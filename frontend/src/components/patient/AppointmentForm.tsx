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
      <CardHeader className="bg-slate-50">
        <CardTitle>Patient details</CardTitle>
        <CardDescription>Share your basic contact information to get started.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="patientName">Full name</Label>
            <Input
              id="patientName"
              type="text"
              required
              value={value.patientName}
              onChange={(event) => updateField('patientName', event.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patientEmail">Email address</Label>
            <Input
              id="patientEmail"
              type="email"
              required
              value={value.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="jane@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chiefComplaint">Chief complaint</Label>
          <Textarea
            id="chiefComplaint"
            required
            value={value.chiefComplaint}
            onChange={(event) => updateField('chiefComplaint', event.target.value)}
            placeholder="Describe what you are experiencing and when it started."
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default AppointmentForm
