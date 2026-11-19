import {
  Position,
  ReactFlow,
  useNodesState,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import { sampleCourse } from './courses/sampleCourse.ts'

const initialNodes = sampleCourse.targets.map((target, index) => ({
  id: target.id,
  position: {
    x: index * 250,
    y: 100,
  },
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  style: {
    width: 200,
  },
  data: {
    label: target.name,
  },
}))

const edges = sampleCourse.targets.flatMap((target) =>
  target.prerequisites.map((prerequisite) => ({
    id: `${prerequisite}-${target.id}`,
    source: prerequisite,
    target: target.id,
  })),
)

function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        fitView
      />
    </div>
  )
}

export default App
