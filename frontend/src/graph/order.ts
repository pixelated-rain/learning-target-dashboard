import type { LayeredGraph, LayoutEdge } from './layeredGraph'

export type OrderScore = { crossings: number; distance: number }

type Geometry = {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}

export type GeometryOptions = {
  columnSpacing: number
  rowSpacing: number
  nodeWidth: number
  nodeHeight: number
}

function indexPositions(graph: LayeredGraph): Map<string, number> {
  const positions = new Map<string, number>()
  for (const layer of graph.layers) {
    layer.forEach((id, index) => positions.set(id, index))
  }
  return positions
}

function centerY(
  graph: LayeredGraph,
  id: string,
  positions: Map<string, number>,
  spacing: number,
): number {
  const rank = graph.nodes.get(id)!.rank
  return (positions.get(id)! - (graph.layers[rank].length - 1) / 2) * spacing
}

// Match the handles of a plain React Flow edge: right side of source node
// to left side of target node. NodeHeight / 2 cancels out in comparisons.
function edgeGeometry(
  graph: LayeredGraph,
  edge: LayoutEdge,
  positions: Map<string, number>,
  { columnSpacing, rowSpacing, nodeWidth }: GeometryOptions,
): Geometry {
  return {
    sourceX: graph.nodes.get(edge.source)!.rank * columnSpacing + nodeWidth,
    sourceY: centerY(graph, edge.source, positions, rowSpacing),
    targetX: graph.nodes.get(edge.target)!.rank * columnSpacing,
    targetY: centerY(graph, edge.target, positions, rowSpacing),
  }
}

function yAtX(edge: Geometry, x: number): number {
  return edge.sourceY +
    (edge.targetY - edge.sourceY) *
    ((x - edge.sourceX) / (edge.targetX - edge.sourceX))
}

// Detect proper intersections of straight segments whose horizontal spans
// overlap. This also handles edges that skip one or more ranks.
// Intersections at shared source/target handles aren't crossings.
function crossing(
  a: Geometry,
  b: Geometry,
  edgeA: LayoutEdge,
  edgeB: LayoutEdge,
): boolean {
  if (edgeA.source === edgeB.source || edgeA.target === edgeB.target ||
      edgeA.source === edgeB.target || edgeA.target === edgeB.source) {
    return false
  }

  const left = Math.max(a.sourceX, b.sourceX)
  const right = Math.min(a.targetX, b.targetX)
  if (left >= right) return false

  const dLeft = yAtX(a, left) - yAtX(b, left)
  const dRight = yAtX(a, right) - yAtX(b, right)
  const epsilon = 1e-7
  return (dLeft > epsilon && dRight < -epsilon) ||
    (dLeft < -epsilon && dRight > epsilon)
}

function displacement(geometry: Geometry): number {
  return Math.abs(geometry.targetY - geometry.sourceY)
}

function totalScore(graph: LayeredGraph, geometryOptions: GeometryOptions): OrderScore {
  const positions = indexPositions(graph)
  const segments = graph.edges.map((edge) =>
    edgeGeometry(graph, edge, positions, geometryOptions))
  let crossings = 0
  let distance = 0

  for (let i = 0; i < segments.length; i++) {
    distance += displacement(segments[i])
    for (let j = i + 1; j < segments.length; j++) {
      if (crossing(segments[i], segments[j], graph.edges[i], graph.edges[j])) {
        crossings++
      }
    }
  }
  return { crossings, distance }
}

function better(a: OrderScore, b: OrderScore): boolean {
  return a.crossings < b.crossings ||
    (a.crossings === b.crossings && a.distance < b.distance - 1e-7)
}

// All real neighbors count, including those whose edge skips a rank.
function barycenterSort(graph: LayeredGraph, rank: number, forward: boolean): void {
  const layer = graph.layers[rank]
  const positions = indexPositions(graph)
  const center = (layer.length - 1) / 2

  const scored = layer.map((id, index) => {
    const node = graph.nodes.get(id)!
    const neighbors = forward ? node.incoming : node.outgoing
    const average = neighbors.length === 0
      ? index - center
      : neighbors.reduce((sum, neighbor) => {
        const neighborRank = graph.nodes.get(neighbor)!.rank
        return sum + positions.get(neighbor)! -
          (graph.layers[neighborRank].length - 1) / 2
      }, 0) / neighbors.length

    return { id, average, index }
  })

  scored.sort((a, b) => a.average - b.average || a.index - b.index)
  graph.layers[rank] = scored.map((entry) => entry.id)
}

// Cheap local scoring: swapping A and B only changes edges incident to A/B.
// Compare those edges against the rest, instead of rescoring every edge pair.
function swapDelta(
  graph: LayeredGraph,
  rank: number,
  index: number,
  geometryOptions: GeometryOptions,
): OrderScore {
  const layer = graph.layers[rank]
  const a = layer[index]
  const b = layer[index + 1]
  const beforePositions = indexPositions(graph)
  const afterPositions = new Map(beforePositions)
  afterPositions.set(a, index + 1)
  afterPositions.set(b, index)

  const original = graph.edges.map((edge) =>
    edgeGeometry(graph, edge, beforePositions, geometryOptions))
  const changed = new Set<number>()
  const updated = new Map<number, Geometry>()

  for (let i = 0; i < graph.edges.length; i++) {
    const edge = graph.edges[i]
    if (edge.source === a || edge.source === b ||
        edge.target === a || edge.target === b) {
      changed.add(i)
      updated.set(i, edgeGeometry(graph, edge, afterPositions, geometryOptions))
    }
  }

  let crossings = 0
  let distance = 0
  for (const i of changed) {
    distance += displacement(updated.get(i)!) - displacement(original[i])
    for (let j = 0; j < graph.edges.length; j++) {
      if (i === j || (changed.has(j) && j < i)) continue

      const before = crossing(original[i], original[j], graph.edges[i], graph.edges[j])
      const after = crossing(
        updated.get(i)!, updated.get(j) ?? original[j],
        graph.edges[i], graph.edges[j],
      )
      crossings += Number(after) - Number(before)
    }
  }
  return { crossings, distance }
}

function swapCleanup(
  graph: LayeredGraph,
  rank: number,
  maxPasses: number,
  geometryOptions: GeometryOptions,
): void {
  const layer = graph.layers[rank]
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false
    for (let index = 0; index < layer.length - 1; index++) {
      const delta = swapDelta(graph, rank, index, geometryOptions)
      if (delta.crossings < 0 ||
          (delta.crossings === 0 && delta.distance < -1e-7)) {
        const old = layer[index]
        layer[index] = layer[index + 1]
        layer[index + 1] = old
        changed = true
      }
    }
    if (!changed) break
  }
}

function sweep(
  graph: LayeredGraph,
  forward: boolean,
  maxSwapPasses: number,
  options: GeometryOptions,
): void {
  for (let step = 1; step < graph.layers.length; step++) {
    const rank = forward ? step : graph.layers.length - 1 - step
    barycenterSort(graph, rank, forward)
    swapCleanup(graph, rank, maxSwapPasses, options)
  }
}

export function optimizeOrder(
  graph: LayeredGraph,
  options: GeometryOptions,
  rounds = 4,
  swapPasses = 2,
): OrderScore {
  let bestOrder = graph.layers.map((layer) => [...layer])
  let bestScore = totalScore(graph, options)

  for (let round = 0; round < rounds; round++) {
    const before = graph.layers.map((layer) => [...layer])

    sweep(graph, true, swapPasses, options)
    const forward = totalScore(graph, options)
    if (better(forward, bestScore)) {
      bestScore = forward
      bestOrder = graph.layers.map((layer) => [...layer])
    }

    sweep(graph, false, swapPasses, options)
    const backward = totalScore(graph, options)
    if (better(backward, bestScore)) {
      bestScore = backward
      bestOrder = graph.layers.map((layer) => [...layer])
    }

    if (graph.layers.every((layer, i) =>
      layer.every((id, j) => id === before[i][j]),
    )) break
  }

  graph.layers = bestOrder
  return bestScore
}

// Report the straight-edge crossing count after coordinate refinement.
// Smart Edge's routed paths may have a different number of crossings.
export function countCrossingsAtPositions(
  graph: LayeredGraph,
  positions: Map<string, { x: number; y: number }>,
  nodeWidth: number,
  nodeHeight: number,
): number {
  const segments = graph.edges.map(({ source, target }) => {
    const from = positions.get(source)!
    const to = positions.get(target)!
    return {
      sourceX: from.x + nodeWidth,
      sourceY: from.y + nodeHeight / 2,
      targetX: to.x,
      targetY: to.y + nodeHeight / 2,
    }
  })

  let crossings = 0
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      if (crossing(segments[i], segments[j], graph.edges[i], graph.edges[j])) {
        crossings++
      }
    }
  }
  return crossings
}
