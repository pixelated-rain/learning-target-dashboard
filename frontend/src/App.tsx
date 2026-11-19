import {
  MarkerType,
  Position,
  ReactFlow,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  SmartEdgeProvider,
  SmartSmoothStepEdge,
} from '@tisoap/react-flow-smart-edge'
import { math1310Course as course } from './courses/math1310Course'
import {
  simpleLayout,
  NODE_WIDTH,
  NODE_HEIGHT,
} from './graph/simpleLayout'

const layout = simpleLayout(course.targets)

const edgeTypes = {
  smart: SmartSmoothStepEdge,
}

const initialNodes = course.targets.map((target) => ({
  id: target.id,
  position: layout.positions.get(target.id)!,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,

  style: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    boxSizing: 'border-box',
    borderWidth: target.isCore ? 3 : 1,
  },

  data: {
    label: (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        <strong style={{ fontSize: 20 }}>
          {target.id.toUpperCase()}
        </strong>

        <span style={{
          fontSize: 12,
          lineHeight: 1.4,
        }}>
          {target.name}
        </span>
      </div>
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

function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <SmartEdgeProvider nodes={nodes}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          edgeTypes={edgeTypes}
          fitView
        />
      </SmartEdgeProvider>
    </div>
  )
}

export default App
