import { useLayoutEffect, useRef } from 'react'
import { getBezierPath, type EdgeProps } from '@xyflow/react'
import { edgeDrawDuration } from '../motion/timing'

export type MotionBezierEdgeData = {
  phase?: 'normal' | 'hidden' | 'drawing'
  flowing?: boolean
  introShimmer?: boolean
  introShimmerDelayMs?: number
}

export function MotionBezierEdge(props: EdgeProps) {
  const pathRef = useRef<SVGPathElement | null>(null)
  const data = props.data as MotionBezierEdgeData | undefined
  const phase = data?.phase ?? 'normal'

  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })

  const drawing = phase === 'drawing'
  const flowing = data?.flowing === true && phase === 'normal'
  const introShimmer = data?.introShimmer === true && phase === 'normal'

  const classNames = [
    'graph-motion-edge',
    phase === 'hidden' ? 'graph-motion-edge--hidden' : '',
    drawing ? 'graph-motion-edge--drawing' : '',
    flowing ? 'graph-motion-edge--flowing' : '',
    introShimmer ? 'graph-motion-edge--intro-shimmer' : '',
  ]
    .filter(Boolean)
    .join(' ')

  useLayoutEffect(() => {
    const element = pathRef.current
    if (element === null) return

    const duration = edgeDrawDuration(element.getTotalLength())
    element.style.setProperty('--graph-edge-draw-duration', `${duration}ms`)
  }, [path])

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
        animationDelay: introShimmer
          ? `${data?.introShimmerDelayMs ?? 0}ms`
          : undefined,
      }}
    />
  )
}
