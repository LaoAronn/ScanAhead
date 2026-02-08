import { useState, useEffect } from 'react'
import AppointmentForm from '../components/patient/AppointmentForm'
import BodyPartSelector from '../components/patient/BodyPartSelector'
import CameraCapture from '../components/patient/CameraCapture'
import VideoRecorder from '../components/patient/VideoRecorder'
import VoiceRecorder from '../components/patient/VoiceRecorder'
import CaseSubmission from '../components/patient/CaseSubmission'
import type { AppointmentDraft } from '../lib/types'
import type { CapturedImage } from '../components/patient/CameraCapture'
import { loadNewCaseDraft, saveNewCaseDraft } from '../lib/draftStorage'

const initialAppointment: AppointmentDraft = {
  patientName: '',
  email: '',
  preferredDate: '',
  preferredTime: '',
  chiefComplaint: '',
}

const NewCase = () => {
  const [appointment, setAppointment] = useState<AppointmentDraft>(initialAppointment)
  const [bodyPart, setBodyPart] = useState<string>('')
  const [images, setImages] = useState<CapturedImage[]>([])
  const [captureMode, setCaptureMode] = useState<'photos' | 'video'>('photos')
  const [video, setVideo] = useState<Blob | null>(null)
  const [audio, setAudio] = useState<Blob | null>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true
    const restoreDraft = async () => {
      const draft = await loadNewCaseDraft()
      if (!isMounted) return
      if (draft) {
        setAppointment(draft.appointment ?? initialAppointment)
        setBodyPart(draft.bodyPart ?? '')
        setImages((draft.images ?? []) as CapturedImage[])
        setCaptureMode(draft.captureMode === 'video' ? 'video' : 'photos')
        setVideo(draft.video ?? null)
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

  useEffect(() => {
    if (captureMode === 'video' && images.length > 0) {
      setImages([])
    }
    if (captureMode === 'photos' && video) {
      setVideo(null)
    }
  }, [captureMode, images.length, video])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">New case submission</h1>
        <p className="mt-2 text-sm text-slate-600">
          Complete each step below. You can capture photos with your camera or upload existing images.
        </p>
      </div>

      <AppointmentForm value={appointment} onChange={setAppointment} />
      <BodyPartSelector value={bodyPart} onChange={setBodyPart} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Capture method</h3>
        <p className="mt-1 text-sm text-slate-500">
          Choose photos or a short video. Use video when movement helps demonstrate the issue.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setCaptureMode('photos')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              captureMode === 'photos'
                ? 'bg-brand-600 text-white'
                : 'border border-slate-200 text-slate-700 hover:border-brand-200 hover:text-brand-700'
            }`}
          >
            Photos (recommended)
          </button>
          <button
            type="button"
            onClick={() => setCaptureMode('video')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              captureMode === 'video'
                ? 'bg-brand-600 text-white'
                : 'border border-slate-200 text-slate-700 hover:border-brand-200 hover:text-brand-700'
            }`}
          >
            Short video
          </button>
        </div>
      </section>
      {captureMode === 'photos' ? (
        <CameraCapture value={images} onChange={setImages} />
      ) : (
        <VideoRecorder value={video} onRecorded={setVideo} />
      )}
      <VoiceRecorder value={audio} onRecorded={setAudio} />
      <CaseSubmission
        appointment={appointment}
        bodyPart={bodyPart}
        images={images}
        audio={audio}
        video={video}
        captureMode={captureMode}
      />

    </div>
  )
}

export default NewCase
