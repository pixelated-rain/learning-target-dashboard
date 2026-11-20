export const motionTiming = {
  edgeFade: 80,
  layout: 280,
  routingSettleTimeout: 1200,
  edgeDrawMin: 260,
  edgeDrawMax: 620,
  edgeDrawPixelsPerSecond: 700,
  contentReveal: 300,
} as const

export function edgeDrawDuration(pathLength: number) {
  const duration = (pathLength / motionTiming.edgeDrawPixelsPerSecond) * 1000

  return Math.max(
    motionTiming.edgeDrawMin,
    Math.min(motionTiming.edgeDrawMax, duration),
  )
}
