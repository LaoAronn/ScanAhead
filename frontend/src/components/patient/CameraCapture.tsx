import { useEffect, useMemo, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { useCamera } from '../../hooks/useCamera'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

interface CapturedImage {
  id: string
  angle: string
  dataUrl: string
}

interface CameraCaptureProps {
  maxImages?: number
  value?: CapturedImage[]
  onChange?: (images: CapturedImage[]) => void
}

const angleSteps = [
  { label: 'Front', prompt: 'Hold steady. Capture the front view.' },
  { label: 'Left 45°', prompt: 'Move 45° to the left.' },
  { label: 'Right 45°', prompt: 'Move 45° to the right.' },
  { label: 'Top', prompt: 'Tilt slightly upward for the top view.' },
  { label: 'Bottom', prompt: 'Tilt slightly downward for the bottom view.' },
  { label: 'Close-up', prompt: 'Move closer for a detailed shot.' },
]

const estimateBytes = (dataUrl: string) => Math.ceil((dataUrl.length - 22) * 0.75)

const compressImage = async (dataUrl: string, maxBytes: number) => {
  const image = new Image()
  image.src = dataUrl

  await new Promise((resolve) => {
    image.onload = resolve
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl

  let { width, height } = image
  const maxDimension = 1280
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height)
    width = Math.floor(width * ratio)
    height = Math.floor(height * ratio)
  }

  canvas.width = width
  canvas.height = height
  ctx.drawImage(image, 0, 0, width, height)

  let quality = 0.9
  let output = canvas.toDataURL('image/jpeg', quality)

  while (estimateBytes(output) > maxBytes && quality > 0.5) {
    quality -= 0.1
    output = canvas.toDataURL('image/jpeg', quality)
  }

  return output
}

const CameraCapture = ({ maxImages = 7, value, onChange }: CameraCaptureProps) => {
  const webcamRef = useRef<Webcam>(null)
  const { facingMode, toggleFacingMode, videoConstraints } = useCamera()
  const [images, setImages] = useState<CapturedImage[]>(value ?? [])
  const [activeIndex, setActiveIndex] = useState(0)
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const steps = useMemo(() => angleSteps.slice(0, maxImages), [maxImages])

  useEffect(() => {
    if (typeof value === 'undefined') return
    setImages(value)
    setRetakeIndex(null)
    setActiveIndex(Math.min(value.length, Math.max(steps.length - 1, 0)))
  }, [value, steps.length])

  const handleCapture = async () => {
    const screenshot = webcamRef.current?.getScreenshot()
    if (!screenshot) {
      setError('Unable to capture. Please allow camera access.')
      return
    }

    const compressed = await compressImage(screenshot, 2_000_000)
    const angle = steps[retakeIndex ?? activeIndex]?.label ?? 'Photo'
    const nextImage: CapturedImage = {
      id: crypto.randomUUID(),
      angle,
      dataUrl: compressed,
    }

    setError(null)

    setImages((prev) => {
      let updated = prev
      if (retakeIndex !== null) {
        updated = prev.map((item, index) => (index === retakeIndex ? nextImage : item))
      } else {
        updated = [...prev, nextImage]
      }
      onChange?.(updated)
      return updated
    })

    setRetakeIndex(null)
    setActiveIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    const compressed = await compressImage(dataUrl, 2_000_000)
    const nextImage: CapturedImage = {
      id: crypto.randomUUID(),
      angle: steps[retakeIndex ?? activeIndex]?.label ?? 'Upload',
      dataUrl: compressed,
    }

    setImages((prev) => {
      const updated = retakeIndex !== null
        ? prev.map((item, index) => (index === retakeIndex ? nextImage : item))
        : [...prev, nextImage]
      onChange?.(updated)
      return updated
    })

    setRetakeIndex(null)
    setActiveIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  return (
    <Card>
      <CardHeader className="bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Capture photos</CardTitle>
            <CardDescription>Follow the prompts to capture 5-7 angles.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={toggleFacingMode}>
            {facingMode === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="aspect-video w-full"
              />
              <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-slate-900/60 to-transparent p-4">
                <p className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-900">
                  {steps[retakeIndex ?? activeIndex]?.prompt ?? 'Capture additional detail'}
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleCapture} size="lg">
                Capture photo
              </Button>
              <label className="cursor-pointer rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700">
                Upload instead
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              <p className="text-sm text-slate-500">
                {images.length} / {steps.length} captured
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Angle checklist</p>
              <div className="mt-3 grid gap-2">
                {steps.map((step, index) => (
                  <div
                    key={step.label}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                      index === activeIndex ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-transparent text-slate-600'
                    }`}
                  >
                    <span>{step.label}</span>
                    <span className="text-xs">
                      {images[index] ? 'Done' : index === activeIndex ? 'Next' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">Captured previews</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {images.length === 0 && (
                  <p className="col-span-2 text-sm text-slate-500">No photos captured yet.</p>
                )}
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setRetakeIndex(index)}
                    className="group relative overflow-hidden rounded-xl border border-slate-200"
                  >
                    <img src={image.dataUrl} alt={image.angle} className="h-28 w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-slate-900/70 px-2 py-1 text-xs text-white">
                      {image.angle} · Retake
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CameraCapture
export type { CapturedImage }
