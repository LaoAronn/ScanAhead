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

type DoctorAvailability = {
  weeklySlots: Record<number, string[]>
  busyDates: string[]
}

type DoctorProfile = {
  id: string
  name: string
  email?: string
  specialty: string
  location: string
  visitTypes: Array<'telehealth' | 'in-person' | 'urgent'>
  availability: DoctorAvailability
}

type InstitutionProfile = {
  id: string
  name: string
  city: string
  tagline: string
  doctors: DoctorProfile[]
}

const institutions: InstitutionProfile[] = [
  {
    id: 'scan-ahead-center',
    name: 'ScanAhead Medical Center',
    city: 'Seattle, WA',
    tagline: 'Multi-specialty imaging with rapid triage.',
    doctors: [
      {
        id: '9e2fc9a6-0881-4547-bbfc-b30852a4024c',
        name: 'Dr. Quazi',
        email: 'quazi12@student.ubc.ca',
        specialty: 'Imaging Review',
        location: 'ScanAhead Medical Center',
        visitTypes: ['telehealth', 'in-person'],
        availability: {
          weeklySlots: {
            1: ['9:15 AM', '11:45 AM', '2:15 PM', '4:15 PM'],
            3: ['9:00 AM', '12:00 PM', '2:30 PM', '4:30 PM'],
            5: ['10:00 AM', '12:30 PM', '3:30 PM'],
          },
          busyDates: ['2026-02-09', '2026-02-23'],
        },
      },
      {
        id: 'dr-patel',
        name: 'Dr. Priya Patel',
        specialty: 'Dermatology',
        location: 'Telehealth + Downtown Clinic',
        visitTypes: ['telehealth', 'in-person'],
        availability: {
          weeklySlots: {
            1: ['9:00 AM', '10:30 AM', '1:00 PM', '3:30 PM'],
            2: ['10:00 AM', '11:30 AM', '2:00 PM', '4:00 PM'],
            4: ['9:30 AM', '11:00 AM', '2:30 PM', '4:30 PM'],
          },
          busyDates: ['2026-02-10', '2026-02-13', '2026-02-20'],
        },
      },
      {
        id: 'dr-lee',
        name: 'Dr. Marcus Lee',
        specialty: 'Orthopedics',
        location: 'Downtown Clinic',
        visitTypes: ['in-person'],
        availability: {
          weeklySlots: {
            1: ['8:30 AM', '10:00 AM', '1:30 PM', '3:00 PM'],
            3: ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM'],
            5: ['9:30 AM', '11:00 AM', '1:30 PM'],
          },
          busyDates: ['2026-02-11', '2026-02-19'],
        },
      },
      {
        id: 'care-team',
        name: 'ScanAhead Care Team',
        specialty: 'General Intake',
        location: 'Virtual',
        visitTypes: ['telehealth', 'urgent'],
        availability: {
          weeklySlots: {
            1: ['9:00 AM', '12:00 PM', '4:30 PM'],
            2: ['8:30 AM', '11:00 AM', '3:30 PM'],
            3: ['9:30 AM', '1:00 PM', '4:00 PM'],
            4: ['10:00 AM', '2:00 PM', '5:00 PM'],
            5: ['9:00 AM', '11:30 AM', '3:00 PM'],
          },
          busyDates: ['2026-02-14', '2026-02-21'],
        },
      },
    ],
  },
  {
    id: 'northshore-clinic',
    name: 'Northshore Imaging Clinic',
    city: 'Bellevue, WA',
    tagline: 'Orthopedic and sports injury specialists.',
    doctors: [
      {
        id: 'dr-walker',
        name: 'Dr. Sienna Walker',
        specialty: 'Sports Medicine',
        location: 'Northshore Clinic',
        visitTypes: ['in-person'],
        availability: {
          weeklySlots: {
            2: ['9:00 AM', '10:30 AM', '2:00 PM', '3:30 PM'],
            4: ['9:30 AM', '11:00 AM', '1:30 PM', '3:00 PM'],
          },
          busyDates: ['2026-02-12', '2026-02-26'],
        },
      },
      {
        id: 'dr-fernandez',
        name: 'Dr. Elena Fernandez',
        specialty: 'Primary Care',
        location: 'Northshore Clinic',
        visitTypes: ['telehealth', 'in-person'],
        availability: {
          weeklySlots: {
            1: ['10:00 AM', '12:00 PM', '3:00 PM'],
            3: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
            5: ['10:30 AM', '1:00 PM', '3:30 PM'],
          },
          busyDates: ['2026-02-18', '2026-02-24'],
        },
      },
    ],
  },
  {
    id: 'midtown-health',
    name: 'Midtown Health Hub',
    city: 'Tacoma, WA',
    tagline: 'Primary care with same-week availability.',
    doctors: [
      {
        id: 'dr-omar',
        name: 'Dr. Amina Omar',
        specialty: 'Family Medicine',
        location: 'Midtown Health',
        visitTypes: ['telehealth', 'in-person', 'urgent'],
        availability: {
          weeklySlots: {
            1: ['8:30 AM', '10:00 AM', '1:00 PM', '3:00 PM'],
            2: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
            4: ['9:30 AM', '11:30 AM', '1:30 PM', '3:30 PM'],
          },
          busyDates: ['2026-02-17', '2026-02-25'],
        },
      },
      {
        id: 'dr-zhang',
        name: 'Dr. Li Zhang',
        specialty: 'Radiology Review',
        location: 'Midtown Health',
        visitTypes: ['telehealth'],
        availability: {
          weeklySlots: {
            2: ['8:00 AM', '9:30 AM', '1:30 PM', '3:00 PM'],
            3: ['10:00 AM', '12:30 PM', '2:30 PM'],
            5: ['9:00 AM', '11:00 AM', '1:00 PM'],
          },
          busyDates: ['2026-02-16', '2026-02-28'],
        },
      },
    ],
  },
]

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const getSlotsForDate = (doctor: DoctorProfile, dateIso: string) => {
  const date = new Date(`${dateIso}T00:00:00`)
  const weekday = date.getDay()
  return doctor.availability.weeklySlots[weekday] ?? []
}

const AppointmentScheduler = ({ value, onChange }: AppointmentSchedulerProps) => {
  const [institutionQuery, setInstitutionQuery] = useState('')
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const todayIso = formatDate(new Date())
  const normalizedToday = normalizeDate(new Date())

  const filteredInstitutions = useMemo(() => {
    const query = institutionQuery.trim().toLowerCase()
    if (!query) return institutions
    return institutions.filter((institution) =>
      `${institution.name} ${institution.city}`.toLowerCase().includes(query),
    )
  }, [institutionQuery])

  const selectedInstitution = institutions.find(
    (institution) => institution.id === value.institutionId,
  )
  const selectedDoctor = selectedInstitution?.doctors.find(
    (doctor) => doctor.id === value.preferredProvider,
  )

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

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !value.preferredDate) return []
    return getSlotsForDate(selectedDoctor, value.preferredDate)
  }, [selectedDoctor, value.preferredDate])

  const shouldDisablePrevMonth = useMemo(() => {
    const prevMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)
    return prevMonth < new Date(normalizedToday.getFullYear(), normalizedToday.getMonth(), 1)
  }, [monthCursor, normalizedToday])

  const updateAppointment = (patch: Partial<AppointmentDraft>) => {
    onChange({ ...value, ...patch })
  }

  const handleInstitutionSelect = (institutionId: string) => {
    updateAppointment({
      institutionId,
      preferredProvider: '',
      preferredDate: '',
      preferredTime: '',
    })
  }

  const handleDoctorSelect = (doctorId: string) => {
    updateAppointment({ preferredProvider: doctorId, preferredDate: '', preferredTime: '' })
  }

  const handleDateSelect = (dateIso: string) => {
    if (!selectedDoctor) return
    const slots = getSlotsForDate(selectedDoctor, dateIso)
    updateAppointment({
      preferredDate: dateIso,
      preferredTime: slots.includes(value.preferredTime) ? value.preferredTime : '',
    })
  }

  const handleTimeSelect = (slot: string) => {
    updateAppointment({ preferredTime: slot })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Provider & Schedule</CardTitle>
            <CardDescription>Search an institution, select a clinician, and claim a slot.</CardDescription>
          </div>
          {selectedDoctor && (
            <Badge variant="secondary">
              {selectedDoctor.specialty} · {selectedDoctor.location}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr,1.3fr]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="institutionSearch">Find an institution</Label>
              <Input
                id="institutionSearch"
                placeholder="Search by name or city"
                value={institutionQuery}
                onChange={(event) => setInstitutionQuery(event.target.value)}
                className="mt-2"
              />
            </div>
            <div className="space-y-3">
              {filteredInstitutions.map((institution) => (
                <button
                  key={institution.id}
                  type="button"
                  onClick={() => handleInstitutionSelect(institution.id)}
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-left transition',
                    value.institutionId === institution.id
                      ? 'border-brand-200 bg-brand-50 shadow-sm'
                      : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50',
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900">{institution.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{institution.tagline}</p>
                  <p className="mt-2 text-xs text-slate-400">{institution.city}</p>
                </button>
              ))}
              {filteredInstitutions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No institutions match that search yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Available clinicians</p>
              {selectedInstitution && (
                <Badge variant="secondary">{selectedInstitution.name}</Badge>
              )}
            </div>
            {selectedInstitution ? (
              <div className="grid gap-3 md:grid-cols-2">
                {selectedInstitution.doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => handleDoctorSelect(doctor.id)}
                    className={cn(
                      'rounded-2xl border px-4 py-4 text-left transition',
                      value.preferredProvider === doctor.id
                        ? 'border-brand-200 bg-brand-50 shadow-sm'
                        : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50',
                    )}
                  >
                    <p className="text-sm font-semibold text-slate-900">{doctor.name}</p>
                    {doctor.email && (
                      <p className="mt-1 text-xs text-slate-400">{doctor.email}</p>
                    )}
                    <p className="mt-1 text-sm text-slate-500">{doctor.specialty}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                      {doctor.visitTypes.map((type) => (
                        <span key={type} className="rounded-full bg-slate-100 px-2 py-1">
                          {type === 'telehealth' ? 'Telehealth' : type === 'in-person' ? 'In-person' : 'Urgent'}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Select an institution to reveal its clinicians.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {monthCursor.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-500">Available days are highlighted.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={shouldDisablePrevMonth}
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
              {calendar.days.map((day) => {
                const isPast = day.iso < todayIso
                const isBusy = selectedDoctor?.availability.busyDates.includes(day.iso) ?? false
                const slots = selectedDoctor ? getSlotsForDate(selectedDoctor, day.iso) : []
                const isUnavailable = !selectedDoctor || slots.length === 0
                const isDisabled = isPast || isBusy || isUnavailable
                return (
                  <button
                    key={day.iso}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDateSelect(day.iso)}
                    className={cn(
                      'rounded-xl px-2 py-2 text-sm font-medium transition',
                      value.preferredDate === day.iso
                        ? 'bg-brand-600 text-white'
                        : isBusy
                          ? 'bg-rose-50 text-rose-500'
                          : isDisabled
                            ? 'text-slate-300'
                            : 'text-slate-700 hover:bg-brand-50',
                    )}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-600" /> Selected
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-300" /> Busy
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-200" /> Unavailable
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="preferredDate">Selected date</Label>
              <Input
                id="preferredDate"
                readOnly
                placeholder="Pick a date"
                value={value.preferredDate}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Available time slots</Label>
              {value.preferredDate ? (
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={value.preferredTime === slot ? 'default' : 'outline'}
                        onClick={() => handleTimeSelect(slot)}
                      >
                        {slot}
                      </Button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No time slots are available for this day.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Select a date to see available times.
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="preferredTime">Selected time</Label>
              <Input
                id="preferredTime"
                readOnly
                placeholder="Choose a slot"
                value={value.preferredTime}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="visitType">Visit type</Label>
              <select
                id="visitType"
                value={value.visitType ?? ''}
                onChange={(event) => updateAppointment({ visitType: event.target.value })}
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
                Busy dates are blocked and past dates are disabled. We will confirm the appointment
                time within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AppointmentScheduler
