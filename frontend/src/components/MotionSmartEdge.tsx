import { useLayoutEffect, useRef } from 'react'
import { getBezierPath, type EdgeProps } from '@xyflow/react'
import { useSmartEdgePath } from '@tisoap/react-flow-smart-edge'
import { edgeDrawDuration } from '../motion/timing'

export type MotionSmartEdgeData = {
  phase?: 'normal' | 'hidden' | 'drawing'
  flowing?: boolean
  suppressFallback?: boolean
  routingRevision?: number
}

export function MotionSmartEdge(props: EdgeProps) {
  const pathRef = useRef<SVGPathElement | null>(null)
  const data = props.data as MotionSmartEdgeData | undefined
  const phase = data?.phase ?? 'normal'
  const suppressFallback = data?.suppressFallback === true
  const routingRevision = data?.routingRevision ?? 0

  const routingGeometryRef = useRef({
    revision: routingRevision,
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })

  // While an affected edge is hidden, keep its routing endpoints frozen even
  // though React Flow is animating the visible nodes. A routing revision is
  // bumped only after the layout settles, at which point every affected edge
  // captures its final endpoint geometry exactly once.
  if (
    !suppressFallback ||
    routingGeometryRef.current.revision !== routingRevision
  ) {
    routingGeometryRef.current = {
      revision: routingRevision,
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      sourcePosition: props.sourcePosition,
      targetX: props.targetX,
      targetY: props.targetY,
      targetPosition: props.targetPosition,
    }
  }

  const geometry = routingGeometryRef.current
  const { route, isDragging } = useSmartEdgePath({
    ...props,
    sourceX: geometry.sourceX,
    sourceY: geometry.sourceY,
    sourcePosition: geometry.sourcePosition,
    targetX: geometry.targetX,
    targetY: geometry.targetY,
    targetPosition: geometry.targetPosition,
    preset: 'bezier',
  })

  const [fallbackPath] = getBezierPath({
    sourceX: geometry.sourceX,
    sourceY: geometry.sourceY,
    sourcePosition: geometry.sourcePosition,
    targetX: geometry.targetX,
    targetY: geometry.targetY,
    targetPosition: geometry.targetPosition,
  })

  // A missing route means the worker has not produced the obstacle-aware path
  // yet. A `clear` route is different: Smart Edge explicitly determined that
  // the native Bezier is safe. Keep a pending affected edge invisible rather
  // than exposing its temporary native fallback.
  const routePending = !route && suppressFallback
  const path = isDragging
    ? fallbackPath
    : route && route.kind !== 'clear'
      ? route.svgPathString
      : fallbackPath

  const drawing = phase === 'drawing' && !routePending
  const flowing = data?.flowing === true && phase === 'normal'

  const classNames = [
    'graph-motion-edge',
    phase === 'hidden' ? 'graph-motion-edge--hidden' : '',
    drawing ? 'graph-motion-edge--drawing' : '',
    flowing ? 'graph-motion-edge--flowing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Measure the final routed path itself. useLayoutEffect runs before paint, so
  // the drawing animation receives its length-aware duration without a visible
  // first frame at the fallback duration.
  useLayoutEffect(() => {
    const element = pathRef.current
    if (element === null || routePending) return

    const duration = edgeDrawDuration(element.getTotalLength())
    element.style.setProperty('--graph-edge-draw-duration', `${duration}ms`)
  }, [path, routePending])

  return (
    <path
      ref={pathRef}
      className={classNames}
      d={path}
      fill="none"
      markerStart={drawing ? undefined : props.markerStart}
      markerEnd={drawing ? undefined : props.markerEnd}
      pathLength={drawing ? 1 : undefined}
      pointerEvents="none"
      style={{
        ...props.style,
        opacity: routePending ? 0 : props.style?.opacity,
      }}
    />
  )
}
