import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  applyNodeChanges,
  MarkerType,
  Position,
  ReactFlow,
  useNodesState,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { SmartEdgeProvider } from '@tisoap/react-flow-smart-edge'
import { MotionSmartEdge } from './components/MotionSmartEdge'
import { TargetCard } from './components/TargetCard'
import { math1310Course as course } from './courses/math1310Course'
import { animateNodes } from './graph/animateNodes'
import {
  reflowExpandedRankToSize,
  restoreRankPositions,
  snapshotRankPositions,
  type RankPositionSnapshot,
} from './graph/expandedLayout'
import { calculateRanks } from './graph/rank'
import { relationRole, type RelationRole } from './graph/relations'
import { simpleLayout, NODE_WIDTH, NODE_HEIGHT } from './graph/simpleLayout'
import { useMotionPreference } from './motion/motionSettings'
import { motionTiming } from './motion/timing'
import './styles/graphFocus.css'
import './styles/graphMotion.css'
import './styles/dashboardChrome.css'
import type { LearningTarget } from './types/LearningTarget'

document.title = 'Learning Target Dashboard'

const EXPANDED_WIDTH = 390
const EXPANDED_HEIGHT = 390
const GRAPH_BOUND_PADDING = 180

const prerequisiteColor = '#a6e3a1'
const postrequisiteColor = '#89b4fa'
const baseEdgeColor = '#6c7086'

const layout = simpleLayout(course.targets)
const ranks = calculateRanks(course.targets)
const edgeTypes = { smart: MotionSmartEdge }
const targetsById = new Map(course.targets.map((target) => [target.id, target]))

type ExpansionPhase =
  | 'idle'
  | 'measuring'
  | 'hiding-edges'
  | 'moving'
  | 'drawing-edges'
  | 'revealing-content'
  | 'expanded'
  | 'collapsing'

type EdgeBandPhase = 'normal' | 'hidden' | 'drawing'

function targetNodeClassName(role: RelationRole) {
  return `target-node target-node--${role}`
}

function targetAriaLabel(target: LearningTarget, expanded: boolean) {
  const action = expanded ? 'collapse details' : 'expand details'
  return `${target.id}: ${target.name}. Press Enter to ${action}.`
}

function cardStyle(
  target: LearningTarget,
  expanded: boolean,
  expandedHeight?: number,
) {
  return {
    width: expanded ? EXPANDED_WIDTH : NODE_WIDTH,
    height: expanded ? expandedHeight ?? EXPANDED_HEIGHT : NODE_HEIGHT,
    minHeight: expanded ? NODE_HEIGHT : undefined,
    display: 'flex',
    alignItems: expanded ? 'stretch' : 'center',
    justifyContent: 'center',
    textAlign: expanded ? 'left' : 'center',
    padding: expanded ? '18px 20px' : '10px',
    boxSizing: 'border-box',
    borderWidth: target.isCore ? 3 : 1,
    cursor: 'pointer',
    overflow: expanded ? 'hidden' : undefined,
  } as const
}

function targetCard(
  target: LearningTarget,
  expanded: boolean,
  contentVisible: boolean,
) {
  return (
    <TargetCard
      id={target.id}
      name={target.name}
      expanded={expanded}
      content={target.content}
      lessons={course.lessons}
      contentVisible={contentVisible}
    />
  )
}

const initialNodes: Node[] = course.targets
  .map((target) => ({
    id: target.id,
    position: layout.positions.get(target.id)!,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    className: targetNodeClassName('none'),
    zIndex: 10,
    style: cardStyle(target, false),
    focusable: true,
    selectable: false,
    ariaRole: 'button' as const,
    ariaLabel: targetAriaLabel(target, false),
    data: {
      expanded: false,
      contentVisible: false,
      relationRole: 'none',
      label: targetCard(target, false, false),
    },
  }))
  .sort((a, b) => {
    const rankDifference = (ranks.get(a.id) ?? 0) - (ranks.get(b.id) ?? 0)
    if (rankDifference !== 0) return rankDifference

    return a.position.y - b.position.y || a.position.x - b.position.x
  })

type GraphExtent = [[number, number], [number, number]]

const initialGraphBounds = (() => {
  const minX = Math.min(...initialNodes.map((node) => node.position.x))
  const minY = Math.min(...initialNodes.map((node) => node.position.y))
  const maxX = Math.max(
    ...initialNodes.map((node) => node.position.x + NODE_WIDTH),
  )
  const maxY = Math.max(
    ...initialNodes.map((node) => node.position.y + NODE_HEIGHT),
  )

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  }
})()

function graphViewportBounds(viewportWidth: number, viewportHeight: number) {
  const safeWidth = Math.max(viewportWidth, 1)
  const safeHeight = Math.max(viewportHeight, 1)
  const viewportAspectRatio = safeWidth / safeHeight

  let width = initialGraphBounds.width + GRAPH_BOUND_PADDING * 2
  let height = initialGraphBounds.height + GRAPH_BOUND_PADDING * 2

  // Grow only the axis needed to make the graph-space boundary have exactly
  // the same aspect ratio as the viewport. At minZoom the two rectangles then
  // coincide: there is no spare canvas to pan into.
  if (width / height < viewportAspectRatio) {
    width = height * viewportAspectRatio
  } else {
    height = width / viewportAspectRatio
  }

  const extent: GraphExtent = [
    [
      initialGraphBounds.centerX - width / 2,
      initialGraphBounds.centerY - height / 2,
    ],
    [
      initialGraphBounds.centerX + width / 2,
      initialGraphBounds.centerY + height / 2,
    ],
  ]

  return {
    extent,
    minZoom: safeWidth / width,
  }
}

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

function setExpandedCard(
  nodes: Node[],
  openId: string | null,
  contentVisible: boolean,
  expandedHeight?: number,
): Node[] {
  return nodes.map((node) => {
    const expanded = node.id === openId
    const target = targetsById.get(node.id)!
    const showContent = expanded && contentVisible

    return {
      ...node,
      zIndex: expanded ? 1000 : 10,
      style: cardStyle(target, expanded, expanded ? expandedHeight : undefined),
      ariaRole: expanded ? 'group' : 'button',
      ariaLabel: targetAriaLabel(target, expanded),
      data: {
        ...node.data,
        expanded,
        contentVisible: showContent,
        label: targetCard(target, expanded, showContent),
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

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

function edgeTouchesOrCrossesRank(
  sourceId: string,
  targetId: string,
  rank: number,
) {
  const sourceRank = ranks.get(sourceId)
  const targetRank = ranks.get(targetId)

  if (sourceRank === undefined || targetRank === undefined) {
    return false
  }

  if (sourceRank === rank || targetRank === rank) {
    return true
  }

  const lowerRank = Math.min(sourceRank, targetRank)
  const upperRank = Math.max(sourceRank, targetRank)

  return lowerRank < rank && rank < upperRank
}

function App() {
  const graphRootRef = useRef<HTMLDivElement | null>(null)
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [routingNodes, setRoutingNodes] = useState<Node[]>(initialNodes)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [keyboardFocusedId, setKeyboardFocusedId] = useState<string | null>(null)
  const [helpPinned, setHelpPinned] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null)
  const [phase, setPhase] = useState<ExpansionPhase>('idle')
  const [edgeBandPhase, setEdgeBandPhase] = useState<EdgeBandPhase>('normal')
  const [movingRank, setMovingRank] = useState<number | null>(null)
  const [routingRevision, setRoutingRevision] = useState(0)

  const rankSnapshot = useRef<RankPositionSnapshot | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const nodesRef = useRef(nodes)
  const phaseRef = useRef<ExpansionPhase>(phase)
  const routingBatchResolver = useRef<(() => void) | null>(null)
  const routingBatchTimeout = useRef<number | null>(null)
  const lastRoutingBatchId = useRef(0)
  const minimumRoutingBatchId = useRef(0)
  const { reducedMotion } = useMotionPreference()

  const graphViewport = useMemo(
    () => graphViewportBounds(viewportSize.width, viewportSize.height),
    [viewportSize.height, viewportSize.width],
  )

  useLayoutEffect(() => {
    const root = graphRootRef.current
    if (root === null) return

    const updateViewportSize = () => {
      const bounds = root.getBoundingClientRect()
      setViewportSize({
        width: bounds.width,
        height: bounds.height,
      })
    }

    updateViewportSize()

    const observer = new ResizeObserver(updateViewportSize)
    observer.observe(root)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    return () => {
      if (routingBatchTimeout.current !== null) {
        window.clearTimeout(routingBatchTimeout.current)
      }
      routingBatchResolver.current?.()
      routingBatchResolver.current = null
    }
  }, [])

  const focusedId = draggingId ?? expandedId ?? keyboardFocusedId ?? hoveredId

  const edges = useMemo(() => {
    const decoratedEdges = baseEdges.map((edge) => {
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

      const affectedByMovingRank = movingRank !== null &&
        edgeTouchesOrCrossesRank(edge.source, edge.target, movingRank)

      return {
        ...edge,
        data: {
          phase: affectedByMovingRank ? edgeBandPhase : 'normal',
          flowing: focused && !reducedMotion,
          suppressFallback:
            affectedByMovingRank && edgeBandPhase !== 'normal',
          routingRevision,
        },
        style: focused
          ? {
              stroke: color,
              strokeWidth: 2.25,
            }
          : edge.style,
        markerEnd: focused
          ? {
              type: MarkerType.ArrowClosed,
              color,
            }
          : edge.markerEnd,
        // Focused incident edges sit above all other edges when routes overlap.
        // Nodes use z-index 10+ so even elevated edges remain behind cards.
        zIndex: focused ? 5 : 0,
      }
    })

    return decoratedEdges
  }, [edgeBandPhase, focusedId, movingRank, reducedMotion, routingRevision])

  useEffect(() => {
    setNodes((current) => setFocusRoles(current, focusedId))
  }, [focusedId, setNodes])

  // Render the requested card invisibly at its final width so its content-driven
  // expanded height is known before any visible node geometry changes.
  useLayoutEffect(() => {
    if (pendingOpenId === null || measureRef.current === null) return

    const height = Math.ceil(measureRef.current.getBoundingClientRect().height)
    const id = pendingOpenId

    setPendingOpenId(null)
    void openExpandedCardAnimated(id, height)
  }, [pendingOpenId])

  function changePhase(nextPhase: ExpansionPhase) {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
  }

  function commitNodes(nextNodes: Node[]) {
    nodesRef.current = nextNodes
    setNodes(nextNodes)
  }

  function finishPendingRoutingWait() {
    const resolve = routingBatchResolver.current
    if (resolve === null) return

    routingBatchResolver.current = null

    if (routingBatchTimeout.current !== null) {
      window.clearTimeout(routingBatchTimeout.current)
      routingBatchTimeout.current = null
    }

    resolve()
  }

  function rerouteToCurrentGeometry() {
    finishPendingRoutingWait()

    return new Promise<void>((resolve) => {
      routingBatchResolver.current = resolve
      routingBatchTimeout.current = window.setTimeout(
        finishPendingRoutingWait,
        motionTiming.routingSettleTimeout,
      )

      minimumRoutingBatchId.current = lastRoutingBatchId.current + 1

      // Routing geometry changes only once, after the visible animation has
      // finished. The revision tells affected edge hooks to capture their final
      // endpoint coordinates at the same time, instead of registering every
      // intermediate animation frame with Smart Edge.
      setRoutingRevision((current) => current + 1)
      setRoutingNodes([...nodesRef.current])
    })
  }

  function handleNodesChange(changes: NodeChange<Node>[]) {
    onNodesChange(changes)

    // Outside expansion/collapse choreography, manual dragging and React Flow
    // measurements should update routing geometry normally. During motion the
    // provider stays frozen until rerouteToCurrentGeometry() is called.
    if (phaseRef.current === 'idle' || phaseRef.current === 'expanded') {
      setRoutingNodes((current) => applyNodeChanges(changes, current))
    }
  }

  async function openExpandedCardAnimated(id: string, expandedHeight: number) {
    if (phaseRef.current !== 'measuring') return

    const current = nodesRef.current
    const snapshot = snapshotRankPositions(current, id, ranks)
    const rank = ranks.get(id)

    if (rank === undefined) return

    rankSnapshot.current = snapshot
    setMovingRank(rank)

    const focusedStart = setFocusRoles(current, id)
    commitNodes(focusedStart)

    const expanded = setExpandedCard(
      focusedStart,
      id,
      false,
      expandedHeight,
    )
    const finalNodes = reflowExpandedRankToSize(
      expanded,
      id,
      ranks,
      snapshot,
      EXPANDED_WIDTH,
      expandedHeight,
    )

    if (reducedMotion) {
      const visible = setExpandedCard(finalNodes, id, true, expandedHeight)
      commitNodes(visible)
      setRoutingNodes(visible)
      setEdgeBandPhase('normal')
      setMovingRank(null)
      changePhase('expanded')
      return
    }

    changePhase('hiding-edges')
    setEdgeBandPhase('hidden')
    await sleep(motionTiming.edgeFade)

    changePhase('moving')
    await animateNodes(
      focusedStart,
      finalNodes,
      motionTiming.layout,
      commitNodes,
    )

    // Let React Flow measure the final rectangles while affected edges remain
    // hidden, then route exactly once against that settled geometry.
    await nextFrame()
    await nextFrame()
    await rerouteToCurrentGeometry()
    await nextFrame()

    changePhase('drawing-edges')
    setEdgeBandPhase('drawing')
    await sleep(motionTiming.edgeDrawMax)
    setEdgeBandPhase('normal')
    setMovingRank(null)

    changePhase('revealing-content')
    const visible = setExpandedCard(
      nodesRef.current,
      id,
      true,
      expandedHeight,
    )
    commitNodes(visible)
    await sleep(motionTiming.contentReveal)

    changePhase('expanded')
  }

  async function closeExpandedCardAnimated() {
    const id = expandedId
    const snapshot = rankSnapshot.current

    if (id === null || snapshot === null) return
    if (phaseRef.current !== 'expanded') return

    const rank = ranks.get(id)
    if (rank === undefined) return

    const expandedNode = nodesRef.current.find((node) => node.id === id)
    const expandedHeight = typeof expandedNode?.style?.height === 'number'
      ? expandedNode.style.height
      : NODE_HEIGHT

    if (reducedMotion) {
      const restored = restoreRankPositions(nodesRef.current, snapshot)
      const collapsed = setExpandedCard(restored, null, false)
      commitNodes(collapsed)
      setRoutingNodes(collapsed)
      rankSnapshot.current = null
      setExpandedId(null)
      setMovingRank(null)
      setEdgeBandPhase('normal')
      changePhase('idle')
      return
    }

    changePhase('collapsing')

    // First let the details disappear while the expanded geometry remains fixed.
    commitNodes(setExpandedCard(nodesRef.current, id, false, expandedHeight))
    await sleep(motionTiming.edgeFade)

    setMovingRank(rank)
    setEdgeBandPhase('hidden')
    await sleep(motionTiming.edgeFade)

    const fromNodes = nodesRef.current
    const restored = restoreRankPositions(fromNodes, snapshot)
    const collapsed = setExpandedCard(restored, null, false)

    await animateNodes(
      fromNodes,
      collapsed,
      motionTiming.layout,
      commitNodes,
    )

    await nextFrame()
    await nextFrame()
    await rerouteToCurrentGeometry()
    await nextFrame()

    changePhase('drawing-edges')
    setEdgeBandPhase('drawing')
    await sleep(motionTiming.edgeDrawMax)
    setEdgeBandPhase('normal')
    setMovingRank(null)
    rankSnapshot.current = null
    setExpandedId(null)
    changePhase('idle')
  }

  function requestOpen(id: string) {
    if (phaseRef.current !== 'idle') return

    setExpandedId(id)
    changePhase('measuring')
    setPendingOpenId(id)
  }

  async function handleNodeClick(id: string) {
    if (phaseRef.current === 'expanded') {
      if (id === expandedId) {
        await closeExpandedCardAnimated()
        return
      }

      await closeExpandedCardAnimated()
      requestOpen(id)
      return
    }

    requestOpen(id)
  }

  const measuringTarget = pendingOpenId === null
    ? undefined
    : targetsById.get(pendingOpenId)

  const transitioning =
    phase !== 'idle' && phase !== 'expanded'

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <button
          className="dashboard-reset-button"
          type="button"
          onClick={() => window.location.reload()}
        >
          Reset View
        </button>
        <h1 className="dashboard-title">Learning Target Dashboard</h1>
        <div className={`dashboard-help${helpPinned ? ' dashboard-help--open' : ''}`}>
          <button
            className="dashboard-help-button"
            type="button"
            aria-label="How to use the dashboard"
            aria-expanded={helpPinned}
            aria-controls="dashboard-help-panel"
            onClick={() => setHelpPinned((current) => !current)}
          >
            <span className="dashboard-help-glyph" aria-hidden="true">?</span>
          </button>
          <div
            id="dashboard-help-panel"
            className="dashboard-help-panel"
            role="region"
            aria-label="How to use the dashboard"
          >
            <strong>How to use the map</strong>
            <p>Zoom in or out to explore the full map.</p>
            <p>Click a target to see more about it.</p>
            <p>Hover a target to highlight its prerequisites and postrequisites.</p>
            <p>Drag targets to rearrange the view.</p>
            <p>Use Tab to move through controls and targets, then Enter to expand or collapse a target.</p>
            <p>When a target is open, Tab through its detail tabs and press Enter to switch sections.</p>
            <p>Use Reset View to return to the starting layout.</p>
          </div>
        </div>
      </header>

      <div
        ref={graphRootRef}
        className={`dashboard-graph${
          reducedMotion ? ' graph-root--reduced-motion' : ''
        }`}
        onKeyDownCapture={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return

          const element = event.target as HTMLElement
          if (!element.classList.contains('react-flow__node')) return

          const id = element.dataset.id
          if (id === undefined) return

          event.preventDefault()
          event.stopPropagation()
          void handleNodeClick(id)
        }}
        onFocusCapture={(event) => {
          const element = event.target as HTMLElement
          const node = element.closest<HTMLElement>('.react-flow__node[data-id]')
          setKeyboardFocusedId(node?.dataset.id ?? null)
        }}
        onBlurCapture={(event) => {
          const next = event.relatedTarget as HTMLElement | null
          const node = next?.closest<HTMLElement>('.react-flow__node[data-id]')
          setKeyboardFocusedId(node?.dataset.id ?? null)
        }}
      >
      {measuringTarget && (
        <div
          ref={measureRef}
          aria-hidden="true"
          style={{
            ...cardStyle(measuringTarget, true),
            position: 'fixed',
            left: -10000,
            top: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {targetCard(measuringTarget, true, true)}
        </div>
      )}

      <SmartEdgeProvider
        nodes={routingNodes}
        onMetrics={(metrics) => {
          lastRoutingBatchId.current = Math.max(
            lastRoutingBatchId.current,
            metrics.batchId,
          )

          if (
            metrics.batchId >= minimumRoutingBatchId.current &&
            metrics.deferred === 0
          ) {
            finishPendingRoutingWait()
          }
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          nodeExtent={graphViewport.extent}
          translateExtent={graphViewport.extent}
          minZoom={graphViewport.minZoom}
          maxZoom={Math.max(2, graphViewport.minZoom)}
          nodesDraggable={!transitioning}
          nodesFocusable
          edgesFocusable={false}
          autoPanOnNodeFocus
          onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
          onNodeMouseLeave={(_, node) => {
            setHoveredId((current) => current === node.id ? null : current)
          }}
          onNodeDragStart={(_, node) => setDraggingId(node.id)}
          onNodeDragStop={(_, node) => {
            setDraggingId((current) => current === node.id ? null : current)
          }}
          onNodeClick={(_, node) => {
            void handleNodeClick(node.id)
          }}
          onPaneClick={() => {
            if (phaseRef.current === 'expanded') {
              void closeExpandedCardAnimated()
            }
          }}
          edgeTypes={edgeTypes}
          proOptions={{ hideAttribution: true }}
          fitView
        />
      </SmartEdgeProvider>
      </div>
    </div>
  )
}

export default App
