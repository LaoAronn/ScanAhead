import { Link } from 'react-router-dom'

const PatientDashboard = () => (
  <div className="space-y-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Patient intake</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Share your symptoms, capture guided photos, and provide a short voice note. Our team will review
        your case and follow up quickly.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/patient/new-case"
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Start new case
        </Link>
        <button
          type="button"
          className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700"
        >
          View previous submissions
        </button>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
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
        <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
        </div>
      ))}
    </section>
  </div>
)

export default PatientDashboard
