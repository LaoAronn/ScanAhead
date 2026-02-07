const bodyParts = [
  { label: 'Head / Face', value: 'Head / Face' },
  { label: 'Neck', value: 'Neck' },
  { label: 'Chest', value: 'Chest' },
  { label: 'Abdomen / Torso', value: 'Abdomen / Torso' },
  { label: 'Back', value: 'Back' },
  { label: 'Arms / Hands', value: 'Arms / Hands' },
  { label: 'Hips', value: 'Hips' },
  { label: 'Legs / Feet', value: 'Legs / Feet' },
]

interface BodyPartSelectorProps {
  value: string
  onChange: (next: string) => void
}

const BodyPartSelector = ({ value, onChange }: BodyPartSelectorProps) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-900">Body part selection</h3>
    <p className="mt-1 text-sm text-slate-500">
      Choose the area most affected. This helps our clinicians focus on the right visuals.
    </p>
    <div className="mt-4">
      <label className="text-sm font-medium text-slate-700">Body area</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none"
      >
        <option value="">Select a body part</option>
        {bodyParts.map((part) => (
          <option key={part.value} value={part.value}>
            {part.label}
          </option>
        ))}
      </select>
    </div>
  </section>
)

export default BodyPartSelector
