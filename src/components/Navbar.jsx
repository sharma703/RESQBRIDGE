import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Shield, Menu, X, AlertTriangle, LayoutDashboard, FileText, Users, Home, LogOut, User } from 'lucide-react'
import { useApp } from '../store.jsx'
import './Navbar.css'

const ROLE_LABELS = {
  reporter:  { label: 'REPORTER',   badgeClass: 'badge-orange' },
  responder: { label: 'RESPONDER',  badgeClass: 'badge-blue' },
  admin:     { label: 'ADMIN',      badgeClass: 'badge-purple' },
}

export default function Navbar() {
  const { state, logout, toast } = useApp()
  const { userRole, isAuthenticated, currentUser, userName } = state
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const navLinks = [
    { to: '/',           label: 'Home',       icon: <Home size={16} /> },
    { to: '/report',     label: 'Report',     icon: <AlertTriangle size={16} /> },
    { to: '/my-reports', label: 'My Reports', icon: <FileText size={16} /> },
  ]

  // Add protected navigation links based strictly on authorized role
  if (isAuthenticated && (userRole === 'responder' || userRole === 'admin')) {
    navLinks.push({ to: '/dashboard',    label: 'Dashboard',    icon: <LayoutDashboard size={16} /> })
    navLinks.push({ to: '/coordination', label: 'Coordination', icon: <Users size={16} /> })
  }

  const handleSignOut = () => {
    logout()
    toast('Session terminated. Signed out safely.', 'info')
    setOpen(false)
    navigate('/')
  }

  const roleMeta = ROLE_LABELS[userRole] || ROLE_LABELS.reporter

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" title="RESQBRIDGE Home">
          <div className="navbar-logo-icon">
            <Shield size={20} fill="currentColor" />
          </div>
          <span className="navbar-logo-text">RESQ<span className="navbar-logo-accent">BRIDGE</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-links hide-sm">
          {navLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            >
              {l.icon} {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right Side */}
        <div className="navbar-right">
          {/* 112 Emergency Button — Always visible */}
          <a href="tel:112" className="btn btn-primary btn-sm navbar-emergency hide-sm" title="Call 112 immediately">
            <AlertTriangle size={13} />
            Call 112
          </a>

          {/* Compact Role Indicator */}
          <div className="navbar-role-indicator hide-sm" aria-label={`Current authorized role: ${roleMeta.label}`}>
            <span className={`badge ${roleMeta.badgeClass}`} style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', padding: '0.22rem 0.55rem' }}>
              {roleMeta.label}
            </span>
          </div>

          {/* Authenticated Profile & Sign Out (Only shown for authenticated users) */}
          {isAuthenticated && (
            <div className="navbar-auth-group hide-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                className="navbar-user-chip"
                title={`Signed in as ${currentUser?.email || userName}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  color: 'var(--clr-text-muted)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--clr-border)',
                }}
              >
                <User size={13} style={{ color: 'var(--clr-accent)' }} />
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.name || userName}
                </span>
              </div>

              <button
                id="navbar-signout-btn"
                className="btn btn-outline btn-sm"
                onClick={handleSignOut}
                title="Sign out of current session"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="btn-icon"
            onClick={() => setOpen(p => !p)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="navbar-mobile">
          {/* Mobile Role & User Info */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--clr-border)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isAuthenticated ? '0.35rem' : '0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', letterSpacing: '0.05em' }}>CURRENT ROLE</span>
              <span className={`badge ${roleMeta.badgeClass}`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                {roleMeta.label}
              </span>
            </div>
            {isAuthenticated && (
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-accent)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
                <User size={12} /> {currentUser?.name || userName} ({currentUser?.email})
              </div>
            )}
          </div>

          {/* Mobile Navigation Links */}
          {navLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => `navbar-mobile-link${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.icon} {l.label}
            </NavLink>
          ))}

          {/* Mobile Auth Button */}
          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {isAuthenticated && (
              <button
                className="btn btn-outline btn-sm w-full"
                onClick={handleSignOut}
                style={{ justifyContent: 'center' }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            )}

            <a href="tel:112" className="btn btn-primary btn-sm w-full" style={{ justifyContent: 'center' }}>
              <AlertTriangle size={13} /> Call 112 Now
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
