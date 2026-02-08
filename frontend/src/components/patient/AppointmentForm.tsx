import type { AppointmentDraft } from '../../lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'

interface AppointmentFormProps {
  value: AppointmentDraft
  onChange: (next: AppointmentDraft) => void
}

const AppointmentForm = ({ value, onChange }: AppointmentFormProps) => {
  const updateField = (field: keyof AppointmentDraft, nextValue: string) => {
    onChange({ ...value, [field]: nextValue })
  }

  return (
    <Card>
      <CardHeader className="bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
        <CardTitle className="text-lg sm:text-xl">Patient details</CardTitle>
        <CardDescription className="text-sm">
          Share your basic contact information to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-4 py-6 sm:px-6">
        {/* Form fields - stack on mobile, side-by-side on tablet+ */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="patientName" className="text-sm font-medium">
              Full name
            </Label>
            <Input
              id="patientName"
              type="text"
              required
              value={value.patientName}
              onChange={(event) => updateField('patientName', event.target.value)}
              placeholder="Jane Doe"
              className="h-11 text-base sm:h-10 sm:text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patientEmail" className="text-sm font-medium">
              Email address
            </Label>
            <Input
              id="patientEmail"
              type="email"
              required
              value={value.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="jane@example.com"
              className="h-11 text-base sm:h-10 sm:text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chiefComplaint" className="text-sm font-medium">
            Problem or issue
          </Label>
          <Textarea
            id="chiefComplaint"
            required
            value={value.chiefComplaint}
            onChange={(event) => updateField('chiefComplaint', event.target.value)}
            placeholder="Describe what you are experiencing and when it started."
            className="min-h-[120px] text-base sm:min-h-[100px] sm:text-sm"
            rows={5}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default AppointmentForm