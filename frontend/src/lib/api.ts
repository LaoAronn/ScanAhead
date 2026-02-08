import { GoogleGenAI } from '@google/genai'

let genAiClient: GoogleGenAI | null = null
let genAiKey: string | null = null
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

type GeminiSummaryInput = {
  transcription: string
  bodyPart: string
  problem: string
  preferredDate: string
  preferredTime: string
  captureMode: 'photos' | 'video'
  providerName?: string
}

export const summarizeCaseWithGemini = async (input: GeminiSummaryInput) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

  if (!apiKey) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY.')
  }

  if (!genAiClient || genAiKey !== apiKey) {
    genAiClient = new GoogleGenAI({ apiKey })
    genAiKey = apiKey
  }

  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3-flash-preview'
  const prompt = `You are assisting a clinician. Write a concise, clinical-style summary in 3-5 sentences.\n\nPatient submission:\n- Body area: ${input.bodyPart}\n- Problem/issue: ${input.problem}\n- Preferred appointment: ${input.preferredDate} at ${input.preferredTime}\n- Capture mode: ${input.captureMode}\n- Selected clinician: ${input.providerName ?? 'Not specified'}\n- Transcript: ${input.transcription}\n\nReturn only the summary text.`

  const response = await genAiClient.models.generateContent({
    model,
    contents: prompt,
  })

  const text = response.text

  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Gemini summary response was empty')
  }

  return text.trim()
}

// TODO: Integrate depth estimation with TensorFlow.js
// TODO: Add Polycam API for 3D reconstruction
