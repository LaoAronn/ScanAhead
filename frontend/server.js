import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const app = express()
const upload = multer()

app.use(cors())
app.use(express.json())

const KIRI_BASE_URL = process.env.KIRI_ENGINE_BASE_URL || 'https://api.kiriengine.app/api'
const KIRI_API_KEY = process.env.VITE_KIRI_ENGINE_API_KEY || process.env.KIRI_ENGINE_API_KEY

const requireKiriKey = (res) => {
  if (!KIRI_API_KEY) {
    res.status(500).json({ error: 'KIRI Engine API key not configured' })
    return false
  }
  return true
}

const kiriHeaders = () => ({
  Authorization: `Bearer ${KIRI_API_KEY}`,
})

app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    const apiKey = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    // Create FormData for ElevenLabs
    const FormData = (await import('form-data')).default
    const formData = new FormData()
    formData.append('audio', req.file.buffer, {
      filename: 'recording.webm',
      contentType: req.file.mimetype,
    })

    // Call ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs error:', errorText)
      return res.status(response.status).json({ 
        error: 'Transcription failed',
        details: errorText 
      })
    }

    const data = await response.json()
    res.json({ text: data.text || data.transcription || '' })

  } catch (error) {
    console.error('Server error:', error)
    res.status(500).json({ error: 'Failed to process transcription' })
  }
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})

app.post('/api/kiri/video-upload', upload.single('video'), async (req, res) => {
  try {
    if (!requireKiriKey(res)) return
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' })
    }

    const {
      modelQuality = '1',
      textureQuality = '1',
      isMask = '1',
      textureSmoothing = '1',
      fileFormat = 'glb',
    } = req.body ?? {}

    const FormData = (await import('form-data')).default
    const formData = new FormData()
    formData.append('videoFile', req.file.buffer, {
      filename: req.file.originalname || 'case-video.mp4',
      contentType: req.file.mimetype,
    })
    formData.append('modelQuality', String(modelQuality))
    formData.append('textureQuality', String(textureQuality))
    formData.append('fileFormat', String(fileFormat))
    formData.append('isMask', String(isMask))
    formData.append('textureSmoothing', String(textureSmoothing))

    const response = await fetch(`${KIRI_BASE_URL}/v1/open/photo/video`, {
      method: 'POST',
      headers: {
        ...kiriHeaders(),
        ...formData.getHeaders(),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return res.status(response.status).json({ error: 'KIRI upload failed', details: errorText })
    }

    const payload = await response.json()
    res.json(payload)
  } catch (error) {
    console.error('KIRI upload error:', error)
    res.status(500).json({ error: 'Failed to upload video to KIRI' })
  }
})

app.get('/api/kiri/model-status', async (req, res) => {
  try {
    if (!requireKiriKey(res)) return

    const serialize = req.query.serialize
    if (!serialize || typeof serialize !== 'string') {
      return res.status(400).json({ error: 'serialize query param is required' })
    }

    const response = await fetch(
      `${KIRI_BASE_URL}/v1/open/model/getStatus?serialize=${encodeURIComponent(serialize)}`,
      {
        headers: kiriHeaders(),
      },
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return res.status(response.status).json({ error: 'KIRI status failed', details: errorText })
    }

    const payload = await response.json()
    res.json(payload)
  } catch (error) {
    console.error('KIRI status error:', error)
    res.status(500).json({ error: 'Failed to get KIRI status' })
  }
})

app.get('/api/kiri/model-zip', async (req, res) => {
  try {
    if (!requireKiriKey(res)) return

    const serialize = req.query.serialize
    if (!serialize || typeof serialize !== 'string') {
      return res.status(400).json({ error: 'serialize query param is required' })
    }

    const response = await fetch(
      `${KIRI_BASE_URL}/v1/open/model/getModelZip?serialize=${encodeURIComponent(serialize)}`,
      {
        headers: kiriHeaders(),
      },
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return res.status(response.status).json({ error: 'KIRI model download failed', details: errorText })
    }

    const payload = await response.json()
    res.json(payload)
  } catch (error) {
    console.error('KIRI model zip error:', error)
    res.status(500).json({ error: 'Failed to get KIRI model zip' })
  }
})

app.get('/api/kiri/download-zip', async (req, res) => {
  try {
    if (!requireKiriKey(res)) return

    const url = req.query.url
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url query param is required' })
    }

    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return res.status(response.status).json({ error: 'KIRI model download failed', details: errorText })
    }

    const contentType = response.headers.get('content-type') || 'application/zip'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', 'attachment; filename="kiri-model.zip"')

    const buffer = Buffer.from(await response.arrayBuffer())
    res.send(buffer)
  } catch (error) {
    console.error('KIRI model download proxy error:', error)
    res.status(500).json({ error: 'Failed to download KIRI model zip' })
  }
})