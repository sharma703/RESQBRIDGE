import { useState, useRef, useCallback, useEffect } from 'react'
import {
  AlertTriangle, Mic, MicOff, Camera, X, MapPin, ChevronRight, ChevronLeft,
  Send, Phone, CheckCircle, Upload, Video, Loader2, Info, ChevronDown
} from 'lucide-react'
import { useApp, CATEGORIES, AGENCIES, URGENCY_LEVELS } from '../store.jsx'
import './ReportPage.css'

// ---- Voice language options ----
const VOICE_LANGS = [
  { code: 'en-IN', label: 'EN (India)',  flag: '🇮🇳' },
  { code: 'en-US', label: 'EN (US)',     flag: '🇺🇸' },
  { code: 'hi-IN', label: 'हिन्दी',      flag: '🇮🇳' },
]

/**
 * Custom language dropdown — fully styled for RESQBRIDGE dark theme.
 * Native <select> options cannot be reliably styled on Windows/Mac;
 * a custom listbox avoids clipping, contrast, and option-visibility bugs.
 */
function VoiceLangDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = VOICE_LANGS.find(l => l.code === value) || VOICE_LANGS[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const select = (code) => { onChange(code); setOpen(false) }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false) }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) setOpen(p => !p) }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = VOICE_LANGS.findIndex(l => l.code === value)
      select(VOICE_LANGS[(idx + 1) % VOICE_LANGS.length].code)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = VOICE_LANGS.findIndex(l => l.code === value)
      select(VOICE_LANGS[(idx - 1 + VOICE_LANGS.length) % VOICE_LANGS.length].code)
    }
  }

  return (
    <div ref={ref} className="voice-lang-dropdown" role="combobox" aria-expanded={open} aria-haspopup="listbox">
      <button
        type="button"
        className={`voice-lang-trigger${disabled ? ' disabled' : ''}`}
        onClick={() => !disabled && setOpen(p => !p)}
        onKeyDown={handleKeyDown}
        aria-label={`Voice language: ${selected.label}`}
        aria-disabled={disabled}
        tabIndex={0}
      >
        <span className="voice-lang-flag">{selected.flag}</span>
        <span className="voice-lang-label">{selected.label}</span>
        <ChevronDown size={10} className={`voice-lang-arrow${open ? ' open' : ''}`} />
      </button>
      {open && (
        <ul className="voice-lang-menu" role="listbox" aria-label="Select voice language">
          {VOICE_LANGS.map(lang => (
            <li
              key={lang.code}
              role="option"
              aria-selected={lang.code === value}
              className={`voice-lang-option${lang.code === value ? ' selected' : ''}`}
              onClick={() => select(lang.code)}
              onKeyDown={(e) => { if (e.key === 'Enter') select(lang.code) }}
              tabIndex={0}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === value && <CheckCircle size={12} className="voice-lang-check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Step names ----
const STEPS = ['incident', 'location', 'media', 'services', 'review']
const STEP_LABELS = ['Incident', 'Location', 'Media', 'Services', 'Review']

function generateAISummary(f, loc) {
  const cat = CATEGORIES.find(c => c.id === f.category)
  const locStr = [loc.address, loc.landmark, loc.floor && `Floor: ${loc.floor}`, loc.room].filter(Boolean).join(', ')
  return `[AI SIMULATED] ${cat?.label || 'Incident'} reported${locStr ? ` at ${locStr}` : ''}. Description: ${f.description.substring(0, 120)}${f.description.length > 120 ? '...' : ''} AI-suggested urgency: ${f.urgency || 'medium'}.`
}

export default function ReportPage() {
  const { addReport, toast, state } = useApp()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  // Form data
  const [form, setForm] = useState({
    category: '',
    subCategory: '',
    urgency: '',
    description: '',
    reporterName: '',
    reporterContact: '',
    anonymous: false,
  })
  const [errors, setErrors] = useState({})

  // Location state
  const [location, setLocation] = useState({
    lat: null, lng: null, address: '', landmark: '', floor: '', room: '',
    accuracy: null, loading: false, error: null, manual: false
  })

  // Media state
  const [mediaItems, setMediaItems] = useState([])   // { type, url, blob, name }
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraMode, setCameraMode] = useState('photo') // 'photo' | 'video'
  const [recording, setRecording] = useState(false)

  // Voice
  // voiceSupported is stable — initialized once from window check, never re-computed
  const [voiceListening, setVoiceListening] = useState(false)
  const [voiceSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition))
  const [voiceStatus, setVoiceStatus]       = useState(() =>
    (window.SpeechRecognition || window.webkitSpeechRecognition) ? null : 'unsupported'
  )
  const [voiceLang, setVoiceLang]           = useState('en-IN')
  const [voiceInterim, setVoiceInterim]     = useState('') // live interim transcript preview
  const recognitionRef = useRef(null)
  const voiceGotResultRef = useRef(false)   // tracks whether we received any speech result

  // Camera refs
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef   = useRef([])

  // Selected agencies
  const [selectedAgencies, setSelectedAgencies] = useState([])

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      // Abort any active recognition session when component unmounts
      try { recognitionRef.current?.abort() } catch { /* ignore abort errors */ }
      recognitionRef.current = null
    }
  }, [])

  // ---- GPS ----
  const getGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(l => ({ ...l, error: 'Geolocation is not supported by your browser.' }))
      return
    }
    setLocation(l => ({ ...l, loading: true, error: null }))
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation(l => ({
          ...l,
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
          accuracy: Math.round(pos.coords.accuracy),
          loading: false,
          address: l.address || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        }))
        toast('Location captured', 'success')
      },
      err => {
        const msg = err.code === 1 ? 'Location permission denied. Enter manually below.' :
                    err.code === 2 ? 'Location unavailable. Enter manually below.' :
                    'Location timed out. Enter manually below.'
        setLocation(l => ({ ...l, loading: false, error: msg }))
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [toast])

  // ---- Voice input ----
  // Error code → UI metadata is defined inline in the JSX below (VOICE_UI object)
  // This avoids a declared-but-unused variable while keeping messages co-located with the UI.

  const stopVoice = useCallback(() => {
    try { recognitionRef.current?.abort() } catch { /* ignore */ }
    recognitionRef.current = null
    setVoiceListening(false)
    setVoiceInterim('')
    setVoiceStatus(null)
  }, [])

  const toggleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setVoiceStatus('unsupported')
      return
    }

    // Stop if already listening
    if (voiceListening) {
      stopVoice()
      return
    }

    // Prevent overlapping sessions — abort any existing recognition first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    const rec = new SR()
    rec.lang = voiceLang
    rec.interimResults = true
    rec.continuous = true           // Keep listening until user clicks Stop
    rec.maxAlternatives = 1

    voiceGotResultRef.current = false  // Reset for this session

    rec.onstart = () => {
      setVoiceListening(true)
      setVoiceStatus('listening')
    }

    rec.onresult = (e) => {
      voiceGotResultRef.current = true
      // ─── DUPLICATION FIX ───────────────────────────────────────────────
      // e.results is a cumulative list — it contains ALL results, including
      // those already appended in previous events. e.resultIndex is the
      // index of the first NEW result in this event. Only process from there
      // to avoid re-appending text that was already finalized.
      let interim = ''
      let newFinals = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          newFinals += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      // Append only newly finalized text; show live interim separately
      if (newFinals.trim()) {
        setForm(f => ({
          ...f,
          description: f.description
            ? f.description.trimEnd() + ' ' + newFinals.trim()
            : newFinals.trim()
        }))
        setVoiceInterim('')
      } else {
        setVoiceInterim(interim)
      }
    }

    rec.onerror = (e) => {
      const errCode = e.error
      setVoiceInterim('')

      if (errCode === 'aborted') {
        setVoiceListening(false)
        setVoiceStatus(null)
        return
      }
      if (errCode === 'language-not-supported') {
        setVoiceLang('en-US')
      }
      setVoiceListening(false)
      setVoiceStatus(errCode)
    }

    rec.onend = () => {
      setVoiceListening(false)
      setVoiceInterim('')
      // Only clear 'listening' status if we got a result; otherwise preserve the error code
      // that onerror set (e.g. 'no-speech')
      setVoiceStatus(prev => {
        if (prev === 'listening') return null   // Clean end with speech received
        return prev                             // Keep error status
      })
    }

    recognitionRef.current = rec
    try {
      rec.start()
    } catch {
      setVoiceListening(false)
      setVoiceStatus('audio-capture')
    }
  }, [voiceListening, voiceLang, stopVoice])

  // ---- Camera ----
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: cameraMode === 'video' })
      streamRef.current = stream
      setCameraOpen(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 100)
    } catch (e) {
      toast(e.name === 'NotAllowedError' ? 'Camera permission denied.' : `Camera error: ${e.message}`, 'error')
    }
  }, [cameraMode, toast])

  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOpen(false)
    setRecording(false)
  }, [])

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current
    const video  = videoRef.current
    if (!canvas || !video) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      setMediaItems(m => [...m, { type: 'photo', url, blob, name: `photo-${Date.now()}.jpg` }])
      closeCamera()
      toast('Photo captured', 'success')
    }, 'image/jpeg', 0.9)
  }, [closeCamera, toast])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    chunksRef.current = []
    const mr = new MediaRecorder(streamRef.current)
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url  = URL.createObjectURL(blob)
      setMediaItems(m => [...m, { type: 'video', url, blob, name: `video-${Date.now()}.webm` }])
      closeCamera()
      toast('Video saved', 'success')
    }
    recorderRef.current = mr
    mr.start()
    setRecording(true)
  }, [closeCamera, toast])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
    setRecording(false)
  }, [])

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      const type = file.type.startsWith('video') ? 'video' : 'photo'
      setMediaItems(m => [...m, { type, url, blob: file, name: file.name }])
    })
    toast(`${files.length} file(s) added`, 'success')
  }, [toast])

  const removeMedia = useCallback((idx) => {
    setMediaItems(m => m.filter((_, i) => i !== idx))
  }, [])

  // ---- Validation ----
  const validateName = (name) => {
    if (!name) return null                          // Optional — blank is fine
    const trimmed = name.trim()
    if (!trimmed) return 'Name cannot be only spaces.'
    if (/^[0-9]+$/.test(trimmed)) return 'Enter a valid name, not just numbers.'
    // Allow letters (including Unicode/Devanagari), spaces, hyphens, apostrophes, periods
    if (!/^[\p{L}\s'\-.]+$/u.test(trimmed)) return 'Name contains invalid characters.'
    if (trimmed.length < 2) return 'Name is too short.'
    if (trimmed.length > 80) return 'Name is too long.'
    return null
  }

  const validateContact = (contact) => {
    if (!contact) return null                       // Optional — blank is fine
    const digits = contact.replace(/\s/g, '')       // Strip spaces (handles pasted input)
    if (!/^[0-9]+$/.test(digits)) return 'Enter digits only — no letters or symbols.'
    if (digits.length < 10) return `Enter a valid 10-digit mobile number (${digits.length} digits entered).`
    if (digits.length > 10) return `Mobile number must be exactly 10 digits (${digits.length} entered).`
    return null
  }

  const validate = useCallback((s) => {
    const e = {}
    if (s === 0) {
      if (!form.category)    e.category    = 'Select a category'
      if (!form.subCategory) e.subCategory = 'Select a sub-category'
      if (!form.description || form.description.trim().length < 10)
        e.description = 'Please describe the incident (at least 10 characters)'

      // Name & contact only validated when not anonymous and user has entered something
      if (!form.anonymous) {
        const nameErr = validateName(form.reporterName)
        if (nameErr) e.reporterName = nameErr

        const contactErr = validateContact(form.reporterContact)
        if (contactErr) e.reporterContact = contactErr
      }
    }
    if (s === 1) {
      if (!location.lat && !location.address)
        e.location = 'Please capture GPS location or enter an address manually'
    }
    return e
  }, [form, location])

  const next = () => {
    const e = validate(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep(s => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const prev = () => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // ---- Submit ----
  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1800)) // Simulate network
    const nowIso = new Date().toISOString()
    const report = {
      reportedAt: nowIso,
      category: form.category,
      subCategory: form.subCategory,
      urgency: form.urgency || 'medium',
      description: form.description,
      location: {
        lat: location.lat, lng: location.lng,
        address: location.address, landmark: location.landmark,
        floor: location.floor, room: location.room
      },
      status: 'submitted',
      reporter: {
        name: form.anonymous ? 'Anonymous' : (form.reporterName || state.userName),
        anonymous: form.anonymous,
        contact: form.anonymous ? '' : form.reporterContact
      },
      media: mediaItems.map(m => ({ type: m.type, url: m.url, name: m.name })),
      aiSummary: generateAISummary(form, location),
      aiCategory: form.category,
      aiUrgency: form.urgency || 'medium',
      aiConfidence: 0.82,
      reviewNotes: [],
      assignedTo: null,
      agencies: Object.fromEntries(AGENCIES.map(a => [a.id, selectedAgencies.includes(a.id) ? 'pending' : null])),
      timeline: [
        { at: nowIso, event: 'Report submitted', by: form.anonymous ? 'Anonymous' : (form.reporterName || state.userName) },
        { at: nowIso, event: `AI triage — ${form.urgency || 'Medium'} / ${form.category}`, by: 'System (AI) [SIMULATED]' },
      ]
    }
    addReport(report)
    setSubmitted(report)
    setSubmitting(false)
  }, [addReport, form, location, mediaItems, selectedAgencies, state.userName])

  if (submitted) return <SubmitSuccess report={submitted} onNew={() => { setSubmitted(null); setStep(0); setForm({ category:'',subCategory:'',urgency:'',description:'',reporterName:'',reporterContact:'',anonymous:false }); setLocation({ lat:null,lng:null,address:'',landmark:'',floor:'',room:'',accuracy:null,loading:false,error:null,manual:false }); setMediaItems([]); setSelectedAgencies([]) }} />

  return (
    <div className="page report-page">
      <div className="container-sm" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Emergency bar */}
        <div className="alert alert-emergency" style={{ marginBottom: '1.5rem' }}>
          <Phone size={18} className="alert-icon" />
          <span><strong>In immediate danger? Call <a href="tel:112" style={{ color: 'var(--clr-primary)' }}>112</a> now.</strong> Do not wait for this form. RESQBRIDGE is not an emergency service.</span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-head)', marginBottom: '0.25rem' }}>Report an Incident</h1>
        <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
          Step {step + 1} of {STEPS.length} — {STEP_LABELS[step]}
        </p>

        {/* Step indicator */}
        <div className="step-indicator">
          {STEPS.map((s, i) => (
            <div key={s} className="step-item">
              <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`step-line${i < step ? ' done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* ---- Step 0: Incident ---- */}
        {step === 0 && (
          <div className="report-step fade-up">
            <h2 className="step-title">What happened?</h2>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Incident Category *</label>
              <div className="category-grid">
                {CATEGORIES.map(cat => (
                  <button key={cat.id}
                    className={`category-btn ${form.category === cat.id ? 'selected' : ''} cat-${cat.color}`}
                    onClick={() => setForm(f => ({ ...f, category: cat.id, subCategory: '' }))}
                    type="button"
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-label">{cat.label}</span>
                  </button>
                ))}
              </div>
              {errors.category && <div className="form-error"><Info size={12} /> {errors.category}</div>}
            </div>

            {/* Sub-category */}
            {form.category && (
              <div className="form-group">
                <label className="form-label">Sub-Category *</label>
                <select className="form-select" value={form.subCategory}
                  onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))}>
                  <option value="">Select a sub-category…</option>
                  {CATEGORIES.find(c => c.id === form.category)?.sub.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.subCategory && <div className="form-error"><Info size={12} /> {errors.subCategory}</div>}
              </div>
            )}

            {/* Urgency */}
            <div className="form-group">
              <label className="form-label">Urgency Level (optional — AI will suggest)</label>
              <div className="urgency-row">
                {URGENCY_LEVELS.map(u => (
                  <button key={u.id} type="button"
                    className={`urgency-btn urgency-${u.color} ${form.urgency === u.id ? 'selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, urgency: f.urgency === u.id ? '' : u.id }))}>
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
                <span>Describe what you see *</span>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem' }}>
                  {voiceSupported ? (
                    <>
                      {/* Custom language dropdown — readable in dark theme */}
                      <VoiceLangDropdown
                        value={voiceLang}
                        onChange={(code) => {
                          // Stop active session before changing language
                          if (voiceListening) stopVoice()
                          setVoiceLang(code)
                          setVoiceStatus(null)
                        }}
                        disabled={voiceListening}
                      />
                      {/* Mic toggle */}
                      <button
                        type="button"
                        className={`voice-btn ${voiceListening ? 'listening' : ''}`}
                        onClick={() => { setVoiceStatus(null); toggleVoice() }}
                        title={voiceListening ? 'Stop voice input' : 'Start voice input'}
                        aria-label={voiceListening ? 'Stop voice input' : 'Start voice input'}
                        aria-pressed={voiceListening}
                      >
                        {voiceListening ? <MicOff size={14} /> : <Mic size={14} />}
                        {voiceListening ? 'Stop' : 'Voice'}
                      </button>
                    </>
                  ) : (
                    <span className="voice-unsupported" title="Voice input requires Chrome or Edge">
                      <MicOff size={13} /> Voice unavailable
                    </span>
                  )}
                </div>
              </label>
              <textarea className="form-textarea" style={{ minHeight: 130 }}
                placeholder="Describe what you see — who is involved, visible injuries, number of people, hazards, and anything a responder needs to know. Stay safe while reporting."
                value={form.description}
                onChange={e => {
                  setForm(f => ({ ...f, description: e.target.value }))
                  setVoiceInterim('')   // Clear interim preview when user edits manually
                }}
              />

              {/* Voice status feedback */}
              {voiceListening && (
                <div className="voice-active" role="status" aria-live="polite">
                  <span className="pulse-dot" style={{ color: 'var(--clr-primary)' }} />
                  Listening… speak now. Click Stop when done.
                  {voiceInterim && (
                    <span style={{ marginLeft:'0.5rem', color:'var(--clr-text-muted)', fontStyle:'italic', fontSize:'0.8rem' }}>
                      &ldquo;{voiceInterim}&rdquo;
                    </span>
                  )}
                </div>
              )}
              {!voiceListening && voiceStatus && voiceStatus !== 'listening' && (() => {
                const VOICE_UI = {
                  'no-speech':      { icon: '🎙️', msg: 'No speech detected. The microphone did not hear any speech. Make sure your mic is working and try again, or type your report below.', retry: true },
                  'audio-capture':  { icon: '🎤', msg: 'Microphone not available. Check that a mic is connected and not in use by another app.', retry: true },
                  'not-allowed':    { icon: '🔒', msg: 'Microphone permission denied. Click the mic/camera icon in your browser address bar, select Allow, then try again.', retry: true },
                  'network':        { icon: '🌐', msg: 'Speech recognition network error. Check your internet connection and try again.', retry: true },
                  'unsupported':    { icon: '⚠️', msg: 'Voice input requires Chrome or Edge. Please type your report instead.', retry: false },
                  'service-not-allowed': { icon: '⚠️', msg: 'Speech recognition is blocked in this context. Try on HTTPS or allow microphone access.', retry: true },
                  'bad-grammar':    { icon: '⚠️', msg: 'Voice recognition configuration error. Please type your report.', retry: false },
                  'language-not-supported': { icon: '⚠️', msg: 'Selected language not supported by your browser. Switched to English — try again.', retry: true },
                }
                const ui = VOICE_UI[voiceStatus] || { icon: '⚠️', msg: `Voice input encountered an issue (${voiceStatus}). Please type your report.`, retry: true }
                return (
                  <div className="voice-error-panel" role="alert" aria-live="assertive">
                    <span style={{ fontSize:'1rem' }}>{ui.icon}</span>
                    <span style={{ flex:1, fontSize:'0.825rem', lineHeight:1.5 }}>{ui.msg}</span>
                    {ui.retry && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setVoiceStatus(null); toggleVoice() }}>
                        <Mic size={13} /> Retry
                      </button>
                    )}
                    <button type="button" className="btn-icon" onClick={() => setVoiceStatus(null)} aria-label="Dismiss voice error">
                      <X size={13} />
                    </button>
                  </div>
                )
              })()}

              {errors.description && <div className="form-error"><Info size={12} /> {errors.description}</div>}
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-faint)', textAlign: 'right' }}>
                {form.description.length} chars
              </div>
            </div>

            {/* Reporter info */}
            <div className="reporter-section">
              <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                <div className="form-label" style={{ margin: 0 }}>Your details (optional)</div>
                <label className="toggle-label">
                  <input type="checkbox" checked={form.anonymous}
                    onChange={e => {
                      setForm(f => ({ ...f, anonymous: e.target.checked }))
                      // Clear reporter field errors when switching to anonymous
                      setErrors(prev => { const n = {...prev}; delete n.reporterName; delete n.reporterContact; return n })
                    }} />
                  <span>Report anonymously</span>
                </label>
              </div>
              {!form.anonymous && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reporter-name">Your name</label>
                    <input
                      id="reporter-name"
                      className={`form-input ${errors.reporterName ? 'input-error' : ''}`}
                      placeholder="Optional"
                      autoComplete="name"
                      value={form.reporterName}
                      onChange={e => {
                        const val = e.target.value
                        setForm(f => ({ ...f, reporterName: val }))
                        // Live-clear the error once valid
                        if (errors.reporterName) {
                          const err = validateName(val)
                          setErrors(prev => ({ ...prev, reporterName: err || undefined }))
                        }
                      }}
                    />
                    {errors.reporterName && (
                      <div className="form-error" role="alert"><Info size={12} /> {errors.reporterName}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reporter-contact">Contact number</label>
                    <input
                      id="reporter-contact"
                      className={`form-input ${errors.reporterContact ? 'input-error' : ''}`}
                      placeholder="10-digit mobile (optional)"
                      type="tel"
                      inputMode="numeric"
                      maxLength={12}  /* 10 digits + up to 2 spaces */
                      autoComplete="tel"
                      value={form.reporterContact}
                      onChange={e => {
                        const val = e.target.value
                        setForm(f => ({ ...f, reporterContact: val }))
                        // Live-clear the error once valid
                        if (errors.reporterContact) {
                          const err = validateContact(val)
                          setErrors(prev => ({ ...prev, reporterContact: err || undefined }))
                        }
                      }}
                    />
                    {errors.reporterContact && (
                      <div className="form-error" role="alert"><Info size={12} /> {errors.reporterContact}</div>
                    )}
                    {!errors.reporterContact && form.reporterContact && (
                      <div style={{ fontSize:'0.72rem', color:'var(--clr-text-faint)', marginTop:'0.2rem' }}>
                        {form.reporterContact.replace(/\s/g,'').length}/10 digits
                      </div>
                    )}
                  </div>
                </div>
              )}
              {form.anonymous && (
                <div className="alert alert-info" style={{ padding: '0.625rem 0.875rem', fontSize: '0.8rem' }}>
                  <Info size={14} className="alert-icon" />
                  Report is anonymous. Responders may not be able to follow up with you for clarification.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- Step 1: Location ---- */}
        {step === 1 && (
          <div className="report-step fade-up">
            <h2 className="step-title">Where is it happening?</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              GPS is a starting point — add landmarks, floor, and room for precision. Responders need to find the exact spot.
            </p>

            {/* GPS button */}
            <div className="gps-section">
              <button className="btn btn-outline gps-btn" onClick={getGPS} disabled={location.loading} type="button">
                {location.loading ? <Loader2 size={16} className="spin" /> : <MapPin size={16} />}
                {location.loading ? 'Getting location…' : 'Capture GPS Location'}
              </button>
              {location.lat && (
                <div className="gps-result">
                  <CheckCircle size={14} color="var(--clr-green)" />
                  <span>{location.lat}, {location.lng}</span>
                  {location.accuracy && <span className="text-faint">(±{location.accuracy}m)</span>}
                </div>
              )}
              {location.error && (
                <div className="form-error" style={{ marginTop: '0.5rem' }}><Info size={12} /> {location.error}</div>
              )}
            </div>

            {/* Manual fields */}
            <div className="form-group">
              <label className="form-label">Address / Building name *</label>
              <input className="form-input" placeholder="e.g. Block A, Main Building, 45 MG Road…"
                value={location.address}
                onChange={e => setLocation(l => ({ ...l, address: e.target.value }))} />
              {errors.location && <div className="form-error"><Info size={12} /> {errors.location}</div>}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Landmark (helps responders)</label>
                <input className="form-input" placeholder="e.g. Near main gate, opposite ATM"
                  value={location.landmark}
                  onChange={e => setLocation(l => ({ ...l, landmark: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Floor</label>
                <input className="form-input" placeholder="e.g. Ground, 2nd, Basement"
                  value={location.floor}
                  onChange={e => setLocation(l => ({ ...l, floor: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Room / Area details</label>
              <input className="form-input" placeholder="e.g. Room 302, Cafeteria, Parking Lot B"
                value={location.room}
                onChange={e => setLocation(l => ({ ...l, room: e.target.value }))} />
            </div>

            {/* Location preview card */}
            {(location.lat || location.address) && (
              <div className="location-preview">
                <div className="location-preview-head">
                  <MapPin size={16} color="var(--clr-blue)" />
                  <strong>Location Summary</strong>
                </div>
                <div className="location-preview-body">
                  {location.lat && <div><span className="text-muted">GPS:</span> {location.lat}, {location.lng}</div>}
                  {location.address  && <div><span className="text-muted">Address:</span> {location.address}</div>}
                  {location.landmark && <div><span className="text-muted">Landmark:</span> {location.landmark}</div>}
                  {location.floor    && <div><span className="text-muted">Floor:</span> {location.floor}</div>}
                  {location.room     && <div><span className="text-muted">Room:</span> {location.room}</div>}
                </div>
              </div>
            )}

            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              <Info size={16} className="alert-icon" />
              <span style={{ fontSize: '0.825rem' }}>GPS coordinates alone may not be accurate indoors. Always add a landmark, floor, or room to help responders find you quickly.</span>
            </div>
          </div>
        )}

        {/* ---- Step 2: Media ---- */}
        {step === 2 && (
          <div className="report-step fade-up">
            <h2 className="step-title">Add photos or video <span className="badge badge-gray" style={{ fontSize:'0.65rem', verticalAlign:'middle' }}>Optional</span></h2>
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
              <AlertTriangle size={16} className="alert-icon" />
              <span style={{ fontSize: '0.825rem' }}><strong>Safety first.</strong> Only capture media if it is safe to do so. Never approach hazards, enter dangerous areas, or endanger yourself or others. Skip this step if in doubt.</span>
            </div>

            {/* Camera controls */}
            <div className="media-controls">
              <div className="flex gap-1" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button type="button" className={`btn btn-outline btn-sm ${cameraMode === 'photo' ? 'active-mode' : ''}`} onClick={() => setCameraMode('photo')}>
                  <Camera size={14} /> Photo
                </button>
                <button type="button" className={`btn btn-outline btn-sm ${cameraMode === 'video' ? 'active-mode' : ''}`} onClick={() => setCameraMode('video')}>
                  <Video size={14} /> Video
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={openCamera}>
                  <Camera size={14} /> Open Camera
                </button>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={14} /> Upload File
                  <input type="file" accept="image/*,video/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Camera viewfinder */}
            {cameraOpen && (
              <div className="camera-viewfinder">
                <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="camera-controls">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={closeCamera}><X size={16} /> Close</button>
                  {cameraMode === 'photo' ? (
                    <button type="button" className="btn btn-primary" onClick={capturePhoto}><Camera size={16} /> Capture</button>
                  ) : recording ? (
                    <button type="button" className="btn btn-danger" onClick={stopRecording}><X size={16} /> Stop Recording</button>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={startRecording}><Video size={16} /> Start Recording</button>
                  )}
                </div>
                {recording && (
                  <div className="recording-indicator">
                    <span className="pulse-dot" style={{ color: 'var(--clr-primary)' }} /> REC
                  </div>
                )}
              </div>
            )}

            {/* Media grid */}
            {mediaItems.length > 0 && (
              <div className="media-grid">
                {mediaItems.map((m, i) => (
                  <div key={i} className="media-thumb">
                    {m.type === 'photo'
                      ? <img src={m.url} alt={m.name} />
                      : <video src={m.url} controls className="media-video-thumb" />
                    }
                    <button type="button" className="media-remove" onClick={() => removeMedia(i)} aria-label="Remove">
                      <X size={14} />
                    </button>
                    <div className="media-label">{m.type === 'photo' ? '📷' : '🎥'} {m.name.slice(0, 20)}</div>
                  </div>
                ))}
              </div>
            )}

            {mediaItems.length === 0 && !cameraOpen && (
              <div className="media-empty">
                <Camera size={32} color="var(--clr-text-faint)" />
                <p>No media added yet. This step is optional — skip if unsafe.</p>
              </div>
            )}
          </div>
        )}

        {/* ---- Step 3: Services ---- */}
        {step === 3 && (
          <div className="report-step fade-up">
            <h2 className="step-title">Which services should be notified?</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Select relevant services. <strong>Note:</strong> this is a demo — no real agency is contacted. In a real emergency, call 112 directly.
            </p>
            <div className="alert alert-emergency" style={{ marginBottom: '1.5rem' }}>
              <Phone size={16} className="alert-icon" />
              <span style={{ fontSize: '0.825rem' }}>For immediate emergencies: <a href="tel:112" style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>Call 112</a> · Police: 100 · Ambulance: 108 · Fire: 101</span>
            </div>

            <div className="agencies-grid">
              {AGENCIES.map(agency => (
                <button key={agency.id} type="button"
                  className={`agency-card ${selectedAgencies.includes(agency.id) ? 'selected' : ''}`}
                  onClick={() => setSelectedAgencies(a =>
                    a.includes(agency.id) ? a.filter(x => x !== agency.id) : [...a, agency.id]
                  )}>
                  <div className="agency-icon">{agency.icon}</div>
                  <div className="agency-info">
                    <div className="agency-name">{agency.label}</div>
                    <div className="agency-number">{agency.number}</div>
                  </div>
                  <div className={`agency-check ${selectedAgencies.includes(agency.id) ? 'checked' : ''}`}>
                    {selectedAgencies.includes(agency.id) && <CheckCircle size={16} />}
                  </div>
                </button>
              ))}
            </div>

            <div className="alert alert-warning" style={{ marginTop: '1.5rem' }}>
              <Info size={16} className="alert-icon" />
              <span style={{ fontSize: '0.825rem' }}>DEMO ONLY — Selecting agencies here does not contact any real service. Agency notification is simulated for demonstration purposes.</span>
            </div>
          </div>
        )}

        {/* ---- Step 4: Review ---- */}
        {step === 4 && (
          <div className="report-step fade-up">
            <h2 className="step-title">Review before submitting</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Check everything below. AI will analyze the report after submission — you can correct any AI suggestions from the responder view.
            </p>

            <div className="review-card">
              <div className="review-section">
                <div className="review-label">Category</div>
                <div className="flex items-center gap-2">
                  <span>{CATEGORIES.find(c => c.id === form.category)?.icon}</span>
                  <span>{CATEGORIES.find(c => c.id === form.category)?.label}</span>
                  {form.subCategory && <span className="badge badge-gray">{form.subCategory}</span>}
                </div>
              </div>
              <hr className="divider" style={{ margin: '0.875rem 0' }} />

              {form.urgency && (
                <>
                  <div className="review-section">
                    <div className="review-label">Urgency</div>
                    <div className={`badge badge-${URGENCY_LEVELS.find(u => u.id === form.urgency)?.color || 'gray'}`}>
                      {URGENCY_LEVELS.find(u => u.id === form.urgency)?.label}
                    </div>
                  </div>
                  <hr className="divider" style={{ margin: '0.875rem 0' }} />
                </>
              )}

              <div className="review-section">
                <div className="review-label">Description</div>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                  {form.description}
                </div>
              </div>
              <hr className="divider" style={{ margin: '0.875rem 0' }} />

              <div className="review-section">
                <div className="review-label">Location</div>
                <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {location.lat     && <span>📍 GPS: {location.lat}, {location.lng}</span>}
                  {location.address && <span>🏢 {location.address}</span>}
                  {location.landmark && <span>📌 {location.landmark}</span>}
                  {location.floor   && <span>🔢 Floor: {location.floor}</span>}
                  {location.room    && <span>🚪 Room: {location.room}</span>}
                  {!location.lat && !location.address && <span className="text-muted">No location provided</span>}
                </div>
              </div>

              {mediaItems.length > 0 && (
                <>
                  <hr className="divider" style={{ margin: '0.875rem 0' }} />
                  <div className="review-section">
                    <div className="review-label">Media</div>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {mediaItems.map((m, i) => (
                        <div key={i} className="chip">{m.type === 'photo' ? '📷' : '🎥'} {m.name.slice(0,18)}</div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedAgencies.length > 0 && (
                <>
                  <hr className="divider" style={{ margin: '0.875rem 0' }} />
                  <div className="review-section">
                    <div className="review-label">Services (DEMO — not real notifications)</div>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {selectedAgencies.map(id => {
                        const a = AGENCIES.find(ag => ag.id === id)
                        return <div key={id} className="chip">{a?.icon} {a?.label}</div>
                      })}
                    </div>
                  </div>
                </>
              )}

              <hr className="divider" style={{ margin: '0.875rem 0' }} />
              <div className="review-section">
                <div className="review-label">Reporter</div>
                <div style={{ fontSize: '0.875rem' }}>
                  {form.anonymous ? '🔒 Anonymous' : (form.reporterName || state.userName || 'Not provided')}
                  {!form.anonymous && form.reporterContact && ` · ${form.reporterContact}`}
                </div>
              </div>
            </div>

            {/* AI notice */}
            <div className="ai-notice">
              <div className="ai-notice-head">🤖 AI Triage [SIMULATED]</div>
              <div className="ai-notice-body">
                After submission, AI will suggest a summary, category, and urgency level. These are <strong>advisory only</strong> — an authorized human will review and can override any AI suggestion. AI can make mistakes.
              </div>
            </div>
          </div>
        )}

        {/* ---- Navigation buttons ---- */}
        <div className="step-nav">
          {step > 0 && (
            <button type="button" className="btn btn-outline" onClick={prev}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={next}>
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 size={16} className="spin" /> Submitting…</> : <><Send size={16} /> Submit Report</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Success screen ----
function SubmitSuccess({ report, onNew }) {
  const navigate = useNavigate()
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="success-screen fade-up">
        <div className="success-icon"><CheckCircle size={48} /></div>
        <h2>Report Submitted</h2>
        <div className="badge badge-blue" style={{ margin: '0.75rem auto', display: 'inline-flex' }}>Ref: {report.id}</div>
        <p className="text-muted">
          Your report has been received by RESQBRIDGE and is awaiting human review.
          Track its status in <strong>My Reports</strong>.
        </p>
        <div className="alert alert-emergency" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <Phone size={16} className="alert-icon" />
          <span><strong>If you need immediate help, call <a href="tel:112" style={{ color: 'var(--clr-primary)' }}>112</a> now.</strong> This platform does not dispatch emergency services.</span>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/my-reports')}>View My Reports</button>
          <button className="btn btn-outline" onClick={onNew}>Submit Another</button>
        </div>
      </div>
    </div>
  )
}
