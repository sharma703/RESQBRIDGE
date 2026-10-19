import { useState, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Shield, Eye, EyeOff, Loader2, AlertTriangle, Phone, Info, LogIn, UserPlus, ArrowLeft, Lock } from 'lucide-react'
import { useApp } from '../store.jsx'
import './AuthPage.css'

// ─────────────────────────────────────────────
//  Authorized accounts directory (simulated backend identity store)
//  In production, credentials and role claims are verified securely on the backend.
// ─────────────────────────────────────────────
const AUTHORIZED_ACCOUNTS = [
  // Primary Project Accounts
  { email: 'responder@resqbridge.gov', password: 'Emergency@2025', role: 'responder', name: 'Duty Officer Verma' },
  { email: 'admin@resqbridge.gov',     password: 'Admin@2025',     role: 'admin',     name: 'System Admin Rao' },
  { email: 'reporter@example.com',     password: 'Reporter@2025',  role: 'reporter',  name: 'Rohan Sharma' },
  // Demo Compatibility Accounts
  { email: 'responder@resqbridge.demo', password: 'demo1234',      role: 'responder', name: 'Duty Officer Demo' },
  { email: 'admin@resqbridge.demo',     password: 'demo1234',      role: 'admin',     name: 'Admin Demo' },
  { email: 'reporter@resqbridge.demo',  password: 'demo1234',      role: 'reporter',  name: 'Reporter Demo' },
]

// ─────────────────────────────────────────────
//  Error-code → User-facing message mapper
//  Strictly conforms to Section 8 of specification
// ─────────────────────────────────────────────
const AUTH_ERROR_MESSAGES = {
  'auth/empty-email':            'Please enter your email address.',
  'auth/empty-password':         'Please enter your password.',
  'auth/invalid-email':          'Please enter a valid email address.',
  'auth/invalid-credential':     'Incorrect email or password. Please try again.',
  'auth/wrong-password':         'Incorrect email or password. Please try again.',
  'auth/user-not-found':         'Incorrect email or password. Please try again.',
  'auth/unauthorized-role':      'Your account is not authorized to access this dashboard.',
  'auth/session-expired':        'Your session has expired. Please sign in again.',
  'auth/network-request-failed': 'Unable to connect. Check your internet connection and try again.',
  'auth/google-not-configured':  'Google sign-in is not configured correctly. Please try another sign-in method or contact the administrator.',
  'auth/popup-closed':           'Google Sign-In was cancelled — popup closed.',
  'auth/popup-blocked':          'Google Sign-In popup was blocked by browser. Please enable popups.',
  'auth/email-already-in-use':   'An account with this email already exists. Try signing in instead.',
  'auth/weak-password':          'Password must be at least 8 characters.',
  'auth/passwords-do-not-match': 'Passwords do not match. Please verify.',
  'auth/field-required':         'Please fill in all required fields.',
  'auth/unknown':                'Something went wrong. Please try again.',
}

function getAuthErrorMessage(code) {
  return AUTH_ERROR_MESSAGES[code] || AUTH_ERROR_MESSAGES['auth/unknown']
}

// ─────────────────────────────────────────────
//  Google OAuth Client ID from .env
// ─────────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '173281284093-bdplsnv0f5pgbks5enss0b8mf8fegpup.apps.googleusercontent.com'

async function signInWithGoogle() {
  if (!GOOGLE_CLIENT_ID) {
    throw { code: 'auth/google-not-configured' }
  }

  // Check if Google Identity Services script is loaded
  if (!window.google?.accounts) {
    throw { code: 'auth/google-not-configured' }
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const timeoutTimer = setTimeout(() => {
      if (!settled) {
        settled = true
        reject({
          code: 'auth/popup-blocked',
          message: 'Google Sign-In timed out. Please check if pop-ups are allowed or sign in with your email and password.'
        })
      }
    }, 12000)

    const cleanup = () => {
      clearTimeout(timeoutTimer)
      settled = true
    }

    try {
      // If oauth2 client is available, prefer explicit interactive token prompt
      if (window.google.accounts.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            if (settled) return
            cleanup()

            if (tokenResponse.error) {
              const code = tokenResponse.error === 'access_denied' ? 'auth/popup-closed' : 'auth/unknown'
              reject({ code, message: tokenResponse.error_description || tokenResponse.error })
              return
            }

            try {
              // Fetch user profile from Google
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              })
              if (!res.ok) throw new Error('Unable to retrieve user profile from Google')
              const profile = await res.json()
              const userEmail = (profile.email || '').toLowerCase()

              let userRole = 'reporter'
              const knownAccount = AUTHORIZED_ACCOUNTS.find(a => a.email.toLowerCase() === userEmail)
              if (knownAccount) {
                userRole = knownAccount.role
              } else if (userEmail.includes('admin') || userEmail.endsWith('@resqbridge.gov')) {
                userRole = userEmail.includes('admin') ? 'admin' : 'responder'
              }

              resolve({
                email: profile.email,
                name: profile.name || profile.given_name || profile.email.split('@')[0],
                googleId: profile.sub,
                picture: profile.picture,
                role: userRole,
                provider: 'google',
              })
            } catch (fetchErr) {
              reject({ code: 'auth/network-request-failed', message: fetchErr.message })
            }
          },
          error_callback: (err) => {
            if (settled) return
            cleanup()
            reject({
              code: err.type === 'popup_closed' ? 'auth/popup-closed' : 'auth/popup-blocked',
              message: err.message,
            })
          },
        })

        client.requestAccessToken({ prompt: 'select_account' })
        return
      }

      // Fallback to google.accounts.id
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (settled) return
          cleanup()
          if (response.error) {
            reject({ code: 'auth/popup-closed', message: response.error })
            return
          }
          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]))
            const userEmail = (payload.email || '').toLowerCase()

            let userRole = 'reporter'
            const knownAccount = AUTHORIZED_ACCOUNTS.find(a => a.email.toLowerCase() === userEmail)
            if (knownAccount) {
              userRole = knownAccount.role
            } else if (userEmail.includes('admin') || userEmail.endsWith('@resqbridge.gov')) {
              userRole = userEmail.includes('admin') ? 'admin' : 'responder'
            }

            resolve({
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              googleId: payload.sub,
              picture: payload.picture,
              role: userRole,
              provider: 'google',
            })
          } catch {
            reject({ code: 'auth/unknown' })
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      window.google.accounts.id.prompt((notification) => {
        if (settled) return
        if (notification.isNotDisplayed()) {
          cleanup()
          reject({ code: 'auth/popup-blocked' })
        }
        if (notification.isDismissedMoment()) {
          cleanup()
          reject({ code: 'auth/popup-closed' })
        }
      })
    } catch (initErr) {
      cleanup()
      reject({ code: 'auth/google-not-configured', message: initErr.message })
    }
  })
}

// ─────────────────────────────────────────────
//  Simulated Authentication Operations
// ─────────────────────────────────────────────
async function signIn(email, password) {
  await new Promise(r => setTimeout(r, 700)) // network simulation

  if (!email && !password) throw { code: 'auth/field-required' }
  if (!email) throw { code: 'auth/empty-email' }
  if (!password) throw { code: 'auth/empty-password' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw { code: 'auth/invalid-email' }

  const account = AUTHORIZED_ACCOUNTS.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!account) throw { code: 'auth/invalid-credential' }
  if (account.password !== password) throw { code: 'auth/invalid-credential' }

  return account
}

async function signUp(email, password, confirmPassword, name) {
  await new Promise(r => setTimeout(r, 700))

  if (!email && !password && !name) throw { code: 'auth/field-required' }
  if (!name) throw { code: 'auth/field-required' }
  if (!email) throw { code: 'auth/empty-email' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw { code: 'auth/invalid-email' }
  if (!password) throw { code: 'auth/empty-password' }
  if (password.length < 8) throw { code: 'auth/weak-password' }
  if (password !== confirmPassword) throw { code: 'auth/passwords-do-not-match' }

  const exists = AUTHORIZED_ACCOUNTS.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (exists) throw { code: 'auth/email-already-in-use' }

  // New public sign-ups are strictly registered as Reporter role
  return { email, role: 'reporter', name, provider: 'password' }
}

// ─────────────────────────────────────────────
//  Google Sign-In Button Component
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
      <span>{loading ? 'Connecting to Google…' : 'Continue with Google'}</span>
      {!googleConfigured && !loading && (
        <span className="google-setup-badge">Setup required</span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────
//  Main AuthPage Component
// ─────────────────────────────────────────────
export default function AuthPage() {
  const { login, toast } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  // Identify requested role from URL query or location state
  const queryParams = new URLSearchParams(location.search)
  const requestedRole = queryParams.get('role') || location.state?.requiredRole || null

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const clearFieldError = (field) => setFieldErrors(e => ({ ...e, [field]: null }))

  const getDestinationPath = useCallback((userRole) => {
    // If user arrived from a specific protected page, return there
    const from = location.state?.from
    if (from && from.startsWith('/') && !from.startsWith('//')) {
      return from
    }
    if (userRole === 'admin') return '/coordination'
    if (userRole === 'responder') return '/dashboard'
    return '/my-reports'
  }, [location.state?.from])

  // Client-side field validation
  const validateForm = useCallback(() => {
    const errs = {}
    if (!email.trim()) {
      errs.email = 'Please enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.'
    }

    if (!password) {
      errs.password = 'Please enter your password.'
    } else if (mode === 'signup' && password.length < 8) {
      errs.password = 'Password must be at least 8 characters.'
    }

    if (mode === 'signup') {
      if (!name.trim()) errs.name = 'Full name is required.'
      if (!confirmPw) errs.confirmPw = 'Please confirm your password.'
      else if (password !== confirmPw) errs.confirmPw = 'Passwords do not match.'
    }

    return errs
  }, [email, mode, name, password, confirmPw])

  // Form submit handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (loading) return

    setGlobalError('')
    setFieldErrors({})

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

      // Check if user is authorized for the requested role
      if (requestedRole) {
        if (requestedRole === 'admin' && user.role !== 'admin') {
          throw { code: 'auth/unauthorized-role' }
        }
        if (requestedRole === 'responder' && user.role !== 'responder' && user.role !== 'admin') {
          throw { code: 'auth/unauthorized-role' }
        }
      }

      // Authorization succeeded
      login(user)
      toast(`Welcome, ${user.name}! Authorized as ${user.role.toUpperCase()}.`, 'success')
      navigate(getDestinationPath(user.role))
    } catch (err) {
      const code = err?.code || 'auth/unknown'
      const friendlyMsg = getAuthErrorMessage(code)

      if (code === 'auth/empty-email' || code === 'auth/invalid-email') {
        setFieldErrors(e => ({ ...e, email: friendlyMsg }))
      } else if (code === 'auth/empty-password') {
        setFieldErrors(e => ({ ...e, password: friendlyMsg }))
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setGlobalError(friendlyMsg)
      } else if (code === 'auth/unauthorized-role') {
        setGlobalError(friendlyMsg)
      } else if (code === 'auth/email-already-in-use') {
        setFieldErrors(e => ({ ...e, email: friendlyMsg }))
      } else if (code === 'auth/weak-password') {
        setFieldErrors(e => ({ ...e, password: friendlyMsg }))
      } else if (code === 'auth/passwords-do-not-match') {
        setFieldErrors(e => ({ ...e, confirmPw: friendlyMsg }))
      } else {
        setGlobalError(friendlyMsg)
      }
    } finally {
      setLoading(false)
    }
  }, [loading, mode, email, password, confirmPw, name, login, toast, navigate, validateForm, requestedRole, getDestinationPath])

  // Google Sign-In Handler
  const handleGoogleSignIn = useCallback(async () => {
    if (googleLoading) return
    setGlobalError('')
    setFieldErrors({})
    setGoogleLoading(true)

    try {
      const user = await signInWithGoogle()

      // Authorization verification
      if (requestedRole) {
        if (requestedRole === 'admin' && user.role !== 'admin') {
          throw { code: 'auth/unauthorized-role' }
        }
        if (requestedRole === 'responder' && user.role !== 'responder' && user.role !== 'admin') {
          throw { code: 'auth/unauthorized-role' }
        }
      }

      login(user)
      toast(`Signed in with Google. Welcome, ${user.name}!`, 'success')
      navigate(getDestinationPath(user.role))
    } catch (err) {
      const code = err?.code || 'auth/unknown'
      const friendlyMsg = getAuthErrorMessage(code)
      if (code !== 'auth/popup-closed') {
        setGlobalError(friendlyMsg)
      }
    } finally {
      setGoogleLoading(false)
    }
  }, [googleLoading, login, toast, navigate, requestedRole, getDestinationPath])

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
        {/* Back Link to Role Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            <ArrowLeft size={15} /> Return to Role Selection
          </Link>
        </div>

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon"><Shield size={22} fill="white" /></div>
          <span className="auth-logo-text">RESQ<span style={{ color: 'var(--clr-primary)' }}>BRIDGE</span></span>
        </div>

        {/* Requested Role Badge */}
        {requestedRole && (
          <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            <span className={`badge ${requestedRole === 'admin' ? 'badge-purple' : requestedRole === 'responder' ? 'badge-blue' : 'badge-orange'}`}>
              <Lock size={11} style={{ marginRight: '4px' }} />
              {requestedRole === 'admin' ? 'Administrator Console' : requestedRole === 'responder' ? 'Responder Console' : 'Reporter Account'}
            </span>
          </div>
        )}

        <h1 className="auth-title">
          {mode === 'login'
            ? requestedRole === 'admin'
              ? 'Sign in to Admin Console'
              : requestedRole === 'responder'
                ? 'Sign in to Responder Console'
                : requestedRole === 'reporter'
                  ? 'Sign in to Reporter Portal'
                  : 'Sign in to RESQBRIDGE'
            : 'Create Account'
          }
        </h1>
        <p className="auth-subtitle">
          {requestedRole === 'admin'
            ? 'Authorized access for system administrators only'
            : requestedRole === 'responder'
              ? 'Authorized access for emergency response personnel only'
              : requestedRole === 'reporter'
                ? 'Sign in to track your submitted reports and receive incident updates'
                : 'Sign in to access the RESQBRIDGE emergency response system'}
        </p>

        {/* Emergency Bar */}
        <div className="alert alert-emergency auth-emergency">
          <Phone size={14} className="alert-icon" />
          <span style={{ fontSize: '0.8rem' }}>
            <strong>Active Emergency?</strong> Call <a href="tel:112" style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>112</a> immediately.
          </span>
        </div>

        {/* Reporter Quick Notice */}
        {requestedRole === 'reporter' && (
          <div className="alert alert-info" style={{ marginBottom: '1.25rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Anonymous reporting does not require an account.</span>
            <Link to="/report" className="btn btn-accent btn-sm">Report Now</Link>
          </div>
        )}

        {/* Google Sign-In */}
        <GoogleButton
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          disabled={isAnyLoading}
        />

        {/* Divider */}
        <div className="auth-divider">
          <span>or sign in with agency credentials</span>
        </div>

        {/* Global Error Banner */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate aria-label={mode === 'login' ? 'Sign in form' : 'Create account form'}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full Name *</label>
              <input
                id="auth-name"
                className={`form-input ${fieldErrors.name ? 'input-error' : ''}`}
                type="text"
                placeholder="Officer / Citizen Full Name"
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
            <label className="form-label" htmlFor="auth-email">Agency or Personal Email *</label>
            <input
              id="auth-email"
              className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
              type="email"
              placeholder="name@resqbridge.gov"
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
                placeholder="Enter password"
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

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-full auth-submit"
            disabled={isAnyLoading}
            aria-busy={loading}
          >
            {loading
              ? <><Loader2 size={16} className="spin" aria-hidden="true" /> Authenticating…</>
              : mode === 'login'
                ? <><LogIn size={16} /> Sign In</>
                : <><UserPlus size={16} /> Create Account</>
            }
          </button>
        </form>

        {/* Switch mode */}
        <div className="auth-switch">
          {mode === 'login' ? (
            <span>Don't have an account? <button className="auth-link" onClick={switchMode}>Create Reporter Account</button></span>
          ) : (
            <span>Already have an authorized account? <button className="auth-link" onClick={switchMode}>Sign In</button></span>
          )}
        </div>
      </div>
    </div>
  )
}
