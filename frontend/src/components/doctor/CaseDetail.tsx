import { useEffect, useMemo, useState } from 'react'
import ImageGallery from '../shared/ImageGallery'
import ModelViewer from '../3d/ModelViewer'
import DoctorNotes from './DoctorNotes'
import type { AiSummary } from '../../lib/types'
import { supabase } from '../../lib/supabase'
import { extractFirstGlbFromZip } from '../../lib/zip'
import { getKiriModelStatus, getKiriModelZip } from '../../lib/kiri'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

interface CaseDetailProps {
  appointmentId: string
  patientName: string
  bodyPart: string
  createdAt: string
  status: 'submitted' | 'reviewing' | 'completed'
  images: string[]
  summary: AiSummary | null
  videoPath?: string | null
  audioPath?: string | null
  transcription?: string | null
  modelPath?: string | null
  kiriSerialize?: string | null
  modelStatus?: number | null
  caseSubmissionId?: string | null
}

const statusPillStyles: Record<CaseDetailProps['status'], string> = {
  submitted: 'border border-emerald-300 bg-emerald-100 text-emerald-800',
  reviewing: 'border border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border border-slate-200 bg-slate-100 text-slate-600',
}

const CaseDetail = ({
  appointmentId,
  patientName,
  bodyPart,
  createdAt,
  status,
  images,
  summary,
  videoPath,
  audioPath,
  transcription,
  modelPath,
  kiriSerialize,
  modelStatus,
  caseSubmissionId,
}: CaseDetailProps) => {
  const [notes, setNotes] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [kiriStatus, setKiriStatus] = useState<number | null>(modelStatus ?? null)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const statusText = status.charAt(0).toUpperCase() + status.slice(1)

  const statusLabel = useMemo(() => {
    switch (kiriStatus) {
      case -1:
        return 'Uploading'
      case 0:
        return 'Processing'
      case 1:
        return 'Failed'
      case 2:
        return 'Successful'
      case 3:
        return 'Queuing'
      case 4:
        return 'Expired'
      default:
        return 'Pending'
    }
  }, [kiriStatus])

  const createSignedUrl = async (bucket: string, path?: string | null) => {
    if (!path) return null
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
    if (error) {
      console.warn(`Unable to sign ${bucket} asset`, error)
      return null
    }
    return data?.signedUrl ?? null
  }

  const findExistingModel = async () => {
    if (modelPath) {
      const signed = await createSignedUrl('patient-models', modelPath)
      if (signed) return { path: modelPath, url: signed }
    }

    const { data, error } = await supabase.storage
      .from('patient-models')
      .list(appointmentId, { search: 'model.glb', limit: 1 })

    if (error) {
      console.warn('Unable to list model files', error)
      return null
    }

    const file = data?.find((entry) => entry.name === 'model.glb')
    if (!file) return null

    const path = `${appointmentId}/${file.name}`
    const signed = await createSignedUrl('patient-models', path)
    if (!signed) return null

    return { path, url: signed }
  }

  useEffect(() => {
    const loadMedia = async () => {
      setVideoUrl(await createSignedUrl('patient-videos', videoPath))
      setAudioUrl(await createSignedUrl('voice-notes', audioPath))
      setModelUrl(await createSignedUrl('patient-models', modelPath))
    }

    loadMedia()
  }, [videoPath, audioPath, modelPath])

  useEffect(() => {
    setKiriStatus(modelStatus ?? null)
  }, [modelStatus])

  const handleCheckStatus = async () => {
    if (!kiriSerialize) return
    setModelError(null)
    try {
      const response = await getKiriModelStatus(kiriSerialize)
      if (response?.data?.status !== undefined) {
        setKiriStatus(response.data.status)
      }
    } catch (err) {
      setModelError(err instanceof Error ? err.message : 'Unable to fetch model status')
    }
  }

  const handleDownloadModel = async () => {
    if (!kiriSerialize || !caseSubmissionId) return
    setModelError(null)
    setModelLoading(true)
    try {
      const existing = await findExistingModel()
      if (existing) {
        setModelUrl(existing.url)
        setKiriStatus(2)
        return
      }

      const response = await getKiriModelZip(kiriSerialize)
      const modelUrl = response?.data?.modelUrl
      if (!modelUrl) {
        throw new Error('No model URL returned from KIRI')
      }

      const zipResponse = await fetch(`/api/kiri/download-zip?url=${encodeURIComponent(modelUrl)}`)
      if (!zipResponse.ok) {
        throw new Error('Unable to download model zip')
      }

      const zipBlob = await zipResponse.blob()
      const { blob } = await extractFirstGlbFromZip(zipBlob)
      const uploadPath = `${appointmentId}/model.glb`

      const { error: uploadError } = await supabase.storage
        .from('patient-models')
        .upload(uploadPath, blob, { contentType: 'model/gltf-binary', upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message || 'Unable to store model file')
      }

      const { error: updateError } = await supabase
        .from('case_submissions')
        .update({ model_3d_url: uploadPath, model_status: 2 })
        .eq('id', caseSubmissionId)

      if (updateError) {
        throw new Error('Unable to update case with model')
      }

      setKiriStatus(2)
      setModelUrl(await createSignedUrl('patient-models', uploadPath))
    } catch (err) {
      setModelError(err instanceof Error ? err.message : 'Unable to download model')
    } finally {
      setModelLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-slate-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{patientName}</CardTitle>
              <CardDescription>
                {bodyPart} · Submitted {new Date(createdAt).toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusPillStyles[status]}>{statusText}</Badge>
              <Badge variant="outline">ID {appointmentId}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">Case status</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{statusText}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">Body area</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{bodyPart}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">Created</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI summary</CardTitle>
          <CardDescription>Auto-generated from the voice note.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Symptoms</p>
            <p className="mt-2 text-sm text-slate-700">
              {summary?.symptoms?.length ? summary.symptoms.join(', ') : 'Pending transcription'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Duration</p>
            <p className="mt-2 text-sm text-slate-700">{summary?.duration ?? 'Pending'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Severity</p>
            <p className="mt-2 text-sm text-slate-700">{summary?.severity ?? 'Pending'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Concerns</p>
            <p className="mt-2 text-sm text-slate-700">{summary?.concerns ?? 'Pending'}</p>
          </div>
        </CardContent>
      </Card>

      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Submitted images</CardTitle>
            <CardDescription>Captured angles for clinician review.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageGallery images={images} />
          </CardContent>
        </Card>
      )}

      {videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Submitted video</CardTitle>
            <CardDescription>Motion and texture review.</CardDescription>
          </CardHeader>
          <CardContent>
            <video controls src={videoUrl} className="aspect-video w-full rounded-2xl" />
          </CardContent>
        </Card>
      )}

      {audioUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Voice note</CardTitle>
            <CardDescription>Patient-recorded note.</CardDescription>
          </CardHeader>
          <CardContent>
            <audio controls src={audioUrl} className="w-full" />
          </CardContent>
        </Card>
      )}

      {transcription && (
        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
            <CardDescription>Converted from the voice note.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">{transcription}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>3D model viewer</CardTitle>
              <CardDescription>Status: {statusLabel}</CardDescription>
            </div>
            {kiriSerialize && !modelUrl && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCheckStatus}>
                  Check status
                </Button>
                {kiriStatus === 2 && (
                  <Button type="button" size="sm" onClick={handleDownloadModel} disabled={modelLoading}>
                    {modelLoading ? 'Preparing model...' : 'Download model'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {modelError && <p className="mb-3 text-sm text-rose-600">{modelError}</p>}
          <div className="h-[360px] rounded-2xl border border-slate-200 bg-slate-50">
            <ModelViewer modelUrl={modelUrl ?? ''} />
          </div>
        </CardContent>
      </Card>

      <DoctorNotes value={notes} onChange={setNotes} />

      <section className="flex flex-wrap gap-3">
        <Button className="px-5" size="lg">Mark reviewing</Button>
        <Button variant="outline" size="lg">Mark completed</Button>
      </section>
    </div>
  )
}

export default CaseDetail
