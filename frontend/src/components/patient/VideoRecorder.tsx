import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

interface VideoRecorderProps {
  value?: Blob | null
  onRecorded?: (video: Blob | null) => void
}

const MAX_DURATION = 45
const MAX_SIZE_BYTES = 50_000_000

const pickSupportedMimeType = () => {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/webm;codecs=vp9,opus',
  ]

  const video = document.createElement('video')
  const canPlay = (type: string) => {
    const base = type.split(';')[0]
    return video.canPlayType(type) !== '' || video.canPlayType(base) !== ''
  }

  const playableAndRecordable = candidates.find(
    (type) => MediaRecorder.isTypeSupported(type) && canPlay(type),
  )

  if (playableAndRecordable) return playableAndRecordable

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
}

const VideoRecorder = ({ value, onRecorded }: VideoRecorderProps) => {
  const { facingMode, toggleFacingMode, videoConstraints } = useCamera()
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const timerRef = useRef<number | null>(null)

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
    setIsRecording(false)

    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }
  }

  const startRecording = async () => {
    setError(null)
    setVideoUrl(null)
    setDuration(0)

    try {
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('Video recording is not supported on this device.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      })
      streamRef.current = stream
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        previewRef.current.onloadedmetadata = () => {
          previewRef.current?.play().catch(() => {})
        }
      }

      const mimeType = pickSupportedMimeType()
      if (!mimeType) {
        throw new Error('Video recording is not supported on this device.')
      }

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        setError('Unable to record video on this device. Please upload a file instead.')
      }

      recorder.onstop = () => {
        if (chunksRef.current.length === 0) {
          setError('No video data captured. Please try recording again or upload a file.')
          setVideoUrl(null)
          onRecorded?.(null)
          streamRef.current?.getTracks().forEach((track) => track.stop())
          if (previewRef.current) {
            previewRef.current.srcObject = null
          }
          return
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType })
        if (blob.size > MAX_SIZE_BYTES) {
          setError('Video is too large. Please keep it under 50 MB.')
          setVideoUrl(null)
          onRecorded?.(null)
          streamRef.current?.getTracks().forEach((track) => track.stop())
          if (previewRef.current) {
            previewRef.current.srcObject = null
          }
          return
        }
        streamRef.current?.getTracks().forEach((track) => track.stop())
        if (previewRef.current) {
          previewRef.current.srcObject = null
        }
        const url = URL.createObjectURL(blob)
        setVideoUrl(url)
        onRecorded?.(blob)
      }

      recorder.start()
      setIsRecording(true)

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording()
            return MAX_DURATION
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access is required to record a video.'
      setError(message)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE_BYTES) {
      setError('Video is too large. Please keep it under 50 MB.')
      return
    }

    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    onRecorded?.(file)
  }

  const clearVideo = () => {
    setVideoUrl(null)
    setDuration(0)
    setError(null)
    setIsRecording(false)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (previewRef.current) {
      previewRef.current.srcObject = null
      previewRef.current.removeAttribute('src')
      previewRef.current.load()
    }
    setPreviewKey((prev) => prev + 1)
    onRecorded?.(null)
  }

  useEffect(() => {
    if (!value) {
      setVideoUrl(null)
      return
    }
    const url = URL.createObjectURL(value)
    setVideoUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [value])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <Card>
      <CardHeader className="bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Record a short video</CardTitle>
            <CardDescription>Capture a 30-45s clip that shows the issue clearly.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={toggleFacingMode}>
            {facingMode === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
            {!videoUrl ? (
              <video
                key={previewKey}
                ref={previewRef}
                autoPlay
                muted
                playsInline
                className="aspect-video w-full"
              />
            ) : (
              <video controls src={videoUrl} className="aspect-video w-full" />
            )}
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            {!isRecording ? (
              <Button type="button" onClick={startRecording} size="lg">
                Record video
              </Button>
            ) : (
              <Button type="button" onClick={stopRecording} variant="destructive" size="lg">
                Stop
              </Button>
            )}

            <label className="cursor-pointer rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700">
              Upload instead
              <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <Button type="button" onClick={clearVideo} disabled={!videoUrl} variant="outline">
              Clear
            </Button>

            <span className="text-sm text-slate-600">
              {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default VideoRecorder
