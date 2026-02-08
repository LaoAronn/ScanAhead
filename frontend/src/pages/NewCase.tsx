import { useState, useEffect } from 'react'
import AppointmentForm from '../components/patient/AppointmentForm'
import BodyPartSelector from '../components/patient/BodyPartSelector'
import CameraCapture from '../components/patient/CameraCapture'
import VoiceRecorder from '../components/patient/VoiceRecorder'
import CaseSubmission from '../components/patient/CaseSubmission'
import type { AppointmentDraft } from '../lib/types'
import type { CapturedImage } from '../components/patient/CameraCapture'

const STORAGE_KEY = 'newCaseDraft'

const initialAppointment: AppointmentDraft = {
  patientName: '',
  email: '',
  preferredDate: '',
  preferredTime: '',
  chiefComplaint: '',
}

const NewCase = () => {
  // Restore draft from sessionStorage where possible
  const [appointment, setAppointment] = useState<AppointmentDraft>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return initialAppointment
      const parsed = JSON.parse(raw)
      return parsed.appointment ?? initialAppointment
    } catch {
      return initialAppointment
    }
  })

  const [bodyPart, setBodyPart] = useState<string>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return ''
      const parsed = JSON.parse(raw)
      return parsed.bodyPart ?? ''
    } catch {
      return ''
    }
  })

  const [images, setImages] = useState<CapturedImage[]>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return (parsed.images ?? []) as CapturedImage[]
    } catch {
      return []
    }
  })

  // audio is stored as data URL in storage; restore it to a Blob after mount
  const [audio, setAudio] = useState<Blob | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.audioDataUrl) {
        // convert dataURL -> Blob and restore
        fetch(parsed.audioDataUrl)
          .then((r) => r.blob())
          .then((b) => setAudio(b))
          .catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Persist draft (appointment, bodyPart, images, audio) on change
  useEffect(() => {
    let cancelled = false
    const persist = async () => {
      try {
        let audioDataUrl: string | null = null
        if (audio) {
          audioDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(audio)
          })
        }

        if (cancelled) return
        const payload = { appointment, bodyPart, images, audioDataUrl }
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch {
        // ignore storage errors
      }
    }
    persist()
    return () => {
      cancelled = true
    }
  }, [appointment, bodyPart, images, audio])

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
      <CameraCapture onChange={setImages} />
      <VoiceRecorder onRecorded={setAudio} />
      <CaseSubmission appointment={appointment} bodyPart={bodyPart} images={images} audio={audio} />
    </div>
  )
}

export default NewCase
