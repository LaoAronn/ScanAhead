import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStethoscope, faBars, faTimes } from '@fortawesome/free-solid-svg-icons'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'}`

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-3 text-base font-medium transition ${
    isActive 
      ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-700' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`

const Navbar = () => {
  const { user, role, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const handleSignOut = () => {
    signOut()
    closeMobileMenu()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 text-lg font-semibold text-slate-900"
          onClick={closeMobileMenu}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
            <FontAwesomeIcon icon={faStethoscope} className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">ScanAhead</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
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

        {/* Desktop User Section */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 lg:inline">{user.email}</span>
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon 
            icon={mobileMenuOpen ? faTimes : faBars} 
            className="h-5 w-5" 
          />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 top-[57px] z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed right-0 top-[57px] z-50 h-[calc(100vh-57px)] w-72 transform border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            {role === 'patient' && (
              <div className="space-y-1">
                <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Patient Menu
                </div>
                <NavLink 
                  to="/patient" 
                  end 
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/patient/cases" 
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  All Cases
                </NavLink>
                <NavLink 
                  to="/patient/new-case" 
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  New Case
                </NavLink>
              </div>
            )}
            {role === 'doctor' && (
              <div className="space-y-1">
                <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Doctor Menu
                </div>
                <NavLink 
                  to="/doctor" 
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  Doctor Hub
                </NavLink>
              </div>
            )}
            {user && !loading && !role && (
              <div className="px-4 py-3 text-sm text-slate-400">
                Loading profile...
              </div>
            )}
          </nav>

          {/* Mobile User Section */}
          <div className="border-t border-slate-200 bg-slate-50 p-4">
            {user ? (
              <div className="space-y-3">
                <div className="truncate text-sm text-slate-600">{user.email}</div>
                <button
                  onClick={handleSignOut}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="block w-full rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-brand-700"
                onClick={closeMobileMenu}
              >
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar