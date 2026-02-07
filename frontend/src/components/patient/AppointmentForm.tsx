import type { AppointmentDraft } from '../../lib/types'

interface AppointmentFormProps {
  value: AppointmentDraft
  onChange: (next: AppointmentDraft) => void
}

const AppointmentForm = ({ value, onChange }: AppointmentFormProps) => {
  const updateField = (field: keyof AppointmentDraft, nextValue: string) => {
    onChange({ ...value, [field]: nextValue })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Appointment details</h3>
      <p className="mt-1 text-sm text-slate-500">Tell us who you are and when you are available.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Full name</label>
          <input
            type="text"
            required
            value={value.patientName}
            onChange={(event) => updateField('patientName', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email address</label>
          <input
            type="email"
            required
            value={value.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none"
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Preferred date</label>
          <input
            type="date"
            required
            value={value.preferredDate}
            onChange={(event) => updateField('preferredDate', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Preferred time</label>
          <input
            type="time"
            required
            value={value.preferredTime}
            onChange={(event) => updateField('preferredTime', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Chief complaint</label>
        <textarea
          required
          value={value.chiefComplaint}
          onChange={(event) => updateField('chiefComplaint', event.target.value)}
          className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none"
          placeholder="Describe what you are experiencing and when it started."
        />
      </div>
    </section>
  )
}

export default AppointmentForm
