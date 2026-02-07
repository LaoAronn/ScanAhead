interface DoctorNotesProps {
  value: string
  onChange: (next: string) => void
}

const DoctorNotes = ({ value, onChange }: DoctorNotesProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h4 className="text-base font-semibold text-slate-900">Doctor notes</h4>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-3 min-h-[160px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none"
      placeholder="Add clinical observations, next steps, or recommended follow-ups."
    />
  </div>
)

export default DoctorNotes
