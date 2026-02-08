import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCases } from '../hooks/useCases'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'

const statusStyles: Record<string, string> = {
  submitted: 'border border-emerald-700 bg-emerald-600 text-white',
  reviewing: 'border border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border border-slate-200 bg-slate-100 text-slate-600',
}

const PatientCases = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'reviewing' | 'completed'>('all')
  const { cases, loading, error } = useCases({ patientId: user?.id ?? null, searchTerm, statusFilter })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All cases</CardTitle>
          <CardDescription>Browse every case you have submitted.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by body part or case ID"
              className="max-w-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="reviewing">Reviewing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Case history</CardTitle>
          <CardDescription>Most recent cases appear first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-slate-500">Loading your cases...</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {!loading && cases.length === 0 && (
            <p className="text-sm text-slate-500">No cases found. Try adjusting your filters.</p>
          )}
          {cases.map((item) => (
            <Link
              key={item.id}
              to={`/patient/cases/${item.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-200 hover:shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.body_part}</p>
                <p className="text-xs text-slate-500">
                  {item.id} · {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge className={statusStyles[item.status] ?? ''}>{item.status}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientCases
