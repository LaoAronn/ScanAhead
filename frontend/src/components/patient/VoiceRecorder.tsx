import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

interface VoiceRecorderProps {
  value?: Blob | null
  onRecorded?: (audio: Blob) => void
  onTranscribed?: (text: string) => void
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: { transcript: string }
}

type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultLike[]
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

type TranscriptionResponse =
  | {
      text?: string
      transcription?: string
      transcription_id?: string
      words?: unknown[]
    }
  | string

const MAX_DURATION = 120
const WARNING_AT = 105
const QUESTION_DISPLAY_TIME = 30000

const PROMPTS = [
  'When did this start?',
  'How has it changed?',
  'Any pain, itching, or other symptoms?',
  'What have you tried so far?',
]

const VoiceRecorder = ({ value, onRecorded, onTranscribed }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<string | null>(null)
  const [showPrompts, setShowPrompts] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [transcriptionMeta, setTranscriptionMeta] = useState<{ transcription_id?: string; words?: unknown[] } | null>(null)
  const [liveTranscript, setLiveTranscript] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const timerRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const promptTimerRef = useRef<number | null>(null)

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
    setDetailedError(null)
    setLiveTranscript(null)
    setAudioUrl(null)
    setAudioBlob(null)
    setTranscription(null)
    setDuration(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      try {
        const speechWindow = window as SpeechWindow
        const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
        if (SpeechRecognition) {
          const rec = new SpeechRecognition()
          rec.continuous = true
          rec.interimResults = true
          rec.lang = 'en-US'
          rec.onresult = (ev: SpeechRecognitionEventLike) => {
            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = 0; i < ev.results.length; i++) {
              const result = ev.results[i]
              const text = result[0]?.transcript ?? ''
              if (result.isFinal) {
                finalTranscript = finalTranscript ? `${finalTranscript} ${text}` : text
              } else if (i === ev.results.length - 1) {
                interimTranscript = text
              }
            }

            const combined = (finalTranscript ? `${finalTranscript} ${interimTranscript}` : interimTranscript).trim()
            setLiveTranscript(combined || null)
          }
          rec.onerror = (event: Event) => {
            console.warn('SpeechRecognition error', event)
          }
          rec.start()
          recognitionRef.current = rec
        }
      } catch (e) {
        console.warn('SpeechRecognition not available', e)
      }

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
          setAudioBlob(null)
          return
        }
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setAudioBlob(blob)
        onRecorded?.(blob)
      }

      recorder.start()
      setIsRecording(true)
      setShowPrompts(true)
      drawWaveform()

      promptTimerRef.current = window.setTimeout(() => {
        setShowPrompts(false)
      }, QUESTION_DISPLAY_TIME)

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording()
            return MAX_DURATION
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setError('Microphone access is required to record a voice note.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setIsRecording(false)
    setShowPrompts(false)
    stopWaveform()

    if (!transcription && liveTranscript) {
      setTranscription(liveTranscript)
      try {
        localStorage.setItem('scanahead_transcription', liveTranscript)
      } catch {
        /* ignore */
      }
      onTranscribed?.(liveTranscript)
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop?.()
        recognitionRef.current = null
      }
    } catch {
      /* ignore */
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }
    if (promptTimerRef.current) {
      window.clearTimeout(promptTimerRef.current)
    }
  }

  const handleTranscribe = async () => {
    if (transcription) {
      onTranscribed?.(transcription)
      return
    }

    if (!liveTranscript) {
      setError('No transcript captured yet. Try recording again and speak clearly.')
      return
    }

    setIsTranscribing(true)
    setError(null)
    setDetailedError(null)

    const text = liveTranscript.trim()
    setTranscription(text)
    setTranscriptionMeta(null)
    try {
      localStorage.setItem('scanahead_transcription', text)
    } catch {
      /* ignore storage errors */
    }
    onTranscribed?.(text)
    setIsTranscribing(false)
  }

  useEffect(() => {
    if (!value) {
      setAudioUrl(null)
      return
    }
    const url = URL.createObjectURL(value)
    setAudioUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [value])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
      if (promptTimerRef.current) {
        window.clearTimeout(promptTimerRef.current)
      }
      stopWaveform()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      try {
        recognitionRef.current?.stop?.()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return (
    <Card>
      <CardHeader className="bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Voice note (max 2 minutes)</CardTitle>
            <CardDescription>Describe symptoms, duration, and changes over time.</CardDescription>
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
          <canvas ref={canvasRef} className="h-20 w-full" />
          <p className="mt-2 text-xs text-slate-500">Waveform appears while recording.</p>
        </div>

        {showPrompts && isRecording && (
          <div className="mt-4 space-y-2 animate-fade-in">
            <p className="text-sm font-medium text-slate-700">Consider mentioning:</p>
            <div className="grid gap-2">
              {PROMPTS.map((prompt, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        )}

        {duration >= WARNING_AT && isRecording && (
          <p className="mt-3 text-sm text-amber-600">Almost done. Please wrap up in the next 15 seconds.</p>
        )}
        {error && (
          <div className="mt-3">
            <p className="text-sm text-rose-600">{error}</p>
            {detailedError && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-slate-100 p-2 text-xs text-slate-700">
                {detailedError}
              </pre>
            )}
          </div>
        )}

        {transcription && (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="mb-2 text-sm font-medium text-green-900">Transcription:</p>
            <p className="whitespace-pre-wrap text-sm text-green-800">{transcription}</p>
          </div>
        )}

        {liveTranscript && (
          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            <strong className="text-xs text-slate-600">Live (browser) transcript:</strong>
            <p className="mt-1 whitespace-pre-wrap text-xs">{liveTranscript}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!isRecording ? (
            <Button type="button" onClick={startRecording} size="lg">
              Record
            </Button>
          ) : (
            <Button type="button" onClick={stopRecording} variant="destructive" size="lg">
              Stop
            </Button>
          )}

          {audioUrl && (
            <>
              <audio controls src={audioUrl} className="flex-1 max-w-sm" />
              <Button type="button" onClick={handleTranscribe} variant="outline" disabled={isTranscribing}>
                {isTranscribing ? 'Saving transcript...' : 'Use transcript'}
              </Button>
            </>
          )}
        </div>

        {transcriptionMeta && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Transcription metadata</p>
            {transcriptionMeta.transcription_id && (
              <p className="mt-2 text-xs text-slate-600">ID: {transcriptionMeta.transcription_id}</p>
            )}
            {transcriptionMeta.words && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-white p-2 text-xs text-slate-700">
                {JSON.stringify(transcriptionMeta.words, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VoiceRecorder
