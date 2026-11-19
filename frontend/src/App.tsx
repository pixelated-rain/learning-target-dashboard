import { useLayoutEffect, useRef, useState } from 'react'
import {
  MarkerType,
  Position,
  ReactFlow,
  useNodesState,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  SmartEdgeProvider,
  SmartSmoothStepEdge,
} from '@tisoap/react-flow-smart-edge'
import { TargetCard } from './components/TargetCard'
import { math1310Course as course } from './courses/math1310Course'
import { math1310TargetContent } from './courses/math1310TargetContent'
import {
  centerExpandedWidth,
  reflowExpandedRank,
  restoreRankPositions,
  snapshotRankPositions,
  type RankPositionSnapshot,
} from './graph/expandedLayout'
import { calculateRanks } from './graph/rank'
import { simpleLayout, NODE_WIDTH, NODE_HEIGHT } from './graph/simpleLayout'
import type { LearningTarget } from './types/LearningTarget'

const EXPANDED_WIDTH = 390

const layout = simpleLayout(course.targets)
const ranks = calculateRanks(course.targets)
const edgeTypes = { smart: SmartSmoothStepEdge }
const targetsById = new Map(course.targets.map((target) => [target.id, target]))

function cardStyle(target: LearningTarget, expanded: boolean) {
  return {
    width: expanded ? EXPANDED_WIDTH : NODE_WIDTH,
    height: expanded ? undefined : NODE_HEIGHT,
    minHeight: expanded ? NODE_HEIGHT : undefined,
    display: 'flex',
    alignItems: expanded ? 'stretch' : 'center',
    justifyContent: 'center',
    textAlign: expanded ? 'left' : 'center',
    padding: expanded ? '18px 20px' : '10px',
    boxSizing: 'border-box',
    borderWidth: target.isCore ? 3 : 1,
    cursor: 'pointer',
  } as const
}

const initialNodes: Node[] = course.targets.map((target) => ({
  id: target.id,
  position: layout.positions.get(target.id)!,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  style: cardStyle(target, false),
  data: {
    expanded: false,
    label: (
      <TargetCard
        id={target.id}
        name={target.name}
        expanded={false}
        content={math1310TargetContent[target.id]}
      />
    ),
  },
}))

const edges = layout.edges.map(({ source, target }) => ({
  id: `${source}->${target}`,
  source,
  target,
  type: 'smart',
  markerEnd: { type: MarkerType.ArrowClosed },
}))

function setExpandedCard(nodes: Node[], openId: string | null): Node[] {
  return nodes.map((node) => {
    const expanded = node.id === openId
    if (node.data.expanded === expanded) return node

    const target = targetsById.get(node.id)!

    return {
      ...node,
      zIndex: expanded ? 1000 : 0,
      style: cardStyle(target, expanded),
      data: {
        ...node.data,
        expanded,
        label: (
          <TargetCard
            id={target.id}
            name={target.name}
            expanded={expanded}
            content={math1310TargetContent[target.id]}
          />
        ),
      },
    }
  })
}

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const rankSnapshot = useRef<RankPositionSnapshot | null>(null)

  const expandedNode = expandedId === null
    ? undefined
    : nodes.find((node) => node.id === expandedId)
  const expandedWidth = expandedNode?.measured?.width
  const expandedHeight = expandedNode?.measured?.height

  // React Flow measures the content-driven expanded height after rendering.
  // Once that measurement changes, recenter the card and move only its rank
  // neighbors far enough to maintain the normal row gap.
  useLayoutEffect(() => {
    if (
      expandedId === null ||
      rankSnapshot.current === null ||
      expandedWidth === undefined ||
      expandedHeight === undefined
    ) {
      return
    }

    setNodes((current) =>
      reflowExpandedRank(current, expandedId, ranks, rankSnapshot.current!),
    )
  }, [expandedId, expandedWidth, expandedHeight, setNodes])

  function closeExpandedCard() {
    const snapshot = rankSnapshot.current

    setNodes((current) => {
      const collapsed = setExpandedCard(current, null)
      return snapshot === null
        ? collapsed
        : restoreRankPositions(collapsed, snapshot)
    })

    rankSnapshot.current = null
    setExpandedId(null)
  }

  function openExpandedCard(id: string) {
    // If another card is already open, first put that rank back exactly where
    // it was before the previous expansion.
    const restored = rankSnapshot.current === null
      ? nodes
      : restoreRankPositions(nodes, rankSnapshot.current)

    const snapshot = snapshotRankPositions(restored, id, ranks)
    rankSnapshot.current = snapshot

    const expanded = setExpandedCard(restored, id)

    // Width is known immediately, so center it horizontally before React Flow
    // has measured the content-driven height. Vertical centering follows as
    // soon as the measured height is available.
    setNodes(centerExpandedWidth(expanded, id, snapshot, EXPANDED_WIDTH))
    setExpandedId(id)
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <SmartEdgeProvider nodes={nodes}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => {
            if (node.id === expandedId) {
              closeExpandedCard()
            } else {
              openExpandedCard(node.id)
            }
          }}
          onPaneClick={closeExpandedCard}
          edgeTypes={edgeTypes}
          fitView
        />
      </SmartEdgeProvider>
    </div>
  )
}

export default App
