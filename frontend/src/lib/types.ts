export type UserRole = 'patient' | 'doctor'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  full_name: string
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  assigned_doctor_id: string | null
  patient_name: string
  patient_email: string
  body_part: string
  chief_complaint: string
  preferred_date: string
  preferred_time: string
  status: 'submitted' | 'reviewing' | 'completed'
  created_at: string
}

export interface AiSummary {
  symptoms: string[]
  duration: string
  severity: string
  concerns: string
}

export interface CaseSubmission {
  id: string
  appointment_id: string
  image_urls: string[]
  audio_url: string
  video_url?: string | null
  transcription: string | null
  ai_summary: AiSummary | null
  model_3d_url?: string | null
  kiri_serialize?: string | null
  model_status?: number | null
  doctor_notes?: string | null
  created_at: string
}

export interface CaseSummary {
  id: string
  patient_name: string
  body_part: string
  status: 'submitted' | 'reviewing' | 'completed'
  created_at: string
}

export interface AppointmentDraft {
  patientName: string
  email: string
  preferredDate: string
  preferredTime: string
  chiefComplaint: string
  preferredProvider?: string
  visitType?: string
}
