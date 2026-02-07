import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import ProtectedRoute from './components/shared/ProtectedRoute'
import Login from './pages/Login'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import NewCase from './pages/NewCase'
import CaseView from './pages/CaseView'
import { useAuth } from './hooks/useAuth'

const HomeRedirect = () => {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-600">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role === 'doctor') {
    return <Navigate to="/doctor" replace />
  }

  return <Navigate to="/patient" replace />
}

const NotFound = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
    <h2 className="text-2xl font-semibold text-slate-900">Page not found</h2>
    <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
  </div>
)

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/new-case"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <NewCase />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/cases/:id"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <CaseView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
