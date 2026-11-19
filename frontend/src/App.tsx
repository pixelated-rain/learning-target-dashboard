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
import { simpleLayout } from './graph/simpleLayout'

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
    width: 200,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  data: { label: target.name },
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
