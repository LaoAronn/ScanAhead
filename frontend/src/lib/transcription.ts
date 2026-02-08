// transcription.ts
export async function transcribeAudio(audio: Blob): Promise<string> {
  // Candidate endpoints (order matters)
  const env = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) || {}
  const envEndpoint = env.VITE_ELEVENLABS_API_KEY as string | undefined
  const serverUrl = env.VITE_SERVER_URL || 'http://localhost:3001'

  const candidates = [
  '${serverUrl}/api/transcribe', ,
  'http://localhost:3001/api/transcribe',  // Add this
  envEndpoint,
  '/api/transcribe',
  '/api/transcription',
  '/transcribe',
    ].filter(Boolean) as string[]

  if (candidates.length === 0) {
    throw new Error('No transcription endpoint configured. Set VITE_TRANSCRIBE_ENDPOINT or ensure /api/transcribe exists.')
  }

  const timeoutMs = 60_000

  let lastError: Error | null = null
  const tried: string[] = []

  for (const endpoint of candidates) {
    tried.push(endpoint)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

    try {
      const form = new FormData()
      form.append('file', audio, 'recording.webm')

      const res = await fetch(endpoint, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (res.status === 404) {
        // try next candidate
        lastError = new Error(`Endpoint ${endpoint} returned 404`)
        continue
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(body || `Transcription request failed (${res.status})`)
      }

      // success
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (typeof data === 'string') return data
        if (data && typeof data.text === 'string') return data.text
        // unexpected json shape
        throw new Error('Unexpected JSON transcription response')
      } else {
        // plain text response
        const text = await res.text()
        return text
      }
    } catch (err) {
      clearTimeout(timeout)
      if ((err as any)?.name === 'AbortError') {
        lastError = new Error(`Transcription request to ${endpoint} timed out`)
        // try next
        continue
      }
      lastError = err instanceof Error ? err : new Error(String(err))
      // for network errors or 5xx, stop and propagate (optional: continue). We'll propagate to make failures visible.
      throw lastError
    }
  }

  // All candidates exhausted
  throw new Error(
    `Transcription endpoint not found. Tried: ${tried.join(', ')}. ${
      lastError ? `Last error: ${lastError.message}` : ''
    }`
  )
}