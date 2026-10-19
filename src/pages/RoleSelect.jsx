import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, ChevronRight, Phone, Lock, CheckCircle, Clock, Info } from 'lucide-react'
import { useApp } from '../store.jsx'
import './RoleSelect.css'

const ROLES = [
  {
    id: 'reporter',
    label: 'Reporter',
    emoji: '📣',
    color: 'orange',
    tagline: 'Submit and track incident reports',
    description: 'Report what you witness. Track your submissions. Receive status updates from authorized responders.',
    capabilities: [
      'Submit emergency incident reports',
      'Attach photos, video, and GPS location',
      'Use voice input for hands-free reporting',
      'View your report history and reference IDs',
      'See status updates from responders',
      'Anonymous reporting supported',
    ],
    note: null,
    destination: '/report',
    destinationLabel: 'Go to Report Form',
  },
  {
    id: 'responder',
    label: 'Responder',
    emoji: '🛡️',
    color: 'blue',
    tagline: 'Review incidents and coordinate response',
    description: 'Authorized personnel only. Access the incident dashboard, triage reports, update status, and coordinate with agencies.',
    capabilities: [
      'View and triage incoming incident reports',
      'Review AI-suggested categories (human decision always final)',
      'Update incident status and add review notes',
      'Coordinate with Police, Ambulance, Fire, NDRF',
      'View full incident timelines and media',
      'Access multi-agency coordination panel',
    ],
    note: 'Responder access requires authorization. In this demo, selecting Responder grants access. In production, role would be verified server-side.',
    destination: '/dashboard',
    destinationLabel: 'Go to Dashboard',
  },
  {
    id: 'admin',
    label: 'Administrator',
    emoji: '⚙️',
    color: 'purple',
    tagline: 'Manage platform configuration and oversight',
    description: 'Full administrative access. Review all incidents, manage users, and oversee coordination across all agencies.',
    capabilities: [
      'All Responder capabilities',
      'Access coordination dashboard with full visibility',
      'View all incidents regardless of assignment',
      'Review audit trails and system activity',
      'Manage service directory and platform settings',
      'Access failed notification logs and routing status',
    ],
    note: 'Administrator access is strictly controlled. In production, admin roles are granted only through secure backend processes — never self-selected.',
    destination: '/coordination',
    destinationLabel: 'Go to Coordination',
  },
]

const COLOR_MAP = {
  orange: {
    border: 'var(--clr-accent)',
    bg: 'var(--clr-accent-dim)',
    text: 'var(--clr-accent)',
    badge: 'badge-orange',
    glow: 'rgba(255,140,66,0.12)',
  },
  blue: {
    border: 'var(--clr-blue)',
    bg: 'var(--clr-blue-dim)',
    text: 'var(--clr-blue)',
    badge: 'badge-blue',
    glow: 'rgba(74,158,255,0.12)',
  },
  purple: {
    border: 'var(--clr-purple)',
    bg: 'var(--clr-purple-dim)',
    text: 'var(--clr-purple)',
    badge: 'badge-purple',
    glow: 'rgba(168,85,247,0.12)',
  },
}

export default function RoleSelect() {
  const { state, setRole, toast } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(state.userRole || null)
  const [confirming, setConfirming] = useState(false)

  const currentRole = ROLES.find(r => r.id === selected)

  const handleConfirm = () => {
    if (!selected || !currentRole) return
    setConfirming(true)
    // Brief animation delay before navigation
    setTimeout(() => {
      setRole(selected, state.userName)
      toast(`Role set to ${currentRole.label}`, 'success')
      navigate(currentRole.destination)
      setConfirming(false)
    }, 400)
  }

  return (
    <div className="role-select-page page">
      <div className="role-select-glow" />
      <div className="container role-select-container">
        {/* Header */}
        <div className="role-select-header fade-up">
          <div className="role-select-logo">
            <div className="role-select-logo-icon">
              <Shield size={22} fill="white" />
            </div>
            <span className="role-select-logo-text">RESQ<span style={{ color: 'var(--clr-primary)' }}>BRIDGE</span></span>
          </div>
          <h1 className="role-select-title">How are you using RESQBRIDGE?</h1>
          <p className="role-select-subtitle">
            Select your role to access the appropriate features. Your role determines what you can see and do.
          </p>

          {/* Emergency bar — always accessible */}
          <div className="alert alert-emergency role-emergency-bar">
            <Phone size={14} className="alert-icon" />
            <span style={{ fontSize: '0.8rem' }}>
              <strong>Emergency?</strong> Call <a href="tel:112" style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>112</a> — don't wait to select a role.
            </span>
          </div>
        </div>

        {/* Role cards */}
        <div className="role-cards-grid fade-up fade-up-1">
          {ROLES.map((role) => {
            const colors = COLOR_MAP[role.color]
            const isSelected = selected === role.id
            return (
              <button
                key={role.id}
                className={`role-card${isSelected ? ' selected' : ''}`}
                style={isSelected ? {
                  borderColor: colors.border,
                  background: `linear-gradient(135deg, var(--clr-bg-card) 0%, ${colors.glow} 100%)`,
                  boxShadow: `0 0 0 2px ${colors.border}20, 0 8px 32px ${colors.glow}`,
                } : {}}
                onClick={() => setSelected(role.id)}
                aria-pressed={isSelected}
                type="button"
              >
                {/* Selection indicator */}
                <div className={`role-card-check ${isSelected ? 'checked' : ''}`} style={isSelected ? { borderColor: colors.border, background: colors.bg, color: colors.text } : {}}>
                  {isSelected ? <CheckCircle size={16} /> : <span className="role-card-check-empty" />}
                </div>

                {/* Icon and label */}
                <div className="role-card-icon" style={isSelected ? { background: colors.bg, border: `1px solid ${colors.border}40` } : {}}>
                  <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{role.emoji}</span>
                </div>

                <div className={`badge ${colors.badge}`} style={{ marginBottom: '0.5rem' }}>{role.label}</div>
                <h3 className="role-card-tagline" style={isSelected ? { color: colors.text } : {}}>{role.tagline}</h3>
                <p className="role-card-desc">{role.description}</p>

                {/* Capabilities */}
                <ul className="role-capabilities">
                  {role.capabilities.map((cap, i) => (
                    <li key={i} className="role-capability">
                      <CheckCircle size={12} style={{ color: isSelected ? colors.text : 'var(--clr-text-faint)', flexShrink: 0 }} />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>

                {/* Note for privileged roles */}
                {role.note && (
                  <div className="role-card-note">
                    <Lock size={11} style={{ flexShrink: 0, color: 'var(--clr-yellow)' }} />
                    <span>{role.note}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Confirm section */}
        <div className={`role-confirm-section fade-up fade-up-2${selected ? ' visible' : ''}`}>
          {selected && currentRole && (
            <>
              <div className="role-confirm-info">
                <Info size={16} style={{ flexShrink: 0, color: 'var(--clr-blue)' }} />
                <span>
                  You selected <strong>{currentRole.label}</strong>.
                  {' '}You'll be taken to {currentRole.destinationLabel.replace('Go to ', '')}.
                </span>
              </div>
              <div className="role-confirm-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleConfirm}
                  disabled={confirming}
                  aria-busy={confirming}
                >
                  {confirming
                    ? <><Clock size={14} className="spin" /> Setting role…</>
                    : <>{currentRole.emoji} {currentRole.destinationLabel} <ChevronRight size={16} /></>
                  }
                </button>
              </div>
            </>
          )}
        </div>

        {/* Demo notice */}
        <div className="role-demo-notice fade-up fade-up-3">
          <AlertTriangle size={14} style={{ flexShrink: 0, color: 'var(--clr-yellow)' }} />
          <span>
            <strong>Demo platform</strong> — In production, Responder and Admin roles require verified authorization.
            Self-selecting a privileged role is only possible here for demonstration purposes.
            No real emergency services are contacted.
          </span>
        </div>
      </div>
    </div>
  )
}
