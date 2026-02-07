import CaseList from '../components/doctor/CaseList'

const DoctorDashboard = () => (
  <div className="space-y-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Doctor dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">
        Review cases, inspect 3D models, and add clinical notes. Summaries update as voice notes are processed.
      </p>
    </section>

    <CaseList />
  </div>
)

export default DoctorDashboard
