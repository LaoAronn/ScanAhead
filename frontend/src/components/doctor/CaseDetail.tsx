import { useState } from 'react'
import ImageGallery from '../shared/ImageGallery'
import ModelViewer from '../3d/ModelViewer'
import DoctorNotes from './DoctorNotes'
import type { AiSummary } from '../../lib/types'

interface CaseDetailProps {
  patientName: string
  bodyPart: string
  createdAt: string
  status: 'submitted' | 'reviewing' | 'completed'
  images: string[]
  summary: AiSummary | null
}

const CaseDetail = ({ patientName, bodyPart, createdAt, status, images, summary }: CaseDetailProps) => {
  const [notes, setNotes] = useState('')

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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Submitted images</h3>
        <div className="mt-4">
          <ImageGallery images={images} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">3D model viewer</h3>
        <div className="mt-4 h-[360px]">
          <ModelViewer modelUrl="" />
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
