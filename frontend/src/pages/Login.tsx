import { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'

const Login = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:flex-row">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome to ScanAhead</h1>
        <p className="mt-2 text-sm text-slate-500">
          Secure pre-diagnosis intake for patients and rapid triage for clinicians.
        </p>
        <div className="mt-6 flex gap-3 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
              mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Create account
          </button>
        </div>
      </div>
      <div className="flex-1">
        {mode === 'login' ? <LoginForm /> : <SignupForm />}
      </div>
    </div>
  )
}

export default Login
