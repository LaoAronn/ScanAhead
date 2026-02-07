import { useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import type { BufferGeometry } from 'three'

interface PointCloudLoaderProps {
  url: string
}

const PointCloudLoader = ({ url }: PointCloudLoaderProps) => {
  const extension = url.split('.').pop()?.toLowerCase()

  if (extension === 'ply') {
    const geometry = useLoader(PLYLoader, url) as BufferGeometry
    return (
      <points geometry={geometry}>
        <pointsMaterial size={0.01} color="#7dd3fc" />
      </points>
    )
  }

  const gltf = useGLTF(url)
  return <primitive object={gltf.scene} />
}

export default PointCloudLoader
