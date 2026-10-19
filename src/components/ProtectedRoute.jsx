import { Navigate, useLocation, Link } from 'react-router-dom'
import { Lock, AlertTriangle, ArrowLeft, LogIn } from 'lucide-react'
import { useApp } from '../store.jsx'

/**
 * Route guard component for role-based authorization.
 * Ensures only authenticated users with allowed roles can access protected pages.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { state } = useApp()
  const { isAuthenticated, userRole, currentUser } = state
  const location = useLocation()

  // 1. Unauthenticated -> redirect to /auth with target role and return path
  if (!isAuthenticated) {
    const targetRole = allowedRoles[0] || 'responder'
    return (
      <Navigate
        to={`/auth?role=${targetRole}`}
        state={{ from: location.pathname, requiredRole: targetRole }}
        replace
      />
    )
  }

  // 2. Authenticated but unauthorized role -> show clear Access Denied screen
  const isAuthorized = allowedRoles.includes(userRole)
  if (!isAuthorized) {
    const requiredRoleName = allowedRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(' or ')

    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          background: 'var(--clr-bg-card)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: 'var(--clr-primary)',
            boxShadow: '0 0 24px rgba(239, 68, 68, 0.2)'
          }}>
            <Lock size={32} />
          </div>

          <div className="badge badge-red" style={{ marginBottom: '0.75rem' }}>
            Authorization Required
          </div>

          <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-head)', marginBottom: '0.75rem' }}>
            Access Denied
          </h1>

          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            This console requires <strong>{requiredRoleName}</strong> authorization.
            Your account (<strong>{currentUser?.email || state.userName}</strong>) is currently assigned the <strong>{userRole}</strong> role.
          </p>

          <div className="alert alert-warning" style={{ textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              Privileged responder and administrative dashboards cannot be accessed by switching frontend tabs. Please sign in with an authorized agency account.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              to={`/auth?role=${allowedRoles[0]}`}
              state={{ from: location.pathname }}
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
            >
              <LogIn size={16} /> Sign in with {requiredRoleName} Account
            </Link>
            <Link
              to="/"
              className="btn btn-outline"
              style={{ justifyContent: 'center' }}
            >
              <ArrowLeft size={16} /> Return to Role Selection
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. Authenticated & Authorized -> render protected content
  return children
}
