import { Link, useNavigate } from 'react-router-dom'
import { Shield, Phone, Lock, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react'
import { useApp } from '../store.jsx'
import './RoleSelect.css'

const ROLES = [
  {
    id: 'reporter',
    label: 'Reporter',
    emoji: '📣',
    color: 'orange',
    tagline: 'Witness or Involved Party',
    description: 'Report an emergency quickly and provide incident details.',
    capabilities: [
      'Instant access — no login or sign-up required',
      'Submit emergency reports with photos & video',
      'GPS location capture or manual address entry',
      'Hands-free voice-to-text reporting',
      'Anonymous reporting supported',
      'Track report status via reference ID',
    ],
    buttonText: 'Continue as Reporter',
    destination: '/report',
    isPublic: true,
  },
  {
    id: 'responder',
    label: 'Responder',
    emoji: '🛡️',
    color: 'blue',
    tagline: 'Duty Officer & Field Unit',
    description: 'Review assigned incidents and update response progress.',
    capabilities: [
      'Access verified incident triage dashboard',
      'Review AI-assisted triage suggestions',
      'Update response status & add audit notes',
      'Coordinate with Police, Ambulance, Fire, NDRF',
      'View incident evidence and location maps',
    ],
    buttonText: 'Continue as Responder',
    destination: '/dashboard',
    isPublic: false,
    authNote: 'Authentication & verified authorization required',
  },
  {
    id: 'admin',
    label: 'Administrator',
    emoji: '⚙️',
    color: 'purple',
    tagline: 'Operations & Agency Command',
    description: 'Manage incident verification, users, service configuration, and authorized operations.',
    capabilities: [
      'Full administrative & multi-agency oversight',
      'System-wide incident coordination & dispatch',
      'Manage agency permissions and user accounts',
      'View comprehensive audit logs & activity history',
      'Configure platform endpoints & emergency services',
    ],
    buttonText: 'Continue as Administrator',
    destination: '/coordination',
    isPublic: false,
    authNote: 'Strictly restricted to authorized administrative personnel',
  },
]

const COLOR_MAP = {
  orange: {
    border: 'var(--clr-accent)',
    bg: 'var(--clr-accent-dim)',
    text: 'var(--clr-accent)',
    badge: 'badge-orange',
    btnClass: 'btn-accent',
    glow: 'rgba(255,140,66,0.12)',
  },
  blue: {
    border: 'var(--clr-blue)',
    bg: 'var(--clr-blue-dim)',
    text: 'var(--clr-blue)',
    badge: 'badge-blue',
    btnClass: 'btn-primary',
    glow: 'rgba(74,158,255,0.12)',
  },
  purple: {
    border: 'var(--clr-purple)',
    bg: 'var(--clr-purple-dim)',
    text: 'var(--clr-purple)',
    badge: 'badge-purple',
    btnClass: 'btn-purple',
    glow: 'rgba(168,85,247,0.12)',
  },
}

export default function RoleSelect() {
  const { state, setRole, toast } = useApp()
  const { isAuthenticated, userRole, currentUser } = state
  const navigate = useNavigate()

  const handleRoleAction = (role) => {
    if (role.isPublic) {
      // Reporter: Direct access without mandatory login
      setRole('reporter', currentUser?.name || 'Public Reporter')
      toast('Welcome to Emergency Reporting. Stay safe.', 'info')
      navigate('/report')
      return
    }

    // Privileged role (Responder or Admin):
    // Check if already authenticated with appropriate role
    if (isAuthenticated) {
      if (userRole === role.id || (role.id === 'responder' && userRole === 'admin')) {
        navigate(role.destination)
        return
      }
      // Logged in with different role -> redirect to auth with notice
      toast(`You are signed in as ${userRole}. Please sign in with a ${role.label} account.`, 'warning')
      navigate(`/auth?role=${role.id}`)
      return
    }

    // Not authenticated -> open sign-in page for requested role
    navigate(`/auth?role=${role.id}`)
  }

  return (
    <div className="role-select-page page">
      <div className="role-select-glow" />
      <div className="container role-select-container">
        {/* Header */}
        <div className="role-select-header fade-up">
          <div className="role-select-logo">
            <div className="role-select-logo-icon">
              <Shield size={24} fill="white" />
            </div>
            <span className="role-select-logo-text">RESQ<span style={{ color: 'var(--clr-primary)' }}>BRIDGE</span></span>
          </div>
          <h1 className="role-select-title">Smart Emergency Response Portal</h1>
          <p className="role-select-subtitle">
            Welcome to RESQBRIDGE. Please select your role to proceed to the appropriate emergency service, incident dashboard, or administrative console.
          </p>

          {/* Emergency Bar — India 112 Prominently Displayed */}
          <div className="alert alert-emergency role-emergency-bar" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <Phone size={16} className="alert-icon" style={{ animation: 'pulse 2s infinite' }} />
            <span>
              <strong>Immediate Life Threat?</strong> Call <a href="tel:112" style={{ color: 'var(--clr-primary)', fontWeight: 800, textDecoration: 'underline' }}>112</a> (National Emergency Helpline) immediately.
            </span>
          </div>
        </div>

        {/* Three Role Cards Grid */}
        <div className="role-cards-grid fade-up fade-up-1">
          {ROLES.map((role) => {
            const colors = COLOR_MAP[role.color]
            const isUserCurrentRole = isAuthenticated && userRole === role.id

            return (
              <div
                key={role.id}
                className="role-card"
                style={{
                  border: `2px solid ${colors.border}40`,
                  background: `linear-gradient(145deg, var(--clr-bg-card) 0%, ${colors.glow} 100%)`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '1rem' }}>
                  <div className="role-card-icon" style={{ background: colors.bg, border: `1px solid ${colors.border}50` }}>
                    <span style={{ fontSize: '1.85rem', lineHeight: 1 }}>{role.emoji}</span>
                  </div>
                  <div className={`badge ${colors.badge}`}>
                    {role.label}
                    {isUserCurrentRole && ' (Active)'}
                  </div>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-head)', marginBottom: '0.35rem', color: 'var(--clr-text)' }}>
                  {role.label}
                </h2>
                <div style={{ fontSize: '0.85rem', color: colors.text, fontWeight: 600, marginBottom: '0.6rem' }}>
                  {role.tagline}
                </div>
                <p className="role-card-desc" style={{ minHeight: '3rem', marginBottom: '1.25rem' }}>
                  {role.description}
                </p>

                {/* Capabilities list */}
                <ul className="role-capabilities" style={{ flex: 1, marginBottom: '1.5rem', width: '100%' }}>
                  {role.capabilities.map((cap, i) => (
                    <li key={i} className="role-capability">
                      <CheckCircle size={14} style={{ color: colors.text, flexShrink: 0 }} />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>

                {/* Authorization note */}
                {role.authNote && (
                  <div className="role-card-note" style={{ marginBottom: '1.25rem', width: '100%' }}>
                    <Lock size={12} style={{ flexShrink: 0, color: 'var(--clr-yellow)' }} />
                    <span style={{ fontSize: '0.75rem' }}>{role.authNote}</span>
                  </div>
                )}

                {/* Primary Button */}
                <button
                  id={`role-btn-${role.id}`}
                  className={`btn ${colors.btnClass}`}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem', fontSize: '0.95rem', fontWeight: 600 }}
                  onClick={() => handleRoleAction(role)}
                >
                  {role.buttonText}
                  <ArrowRight size={16} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Role Security Notice */}
        <div className="role-demo-notice fade-up fade-up-2" style={{ maxWidth: '850px', margin: '2rem auto 0' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--clr-yellow)' }} />
          <div style={{ fontSize: '0.825rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
            <strong>Security & Role-Based Access:</strong> Selecting a role indicates your requested destination.
            Reporter access is immediately open to all citizens for emergency reporting.
            Responder and Administrator consoles are strictly protected and require valid authentication with verified role authorization.
          </div>
        </div>

        {/* Footer info link */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link to="/about" style={{ color: 'var(--clr-text-faint)', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Learn more about the RESQBRIDGE AI Emergency Coordination System →
          </Link>
        </div>
      </div>
    </div>
  )
}
