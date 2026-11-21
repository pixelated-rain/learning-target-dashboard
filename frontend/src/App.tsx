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
type IntroPhase = 'bubbling' | 'edges' | 'done'

type ViewportSnapshot = {
  x: number
  y: number
  zoom: number
}

type ViewportController = {
  getViewport: () => ViewportSnapshot
  setViewport: (
    viewport: ViewportSnapshot,
    options?: {
      duration?: number
      ease?: (progress: number) => number
      interpolate?: 'smooth' | 'linear'
    },
  ) => void
  fitView: (options?: { padding?: number; duration?: number }) => void
}

const INTRO_POP_BUCKET_MS = 90
const INTRO_POP_BUCKETS = 7
const INTRO_POP_GROW_DURATION = 560
const INTRO_POP_SETTLE_DURATION = 650
const INTRO_POP_DURATION =
  INTRO_POP_GROW_DURATION + INTRO_POP_SETTLE_DURATION
const INTRO_EDGE_DRAW_DELAY = 650
const EXPANSION_CAMERA_DURATION = 520
const EXPANSION_ZOOM_FLOOR = 1.35

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2
}

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

function numericNodeStyle(
  node: Node,
  key: 'width' | 'height',
  fallback: number,
) {
  const value = node.style?.[key]
  return typeof value === 'number' ? value : fallback
}

function hideExpandedContent(nodes: Node[]): Node[] {
  return nodes.map((node) => {
    if (node.data.expanded !== true || node.data.contentVisible !== true) {
      return node
    }

    const target = targetsById.get(node.id)!

    return {
      ...node,
      data: {
        ...node.data,
        contentVisible: false,
        label: targetCard(target, true, false),
      },
    }
  })
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
  const { reducedMotion } = useMotionPreference()
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
  const [movingTargetIds, setMovingTargetIds] = useState<string[]>([])
  const [flowReady, setFlowReady] = useState(false)
  const [introPhase, setIntroPhase] = useState<IntroPhase>(
    reducedMotion ? 'done' : 'bubbling',
  )
  const [introPoppingIds, setIntroPoppingIds] = useState<string[]>([])
  const [introSettledIds, setIntroSettledIds] = useState<string[]>(
    reducedMotion ? initialNodes.map((node) => node.id) : [],
  )

  const rankSnapshot = useRef<RankPositionSnapshot | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const nodesRef = useRef(nodes)
  const phaseRef = useRef<ExpansionPhase>(phase)
  const reactFlowRef = useRef<ViewportController | null>(null)
  const manualTransitionGenerationRef = useRef(0)
  const requestedOpenIdRef = useRef<string | null>(null)
  const introGenerationRef = useRef(0)
  const lastPointerClickRef = useRef<{ id: string; at: number } | null>(null)
  const manualBasePositionsRef = useRef(
    new Map(
      initialNodes.map((node) => [node.id, { ...node.position }]),
    ),
  )

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

  const renderedNodes = useMemo(() => {
    const poppingIds = new Set(introPoppingIds)
    const settledIds = new Set(introSettledIds)

    return nodes.map((node) => {
      let className = node.className ?? ''
      let style = { ...node.style }

      if (introPhase !== 'done') {
        const popping = poppingIds.has(node.id)
        const settled = settledIds.has(node.id)
        const visible = popping || settled
        const introClass = settled
          ? 'target-node--intro-settled'
          : popping
            ? 'target-node--intro-popping'
            : 'target-node--intro-hidden'

        className = `${className} ${introClass}`.trim()
        style = {
          ...style,
          pointerEvents: visible ? node.style?.pointerEvents : 'none',
        }
      }

      return {
        ...node,
        className,
        style,
      }
    })
  }, [introPhase, introPoppingIds, introSettledIds, nodes])

  const focusedId =
    draggingId ?? expandedId ?? keyboardFocusedId ?? hoveredId

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
        : movingTargetIds.some((id) =>
            edgeTouchesNode(edge.source, edge.target, id),
          )
      const introEdgePhase =
        introPhase === 'bubbling'
          ? 'hidden'
          : introPhase === 'edges'
            ? 'drawing'
            : null

      return {
        ...edge,
        data: {
          phase:
            introEdgePhase ??
            (affectedByAnimation ? edgeBandPhase : 'normal'),
          flowing:
            focused &&
            !reducedMotion &&
            introEdgePhase === null &&
            introPhase === 'done',
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
    introPhase,
    movingRank,
    movingTargetIds,
    reducedMotion,
  ])

  useEffect(() => {
    setNodes((current) => setFocusRoles(current, focusedId))
  }, [focusedId, setNodes])

  useEffect(() => {
    if (!flowReady) return

    if (reducedMotion) {
      introGenerationRef.current += 1
      setIntroPoppingIds([])
      setIntroSettledIds(initialNodes.map((node) => node.id))
      setIntroPhase('done')
      return
    }

    const generation = introGenerationRef.current + 1
    introGenerationRef.current = generation

    void (async () => {
      setIntroPoppingIds([])
      setIntroSettledIds([])
      setIntroPhase('bubbling')

      const schedule = initialNodes
        .map((node) => ({
          id: node.id,
          at:
            Math.floor(Math.random() * INTRO_POP_BUCKETS) *
            INTRO_POP_BUCKET_MS,
        }))
        .sort((a, b) => a.at - b.at)

      const bubbleSequence = async () => {
        let previousAt = 0
        let index = 0

        while (index < schedule.length) {
          const at = schedule[index].at
          await sleep(at - previousAt)

          if (introGenerationRef.current !== generation) return

          const ids: string[] = []
          while (index < schedule.length && schedule[index].at === at) {
            ids.push(schedule[index].id)
            index += 1
          }

          setIntroPoppingIds((current) => [...current, ...ids])

          void (async () => {
            await sleep(INTRO_POP_DURATION)
            if (introGenerationRef.current !== generation) return

            setIntroPoppingIds((current) =>
              current.filter((id) => !ids.includes(id)),
            )
            setIntroSettledIds((current) => [...current, ...ids])
          })()

          previousAt = at
        }

        await sleep(INTRO_POP_DURATION)

        if (introGenerationRef.current !== generation) return
        setIntroPoppingIds([])
        setIntroSettledIds(initialNodes.map((node) => node.id))
      }

      const edgeSequence = async () => {
        await sleep(INTRO_EDGE_DRAW_DELAY)
        if (introGenerationRef.current !== generation) return

        setIntroPhase('edges')
        await sleep(motionTiming.edgeDrawMax)
      }

      await Promise.all([
        bubbleSequence(),
        edgeSequence(),
      ])

      if (introGenerationRef.current !== generation) return
      setIntroPoppingIds([])
      setIntroSettledIds(initialNodes.map((node) => node.id))
      setIntroPhase('done')

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          reactFlowRef.current?.fitView({
            padding: 0.08,
            duration: reducedMotion
              ? 0
              : EXPANSION_CAMERA_DURATION,
          })
        })
      })
    })()

    return () => {
      if (introGenerationRef.current === generation) {
        introGenerationRef.current += 1
      }
    }
  }, [flowReady, reducedMotion])

  // Render the requested card invisibly at its final width so its content-driven
  // expanded height is known before any visible node geometry changes.
  useLayoutEffect(() => {
    if (pendingOpenId === null || measureRef.current === null) return

    const height = Math.ceil(measureRef.current.getBoundingClientRect().height)
    const id = pendingOpenId

    setPendingOpenId(null)

    if (!USE_SIMPLE_LAYOUT) {
      void transitionManualToTarget(
        id,
        height,
        manualTransitionGenerationRef.current,
      )
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

  function cancelIntro() {
    if (introPhase === 'done') return

    introGenerationRef.current += 1
    setIntroPoppingIds([])
    setIntroSettledIds(initialNodes.map((node) => node.id))
    setIntroPhase('done')

    const instance = reactFlowRef.current
    if (instance !== null) {
      void instance.setViewport(instance.getViewport(), { duration: 0 })
    }
  }

  function manualBasePosition(id: string) {
    return (
      manualBasePositionsRef.current.get(id) ??
      layout.positions.get(id) ??
      { x: 0, y: 0 }
    )
  }

  function rememberManualBasePosition(node: Node) {
    if (USE_SIMPLE_LAYOUT) return

    const width = numericNodeStyle(node, 'width', NODE_WIDTH)
    const height = numericNodeStyle(node, 'height', NODE_HEIGHT)

    manualBasePositionsRef.current.set(node.id, {
      x: node.position.x + (width - NODE_WIDTH) / 2,
      y: node.position.y + (height - NODE_HEIGHT) / 2,
    })
  }

  function focusViewportOnPosition(
    position: { x: number; y: number },
    width: number,
    height: number,
  ) {
    const instance = reactFlowRef.current
    if (instance === null) return

    const start = instance.getViewport()
    const zoom = Math.max(
      start.zoom,
      graphViewport.minZoom,
      EXPANSION_ZOOM_FLOOR,
    )
    const centerX = position.x + width / 2
    const centerY = position.y + height / 2
    const target: ViewportSnapshot = {
      x: viewportSize.width / 2 - centerX * zoom,
      y: viewportSize.height / 2 - centerY * zoom,
      zoom,
    }

    instance.setViewport(target, {
      duration: reducedMotion ? 0 : EXPANSION_CAMERA_DURATION,
      ease: easeInOutCubic,
      interpolate: 'smooth',
    })
  }

  function manualTransitionAffectedIds(nodes: Node[], toId: string | null) {
    const ids = new Set<string>()

    for (const node of nodes) {
      const width = numericNodeStyle(node, 'width', NODE_WIDTH)
      const height = numericNodeStyle(node, 'height', NODE_HEIGHT)

      if (
        node.data.expanded === true ||
        Math.abs(width - NODE_WIDTH) > 0.5 ||
        Math.abs(height - NODE_HEIGHT) > 0.5
      ) {
        ids.add(node.id)
      }
    }

    if (toId !== null) ids.add(toId)
    return [...ids]
  }

  function manualFinalNodes(
    nodes: Node[],
    toId: string | null,
    expandedHeight?: number,
  ) {
    let nextNodes = setExpandedCard(nodes, toId, false, expandedHeight)

    nextNodes = nextNodes.map((node) => ({
      ...node,
      position: { ...manualBasePosition(node.id) },
    }))

    if (toId !== null && expandedHeight !== undefined) {
      nextNodes = centerExpandedCardToSize(
        nextNodes,
        toId,
        manualBasePosition(toId),
        expandedHeight,
      )
    }

    return nextNodes
  }

  async function settleNodeGeometry() {
    // Native React Flow Bézier edges follow node geometry directly. This frame
    // boundary only lets the final node rectangles settle before edge drawing.
    await nextFrame()
  }

  async function transitionManualToTarget(
    toId: string | null,
    expandedHeight: number | undefined,
    generation: number,
  ) {
    if (USE_SIMPLE_LAYOUT) return
    if (manualTransitionGenerationRef.current !== generation) return

    const current = hideExpandedContent(
      setFocusRoles(nodesRef.current, toId),
    )
    const affectedIds = manualTransitionAffectedIds(current, toId)
    const finalNodes = manualFinalNodes(current, toId, expandedHeight)

    setExpandedId(toId)
    setMovingTargetIds(affectedIds)
    setEdgeBandPhase('hidden')
    commitNodes(current)

    if (toId !== null) {
      focusViewportOnPosition(
        manualBasePosition(toId),
        NODE_WIDTH,
        NODE_HEIGHT,
      )
    }

    if (reducedMotion) {
      const visible =
        toId !== null && expandedHeight !== undefined
          ? setExpandedCard(finalNodes, toId, true, expandedHeight)
          : finalNodes
      commitNodes(visible)
      setEdgeBandPhase('normal')
      setMovingTargetIds([])
      changePhase(toId === null ? 'idle' : 'expanded')
      return
    }

    changePhase(toId === null ? 'collapsing' : 'hiding-edges')
    await sleep(motionTiming.edgeFade)
    if (manualTransitionGenerationRef.current !== generation) return

    changePhase('moving')
    await animateNodes(
      current,
      finalNodes,
      motionTiming.layout,
      commitNodes,
      () => manualTransitionGenerationRef.current === generation,
    )
    if (manualTransitionGenerationRef.current !== generation) return

    await nextFrame()
    if (manualTransitionGenerationRef.current !== generation) return
    await settleNodeGeometry()
    if (manualTransitionGenerationRef.current !== generation) return

    changePhase('drawing-edges')
    setEdgeBandPhase('drawing')

    if (toId !== null && expandedHeight !== undefined) {
      commitNodes(
        setExpandedCard(nodesRef.current, toId, true, expandedHeight),
      )

      await Promise.all([
        sleep(motionTiming.edgeDrawMax),
        sleep(motionTiming.contentReveal),
      ])
    } else {
      await sleep(motionTiming.edgeDrawMax)
    }

    if (manualTransitionGenerationRef.current !== generation) return

    setEdgeBandPhase('normal')
    setMovingTargetIds([])
    changePhase(toId === null ? 'idle' : 'expanded')
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
    const finalFocusedNode = finalNodes.find((node) => node.id === id)
    if (finalFocusedNode !== undefined) {
      focusViewportOnPosition(
        finalFocusedNode.position,
        EXPANDED_WIDTH,
        expandedHeight,
      )
    }

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
    await settleNodeGeometry()
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

  async function closeExpandedCardAnimated(animateEdgeDraw = true) {
    const id = expandedId

    if (id === null) return
    if (phaseRef.current !== 'expanded') return

    if (!USE_SIMPLE_LAYOUT) {
      const generation = manualTransitionGenerationRef.current + 1
      manualTransitionGenerationRef.current = generation
      requestedOpenIdRef.current = null
      setPendingOpenId(null)
      await transitionManualToTarget(null, undefined, generation)
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
    await settleNodeGeometry()
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

  function requestManualOpen(id: string) {
    manualTransitionGenerationRef.current += 1
    requestedOpenIdRef.current = id
    setExpandedId(id)
    changePhase('measuring')
    setPendingOpenId(id)
  }

  function requestManualClose() {
    const generation = manualTransitionGenerationRef.current + 1
    manualTransitionGenerationRef.current = generation
    requestedOpenIdRef.current = null
    setPendingOpenId(null)
    void transitionManualToTarget(null, undefined, generation)
  }

  function requestOpen(id: string) {
    if (phaseRef.current !== 'idle') return

    setExpandedId(id)
    changePhase('measuring')
    setPendingOpenId(id)
  }

  async function handleNodeClick(
    id: string,
    source: 'pointer' | 'keyboard' = 'pointer',
  ) {
    if (source === 'pointer') {
      const now = performance.now()
      const previous = lastPointerClickRef.current
      lastPointerClickRef.current = { id, at: now }

      // A browser double click produces two click events. Treat those as one
      // target request so double clicking opens/closes once instead of toggling.
      if (previous?.id === id && now - previous.at < 280) return
    }

    if (!USE_SIMPLE_LAYOUT) {
      if (requestedOpenIdRef.current === id) {
        if (phaseRef.current === 'expanded') requestManualClose()
        return
      }

      requestManualOpen(id)
      return
    }

    if (phaseRef.current === 'expanded') {
      if (id === expandedId) {
        await closeExpandedCardAnimated()
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
    <div
      className="dashboard-shell"
      onPointerDownCapture={cancelIntro}
      onWheelCapture={cancelIntro}
      onKeyDownCapture={cancelIntro}
    >
      <header className="dashboard-header">
        <button
          className="dashboard-reset-button"
          type="button"
          onClick={() => {
            cancelIntro()
            introGenerationRef.current += 1
            manualTransitionGenerationRef.current += 1
            requestedOpenIdRef.current = null
            lastPointerClickRef.current = null
            rankSnapshot.current = null

            setPendingOpenId(null)
            setExpandedId(null)
            setHoveredId(null)
            setKeyboardFocusedId(null)
            setDraggingId(null)
            setMovingRank(null)
            setMovingTargetIds([])
            setEdgeBandPhase('normal')
            setIntroPoppingIds([])
            setIntroSettledIds(initialNodes.map((node) => node.id))
            setIntroPhase('done')
            changePhase('idle')

            manualBasePositionsRef.current = new Map(
              initialNodes.map((node) => [
                node.id,
                { ...node.position },
              ]),
            )

            commitNodes(
              initialNodes.map((node) => ({
                ...node,
                position: { ...node.position },
                data: { ...node.data },
                style: { ...node.style },
              })),
            )

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                reactFlowRef.current?.fitView({
                  padding: 0.08,
                  duration: reducedMotion
                    ? 0
                    : EXPANSION_CAMERA_DURATION,
                })
              })
            })
          }}
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
          void handleNodeClick(id, 'keyboard')
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
          nodes={renderedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onInit={(instance) => {
            reactFlowRef.current = {
              getViewport: () => instance.getViewport(),
              setViewport: (viewport, options) => {
                void instance.setViewport(viewport, options)
              },
              fitView: (options) => {
                void instance.fitView(options)
              },
            }
            setFlowReady(true)
          }}
          nodeExtent={graphViewport.extent}
          translateExtent={graphViewport.extent}
          minZoom={graphViewport.minZoom}
          maxZoom={Math.max(2, graphViewport.minZoom)}
          nodesDraggable={!transitioning}
          nodesFocusable
          edgesFocusable={false}
          autoPanOnNodeFocus
          zoomOnDoubleClick={false}
          onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
          onNodeMouseLeave={(_, node) => {
            setHoveredId((current) => current === node.id ? null : current)
          }}
          onNodeDragStart={(_, node) => setDraggingId(node.id)}
          onNodeDragStop={(_, node) => {
            rememberManualBasePosition(node)
            setDraggingId((current) => current === node.id ? null : current)
          }}
          onNodeClick={(_, node) => {
            void handleNodeClick(node.id)
          }}
          onPaneClick={() => {
            if (phaseRef.current !== 'expanded') return

            if (USE_SIMPLE_LAYOUT) {
              void closeExpandedCardAnimated()
            } else {
              requestManualClose()
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
