import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCases } from '../hooks/useCases'

const statusStyles: Record<string, string> = {
  submitted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
}

const PatientDashboard = () => {
  const { user } = useAuth()
  const { cases, loading, error } = useCases({ patientId: user?.id ?? null })

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Capture images',
            description: 'Follow the guided angles and upload clear images with good lighting.',
          },
          {
            title: 'Record voice note',
            description: 'Share symptoms, pain level, and anything that has changed over time.',
          },
          {
            title: 'Submit securely',
            description: 'Your case is encrypted and routed to the right clinician.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>
      
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Patient intake</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Share your symptoms, capture guided photos, and provide a short voice note. Our team will review
          your case and follow up quickly.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/patient/new-case"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Start new case
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Your submissions</h3>
            <p className="mt-1 text-sm text-slate-500">Track the status of cases you have submitted.</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading && <p className="text-sm text-slate-500">Loading your cases...</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {!loading && cases.length === 0 && (
            <p className="text-sm text-slate-500">No submissions yet. Start a new case to begin.</p>
          )}
          {cases.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.body_part}</p>
                <p className="text-xs text-slate-500">
                  {item.id} · {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[item.status] ?? ''}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default PatientDashboard
