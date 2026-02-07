import { useEffect, useRef, useState } from 'react'

interface VoiceRecorderProps {
  onRecorded?: (audio: Blob) => void
}

const MAX_DURATION = 120
const WARNING_AT = 105

const VoiceRecorder = ({ onRecorded }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  const drawWaveform = () => {
    const analyser = analyserRef.current
    const canvas = canvasRef.current
    if (!analyser || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#2563eb'
      ctx.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i += 1) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
  }

  const stopWaveform = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const startRecording = async () => {
    setError(null)
    setAudioUrl(null)
    setDuration(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size > 5_000_000) {
          setError('Recording is too large. Please keep the note under 2 minutes.')
          setAudioUrl(null)
          return
        }
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        onRecorded?.(blob)
      }

      recorder.start()
      setIsRecording(true)
      drawWaveform()

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
      setError('Microphone access is required to record a voice note.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setIsRecording(false)
    stopWaveform()

    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
      stopWaveform()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Voice note (max 2 minutes)</h3>
          <p className="mt-1 text-sm text-slate-500">Describe symptoms, duration, and changes over time.</p>
        </div>
        <div className="text-sm font-semibold text-slate-700">
          {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
        <canvas ref={canvasRef} className="h-20 w-full" />
        <p className="mt-2 text-xs text-slate-500">Waveform appears while recording.</p>
      </div>

      {duration >= WARNING_AT && isRecording && (
        <p className="mt-3 text-sm text-amber-600">Almost done. Please wrap up in the next 15 seconds.</p>
      )}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Stop
          </button>
        )}

        {audioUrl && (
          <audio controls src={audioUrl} className="w-full max-w-sm" />
        )}
      </div>
    </section>
  )
}

export default VoiceRecorder
