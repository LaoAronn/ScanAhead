import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import type { PerspectiveCamera } from 'three'
import PointCloudLoader from './PointCloudLoader'
import ViewerControls from './ViewerControls'

interface ModelViewerProps {
  modelUrl: string
}

const CameraControls = ({ onReady }: { onReady: (camera: PerspectiveCamera) => void }) => {
  const { camera } = useThree()

  useEffect(() => {
    onReady(camera as PerspectiveCamera)
  }, [camera, onReady])

  return null
}

const ModelViewer = ({ modelUrl }: ModelViewerProps) => {
  const cameraRef = useRef<PerspectiveCamera | null>(null)
  const initialPosition = useRef<[number, number, number]>([0, 0, 4])

  const zoom = (factor: number) => {
    if (!cameraRef.current) return
    cameraRef.current.position.multiplyScalar(factor)
  }

  const resetCamera = () => {
    if (!cameraRef.current) return
    const [x, y, z] = initialPosition.current
    cameraRef.current.position.set(x, y, z)
    cameraRef.current.lookAt(0, 0, 0)
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-950">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <CameraControls
          onReady={(camera) => {
            cameraRef.current = camera
            initialPosition.current = [camera.position.x, camera.position.y, camera.position.z]
          }}
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 4, 2]} intensity={0.8} />
        <directionalLight position={[-4, -2, 4]} intensity={0.6} />
        <gridHelper args={[10, 10, '#1f2937', '#0f172a']} />
        <Suspense
          fallback={
            <Html center>
              <div className="rounded-full bg-slate-900/80 px-4 py-2 text-xs text-slate-200">
                Loading model...
              </div>
            </Html>
          }
        >
          {modelUrl ? <PointCloudLoader url={modelUrl} /> : null}
        </Suspense>
        <OrbitControls enablePan enableZoom />
      </Canvas>

      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          3D model will appear here once uploaded.
        </div>
      )}

      <ViewerControls onZoomIn={() => zoom(0.9)} onZoomOut={() => zoom(1.1)} onReset={resetCamera} />

      {/* TODO: Implement measurement tools on 3D model */}
    </div>
  )
}

export default ModelViewer
