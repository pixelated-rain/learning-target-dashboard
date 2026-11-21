import type { Node } from '@xyflow/react'

type FrameHandler = (nodes: Node[]) => void
type ContinuePredicate = () => boolean

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3
}

function numericStyleValue(node: Node, key: 'width' | 'height'): number | undefined {
  const value = node.style?.[key]
  return typeof value === 'number' ? value : undefined
}

export function animateNodes(
  fromNodes: Node[],
  toNodes: Node[],
  duration: number,
  onFrame: FrameHandler,
  shouldContinue: ContinuePredicate = () => true,
): Promise<void> {
  if (duration <= 0) {
    if (shouldContinue()) onFrame(toNodes)
    return Promise.resolve()
  }

  const fromById = new Map(fromNodes.map((node) => [node.id, node]))

  return new Promise((resolve) => {
    const start = performance.now()

    function frame(now: number) {
      if (!shouldContinue()) {
        resolve()
        return
      }

      const rawProgress = Math.min((now - start) / duration, 1)
      const progress = easeOutCubic(rawProgress)

      const nextNodes = toNodes.map((toNode) => {
        const fromNode = fromById.get(toNode.id)
        if (fromNode === undefined) return toNode

        const fromWidth = numericStyleValue(fromNode, 'width')
        const toWidth = numericStyleValue(toNode, 'width')
        const fromHeight = numericStyleValue(fromNode, 'height')
        const toHeight = numericStyleValue(toNode, 'height')

        return {
          ...toNode,
          position: {
            x: lerp(fromNode.position.x, toNode.position.x, progress),
            y: lerp(fromNode.position.y, toNode.position.y, progress),
          },
          style: {
            ...toNode.style,
            width:
              fromWidth !== undefined && toWidth !== undefined
                ? lerp(fromWidth, toWidth, progress)
                : toNode.style?.width,
            height:
              fromHeight !== undefined && toHeight !== undefined
                ? lerp(fromHeight, toHeight, progress)
                : toNode.style?.height,
          },
        }
      })

      onFrame(nextNodes)

      if (rawProgress < 1) {
        requestAnimationFrame(frame)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(frame)
  })
}
