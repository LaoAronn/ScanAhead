import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { AppointmentDraft } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'
import type { CapturedImage } from './CameraCapture'

interface CaseSubmissionProps {
  appointment: AppointmentDraft
  bodyPart: string
  images: CapturedImage[]
  audio: Blob | null
  onSubmitted?: (caseId: string) => void
}

const CaseSubmission = ({ appointment, bodyPart, images, audio, onSubmitted }: CaseSubmissionProps) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!appointment.patientName || !appointment.email || !appointment.preferredDate) {
        throw new Error('Please complete the appointment details.')
      }
      if (!bodyPart) {
        throw new Error('Please select a body part.')
      }
      if (images.length < 5) {
        throw new Error('Please capture at least 5 images.')
      }
      if (!audio) {
        throw new Error('Please record a voice note.')
      }

      const caseId = crypto.randomUUID()

      if (!import.meta.env.VITE_SUPABASE_URL) {
        setSuccessId(caseId)
        onSubmitted?.(caseId)
        setLoading(false)
        return
      }

      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: user?.id,
          body_part: bodyPart,
          chief_complaint: appointment.chiefComplaint,
          preferred_date: appointment.preferredDate,
          status: 'submitted',
        })
        .select('id')
        .single()

      if (appointmentError || !appointmentData) {
        throw new Error('Unable to create appointment.')
      }

      const imageUrls: string[] = []
      for (const [index, image] of images.entries()) {
        const blob = await (await fetch(image.dataUrl)).blob()
        const filePath = `${appointmentData.id}/${index + 1}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('patient-images')
          .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true })

        if (uploadError) {
          throw new Error('Unable to upload images.')
        }

        const { data: publicUrl } = supabase.storage.from('patient-images').getPublicUrl(filePath)
        imageUrls.push(publicUrl.publicUrl)
      }

      const audioPath = `${appointmentData.id}/voice-note.webm`
      const { error: audioError } = await supabase.storage
        .from('voice-notes')
        .upload(audioPath, audio, { contentType: 'audio/webm', upsert: true })

      if (audioError) {
        throw new Error('Unable to upload voice note.')
      }

      const { error: caseError } = await supabase.from('case_submissions').insert({
        appointment_id: appointmentData.id,
        image_urls: imageUrls,
        audio_url: audioPath,
      })

      if (caseError) {
        throw new Error('Unable to submit case.')
      }

      setSuccessId(appointmentData.id)
      onSubmitted?.(appointmentData.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit case.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Submit your case</h3>
      <p className="mt-1 text-sm text-slate-500">
        We will review your photos and voice note. You will receive a confirmation ID.
      </p>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      {successId && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Success! Your case ID is {successId}.
        </p>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Submit case'}
        </button>
      </div>

      {/* TODO: Add real-time status updates with Supabase subscriptions */}
      {/* TODO: Implement doctor-patient messaging */}
    </section>
  )
}

export default CaseSubmission
