import { useState } from 'react'
import AppointmentForm from '../components/patient/AppointmentForm'
import BodyPartSelector from '../components/patient/BodyPartSelector'
import CameraCapture from '../components/patient/CameraCapture'
import VoiceRecorder from '../components/patient/VoiceRecorder'
import CaseSubmission from '../components/patient/CaseSubmission'
import type { AppointmentDraft } from '../lib/types'
import type { CapturedImage } from '../components/patient/CameraCapture'

const NewCase = () => {
  const [appointment, setAppointment] = useState<AppointmentDraft>({
    patientName: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    chiefComplaint: '',
  })
  const [bodyPart, setBodyPart] = useState('')
  const [images, setImages] = useState<CapturedImage[]>([])
  const [audio, setAudio] = useState<Blob | null>(null)

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
