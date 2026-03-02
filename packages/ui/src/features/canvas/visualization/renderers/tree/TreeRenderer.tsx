import React from 'react'
import * as THREE from 'three'
import type { VisualizationRenderer, RenderContext } from '../../types'

/**
 * TreeRenderer — minimal hierarchy visualization.
 *
 * Renders nodes as spheres at their layout positions.
 * Edges are rendered as lines. No city metaphor.
 *
 * This is a proof-of-concept demonstrating that VisualizationRenderer
 * is truly decoupled from the city rendering system.
 */
const treeRenderer: VisualizationRenderer = {
  type: 'tree',

  render(ctx: RenderContext): React.JSX.Element {
    const { graph, positions } = ctx
    return (
      <group>
        {/* Nodes as spheres */}
        {graph.nodes.map((node) => {
          const pos = positions.get(node.id)
          if (!pos) return null
          return (
            <mesh key={node.id} position={[pos.x, pos.y, pos.z]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial color="#60a5fa" />
            </mesh>
          )
        })}
        {/* Edges as lines — use primitive to avoid SVG line conflict */}
        {graph.edges.map((edge) => {
          const src = positions.get(edge.source)
          const tgt = positions.get(edge.target)
          if (!src || !tgt) return null
          const points = new Float32Array([src.x, src.y, src.z, tgt.x, tgt.y, tgt.z])
          const geo = new THREE.BufferGeometry()
          geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
          const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#94a3b8' }))
          return <primitive key={`${edge.source}-${edge.target}`} object={line} />
        })}
      </group>
    )
  },

  canRender(layoutType: string): boolean {
    return layoutType === 'tree'
  },
}

export { treeRenderer }
