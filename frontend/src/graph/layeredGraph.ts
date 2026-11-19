import type { LearningTarget } from '../types/LearningTarget'

export type LayoutNode = {
  id: string
  rank: number
  component: number
  incoming: string[]
  outgoing: string[]
}

export type LayoutEdge = { source: string; target: string }

export type LayeredGraph = {
  nodes: Map<string, LayoutNode>
  layers: string[][]
  edges: LayoutEdge[]
}

// Validate the inputs before calling the memoized recursive rank function.
export function validateTargets(targets: LearningTarget[]): void {
  const byId = new Map<string, LearningTarget>()
  for (const target of targets) {
    if (byId.has(target.id)) {
      throw new Error(`Duplicate learning target ID: ${target.id}`)
    }
    byId.set(target.id, target)
  }

  const state = new Map<string, 'visiting' | 'done'>()

  function visit(id: string): void {
    const status = state.get(id)
    if (status === 'done') return
    if (status === 'visiting') {
      throw new Error(`Cycle in prerequisite graph involving: ${id}`)
    }

    const target = byId.get(id)
    if (!target) throw new Error(`Unknown prerequisite: ${id}`)

    state.set(id, 'visiting')
    const seen = new Set<string>()
    for (const prerequisite of target.prerequisites) {
      if (seen.has(prerequisite)) {
        throw new Error(`Repeated prerequisite ${prerequisite} for ${id}`)
      }
      seen.add(prerequisite)
      visit(prerequisite)
    }
    state.set(id, 'done')
  }

  for (const target of targets) visit(target.id)
}

// Connected components are useful for keeping genuinely independent strands
// together in the initial ordering. Edge directions are ignored here.
function findComponents(targets: LearningTarget[]): Map<string, number> {
  const neighbors = new Map<string, string[]>()
  for (const target of targets) neighbors.set(target.id, [])

  for (const target of targets) {
    for (const prerequisite of target.prerequisites) {
      neighbors.get(target.id)!.push(prerequisite)
      neighbors.get(prerequisite)!.push(target.id)
    }
  }

  const components = new Map<string, number>()
  let componentId = 0
  for (const target of targets) {
    if (components.has(target.id)) continue

    const queue = [target.id]
    components.set(target.id, componentId)
    for (let i = 0; i < queue.length; i++) {
      for (const neighbor of neighbors.get(queue[i])!) {
        if (components.has(neighbor)) continue
        components.set(neighbor, componentId)
        queue.push(neighbor)
      }
    }
    componentId++
  }
  return components
}

export function makeLayeredGraph(
  targets: LearningTarget[],
  ranks: Map<string, number>,
): LayeredGraph {
  const maxRank = Math.max(0, ...ranks.values())
  const layers: string[][] = Array.from({ length: maxRank + 1 }, () => [])
  const nodes = new Map<string, LayoutNode>()
  const edges: LayoutEdge[] = []
  const components = findComponents(targets)

  for (const target of targets) {
    const rank = ranks.get(target.id)!
    nodes.set(target.id, {
      id: target.id,
      rank,
      component: components.get(target.id)!,
      incoming: [],
      outgoing: [],
    })
    layers[rank].push(target.id)
  }

  // Preserve every original prerequisite edge, even if it skips ranks.
  // There are NO synthetic/dummy vertices.
  for (const target of targets) {
    for (const prerequisite of target.prerequisites) {
      nodes.get(prerequisite)!.outgoing.push(target.id)
      nodes.get(target.id)!.incoming.push(prerequisite)
      edges.push({ source: prerequisite, target: target.id })
    }
  }

  // Stable initial ordering, with independent components grouped together.
  for (const layer of layers) {
    layer.sort((a, b) => nodes.get(a)!.component - nodes.get(b)!.component)
  }

  return { nodes, layers, edges }
}
