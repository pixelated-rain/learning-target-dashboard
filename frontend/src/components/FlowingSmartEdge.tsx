import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { useSmartEdgePath } from '@tisoap/react-flow-smart-edge'

export type FlowingSmartEdgeData = {
  flowing?: boolean
  flowColor?: string
}

const PARTICLE_COUNT = 4
const PARTICLE_DURATION_SECONDS = 1.8
const PARTICLE_RADIUS = 3.2

export function FlowingSmartEdge(props: EdgeProps) {
  const { route } = useSmartEdgePath({ ...props, preset: 'bezier' })

  const [fallbackPath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })

  const path = route && route.kind !== 'clear'
    ? route.svgPathString
    : fallbackPath

  const data = props.data as FlowingSmartEdgeData | undefined
  const flowing = data?.flowing === true
  const flowColor = data?.flowColor ?? '#cba6f7'

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        markerStart={props.markerStart}
        markerEnd={props.markerEnd}
        style={props.style}
        interactionWidth={props.interactionWidth}
      />

      {flowing && Array.from({ length: PARTICLE_COUNT }, (_, index) => (
        <circle
          key={index}
          r={PARTICLE_RADIUS}
          fill={flowColor}
          opacity={0.95}
          pointerEvents="none"
        >
          <animateMotion
            path={path}
            dur={`${PARTICLE_DURATION_SECONDS}s`}
            begin={`${-(index * PARTICLE_DURATION_SECONDS) / PARTICLE_COUNT}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </>
  )
}
