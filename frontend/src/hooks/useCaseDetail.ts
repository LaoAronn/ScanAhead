import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CaseSubmission } from '../lib/types'

interface CaseDetailData {
  appointment: {
    id: string
    patient_name: string
    body_part: string
    status: 'submitted' | 'reviewing' | 'completed'
    created_at: string
  }
  submission: CaseSubmission | null
}

export const useCaseDetail = (appointmentId?: string) => {
  const [data, setData] = useState<CaseDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!appointmentId) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: result, error: fetchError } = await supabase
      .from('appointments')
      .select(
        'id, patient_name, body_part, status, created_at, case_submissions(id, appointment_id, image_urls, audio_url, video_url, transcription, ai_summary, model_3d_url, kiri_serialize, model_status, doctor_notes, created_at)',
      )
      .eq('id', appointmentId)
      .single()

    if (fetchError || !result) {
      setError(fetchError?.message ?? 'Unable to load case details')
      setLoading(false)
      return
    }

    const submission = Array.isArray(result.case_submissions)
      ? result.case_submissions[0]
      : result.case_submissions

    setData({
      appointment: {
        id: result.id,
        patient_name: result.patient_name,
        body_part: result.body_part,
        status: result.status,
        created_at: result.created_at,
      },
      submission: submission ?? null,
    })
    setLoading(false)
  }, [appointmentId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchDetail()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [fetchDetail])

  return { data, loading, error, refresh: fetchDetail }
}
