import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'

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
  <Card>
    <CardHeader className="bg-slate-50">
      <CardTitle>Body area focus</CardTitle>
      <CardDescription>
        Choose the area most affected. This helps our clinicians focus on the right visuals.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Label htmlFor="bodyPart">Body area</Label>
        <select
          id="bodyPart"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Select a body part</option>
          {bodyParts.map((part) => (
            <option key={part.value} value={part.value}>
              {part.label}
            </option>
          ))}
        </select>
      </div>
    </CardContent>
  </Card>
)

export default BodyPartSelector
