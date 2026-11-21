export const motionTiming = {
  edgeFade: 80,
  layout: 280,
  routingSettleTimeout: 1200,
  edgeDrawMin: 400,
  edgeDrawMax: 1000,
  edgeDrawPixelsPerSecond: 500,
  contentReveal: 300,
} as const

export function edgeDrawDuration(pathLength: number) {
  const duration = (pathLength / motionTiming.edgeDrawPixelsPerSecond) * 1000

  return Math.max(
    motionTiming.edgeDrawMin,
    Math.min(motionTiming.edgeDrawMax, duration),
  )
}
