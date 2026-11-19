import type { LayeredGraph } from './layeredGraph'

// Pick preferred continuation edges, one incoming and one outgoing per node.
// The chosen edges form disjoint directed chains, even through forks/merges.
function findChainLinks(
  graph: LayeredGraph,
  initialY: Map<string, number>,
): Map<string, string> {
  const candidates = graph.edges.map(({ source, target }) => {
    const from = graph.nodes.get(source)!
    const to = graph.nodes.get(target)!
    return {
      source,
      target,
      // Prefer an unambiguous continuation and an already-nearby node.
      unique: Number(from.outgoing.length === 1) +
        Number(to.incoming.length === 1),
      distance: Math.abs(initialY.get(source)! - initialY.get(target)!),
      span: to.rank - from.rank,
    }
  })

  candidates.sort((a, b) =>
    b.unique - a.unique || a.distance - b.distance ||
    a.span - b.span || a.source.localeCompare(b.source) ||
    a.target.localeCompare(b.target),
  )

  const next = new Map<string, string>()
  const usedIncoming = new Set<string>()
  for (const { source, target } of candidates) {
    if (next.has(source) || usedIncoming.has(target)) continue
    next.set(source, target)
    usedIncoming.add(target)
  }
  return next
}

// Find the nearest (weighted least-squares) positions to the preferred ones,
// while enforcing y[i+1] - y[i] >= separation.  Pool adjacent violators (PAV)
// solves this one-dimensional constrained problem in linear time.
function keepSeparated(
  preferred: number[],
  weights: number[],
  separation: number,
): number[] {
  type Block = { start: number; end: number; weight: number; mean: number }
  const blocks: Block[] = []

  for (let i = 0; i < preferred.length; i++) {
    blocks.push({
      start: i,
      end: i,
      weight: weights[i],
      mean: preferred[i] - i * separation,
    })

    while (blocks.length > 1) {
      const right = blocks[blocks.length - 1]
      const left = blocks[blocks.length - 2]
      if (left.mean <= right.mean) break

      blocks.pop()
      blocks.pop()
      const weight = left.weight + right.weight
      blocks.push({
        start: left.start,
        end: right.end,
        weight,
        mean: (left.weight * left.mean + right.weight * right.mean) / weight,
      })
    }
  }

  const result = new Array<number>(preferred.length)
  for (const block of blocks) {
    for (let i = block.start; i <= block.end; i++) {
      result[i] = block.mean + i * separation
    }
  }
  return result
}

// The rank ordering is fixed. Only y coordinates are adjusted.
// We minimize a soft cost consisting of vertical edge displacement and a
// weak pull toward the initial positions. Chain edges get extra weight.
export function alignVertically(
  graph: LayeredGraph,
  rowSpacing: number,
  minSeparation: number,
  rounds = 4,
): Map<string, number> {
  const initial = new Map<string, number>()
  for (const layer of graph.layers) {
    layer.forEach((id, i) => {
      initial.set(id, (i - (layer.length - 1) / 2) * rowSpacing)
    })
  }

  const y = new Map(initial)
  if (rounds === 0) return y

  const anchorWeight = 0.25
  const chainLinks = findChainLinks(graph, initial)
  const edgeWeight = (source: string, target: string): number =>
    chainLinks.get(source) === target ? 4 : 1

  function updateLayer(rank: number): void {
    const ids = graph.layers[rank]
    const preferred: number[] = []
    const weights: number[] = []

    for (const id of ids) {
      const node = graph.nodes.get(id)!
      let weight = anchorWeight
      let total = anchorWeight * initial.get(id)!

      for (const predecessor of node.incoming) {
        const w = edgeWeight(predecessor, id)
        weight += w
        total += w * y.get(predecessor)!
      }
      for (const successor of node.outgoing) {
        const w = edgeWeight(id, successor)
        weight += w
        total += w * y.get(successor)!
      }

      preferred.push(total / weight)
      weights.push(weight)
    }

    const adjusted = keepSeparated(preferred, weights, minSeparation)
    ids.forEach((id, i) => y.set(id, adjusted[i]))
  }

  for (let pass = 0; pass < rounds; pass++) {
    // Alternate directions to avoid favoring early or late topics.
    for (let rank = 0; rank < graph.layers.length; rank++) updateLayer(rank)
    for (let rank = graph.layers.length - 1; rank >= 0; rank--) updateLayer(rank)
  }

  return y
}
