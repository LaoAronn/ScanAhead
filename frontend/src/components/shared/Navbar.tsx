import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStethoscope } from '@fortawesome/free-solid-svg-icons'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'}`

const Navbar = () => {
  const { user, role, loading, signOut } = useAuth()

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
            <FontAwesomeIcon icon={faStethoscope} className="h-4 w-4" />
          </span>
          ScanAhead
        </Link>

        <nav className="flex items-center gap-6">
          {role === 'patient' && (
            <>
              <NavLink to="/patient" end className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/patient/cases" className={navLinkClass}>
                All Cases
              </NavLink>
              <NavLink to="/patient/new-case" className={navLinkClass}>
                New Case
              </NavLink>
            </>
          )}
          {role === 'doctor' && (
            <>
              <NavLink to="/doctor" className={navLinkClass}>
                Doctor Hub
              </NavLink>
            </>
          )}
          {user && !loading && !role && (
            <span className="text-sm text-slate-400">Loading profile...</span>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
              <button
                onClick={signOut}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={navLinkClass}>
              Sign in
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
