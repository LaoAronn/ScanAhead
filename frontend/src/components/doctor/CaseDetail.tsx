import { useEffect, useMemo, useState } from 'react'
import ImageGallery from '../shared/ImageGallery'
import ModelViewer from '../3d/ModelViewer'
import DoctorNotes from './DoctorNotes'
import type { AiSummary } from '../../lib/types'
import { supabase } from '../../lib/supabase'
import { extractFirstGlbFromZip } from '../../lib/zip'
import { getKiriModelStatus, getKiriModelZip } from '../../lib/kiri'

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
        throw new Error('Unable to store model file')
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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{patientName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {bodyPart} · Submitted {new Date(createdAt).toLocaleString()}
            </p>
          </div>
          <span className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600">
            {status}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">AI summary</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Symptoms</p>
            <p className="mt-2 text-sm text-slate-700">
              {summary?.symptoms?.length ? summary.symptoms.join(', ') : 'Pending transcription'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Duration</p>
            <p className="mt-2 text-sm text-slate-700">{summary?.duration ?? 'Pending'}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Severity</p>
            <p className="mt-2 text-sm text-slate-700">{summary?.severity ?? 'Pending'}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Concerns</p>
            <p className="mt-2 text-sm text-slate-700">{summary?.concerns ?? 'Pending'}</p>
          </div>
        </div>
      </section>

      {images.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Submitted images</h3>
          <div className="mt-4">
            <ImageGallery images={images} />
          </div>
        </section>
      )}

      {videoUrl && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Submitted video</h3>
          <div className="mt-4">
            <video controls src={videoUrl} className="aspect-video w-full rounded-xl" />
          </div>
        </section>
      )}

      {audioUrl && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Voice note</h3>
          <div className="mt-4">
            <audio controls src={audioUrl} className="w-full" />
          </div>
        </section>
      )}

      {transcription && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Transcription</h3>
          <p className="mt-3 text-sm text-slate-700">{transcription}</p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">3D model viewer</h3>
            <p className="mt-1 text-sm text-slate-500">Status: {statusLabel}</p>
          </div>
          {kiriSerialize && !modelUrl && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCheckStatus}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Check status
              </button>
              {kiriStatus === 2 && (
                <button
                  type="button"
                  onClick={handleDownloadModel}
                  disabled={modelLoading}
                  className="rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {modelLoading ? 'Preparing model...' : 'Download model'}
                </button>
              )}
            </div>
          )}
        </div>
        {modelError && <p className="mt-3 text-sm text-rose-600">{modelError}</p>}
        <div className="mt-4 h-[360px]">
          <ModelViewer modelUrl={modelUrl ?? ''} />
        </div>
      </section>

      <DoctorNotes value={notes} onChange={setNotes} />

      <section className="flex flex-wrap gap-3">
        <button className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white">Mark reviewing</button>
        <button className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700">
          Mark completed
        </button>
      </section>
    </div>
  )
}

export default CaseDetail
