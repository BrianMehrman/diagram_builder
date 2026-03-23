/**
 * Basic3DNode Component
 *
 * Renders a 3D node shape with hover/select interaction for the Basic3D layout.
 * Shape and color are determined by node type via basic3dShapes.ts.
 * Abstract nodes render as wireframe.
 */

import type { IVMNode, Position3D } from '@diagram-builder/core'
import { useCanvasStore } from '../../store'
import { getShapeForType, getColorForType, isAbstractNode } from './basic3dShapes'

export interface Basic3DNodeProps {
  node: IVMNode
  position: Position3D
  isSelected: boolean
}

function renderGeometry(shape: ReturnType<typeof getShapeForType>) {
  switch (shape) {
    case 'disc':
      return <cylinderGeometry args={[1, 1, 0.2, 32]} />
    case 'large-disc':
      return <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
    case 'box':
      return <boxGeometry args={[1, 1, 1]} />
    case 'large-box':
      return <boxGeometry args={[1.5, 1.5, 1.5]} />
    case 'very-large-box':
      return <boxGeometry args={[2, 2, 2]} />
    case 'sphere':
      return <sphereGeometry args={[0.7, 16, 16]} />
    case 'small-sphere':
      return <sphereGeometry args={[0.5, 16, 16]} />
    case 'icosahedron':
      return <icosahedronGeometry args={[0.7]} />
    case 'octahedron':
      return <octahedronGeometry args={[0.7]} />
    case 'cylinder':
      return <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
    case 'torus':
      return <torusGeometry args={[0.7, 0.2, 8, 24]} />
    default:
      return <boxGeometry args={[1, 1, 1]} />
  }
}

export function Basic3DNode({ node, position, isSelected }: Basic3DNodeProps) {
  const selectNode = useCanvasStore((s) => s.selectNode)
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode)

  const shape = getShapeForType(node.type)
  const color = getColorForType(node.type)
  const wireframe = isAbstractNode(node)

  const handleClick = () => {
    selectNode(node.id)
  }

  const handlePointerOver = () => {
    setHoveredNode(node.id)
  }

  const handlePointerOut = () => {
    setHoveredNode(null)
  }

  return (
    <group
      name="basic3d-node"
      position={[position.x, position.y, position.z]}
      userData={{ nodeId: node.id, wireframe, selected: isSelected }}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh>
        {renderGeometry(shape)}
        <meshStandardMaterial
          color={color}
          wireframe={wireframe}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
    </group>
  )
}
