import type { Node, XYPosition } from '@xyflow/react'
import { NODE_HEIGHT, NODE_WIDTH, ROW_GAP } from './simpleLayout'

export type RankPositionSnapshot = Map<string, XYPosition>

export function snapshotRankPositions(
  nodes: Node[],
  targetId: string,
  ranks: Map<string, number>,
): RankPositionSnapshot {
  const rank = ranks.get(targetId)

  if (rank === undefined) {
    throw new Error(`Missing rank for ${targetId}`)
  }

  return new Map(
    nodes
      .filter((node) => ranks.get(node.id) === rank)
      .map((node) => [node.id, { ...node.position }]),
  )
}

export function restoreRankPositions(
  nodes: Node[],
  snapshot: RankPositionSnapshot,
): Node[] {
  return nodes.map((node) => {
    const position = snapshot.get(node.id)

    return position
      ? { ...node, position: { ...position } }
      : node
  })
}

export function centerExpandedWidth(
  nodes: Node[],
  expandedId: string,
  snapshot: RankPositionSnapshot,
  expandedWidth: number,
): Node[] {
  const originalPosition = snapshot.get(expandedId)

  if (originalPosition === undefined) {
    return nodes
  }

  return nodes.map((node) =>
    node.id === expandedId
      ? {
          ...node,
          position: {
            x: originalPosition.x - (expandedWidth - NODE_WIDTH) / 2,
            y: originalPosition.y,
          },
        }
      : node,
  )
}

export function reflowExpandedRank(
  nodes: Node[],
  expandedId: string,
  ranks: Map<string, number>,
  snapshot: RankPositionSnapshot,
): Node[] {
  const expandedNode = nodes.find((node) => node.id === expandedId)
  const originalPosition = snapshot.get(expandedId)
  const rank = ranks.get(expandedId)
  const expandedWidth = expandedNode?.measured?.width
  const expandedHeight = expandedNode?.measured?.height

  if (
    expandedNode === undefined ||
    originalPosition === undefined ||
    rank === undefined ||
    expandedWidth === undefined ||
    expandedHeight === undefined
  ) {
    return nodes
  }

  const centerX = originalPosition.x + NODE_WIDTH / 2
  const centerY = originalPosition.y + NODE_HEIGHT / 2
  const expandedPosition = {
    x: centerX - expandedWidth / 2,
    y: centerY - expandedHeight / 2,
  }

  const rankNodes = nodes
    .filter((node) => ranks.get(node.id) === rank)
    .sort((a, b) => snapshot.get(a.id)!.y - snapshot.get(b.id)!.y)

  const expandedIndex = rankNodes.findIndex((node) => node.id === expandedId)
  const yPositions = new Map<string, number>([
    [expandedId, expandedPosition.y],
  ])

  let cursor = expandedPosition.y - ROW_GAP

  for (let index = expandedIndex - 1; index >= 0; index--) {
    const node = rankNodes[index]
    const original = snapshot.get(node.id)!
    const y = Math.min(original.y, cursor - NODE_HEIGHT)

    yPositions.set(node.id, y)
    cursor = y - ROW_GAP
  }

  cursor = expandedPosition.y + expandedHeight + ROW_GAP

  for (let index = expandedIndex + 1; index < rankNodes.length; index++) {
    const node = rankNodes[index]
    const original = snapshot.get(node.id)!
    const y = Math.max(original.y, cursor)

    yPositions.set(node.id, y)
    cursor = y + NODE_HEIGHT + ROW_GAP
  }

  let changed = false

  const nextNodes = nodes.map((node) => {
    const y = yPositions.get(node.id)

    if (y === undefined) {
      return node
    }

    const original = snapshot.get(node.id)!
    const position = node.id === expandedId
      ? expandedPosition
      : { x: original.x, y }

    if (node.position.x === position.x && node.position.y === position.y) {
      return node
    }

    changed = true
    return { ...node, position }
  })

  return changed ? nextNodes : nodes
}
