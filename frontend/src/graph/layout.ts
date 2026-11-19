import type { LearningTarget } from '../types/LearningTarget'
import { calculateRanks } from './rank'
import { makeLayeredGraph, validateTargets } from './layeredGraph'
import { optimizeOrder, countCrossingsAtPositions } from './order'
import { alignVertically } from './align'

export type Point = { x: number; y: number }

export type LayoutEdge = { source: string; target: string }

export type LayoutResult = {
  positions: Map<string, Point>
  edges: LayoutEdge[]
  crossings: number
}

export type LayoutOptions = {
  columnSpacing?: number
  rowSpacing?: number
  nodeWidth?: number
  nodeHeight?: number
  rounds?: number
  swapPasses?: number
  alignmentRounds?: number
  minRowGap?: number
}

// Pure layout computation: no React Flow types and no dummy vertices.
export function layoutTargets(
  targets: LearningTarget[],
  options: LayoutOptions = {},
): LayoutResult {
  validateTargets(targets)
  if (targets.length === 0) {
    return { positions: new Map(), edges: [], crossings: 0 }
  }

  const {
    columnSpacing = 320,
    rowSpacing = 100,
    nodeWidth = 200,
    nodeHeight = 40,
    rounds = 4,
    swapPasses = 2,
    alignmentRounds = 4,
    minRowGap = 32,
  } = options

  if (columnSpacing <= nodeWidth || rowSpacing < nodeHeight ||
      columnSpacing <= 0 || rowSpacing <= 0 ||
      !Number.isFinite(columnSpacing) || !Number.isFinite(rowSpacing) ||
      !Number.isFinite(nodeWidth) || !Number.isFinite(nodeHeight) ||
      nodeWidth <= 0 || nodeHeight <= 0 ||
      !Number.isFinite(minRowGap) || minRowGap < 0 ||
      !Number.isFinite(alignmentRounds) || alignmentRounds < 0) {
    throw new Error('Invalid layout spacing or node dimensions')
  }

  const graph = makeLayeredGraph(targets, calculateRanks(targets))
  optimizeOrder(
    graph, { columnSpacing, rowSpacing, nodeWidth, nodeHeight },
    Math.max(0, Math.min(Math.floor(rounds), 12)),
    Math.max(0, Math.min(Math.floor(swapPasses), 8)),
  )

  const y = alignVertically(
    graph, rowSpacing, nodeHeight + minRowGap,
    Math.min(Math.floor(alignmentRounds), 20),
  )

  const positions = new Map<string, Point>()
  for (let rank = 0; rank < graph.layers.length; rank++) {
    for (const id of graph.layers[rank]) {
      positions.set(id, { x: rank * columnSpacing, y: y.get(id)! })
    }
  }

  return {
    positions,
    edges: graph.edges,
    // A straight-edge proxy; Smart Edge may route these differently.
    crossings: countCrossingsAtPositions(graph, positions, nodeWidth, nodeHeight),
  }
}
