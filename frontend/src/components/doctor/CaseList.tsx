import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCases } from '../../hooks/useCases'
import { useAuth } from '../../hooks/useAuth'

const statusStyles: Record<string, string> = {
  submitted: 'border border-emerald-700 bg-emerald-600 text-white',
  reviewing: 'border border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border border-slate-200 bg-slate-100 text-slate-600',
}

const CaseList = () => {
  const { user, role } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'reviewing' | 'completed'>('all')
  const assignedDoctorId = role === 'doctor' ? user?.id ?? null : null
  const { cases, loading, error } = useCases({ searchTerm, statusFilter, assignedDoctorId })

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Submitted cases</h3>
          <p className="mt-1 text-sm text-slate-500">Review new cases and update statuses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name or body part"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="submitted">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading cases...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && cases.length === 0 && <p className="text-sm text-slate-500">No cases found.</p>}
        {cases.map((item) => (
          <Link
            key={item.id}
            to={`/doctor/cases/${item.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-brand-200"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.patient_name}</p>
              <p className="text-xs text-slate-500">
                {item.body_part} · {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[item.status] ?? ''}`}
            >
              {item.status}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CaseList
