import { useParams } from 'react-router-dom'
import CaseDetail from '../components/doctor/CaseDetail'
import { useCaseDetail } from '../hooks/useCaseDetail'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

const CaseView = () => {
  const { id } = useParams()
  const { data, loading, error, refresh } = useCaseDetail(id)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <p className="text-sm text-slate-600">Loading case details...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Case not found</h2>
          <p className="mt-2 text-sm text-slate-600">{error ?? 'Select a case from the dashboard.'}</p>
          <div className="mt-4">
            <Button type="button" variant="outline" size="sm" onClick={refresh}>
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const submission = data.submission

  return (
    <CaseDetail
      appointmentId={data.appointment.id}
      patientName={data.appointment.patient_name}
      bodyPart={data.appointment.body_part}
      createdAt={data.appointment.created_at}
      status={data.appointment.status}
      images={submission?.image_urls ?? []}
      summary={submission?.ai_summary ?? null}
      videoPath={submission?.video_url ?? null}
      audioPath={submission?.audio_url ?? null}
      transcription={submission?.transcription ?? null}
      modelPath={submission?.model_3d_url ?? null}
      kiriSerialize={submission?.kiri_serialize ?? null}
      modelStatus={submission?.model_status ?? null}
      caseSubmissionId={submission?.id ?? null}
    />
  )
}

export default CaseView
