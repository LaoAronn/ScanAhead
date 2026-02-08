import { useEffect, useRef, useState } from 'react'
import { transcribeAudio } from '../../lib/transcription'

interface VoiceRecorderProps {
  value?: Blob | null
  onRecorded?: (audio: Blob) => void
  onTranscribed?: (text: string) => void
}

const MAX_DURATION = 120
const WARNING_AT = 105
const QUESTION_DISPLAY_TIME = 30000

const PROMPTS = [
  "When did this start?",
  "How has it changed?",
  "Any pain, itching, or other symptoms?",
  "What have you tried so far?"
]

const VoiceRecorder = ({value, onRecorded, onTranscribed }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<string | null>(null)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [transcriptionMeta, setTranscriptionMeta] = useState<{ transcription_id?: string; words?: any[] } | null>(null)
  const [liveTranscript, setLiveTranscript] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null) // SpeechRecognition instance (if available)
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
    setShowErrorDetails(false)
    setLiveTranscript(null)
    setAudioUrl(null)
    setAudioBlob(null)
    setTranscription(null)
    setDuration(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Start SpeechRecognition fallback (live) if supported
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
          const rec = new SpeechRecognition()
          rec.continuous = true
          rec.interimResults = true
          rec.lang = 'en-US'
          let accumulated = ''
          rec.onresult = (ev: any) => {
            // Recompute final transcript from scratch from the event results
            // (ev.results contains all results so far). This avoids re-appending
            // previously-finalized text and prevents duplication.
            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = 0; i < ev.results.length; i++) {
              const result = ev.results[i]
              const text = result[0]?.transcript ?? ''
              if (result.isFinal) {
                finalTranscript = finalTranscript ? `${finalTranscript} ${text}` : text
              } else if (i === ev.results.length - 1) {
                // only consider the last non-final chunk as the interim
                interimTranscript = text
              }
            }

            accumulated = finalTranscript
            const combined = (finalTranscript ? `${finalTranscript} ${interimTranscript}` : interimTranscript).trim()
            setLiveTranscript(combined || null)
          }
          rec.onerror = (e: any) => {
            console.warn('SpeechRecognition error', e)
          }
          rec.start()
          recognitionRef.current = rec
        }
      } catch (e) {
        // ignore recognition init errors
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
    } catch (err) {
      setError('Microphone access is required to record a voice note.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setIsRecording(false)
    setShowPrompts(false)
    stopWaveform()

    // Stop SpeechRecognition fallback if running
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
    if (!audioBlob) {
      setError('No audio to transcribe')
      return
    }

    setIsTranscribing(true)
    setError(null)
    setDetailedError(null)
    setShowErrorDetails(false)

    try {
      const result = await transcribeAudio(audioBlob)
      // support both shapes (legacy string -> { text })
      const text = (result as any).text ?? (result as any)
      setTranscription(text)
      setTranscriptionMeta({
        transcription_id: (result as any).transcription_id,
        words: (result as any).words
      })
      try {
        // persist final transcription so other components (e.g. CaseSubmission) can read it
        localStorage.setItem('scanahead_transcription', text ?? '')
      } catch {
        /* ignore storage errors */
      }
      onTranscribed?.(text)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Transcription error:', err)
      setDetailedError(msg)

      // If remote fetch failed, fallback to liveTranscript if available
      const isNetworkLike =
        msg.includes('Failed to fetch') ||
        msg.toLowerCase().includes('networkerror') ||
        msg.toLowerCase().includes('network error') ||
        msg.toLowerCase().includes('transcription endpoint not found') ||
        msg.toLowerCase().includes('endpoint')
      if (isNetworkLike && liveTranscript) {
        setTranscription(liveTranscript)
        try {
          localStorage.setItem('scanahead_transcription', liveTranscript ?? '')
        } catch {
          /* ignore */
        }
        onTranscribed?.(liveTranscript)
        // removed fallback error message per request; use live transcript silently
      } else if (isNetworkLike && !liveTranscript) {
        setError(
          'Unable to reach the transcription service and no browser fallback available. Ensure your backend endpoint is running or try recording again.'
        )
      } else {
        setError(msg)
      }
    } finally {
      setIsTranscribing(false)
    }
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
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-900 mb-2">Transcription:</p>
          <p className="text-sm text-green-800 whitespace-pre-wrap">{transcription}</p>
        </div>
      )}

      {liveTranscript && (
        <div className="mt-3 rounded-md bg-slate-50 p-2 text-sm text-slate-700">
          <strong className="text-xs text-slate-600">Live (browser) transcript:</strong>
          <p className="mt-1 whitespace-pre-wrap text-xs">{liveTranscript}</p>
        </div>
      )}

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
          <>
            <audio controls src={audioUrl} className="flex-1 max-w-sm" />
            <button
              type="button"
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isTranscribing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Transcribing...
                </span>
              ) : (
                'Transcribe'
              )}
            </button>

            {/* Transcription metadata displayed right below the transcribe button */}
            {transcriptionMeta && (
              <div className="mt-2 w-full">
                {transcriptionMeta.transcription_id && (
                  <p className="text-xs text-slate-500">Transcription ID: {transcriptionMeta.transcription_id}</p>
                )}
                {transcriptionMeta.words && (
                  <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-slate-50 p-2 text-xs text-slate-700">
                    {JSON.stringify(transcriptionMeta.words, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  )
}

export default VoiceRecorder