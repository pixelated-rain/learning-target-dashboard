import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  SmartBezierEdge,
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
import { relationRole, type RelationRole } from './graph/relations'
import { simpleLayout, NODE_WIDTH, NODE_HEIGHT } from './graph/simpleLayout'
import { useMotionPreference } from './motion/motionSettings'
import './styles/graphFocus.css'
import type { LearningTarget } from './types/LearningTarget'

const EXPANDED_WIDTH = 390

const prerequisiteColor = '#a6e3a1'
const postrequisiteColor = '#89b4fa'
const baseEdgeColor = '#6c7086'

const layout = simpleLayout(course.targets)
const ranks = calculateRanks(course.targets)
const edgeTypes = { smart: SmartBezierEdge }
const targetsById = new Map(course.targets.map((target) => [target.id, target]))

function targetNodeClassName(role: RelationRole) {
  return `target-node target-node--${role}`
}

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
  className: targetNodeClassName('none'),
  style: cardStyle(target, false),
  data: {
    expanded: false,
    relationRole: 'none',
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

const baseEdges = layout.edges.map(({ source, target }) => ({
  id: `${source}->${target}`,
  source,
  target,
  type: 'smart',
  style: {
    stroke: baseEdgeColor,
    strokeWidth: 1.5,
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: baseEdgeColor,
  },
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

function setFocusRoles(nodes: Node[], focusedId: string | null): Node[] {
  const focusedTarget = focusedId === null
    ? undefined
    : targetsById.get(focusedId)

  let changed = false

  const nextNodes = nodes.map((node) => {
    const target = targetsById.get(node.id)!
    const role = relationRole(target, focusedTarget)

    if (node.data.relationRole === role) {
      return node
    }

    changed = true
    return {
      ...node,
      className: targetNodeClassName(role),
      data: {
        ...node.data,
        relationRole: role,
      },
    }
  })

  return changed ? nextNodes : nodes
}

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const rankSnapshot = useRef<RankPositionSnapshot | null>(null)
  const { reducedMotion } = useMotionPreference()

  const focusedId = draggingId ?? expandedId ?? hoveredId

  const edges = useMemo(() => {
    return baseEdges.map((edge) => {
      const isPrerequisiteEdge =
        focusedId !== null && edge.target === focusedId
      const isPostrequisiteEdge =
        focusedId !== null && edge.source === focusedId
      const focused = isPrerequisiteEdge || isPostrequisiteEdge
      const color = isPrerequisiteEdge
        ? prerequisiteColor
        : isPostrequisiteEdge
          ? postrequisiteColor
          : undefined

      return {
        ...edge,
        animated: focused && !reducedMotion,
        style: focused
          ? {
              stroke: color,
              strokeWidth: 2.25,
            }
          : undefined,
        markerEnd: focused
          ? {
              type: MarkerType.ArrowClosed,
              color,
            }
          : edge.markerEnd,
      }
    })
  }, [focusedId, reducedMotion])

  useEffect(() => {
    setNodes((current) => setFocusRoles(current, focusedId))
  }, [focusedId, setNodes])

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
    <div
      className={reducedMotion ? 'graph-root--reduced-motion' : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--graph-background)',
      }}
    >
      <SmartEdgeProvider nodes={nodes}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
          onNodeMouseLeave={(_, node) => {
            setHoveredId((current) => current === node.id ? null : current)
          }}
          onNodeDragStart={(_, node) => setDraggingId(node.id)}
          onNodeDragStop={(_, node) => {
            setDraggingId((current) => current === node.id ? null : current)
          }}
          onNodeClick={(_, node) => {
            if (node.id === expandedId) {
              closeExpandedCard()
            } else {
              openExpandedCard(node.id)
            }
          }}
          onPaneClick={closeExpandedCard}
          edgeTypes={edgeTypes}
          proOptions={{ hideAttribution: true }}
          fitView
        />
      </SmartEdgeProvider>
    </div>
  )
}

export default App
