interface KiriUploadOptions {
  modelQuality?: number
  textureQuality?: number
  isMask?: number
  textureSmoothing?: number
  fileFormat?: string
}

interface KiriUploadResponse {
  code?: number
  msg?: string
  ok?: boolean
  data?: {
    serialize?: string
    calculateType?: number
  }
}

interface KiriStatusResponse {
  code?: number
  msg?: string
  ok?: boolean
  data?: {
    serialize?: string
    status?: number
  }
}

interface KiriModelZipResponse {
  code?: number
  msg?: string
  ok?: boolean
  data?: {
    serialize?: string
    modelUrl?: string
  }
}

export const uploadVideoToKiri = async (video: Blob, options: KiriUploadOptions = {}) => {
  const formData = new FormData()
  formData.append('video', video, 'case-video.mp4')

  if (options.modelQuality !== undefined) formData.append('modelQuality', String(options.modelQuality))
  if (options.textureQuality !== undefined) formData.append('textureQuality', String(options.textureQuality))
  if (options.isMask !== undefined) formData.append('isMask', String(options.isMask))
  if (options.textureSmoothing !== undefined) formData.append('textureSmoothing', String(options.textureSmoothing))
  if (options.fileFormat) formData.append('fileFormat', options.fileFormat)

  const response = await fetch('/api/kiri/video-upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || 'Unable to upload video to KIRI')
  }

  return (await response.json()) as KiriUploadResponse
}

export const getKiriModelStatus = async (serialize: string) => {
  const response = await fetch(`/api/kiri/model-status?serialize=${encodeURIComponent(serialize)}`)

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || 'Unable to retrieve KIRI status')
  }

  return (await response.json()) as KiriStatusResponse
}

export const getKiriModelZip = async (serialize: string) => {
  const response = await fetch(`/api/kiri/model-zip?serialize=${encodeURIComponent(serialize)}`)

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || 'Unable to retrieve KIRI model zip')
  }

  return (await response.json()) as KiriModelZipResponse
}
