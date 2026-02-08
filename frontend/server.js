import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const upload = multer()

app.use(cors())
app.use(express.json())

app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY

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