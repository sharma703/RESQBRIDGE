import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Shield, Menu, X, AlertTriangle, LayoutDashboard, FileText, Users, Home, LogIn, UserCheck } from 'lucide-react'
import { useApp } from '../store.jsx'
import './Navbar.css'

const ROLE_LABELS = {
  reporter:  { label: 'Reporter',   emoji: '📣' },
  responder: { label: 'Responder',  emoji: '🛡️' },
  admin:     { label: 'Admin',      emoji: '⚙️' },
}

export default function Navbar() {
  const { state, setRole } = useApp()
  const { userRole } = state
  const [open, setOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const navigate = useNavigate()

  const navLinks = [
    { to: '/',           label: 'Home',       icon: <Home size={16} /> },
    { to: '/report',     label: 'Report',     icon: <AlertTriangle size={16} /> },
    { to: '/my-reports', label: 'My Reports', icon: <FileText size={16} /> },
  ]

  if (userRole === 'responder' || userRole === 'admin') {
    navLinks.push({ to: '/dashboard',    label: 'Dashboard',    icon: <LayoutDashboard size={16} /> })
    navLinks.push({ to: '/coordination', label: 'Coordination', icon: <Users size={16} /> })
  }

  const switchRole = (role, name) => {
    setRole(role, name)
    setRoleMenuOpen(false)
    setOpen(false)
    navigate('/')
  }

  const roleMeta = ROLE_LABELS[userRole] || ROLE_LABELS.reporter

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <Shield size={20} fill="currentColor" />
          </div>
          <span className="navbar-logo-text">RESQ<span className="navbar-logo-accent">BRIDGE</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links hide-sm">
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
              {l.icon} {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* 112 Emergency button */}
          <a href="tel:112" className="btn btn-primary btn-sm navbar-emergency hide-sm">
            <AlertTriangle size={13} />
            Call 112
          </a>

          {/* Sign In / Role indicator */}
          <Link to="/auth" className="btn btn-outline btn-sm hide-sm">
            <LogIn size={14} /> Sign In
          </Link>

          {/* Role switcher (demo) */}
          <div className="role-switcher" style={{ position: 'relative' }}>
            <button
              className="btn btn-outline btn-sm navbar-role-btn"
              onClick={() => setRoleMenuOpen(p => !p)}
              aria-label={`Current role: ${roleMeta.label}. Click to switch.`}
              aria-expanded={roleMenuOpen}
              aria-haspopup="menu"
            >
              <span style={{ fontSize: '0.85rem' }}>{roleMeta.emoji}</span>
              <span className="hide-sm" style={{ maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {roleMeta.label}
              </span>
            </button>
            {roleMenuOpen && (
              <div className="role-menu" role="menu" aria-label="Switch role">
                <div className="role-menu-title">
                  <UserCheck size={13} /> Demo: Switch Role
                </div>
                <button role="menuitem" onClick={() => switchRole('reporter', 'Guest User')} className={`role-option${userRole === 'reporter' ? ' active' : ''}`}>
                  📣 Reporter (Public)
                </button>
                <button role="menuitem" onClick={() => switchRole('responder', 'Duty Officer')} className={`role-option${userRole === 'responder' ? ' active' : ''}`}>
                  🛡️ Responder (Reviewer)
                </button>
                <button role="menuitem" onClick={() => switchRole('admin', 'Admin')} className={`role-option${userRole === 'admin' ? ' active' : ''}`}>
                  ⚙️ Admin
                </button>
                <div className="role-menu-sep" />
                <Link
                  to="/role-select"
                  className="role-option role-option-link"
                  onClick={() => setRoleMenuOpen(false)}
                >
                  🎭 Full role selection…
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="btn-icon" onClick={() => setOpen(p => !p)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="navbar-mobile">
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `navbar-mobile-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
              {l.icon} {l.label}
            </NavLink>
          ))}
          <Link to="/role-select" className="navbar-mobile-link" onClick={() => setOpen(false)}>
            <UserCheck size={16} /> Switch Role
          </Link>
          <a href="tel:112" className="btn btn-primary btn-sm" style={{ margin: '0.5rem 1rem' }}>
            <AlertTriangle size={13} /> Call 112 Now
          </a>
        </div>
      )}

      {/* Backdrop for role menu */}
      {roleMenuOpen && <div className="role-backdrop" onClick={() => setRoleMenuOpen(false)} />}
    </nav>
  )
}
