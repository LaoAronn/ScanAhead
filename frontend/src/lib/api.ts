import type { AiSummary } from './types'

export const transcribeVoiceNote = async (audio: Blob) => {
  const endpoint = import.meta.env.VITE_TRANSCRIBE_API_URL as string | undefined

  if (!endpoint) {
    throw new Error('Transcription API URL is missing. Set VITE_TRANSCRIBE_API_URL.')
  }

  const formData = new FormData()
  formData.append('file', audio, 'voice-note.webm')

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Unable to transcribe voice note')
  }

  return response.json()
}

export const summarizeTranscription = async (transcription: string) => {
  const endpoint = import.meta.env.VITE_SUMMARY_API_URL as string | undefined

  if (!endpoint) {
    throw new Error('Summary API URL is missing. Set VITE_SUMMARY_API_URL.')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: transcription }),
  })

  if (!response.ok) {
    throw new Error('Unable to summarize transcription')
  }

  return response.json()
}

export const normalizeSummary = (payload: Partial<AiSummary> | null): AiSummary => ({
  symptoms: payload?.symptoms ?? [],
  duration: payload?.duration ?? 'Unknown',
  severity: payload?.severity ?? 'Unknown',
  concerns: payload?.concerns ?? 'None noted',
})

// TODO: Integrate depth estimation with TensorFlow.js
// TODO: Add Polycam API for 3D reconstruction
