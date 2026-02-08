import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCases } from '../hooks/useCases'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const statusStyles: Record<string, string> = {
  submitted: 'border border-emerald-700 bg-emerald-600 text-white',
  reviewing: 'border border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border border-slate-200 bg-slate-100 text-slate-600',
}

const PatientDashboard = () => {
  const { user } = useAuth()
  const { cases, loading, error } = useCases({ patientId: user?.id ?? null })
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const totals = { total: cases.length, submitted: 0, reviewing: 0, completed: 0 }
    cases.forEach((item) => {
      if (item.status === 'submitted') totals.submitted += 1
      if (item.status === 'reviewing') totals.reviewing += 1
      if (item.status === 'completed') totals.completed += 1
    })
    return totals
  }, [cases])

  const recentCases = useMemo(() => cases.slice(0, 4), [cases])

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:space-y-8 md:px-8">
      {/* Hero Card */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-100 blur-3xl opacity-70" />
          <div className="absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-sky-100 blur-3xl opacity-60" />
        </div>
        <CardContent className="relative space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left side - Welcome text */}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-600">Patient Home</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-600 sm:max-w-xl">
                Keep your care team updated with guided imaging and voice notes. We will handle the rest.
              </p>
              
              {/* Action buttons - stacked on mobile */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/patient/new-case')}
                  className="w-full sm:w-auto"
                >
                  Start new case
                </Button>
                {cases[0] && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/patient/cases/${cases[0].id}`)}
                    className="w-full sm:w-auto"
                  >
                    View latest case
                  </Button>
                )}
              </div>
            </div>

            {/* Right side - Stats card */}
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-sm backdrop-blur lg:min-w-[200px]">
              <div>
                <p className="text-xs text-slate-500">Open cases</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.submitted + stats.reviewing}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge className={statusStyles.submitted}>Submitted {stats.submitted}</Badge>
                <Badge className={statusStyles.reviewing}>Reviewing {stats.reviewing}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards - responsive grid */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
          <Card key={item.title}>
            <CardContent className="px-4 py-4 sm:px-6">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Bottom section - stacked on mobile, side by side on desktop */}
      <section className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        {/* Submissions Card */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Your submissions</CardTitle>
            <CardDescription className="text-sm">Track the status of cases you have submitted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {loading && <p className="text-sm text-slate-500">Loading your cases...</p>}
            {error && <p className="text-sm text-rose-600">{error}</p>}
            {!loading && cases.length === 0 && (
              <p className="text-sm text-slate-500">No submissions yet. Start a new case to begin.</p>
            )}
            {recentCases.map((item) => (
              <Link
                key={item.id}
                to={`/patient/cases/${item.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.body_part}</p>
                  <p className="text-xs text-slate-500">
                    {item.id} · {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={statusStyles[item.status] ?? ''}>{item.status}</Badge>
              </Link>
            ))}
            {cases.length > 4 && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/patient/cases')}
                  className="w-full sm:w-auto"
                >
                  View all cases
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Care Timeline Card */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Care timeline</CardTitle>
            <CardDescription className="text-sm">What happens after you submit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            {[
              {
                title: 'Intake review',
                description: 'Your clinician validates details and confirms the appointment.',
              },
              {
                title: 'Clinical summary',
                description: 'AI highlights symptoms and flags priority areas for review.',
              },
              {
                title: 'Follow-up',
                description: 'You receive guidance, next steps, and treatment recommendations.',
              },
            ].map((item, index) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default PatientDashboard