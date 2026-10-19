// ============================================================
// RESQBRIDGE — Global App State (React Context)
// ============================================================
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

// ---- localStorage helpers (media blobs can't be serialized — skip them) ----
function saveToStorage(state) {
  try {
    const saveable = {
      ...state,
      reports: state.reports.map(r => ({
        ...r,
        media: r.media?.map(m => ({ ...m, url: '', blob: null })) ?? []
      }))
    }
    localStorage.setItem('resqbridge_state', JSON.stringify(saveable))
  } catch { /* quota exceeded or private mode — silently ignore */ }
}

function loadFromStorage(defaults) {
  try {
    const raw = localStorage.getItem('resqbridge_state')
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch { return defaults }
}

const AppContext = createContext(null)

// ---- Initial state ----
const initialState = {
  // Toast notifications
  toasts: [],

  // All incident reports (demo store — replace with API)
  reports: [
    {
      id: 'RB-2024-001',
      reportedAt: new Date(Date.now() - 25 * 60000).toISOString(),
      category: 'medical',
      subCategory: 'Collapse / Unconscious',
      urgency: 'critical',
      description: 'Person collapsed near the main gate entrance, not responding to verbal commands. Bystanders present.',
      location: { lat: 28.6139, lng: 77.2090, address: 'Main Gate, Block A', landmark: 'Near security booth', floor: 'Ground', room: '' },
      status: 'under_review',
      reporter: { name: 'Witness', anonymous: false, contact: '9876543210' },
      media: [],
      aiSummary: 'A person has collapsed near the main gate (Block A). They are unresponsive to verbal stimuli. Multiple bystanders are present. Immediate medical attention required.',
      aiCategory: 'medical',
      aiUrgency: 'critical',
      aiConfidence: 0.91,
      reviewNotes: [],
      assignedTo: null,
      agencies: { police: 'notified', ambulance: 'notified', fire: null, disaster: null },
      timeline: [
        { at: new Date(Date.now() - 25 * 60000).toISOString(), event: 'Report submitted', by: 'Reporter' },
        { at: new Date(Date.now() - 22 * 60000).toISOString(), event: 'AI triage completed — Critical / Medical', by: 'System (AI)' },
        { at: new Date(Date.now() - 20 * 60000).toISOString(), event: 'Assigned to Duty Officer', by: 'Desk-1' },
      ]
    },
    {
      id: 'RB-2024-002',
      reportedAt: new Date(Date.now() - 90 * 60000).toISOString(),
      category: 'fire',
      subCategory: 'Smoke Detected',
      urgency: 'high',
      description: 'Smoke coming from inside the electrical room on 3rd floor, Block C. No visible flames yet but smell of burning plastic.',
      location: { lat: 28.6145, lng: 77.2095, address: 'Block C, 3rd Floor', landmark: 'Near elevator lobby', floor: '3rd', room: 'Electrical Room 3C-08' },
      status: 'resolved',
      reporter: { name: 'Riya Sharma', anonymous: false, contact: '9812345678' },
      media: [],
      aiSummary: 'Smoke reported in electrical room 3C-08, Block C, 3rd floor. Burning plastic smell suggests possible electrical fault. No confirmed flames. Immediate fire safety check recommended.',
      aiCategory: 'fire',
      aiUrgency: 'high',
      aiConfidence: 0.87,
      reviewNotes: ['Fire team investigated. Faulty UPS unit identified and isolated. No fire, smoke ventilated.'],
      assignedTo: 'Fire Safety Team',
      agencies: { police: null, ambulance: null, fire: 'notified', disaster: null },
      timeline: [
        { at: new Date(Date.now() - 90 * 60000).toISOString(), event: 'Report submitted', by: 'Riya Sharma' },
        { at: new Date(Date.now() - 87 * 60000).toISOString(), event: 'AI triage — High / Fire', by: 'System (AI)' },
        { at: new Date(Date.now() - 85 * 60000).toISOString(), event: 'Fire Safety Team dispatched', by: 'Desk-1' },
        { at: new Date(Date.now() - 60 * 60000).toISOString(), event: 'Resolved — Faulty UPS isolated', by: 'Fire Safety Team' },
      ]
    },
    {
      id: 'RB-2024-003',
      reportedAt: new Date(Date.now() - 10 * 60000).toISOString(),
      category: 'security',
      subCategory: 'Suspicious Activity',
      urgency: 'medium',
      description: 'Unknown person seen loitering near the parking lot for over 30 minutes, looking into vehicles. No ID badge visible.',
      location: { lat: 28.6130, lng: 77.2085, address: 'Parking Lot B', landmark: 'South entrance near gate 4', floor: 'Ground', room: '' },
      status: 'submitted',
      reporter: { name: 'Anonymous', anonymous: true, contact: '' },
      media: [],
      aiSummary: 'Anonymous report of an unidentified individual loitering near Parking Lot B (south entrance, Gate 4) for approximately 30 minutes. Subject observed looking into parked vehicles. No ID badge visible.',
      aiCategory: 'security',
      aiUrgency: 'medium',
      aiConfidence: 0.78,
      reviewNotes: [],
      assignedTo: null,
      agencies: { police: null, ambulance: null, fire: null, disaster: null },
      timeline: [
        { at: new Date(Date.now() - 10 * 60000).toISOString(), event: 'Report submitted (anonymous)', by: 'Reporter' },
        { at: new Date(Date.now() - 8 * 60000).toISOString(), event: 'AI triage — Medium / Security', by: 'System (AI)' },
      ]
    }
  ],

  // Authentication & Role
  isAuthenticated: false,
  currentUser: null, // { email, name, role, provider }
  userRole: 'reporter', // 'reporter' | 'responder' | 'admin'
  userName: 'Guest',
}

// ---- Reducer ----
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: Date.now(), ...action.payload }] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }

    case 'ADD_REPORT': {
      const reportId = action.payload.id || `RB-2024-${String(state.reports.length + 1).padStart(3, '0')}`
      const report = { ...action.payload, id: reportId }
      return { ...state, reports: [report, ...state.reports] }
    }
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(r => r.id === action.id ? { ...r, ...action.payload } : r)
      }
    case 'ADD_TIMELINE_EVENT':
      return {
        ...state,
        reports: state.reports.map(r => r.id === action.id
          ? { ...r, timeline: [...r.timeline, { at: new Date().toISOString(), ...action.event }] }
          : r
        )
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        currentUser: action.user,
        userRole: action.user.role,
        userName: action.user.name || action.user.email.split('@')[0],
      }
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        currentUser: null,
        userRole: 'reporter',
        userName: 'Guest',
      }
    case 'SET_ROLE':
      return { ...state, userRole: action.role, userName: action.name || state.userName }
    case 'SET_USER_NAME':
      return { ...state, userName: action.name }

    default:
      return state
  }
}

// ---- Provider ----
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, loadFromStorage(initialState))

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), duration)
  }, [])

  const addReport = useCallback((report) => {
    dispatch({ type: 'ADD_REPORT', payload: report })
  }, [])

  const updateReport = useCallback((id, payload) => {
    dispatch({ type: 'UPDATE_REPORT', id, payload })
  }, [])

  const addTimeline = useCallback((id, event) => {
    dispatch({ type: 'ADD_TIMELINE_EVENT', id, event })
  }, [])

  const setRole = useCallback((role, name) => {
    dispatch({ type: 'SET_ROLE', role, name })
  }, [])

  const login = useCallback((user) => {
    dispatch({ type: 'LOGIN_SUCCESS', user })
  }, [])

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' })
  }, [])

  // Persist state to localStorage whenever it changes
  useEffect(() => { saveToStorage(state) }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch, toast, addReport, updateReport, addTimeline, setRole, login, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

// ---- Helpers ----
export const CATEGORIES = [
  { id: 'medical',   label: 'Medical Emergency', icon: '🏥', color: 'red',    sub: ['Collapse / Unconscious','Cardiac Arrest','Breathing Difficulty','Severe Bleeding','Seizure','Allergic Reaction','Other Medical'] },
  { id: 'fire',      label: 'Fire & Smoke',       icon: '🔥', color: 'orange', sub: ['Smoke Detected','Small Fire','Large Fire','Gas Leak','Electrical Fault','Other Fire'] },
  { id: 'security',  label: 'Security Threat',    icon: '🚨', color: 'purple', sub: ['Suspicious Activity','Theft','Assault','Unauthorized Access','Vandalism','Threat/Intimidation','Other Security'] },
  { id: 'accident',  label: 'Accident',           icon: '⚠️', color: 'yellow', sub: ['Road Accident','Fall/Injury','Workplace Accident','Flood/Water Damage','Building Damage','Other Accident'] },
  { id: 'disaster',  label: 'Natural Disaster',   icon: '🌊', color: 'blue',   sub: ['Flood','Earthquake','Storm Damage','Landslide','Other Disaster'] },
  { id: 'other',     label: 'Other',              icon: '📋', color: 'gray',   sub: ['Utility Failure','Crowd Disturbance','Lost Person','Animal Emergency','Other'] },
]

export const AGENCIES = [
  { id: 'police',    label: 'Police',            number: '100', icon: '👮' },
  { id: 'ambulance', label: 'Ambulance',         number: '108', icon: '🚑' },
  { id: 'fire',      label: 'Fire Brigade',      number: '101', icon: '🚒' },
  { id: 'disaster',  label: 'NDRF / Disaster',   number: '1078', icon: '⛑️' },
]

export const URGENCY_LEVELS = [
  { id: 'critical', label: 'Critical',  color: 'red',    desc: 'Life-threatening, immediate help needed' },
  { id: 'high',     label: 'High',      color: 'orange', desc: 'Serious, requires rapid response' },
  { id: 'medium',   label: 'Medium',    color: 'yellow', desc: 'Significant but not immediately life-threatening' },
  { id: 'low',      label: 'Low',       color: 'green',  desc: 'Non-urgent, needs attention when possible' },
]

export const STATUS_LABELS = {
  submitted:    { label: 'Submitted',    color: 'blue',   desc: 'Received by RESQBRIDGE, awaiting review' },
  under_review: { label: 'Under Review', color: 'yellow', desc: 'Being reviewed by an authorized responder' },
  assigned:     { label: 'Assigned',     color: 'purple', desc: 'Assigned to a response team' },
  in_progress:  { label: 'In Progress',  color: 'orange', desc: 'Response team is on-site or acting' },
  resolved:     { label: 'Resolved',     color: 'green',  desc: 'Incident closed and documented' },
  false_alarm:  { label: 'False Alarm',  color: 'gray',   desc: 'Investigated, no incident confirmed' },
  escalated:    { label: 'Escalated',    color: 'red',    desc: 'Escalated to higher authority or external agency' },
}

export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function getCategoryMeta(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[5]
}

export function getUrgencyColor(urgency) {
  const map = { critical: 'red', high: 'orange', medium: 'yellow', low: 'green' }
  return map[urgency] || 'gray'
}
