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
  SmartSmoothStepEdge,
} from '@tisoap/react-flow-smart-edge'
import { TargetCard } from './components/TargetCard'
import { math1310Course as course } from './courses/math1310Course'
import { math1310TargetContent } from './courses/math1310TargetContent'
import { simpleLayout, NODE_WIDTH, NODE_HEIGHT } from './graph/simpleLayout'
import type { LearningTarget } from './types/LearningTarget'

const layout = simpleLayout(course.targets)
const edgeTypes = { smart: SmartSmoothStepEdge }
const targetsById = new Map(course.targets.map((target) => [target.id, target]))

function cardStyle(target: LearningTarget, expanded: boolean) {
  return {
    width: expanded ? 390 : NODE_WIDTH,
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
  style: cardStyle(target, false),
  data: {
    expanded: false,
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

const edges = layout.edges.map(({ source, target }) => ({
  id: `${source}->${target}`,
  source,
  target,
  type: 'smart',
  markerEnd: { type: MarkerType.ArrowClosed },
}))

// Only one card is open at a time. Keep the existing node (including its
// dragged position) so expanding doesn't reset the student's graph layout.
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

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <SmartEdgeProvider nodes={nodes}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => {
            setNodes((current) =>
              setExpandedCard(current, node.data.expanded === true ? null : node.id),
            )
          }}
          onPaneClick={() => {
            setNodes((current) => setExpandedCard(current, null))
          }}
          edgeTypes={edgeTypes}
          fitView
        />
      </SmartEdgeProvider>
    </div>
  )
}

export default App
