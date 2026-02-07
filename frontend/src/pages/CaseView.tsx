import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import CaseDetail from '../components/doctor/CaseDetail'
import { useCases } from '../hooks/useCases'
import type { AiSummary } from '../lib/types'

const CaseView = () => {
  const { id } = useParams()
  const { cases } = useCases()

  const caseData = useMemo(() => cases.find((item) => item.id === id), [cases, id])

  const summary: AiSummary = {
    symptoms: ['Swelling', 'Stiffness'],
    duration: '3 weeks',
    severity: 'Moderate',
    concerns: 'Pain increases with movement',
  }

  if (!caseData) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Case not found</h2>
        <p className="mt-2 text-sm text-slate-600">Select a case from the dashboard.</p>
      </div>
    )
  }

  return (
    <CaseDetail
      patientName={caseData.patient_name}
      bodyPart={caseData.body_part}
      createdAt={caseData.created_at}
      status={caseData.status}
      images={[]}
      summary={summary}
    />
  )
}

export default CaseView
