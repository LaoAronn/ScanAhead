import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppointmentForm from '../components/patient/AppointmentForm'
import AppointmentScheduler from '../components/patient/AppointmentScheduler'
import BodyPartSelector from '../components/patient/BodyPartSelector'
import CameraCapture from '../components/patient/CameraCapture'
import VideoRecorder from '../components/patient/VideoRecorder'
import VoiceRecorder from '../components/patient/VoiceRecorder'
import CaseSubmission from '../components/patient/CaseSubmission'
import type { AppointmentDraft } from '../lib/types'
import type { CapturedImage } from '../components/patient/CameraCapture'
import { clearNewCaseDraft, loadNewCaseDraft, saveNewCaseDraft } from '../lib/draftStorage'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'

const initialAppointment: AppointmentDraft = {
  patientName: '',
  email: '',
  preferredDate: '',
  preferredTime: '',
  chiefComplaint: '',
  institutionId: '',
  preferredProvider: '',
  visitType: '',
}

const steps = [
  {
    id: 'details',
    title: 'Patient details',
    description: 'Personal details and body area focus.',
  },
  {
    id: 'schedule',
    title: 'Provider & Schedule',
    description: 'Choose a provider and request a time.',
  },
  {
    id: 'capture',
    title: 'Record & capture',
    description: 'Voice note, photos, or a short video.',
  },
  {
    id: 'review',
    title: 'Review & submit',
    description: 'Confirm everything before sending.',
  },
]

const NewCase = () => {
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<AppointmentDraft>(initialAppointment)
  const [bodyPart, setBodyPart] = useState<string>('')
  const [images, setImages] = useState<CapturedImage[]>([])
  const [captureMode, setCaptureMode] = useState<'photos' | 'video'>('photos')
  const [video, setVideo] = useState<Blob | null>(null)
  const [audio, setAudio] = useState<Blob | null>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'back'>('next')
  const [transcriptionText, setTranscriptionText] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const restoreDraft = async () => {
      const draft = await loadNewCaseDraft()
      if (!isMounted) return
      if (draft) {
        const restoredMode = draft.captureMode === 'video' ? 'video' : 'photos'
        setAppointment(draft.appointment ?? initialAppointment)
        setBodyPart(draft.bodyPart ?? '')
        setCaptureMode(restoredMode)
        setImages(restoredMode === 'photos' ? ((draft.images ?? []) as CapturedImage[]) : [])
        setVideo(restoredMode === 'video' ? (draft.video ?? null) : null)
        setAudio(draft.audio ?? null)
      }
      setDraftLoaded(true)
    }

    restoreDraft()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!draftLoaded) return
    saveNewCaseDraft({
      appointment,
      bodyPart,
      images,
      audio,
      video,
      captureMode,
      updatedAt: new Date().toISOString(),
    })
  }, [appointment, bodyPart, images, audio, video, captureMode, draftLoaded])

  const applyCaptureMode = (nextMode: 'photos' | 'video') => {
    setCaptureMode(nextMode)
    if (nextMode === 'video') {
      setImages([])
    } else {
      setVideo(null)
    }
  }

  const progressValue = useMemo(() => ((currentStep + 1) / steps.length) * 100, [currentStep])

  const handleNext = () => {
    setDirection('next')
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setDirection('back')
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const captureModeCopy = captureMode === 'photos'
    ? 'Capture at least 5 photos in different angles.'
    : 'Record a short clip that shows movement or texture.'

  const stepContent = () => {
    switch (steps[currentStep]?.id) {
      case 'details':
        return (
          <div className="space-y-6">
            <AppointmentForm value={appointment} onChange={setAppointment} />
            <BodyPartSelector value={bodyPart} onChange={setBodyPart} />
          </div>
        )
      case 'schedule':
        return <AppointmentScheduler value={appointment} onChange={setAppointment} />
      case 'capture':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Capture method</p>
                    <p className="mt-1 text-sm text-slate-500">{captureModeCopy}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={captureMode === 'photos' ? 'default' : 'outline'}
                      onClick={() => applyCaptureMode('photos')}
                    >
                      Photos
                    </Button>
                    <Button
                      type="button"
                      variant={captureMode === 'video' ? 'default' : 'outline'}
                      onClick={() => applyCaptureMode('video')}
                    >
                      Short video
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {captureMode === 'photos' ? (
              <CameraCapture value={images} onChange={setImages} />
            ) : (
              <VideoRecorder value={video} onRecorded={setVideo} />
            )}
            <VoiceRecorder value={audio} onRecorded={setAudio} onTranscribed={setTranscriptionText} />
          </div>
        )
      case 'review':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Review summary</p>
                    <p className="mt-1 text-sm text-slate-500">Confirm details before submitting.</p>
                  </div>
                  <Badge variant="secondary">Step {currentStep + 1} of {steps.length}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-500">Patient</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{appointment.patientName || 'Not provided'}</p>
                    <p className="text-sm text-slate-600">{appointment.email || 'No email yet'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-500">Body area</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{bodyPart || 'Not selected'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-500">Schedule</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {appointment.preferredDate || 'Date pending'}
                    </p>
                    <p className="text-sm text-slate-600">{appointment.preferredTime || 'Time pending'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-500">Capture</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {captureMode === 'photos' ? `${images.length} photos` : video ? 'Video ready' : 'No video yet'}
                    </p>
                    <p className="text-sm text-slate-600">{audio ? 'Voice note ready' : 'Voice note missing'}</p>
                  </div>
                </div>

                {appointment.chiefComplaint && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Chief complaint</p>
                    <p className="mt-2 text-sm text-slate-700">{appointment.chiefComplaint}</p>
                  </div>
                )}

                {transcriptionText && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs uppercase text-blue-700">Latest transcription</p>
                    <p className="mt-2 text-sm text-blue-900">{transcriptionText}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <CaseSubmission
              appointment={appointment}
              bodyPart={bodyPart}
              images={images}
              audio={audio}
              video={video}
              captureMode={captureMode}
              transcriptionText={transcriptionText}
              onSubmitted={async () => {
                await clearNewCaseDraft()
                setAppointment(initialAppointment)
                setBodyPart('')
                setImages([])
                setVideo(null)
                setAudio(null)
                setCaptureMode('photos')
                navigate('/patient', { replace: true })
              }}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-4 px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-600">New Case</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Start a new medical case</h1>
              <p className="mt-2 text-sm text-slate-500">
                A guided intake experience with medical-grade capture and review.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs text-slate-500">Step</p>
              <p className="text-lg font-semibold text-slate-900">{currentStep + 1} / {steps.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Progress value={progressValue} />
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>{steps[currentStep]?.title}</span>
              <span>{Math.round(progressValue)}% complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
        <div
          key={`${steps[currentStep]?.id}-${direction}`}
          className={`step-panel ${direction === 'back' ? 'step-panel-back' : 'step-panel-next'}`}
        >
          {stepContent()}
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <p className="text-sm font-semibold text-slate-900">Your progress</p>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div
                      className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        index <= currentStep ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Need help?</p>
              <p className="text-sm text-slate-600">
                For best results, capture steady images and speak clearly in your voice note.
              </p>
              <Badge variant="secondary">HIPAA-ready workflow</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          {currentStep < steps.length - 1 && (
            <Button type="button" onClick={handleNext} size="lg">
              {currentStep === steps.length - 2 ? 'Review & submit' : 'Next'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewCase
