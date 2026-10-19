import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Eye, EyeOff, Loader2, AlertTriangle, Phone, Info, LogIn, UserPlus } from 'lucide-react'
import { useApp } from '../store.jsx'
import './AuthPage.css'

// ─────────────────────────────────────────────
//  Demo credential store (no real backend).
//  In production: replace with Firebase Auth / Supabase Auth / your own API.
//  See PROJECT_HANDOFF.md for Google OAuth setup instructions.
// ─────────────────────────────────────────────
const DEMO_USERS = [
  { email: 'reporter@resqbridge.demo',  password: 'demo1234', role: 'reporter',  name: 'Demo Reporter' },
  { email: 'responder@resqbridge.demo', password: 'demo1234', role: 'responder', name: 'Duty Officer' },
  { email: 'admin@resqbridge.demo',     password: 'demo1234', role: 'admin',     name: 'Admin' },
]

// ─────────────────────────────────────────────
//  Error-code → user-facing message mapper
// ─────────────────────────────────────────────
const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email':          'Please enter a valid email address.',
  'auth/user-not-found':         'No account found with that email address.',
  'auth/wrong-password':         'The password you entered is incorrect. Please try again.',
  'auth/invalid-credential':     'Incorrect email or password. Please check and try again.',
  'auth/email-already-in-use':   'An account with this email already exists. Try signing in instead.',
  'auth/weak-password':          'Password must be at least 8 characters.',
  'auth/too-many-requests':      'Too many failed attempts. Please wait a few minutes before trying again.',
  'auth/network-request-failed': 'Could not connect to the server. Check your internet connection and try again.',
  'auth/user-disabled':          'This account has been disabled. Please contact support.',
  'auth/requires-recent-login':  'Your session has expired. Please sign in again.',
  'auth/email-not-verified':     'Please verify your email address before signing in.',
  'auth/operation-not-allowed':  'This sign-in method is not enabled. Please contact support.',
  'auth/provider-unavailable':   'The authentication service is temporarily unavailable. Please try again shortly.',
  'auth/session-expired':        'Your session has expired. Please sign in again.',
  'auth/unauthorized':           'You do not have permission to access this resource.',
  'auth/field-required':         'Please fill in all required fields.',
  'auth/passwords-do-not-match': 'Passwords do not match. Please check and try again.',
  'auth/google-not-configured':  'Google Sign-In is not yet configured. Please use email/password or see setup instructions.',
  'auth/popup-closed':           'Google Sign-In was cancelled — the popup was closed before completing.',
  'auth/popup-blocked':          'Google Sign-In popup was blocked by your browser. Please allow popups for this site.',
  'auth/unknown':                'Something went wrong. Please try again. If the problem continues, contact support.',
}

function getAuthErrorMessage(code) {
  return AUTH_ERROR_MESSAGES[code] || AUTH_ERROR_MESSAGES['auth/unknown']
}

// ─────────────────────────────────────────────
//  Google OAuth implementation
//
//  This uses the Google Identity Services (GIS) library loaded via window.google.
//  To enable:
//    1. Create a Google OAuth client at https://console.cloud.google.com/
//    2. Add authorized JavaScript origins: http://localhost:5173 (dev), your production domain
//    3. Add authorized redirect URIs if using redirect flow (not needed for popup)
//    4. Copy the Client ID and set VITE_GOOGLE_CLIENT_ID=your_client_id in .env.local
//    5. Add <script src="https://accounts.google.com/gsi/client" async></script> to index.html
//
//  IMPORTANT: Never put the OAuth client secret in frontend code.
//  The client ID (not secret) is safe to expose — it identifies your app.
//  The actual authentication is handled by Google's servers.
// ─────────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

async function signInWithGoogle() {
  // Check if Google Identity Services is loaded
  if (!window.google?.accounts?.id) {
    // In demo mode without GIS script, throw a clear error
    if (!GOOGLE_CLIENT_ID) {
      throw { code: 'auth/google-not-configured' }
    }
    throw { code: 'auth/provider-unavailable' }
  }

  if (!GOOGLE_CLIENT_ID) {
    throw { code: 'auth/google-not-configured' }
  }

  return new Promise((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.error) {
          // Map GIS error codes to our auth error codes
          const errorMap = {
            'popup_closed_by_user': 'auth/popup-closed',
            'access_denied': 'auth/popup-closed',
            'immediate_failed': 'auth/popup-closed',
          }
          reject({ code: errorMap[response.error] || 'auth/unknown', message: response.error })
          return
        }
        // Decode the credential JWT to get user info
        // NOTE: In production, verify the JWT server-side — never trust client-side decoded JWTs for auth decisions
        try {
          const payload = JSON.parse(atob(response.credential.split('.')[1]))
          resolve({
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            googleId: payload.sub,
            picture: payload.picture,
            // New users get reporter role by default — privilege escalation requires backend authorization
            role: 'reporter',
          })
        } catch {
          reject({ code: 'auth/unknown' })
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    // Use One Tap prompt
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        // One Tap not available — fall back to popup button
        reject({ code: 'auth/popup-blocked' })
      }
      if (notification.isDismissedMoment()) {
        reject({ code: 'auth/popup-closed' })
      }
    })
  })
}

// ─────────────────────────────────────────────
//  Simulated email/password auth operations
// ─────────────────────────────────────────────
async function signIn(email, password) {
  await new Promise(r => setTimeout(r, 900)) // Simulate network latency

  if (!email || !password) throw { code: 'auth/field-required' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw { code: 'auth/invalid-email' }

  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) throw { code: 'auth/user-not-found' }
  if (user.password !== password) throw { code: 'auth/wrong-password' }

  return user
}

async function signUp(email, password, confirmPassword, name) {
  await new Promise(r => setTimeout(r, 900))

  if (!email || !password || !name) throw { code: 'auth/field-required' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw { code: 'auth/invalid-email' }
  if (password.length < 8) throw { code: 'auth/weak-password' }
  if (password !== confirmPassword) throw { code: 'auth/passwords-do-not-match' }

  const exists = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (exists) throw { code: 'auth/email-already-in-use' }

  // In real app: create account server-side, always default to reporter role
  return { email, role: 'reporter', name }
}

// ─────────────────────────────────────────────
//  Validation helpers
// ─────────────────────────────────────────────
function validateEmail(email) {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return null
}

function validatePassword(password, minLen = 1) {
  if (!password) return 'Password is required.'
  if (minLen > 1 && password.length < minLen) return `Password must be at least ${minLen} characters.`
  return null
}

// ─────────────────────────────────────────────
//  Google Sign-In button (matches Google brand guidelines)
// ─────────────────────────────────────────────
function GoogleButton({ onClick, loading, disabled }) {
  const googleConfigured = !!GOOGLE_CLIENT_ID

  return (
    <button
      type="button"
      className={`btn-google${loading ? ' loading' : ''}${disabled ? ' disabled' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      title={!googleConfigured ? 'Google Sign-In requires VITE_GOOGLE_CLIENT_ID — see PROJECT_HANDOFF.md' : ''}
    >
      {loading ? (
        <Loader2 size={18} className="spin" aria-hidden="true" />
      ) : (
        <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      <span>{loading ? 'Signing in with Google…' : 'Continue with Google'}</span>
      {!googleConfigured && !loading && (
        <span className="google-setup-badge">Setup required</span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────
//  AuthPage component
// ─────────────────────────────────────────────
export default function AuthPage() {
  const { setRole, toast } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login') // 'login' | 'signup'

  // Form fields
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [name, setName]             = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // State
  const [loading, setLoading]         = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')   // banner error
  const [fieldErrors, setFieldErrors] = useState({})   // per-field errors

  // After auth, redirect to role-select (or the originally requested page)
  const getRedirectPath = useCallback(() => {
    const from = location.state?.from
    // Validate: only redirect to safe internal paths
    if (from && from.startsWith('/') && !from.startsWith('//')) return from
    return '/role-select'
  }, [location.state?.from])

  // ── Clear errors when user edits a field ──
  const clearFieldError = (field) => setFieldErrors(e => ({ ...e, [field]: null }))

  // ── Client-side field validation ──
  const validateForm = useCallback(() => {
    const errs = {}
    const emailErr = validateEmail(email)
    if (emailErr) errs.email = emailErr

    if (mode === 'signup') {
      if (!name.trim()) errs.name = 'Full name is required.'
      const pwErr = validatePassword(password, 8)
      if (pwErr) errs.password = pwErr
      if (password && confirmPw && password !== confirmPw) errs.confirmPw = 'Passwords do not match.'
      if (!confirmPw) errs.confirmPw = 'Please confirm your password.'
    } else {
      const pwErr = validatePassword(password, 1)
      if (pwErr) errs.password = pwErr
    }

    return errs
  }, [email, mode, name, password, confirmPw])

  // ── Submit handler ──
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (loading) return // Prevent duplicate submissions

    // Reset errors
    setGlobalError('')
    setFieldErrors({})

    // Client-side validation first
    const clientErrors = validateForm()
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }

    setLoading(true)
    try {
      let user
      if (mode === 'login') {
        user = await signIn(email.trim(), password)
      } else {
        user = await signUp(email.trim(), password, confirmPw, name.trim())
      }

      // Auth succeeded
      setRole(user.role, user.name)
      toast(`Welcome, ${user.name}!`, 'success')
      navigate(getRedirectPath())
    } catch (err) {
      const code = err?.code || 'auth/unknown'
      const friendlyMsg = getAuthErrorMessage(code)

      if (code === 'auth/invalid-email') {
        setFieldErrors(e => ({ ...e, email: friendlyMsg }))
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setFieldErrors(e => ({ ...e, password: friendlyMsg }))
      } else if (code === 'auth/user-not-found') {
        setFieldErrors(e => ({ ...e, email: friendlyMsg }))
      } else if (code === 'auth/email-already-in-use') {
        setFieldErrors(e => ({ ...e, email: friendlyMsg }))
      } else if (code === 'auth/weak-password') {
        setFieldErrors(e => ({ ...e, password: friendlyMsg }))
      } else if (code === 'auth/passwords-do-not-match') {
        setFieldErrors(e => ({ ...e, confirmPw: friendlyMsg }))
      } else if (code === 'auth/field-required') {
        setGlobalError(friendlyMsg)
      } else {
        setGlobalError(friendlyMsg)
      }
    } finally {
      setLoading(false)
    }
  }, [loading, mode, email, password, confirmPw, name, setRole, toast, navigate, validateForm, getRedirectPath])

  // ── Google Sign-In handler ──
  const handleGoogleSignIn = useCallback(async () => {
    if (googleLoading) return
    setGlobalError('')
    setFieldErrors({})
    setGoogleLoading(true)

    try {
      const user = await signInWithGoogle()
      // New Google users get reporter role; promote via backend authorization only
      setRole(user.role, user.name)
      toast(`Welcome, ${user.name}! Signed in with Google.`, 'success')
      navigate(getRedirectPath())
    } catch (err) {
      const code = err?.code || 'auth/unknown'
      const friendlyMsg = getAuthErrorMessage(code)
      // Popup-closed/cancelled is a soft error — don't show the error banner
      if (code !== 'auth/popup-closed') {
        setGlobalError(friendlyMsg)
      }
    } finally {
      setGoogleLoading(false)
    }
  }, [googleLoading, setRole, toast, navigate, getRedirectPath])

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setGlobalError('')
    setFieldErrors({})
    setPassword('')
    setConfirmPw('')
    setShowPw(false)
    setShowConfirm(false)
  }

  const isAnyLoading = loading || googleLoading

  return (
    <div className="auth-page page">
      <div className="auth-glow" />

      <div className="auth-card fade-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon"><Shield size={22} fill="white" /></div>
          <span className="auth-logo-text">RESQ<span style={{ color: 'var(--clr-primary)' }}>BRIDGE</span></span>
        </div>

        <h1 className="auth-title">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Access the RESQBRIDGE reporting platform'
            : 'Join RESQBRIDGE to submit and track incident reports'}
        </p>

        {/* Emergency bar — always accessible regardless of auth state */}
        <div className="alert alert-emergency auth-emergency">
          <Phone size={14} className="alert-icon" />
          <span style={{ fontSize: '0.8rem' }}>
            <strong>Emergency?</strong> Call <a href="tel:112" style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>112</a> — don't wait to sign in.
          </span>
        </div>

        {/* Google Sign-In */}
        <GoogleButton
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          disabled={isAnyLoading}
        />

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {/* Global error banner */}
        {globalError && (
          <div
            className="auth-error-banner"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate aria-label={mode === 'login' ? 'Sign in form' : 'Create account form'}>
          {/* Name (signup only) */}
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full Name *</label>
              <input
                id="auth-name"
                className={`form-input ${fieldErrors.name ? 'input-error' : ''}`}
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                value={name}
                onChange={e => { setName(e.target.value); clearFieldError('name') }}
                disabled={isAnyLoading}
                aria-describedby={fieldErrors.name ? 'auth-name-err' : undefined}
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name && (
                <div id="auth-name-err" className="form-error" role="alert">
                  <Info size={12} /> {fieldErrors.name}
                </div>
              )}
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email address *</label>
            <input
              id="auth-email"
              className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
              type="email"
              placeholder="you@example.com"
              autoComplete={mode === 'login' ? 'username' : 'email'}
              value={email}
              onChange={e => { setEmail(e.target.value); clearFieldError('email'); setGlobalError('') }}
              disabled={isAnyLoading}
              aria-describedby={fieldErrors.email ? 'auth-email-err' : undefined}
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && (
              <div id="auth-email-err" className="form-error" role="alert">
                <Info size={12} /> {fieldErrors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password *
              {mode === 'signup' && <span className="form-hint"> (min. 8 characters)</span>}
            </label>
            <div className="password-field">
              <input
                id="auth-password"
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                type={showPw ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => { setPassword(e.target.value); clearFieldError('password'); setGlobalError('') }}
                disabled={isAnyLoading}
                aria-describedby={fieldErrors.password ? 'auth-pw-err' : undefined}
                aria-invalid={!!fieldErrors.password}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <div id="auth-pw-err" className="form-error" role="alert">
                <Info size={12} /> {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Confirm password (signup only) */}
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm-password">Confirm Password *</label>
              <div className="password-field">
                <input
                  id="auth-confirm-password"
                  className={`form-input ${fieldErrors.confirmPw ? 'input-error' : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); clearFieldError('confirmPw') }}
                  disabled={isAnyLoading}
                  aria-describedby={fieldErrors.confirmPw ? 'auth-confirm-err' : undefined}
                  aria-invalid={!!fieldErrors.confirmPw}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowConfirm(p => !p)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPw && (
                <div id="auth-confirm-err" className="form-error" role="alert">
                  <Info size={12} /> {fieldErrors.confirmPw}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-full auth-submit"
            disabled={isAnyLoading}
            aria-busy={loading}
          >
            {loading
              ? <><Loader2 size={16} className="spin" aria-hidden="true" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'login'
                ? <><LogIn size={16} /> Sign in</>
                : <><UserPlus size={16} /> Create account</>
            }
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="auth-demo-hint">
          <div className="auth-demo-title">Demo credentials</div>
          <div className="auth-demo-creds">
            <div><span className="auth-demo-role">Reporter:</span> reporter@resqbridge.demo / demo1234</div>
            <div><span className="auth-demo-role">Responder:</span> responder@resqbridge.demo / demo1234</div>
            <div><span className="auth-demo-role">Admin:</span> admin@resqbridge.demo / demo1234</div>
          </div>
        </div>

        {/* Switch mode */}
        <div className="auth-switch">
          {mode === 'login' ? (
            <span>Don't have an account? <button className="auth-link" onClick={switchMode}>Create one</button></span>
          ) : (
            <span>Already have an account? <button className="auth-link" onClick={switchMode}>Sign in</button></span>
          )}
        </div>

        <p className="auth-disclaimer">
          RESQBRIDGE is a demonstration platform. No real emergency services are contacted when you submit a report.
          Always call <a href="tel:112" style={{ color: 'var(--clr-primary)' }}>112</a> in a genuine emergency.
        </p>
      </div>
    </div>
  )
}
