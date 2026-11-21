import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  MarkerType,
  Position,
  ReactFlow,
  useNodesState,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { MotionBezierEdge } from './components/MotionBezierEdge'
import { TargetCard } from './components/TargetCard'
import { math1310Course as course } from './courses/math1310Course'
import { withMath1310ManualPositions } from './courses/math1310ManualLayout'
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

const USE_SIMPLE_LAYOUT: boolean = false

// Keep the original simple-layout path available for testing the legacy
// rank-based expansion choreography. The manual planar layout is the default.
const automaticLayout = simpleLayout(course.targets)
const layout = USE_SIMPLE_LAYOUT
  ? automaticLayout
  : {
      ...automaticLayout,
      positions: withMath1310ManualPositions(automaticLayout.positions),
    }
const ranks = USE_SIMPLE_LAYOUT
  ? calculateRanks(course.targets)
  : new Map<string, number>()
const edgeTypes = { motionBezier: MotionBezierEdge }
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
  .sort(
    (a, b) =>
      a.position.x - b.position.x ||
      a.position.y - b.position.y,
  )

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
  type: 'motionBezier',
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

type ManualPositionSnapshot = {
  id: string
  position: { x: number; y: number }
}

function centerExpandedCardToSize(
  nodes: Node[],
  id: string,
  originalPosition: { x: number; y: number },
  expandedHeight: number,
): Node[] {
  return nodes.map((node) =>
    node.id === id
      ? {
          ...node,
          position: {
            x: originalPosition.x - (EXPANDED_WIDTH - NODE_WIDTH) / 2,
            y: originalPosition.y - (expandedHeight - NODE_HEIGHT) / 2,
          },
        }
      : node,
  )
}

function restoreManualPosition(
  nodes: Node[],
  snapshot: ManualPositionSnapshot,
): Node[] {
  return nodes.map((node) =>
    node.id === snapshot.id
      ? { ...node, position: { ...snapshot.position } }
      : node,
  )
}

function edgeTouchesNode(sourceId: string, targetId: string, nodeId: string) {
  return sourceId === nodeId || targetId === nodeId
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [keyboardFocusedId, setKeyboardFocusedId] = useState<string | null>(null)
  const [helpPinned, setHelpPinned] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null)
  const [phase, setPhase] = useState<ExpansionPhase>('idle')
  const [edgeBandPhase, setEdgeBandPhase] = useState<EdgeBandPhase>('normal')
  const [movingRank, setMovingRank] = useState<number | null>(null)
  const [movingTargetId, setMovingTargetId] = useState<string | null>(null)
  const [secondaryMovingTargetId, setSecondaryMovingTargetId] = useState<
    string | null
  >(null)

  const rankSnapshot = useRef<RankPositionSnapshot | null>(null)
  const manualPositionSnapshot = useRef<ManualPositionSnapshot | null>(null)
  const switchingFromIdRef = useRef<string | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const nodesRef = useRef(nodes)
  const phaseRef = useRef<ExpansionPhase>(phase)
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

      const affectedByAnimation = USE_SIMPLE_LAYOUT
        ? movingRank !== null &&
          edgeTouchesOrCrossesRank(edge.source, edge.target, movingRank)
        : (movingTargetId !== null &&
            edgeTouchesNode(edge.source, edge.target, movingTargetId)) ||
          (secondaryMovingTargetId !== null &&
            edgeTouchesNode(edge.source, edge.target, secondaryMovingTargetId))

      return {
        ...edge,
        data: {
          phase: affectedByAnimation ? edgeBandPhase : 'normal',
          flowing: focused && !reducedMotion,
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
  }, [
    edgeBandPhase,
    focusedId,
    movingRank,
    movingTargetId,
    secondaryMovingTargetId,
    reducedMotion,
  ])

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

    const switchingFromId = switchingFromIdRef.current
    if (
      !USE_SIMPLE_LAYOUT &&
      switchingFromId !== null &&
      switchingFromId !== id
    ) {
      void switchExpandedCardAnimated(switchingFromId, id, height)
      return
    }

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

  async function rerouteToCurrentGeometry() {
    // Built-in React Flow Bézier edges follow visible node geometry directly.
    await nextFrame()
  }

  async function openExpandedCardAnimated(id: string, expandedHeight: number) {
    if (phaseRef.current !== 'measuring') return

    if (!USE_SIMPLE_LAYOUT) {
      const current = nodesRef.current
      const originalNode = current.find((node) => node.id === id)
      if (originalNode === undefined) return

      const snapshot: ManualPositionSnapshot = {
        id,
        position: { ...originalNode.position },
      }
      manualPositionSnapshot.current = snapshot
      setMovingTargetId(id)

      const focusedStart = setFocusRoles(current, id)
      commitNodes(focusedStart)

      const expanded = setExpandedCard(
        focusedStart,
        id,
        false,
        expandedHeight,
      )
      const finalNodes = centerExpandedCardToSize(
        expanded,
        id,
        snapshot.position,
        expandedHeight,
      )

      if (reducedMotion) {
        const visible = setExpandedCard(finalNodes, id, true, expandedHeight)
        commitNodes(visible)
        setEdgeBandPhase('normal')
        setMovingTargetId(null)
        setSecondaryMovingTargetId(null)
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

      await nextFrame()
      await nextFrame()
      await rerouteToCurrentGeometry()
      await nextFrame()

      changePhase('drawing-edges')
      setEdgeBandPhase('drawing')

      const visible = setExpandedCard(
        nodesRef.current,
        id,
        true,
        expandedHeight,
      )
      commitNodes(visible)

      await Promise.all([
        sleep(motionTiming.edgeDrawMax),
        sleep(motionTiming.contentReveal),
      ])

      setEdgeBandPhase('normal')
      setMovingTargetId(null)
      setSecondaryMovingTargetId(null)
      changePhase('expanded')
      return
    }

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

    const visible = setExpandedCard(
      nodesRef.current,
      id,
      true,
      expandedHeight,
    )
    commitNodes(visible)

    await Promise.all([
      sleep(motionTiming.edgeDrawMax),
      sleep(motionTiming.contentReveal),
    ])

    setEdgeBandPhase('normal')
    setMovingRank(null)
    changePhase('expanded')
  }

  async function switchExpandedCardAnimated(
    fromId: string,
    toId: string,
    expandedHeight: number,
  ) {
    if (phaseRef.current !== 'measuring') return
    if (USE_SIMPLE_LAYOUT) return

    const fromSnapshot = manualPositionSnapshot.current
    const current = nodesRef.current
    const fromNode = current.find((node) => node.id === fromId)
    const toNode = current.find((node) => node.id === toId)

    if (
      fromSnapshot === null ||
      fromSnapshot.id !== fromId ||
      fromNode === undefined ||
      toNode === undefined
    ) {
      switchingFromIdRef.current = null
      changePhase('expanded')
      return
    }

    const fromExpandedHeight = typeof fromNode.style?.height === 'number'
      ? fromNode.style.height
      : NODE_HEIGHT
    const toSnapshot: ManualPositionSnapshot = {
      id: toId,
      position: { ...toNode.position },
    }

    const focusedStart = setFocusRoles(current, toId)
    const contentHidden = setExpandedCard(
      focusedStart,
      fromId,
      false,
      fromExpandedHeight,
    )

    let finalNodes = restoreManualPosition(contentHidden, fromSnapshot)
    finalNodes = setExpandedCard(finalNodes, toId, false, expandedHeight)
    finalNodes = centerExpandedCardToSize(
      finalNodes,
      toId,
      toSnapshot.position,
      expandedHeight,
    )

    if (reducedMotion) {
      const visible = setExpandedCard(finalNodes, toId, true, expandedHeight)
      commitNodes(visible)
      manualPositionSnapshot.current = toSnapshot
      switchingFromIdRef.current = null
      setExpandedId(toId)
      setMovingTargetId(null)
      setSecondaryMovingTargetId(null)
      setEdgeBandPhase('normal')
      changePhase('expanded')
      return
    }

    commitNodes(contentHidden)
    setExpandedId(toId)
    setMovingTargetId(fromId)
    setSecondaryMovingTargetId(toId)
    setEdgeBandPhase('hidden')
    await sleep(motionTiming.edgeFade)

    changePhase('moving')
    await animateNodes(
      contentHidden,
      finalNodes,
      motionTiming.layout,
      commitNodes,
    )

    await nextFrame()
    await nextFrame()
    await rerouteToCurrentGeometry()
    await nextFrame()

    changePhase('drawing-edges')
    setEdgeBandPhase('drawing')

    const visible = setExpandedCard(
      nodesRef.current,
      toId,
      true,
      expandedHeight,
    )
    commitNodes(visible)

    await Promise.all([
      sleep(motionTiming.edgeDrawMax),
      sleep(motionTiming.contentReveal),
    ])

    setEdgeBandPhase('normal')
    setMovingTargetId(null)
    setSecondaryMovingTargetId(null)

    manualPositionSnapshot.current = toSnapshot
    switchingFromIdRef.current = null
    changePhase('expanded')
  }

  async function closeExpandedCardAnimated(animateEdgeDraw = true) {
    const id = expandedId

    if (id === null) return
    if (phaseRef.current !== 'expanded') return

    if (!USE_SIMPLE_LAYOUT) {
      const snapshot = manualPositionSnapshot.current
      if (snapshot === null || snapshot.id !== id) return

      const expandedNode = nodesRef.current.find((node) => node.id === id)
      const expandedHeight = typeof expandedNode?.style?.height === 'number'
        ? expandedNode.style.height
        : NODE_HEIGHT

      if (reducedMotion) {
        const restored = restoreManualPosition(nodesRef.current, snapshot)
        const collapsed = setExpandedCard(restored, null, false)
        commitNodes(collapsed)
        manualPositionSnapshot.current = null
        setExpandedId(null)
        setMovingTargetId(null)
        setSecondaryMovingTargetId(null)
        setEdgeBandPhase('normal')
        changePhase('idle')
        return
      }

      changePhase('collapsing')

      // Hide the details first while the expanded card stays in place.
      commitNodes(setExpandedCard(nodesRef.current, id, false, expandedHeight))
      await sleep(motionTiming.edgeFade)

      setMovingTargetId(id)
      setEdgeBandPhase('hidden')
      await sleep(motionTiming.edgeFade)

      const fromNodes = nodesRef.current
      const restored = restoreManualPosition(fromNodes, snapshot)
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

      if (animateEdgeDraw) {
        changePhase('drawing-edges')
        setEdgeBandPhase('drawing')
        await sleep(motionTiming.edgeDrawMax)
      }

      setEdgeBandPhase('normal')
      setMovingTargetId(null)
      setSecondaryMovingTargetId(null)
      manualPositionSnapshot.current = null
      setExpandedId(null)
      changePhase('idle')
      return
    }

    const snapshot = rankSnapshot.current
    if (snapshot === null) return

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

    if (animateEdgeDraw) {
      changePhase('drawing-edges')
      setEdgeBandPhase('drawing')
      await sleep(motionTiming.edgeDrawMax)
    }

    setEdgeBandPhase('normal')
    setMovingRank(null)
    rankSnapshot.current = null
    setExpandedId(null)
    changePhase('idle')
  }

  function requestOpen(id: string) {
    if (phaseRef.current !== 'idle') return

    switchingFromIdRef.current = null
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

      if (!USE_SIMPLE_LAYOUT && expandedId !== null) {
        switchingFromIdRef.current = expandedId
        changePhase('measuring')
        setPendingOpenId(id)
        return
      }

      await closeExpandedCardAnimated(false)
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

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
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
      </div>
    </div>
  )
}

export default App
