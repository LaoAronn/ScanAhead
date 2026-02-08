import { useMemo, useState } from 'react'
import type { AppointmentDraft } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface AppointmentSchedulerProps {
  value: AppointmentDraft
  onChange: (next: AppointmentDraft) => void
}

const providers = [
  { id: 'dr-patel', name: 'Dr. Priya Patel', specialty: 'Dermatology', location: 'Telehealth' },
  { id: 'dr-lee', name: 'Dr. Marcus Lee', specialty: 'Orthopedics', location: 'Downtown Clinic' },
  { id: 'dr-fernandez', name: 'Dr. Elena Fernandez', specialty: 'Primary Care', location: 'Midtown Health' },
  { id: 'care-team', name: 'ScanAhead Care Team', specialty: 'General Intake', location: 'Virtual' },
]

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const AppointmentScheduler = ({ value, onChange }: AppointmentSchedulerProps) => {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const calendar = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDay = new Date(year, month, 1).getDay()
    const mondayIndex = (startDay + 6) % 7

    const days: Array<{ date: Date; label: string; iso: string }> = []
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day)
      days.push({ date, label: String(day), iso: formatDate(date) })
    }

    return { days, blanks: mondayIndex }
  }, [monthCursor])

  const selectedProvider = providers.find((provider) => provider.id === value.preferredProvider)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Provider & schedule</CardTitle>
            <CardDescription>Select who you would like to see and the best time.</CardDescription>
          </div>
          {selectedProvider && (
            <Badge variant="secondary">
              {selectedProvider.specialty} · {selectedProvider.location}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => onChange({ ...value, preferredProvider: provider.id })}
              className={cn(
                'rounded-2xl border px-4 py-4 text-left transition',
                value.preferredProvider === provider.id
                  ? 'border-brand-200 bg-brand-50 shadow-sm'
                  : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50',
              )}
            >
              <p className="text-sm font-semibold text-slate-900">{provider.name}</p>
              <p className="mt-1 text-sm text-slate-500">{provider.specialty}</p>
              <p className="mt-2 text-xs text-slate-400">{provider.location}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {monthCursor.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-500">Tap a date to prefill the request.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
              {weekDays.map((day) => (
                <span key={day}>{day}</span>
              ))}
              {Array.from({ length: calendar.blanks }).map((_, index) => (
                <span key={`blank-${index}`} />
              ))}
              {calendar.days.map((day) => (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => onChange({ ...value, preferredDate: day.iso })}
                  className={cn(
                    'rounded-xl px-2 py-2 text-sm font-medium transition',
                    value.preferredDate === day.iso
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-700 hover:bg-brand-50',
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="preferredDate">Preferred date</Label>
              <Input
                id="preferredDate"
                type="date"
                value={value.preferredDate}
                onChange={(event) => onChange({ ...value, preferredDate: event.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="preferredTime">Preferred time</Label>
              <Input
                id="preferredTime"
                type="time"
                value={value.preferredTime}
                onChange={(event) => onChange({ ...value, preferredTime: event.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="visitType">Visit type</Label>
              <select
                id="visitType"
                value={value.visitType ?? ''}
                onChange={(event) => onChange({ ...value, visitType: event.target.value })}
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select visit type</option>
                <option value="telehealth">Telehealth</option>
                <option value="in-person">In-person clinic</option>
                <option value="urgent">Urgent triage</option>
              </select>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Availability insight</p>
              <p className="mt-2 text-sm text-slate-500">
                Most providers respond within 24 hours. You will receive a confirmation with the
                final appointment time.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AppointmentScheduler
