import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Filter, Search, Clock, AlertTriangle,
  Eye, User, ChevronDown, Activity, RefreshCw
} from 'lucide-react'
import { useApp, STATUS_LABELS, timeAgo, getCategoryMeta, getUrgencyColor } from '../store.jsx'
import IncidentDetail from '../components/IncidentDetail.jsx'
import './Dashboard.css'

const STATUS_FILTERS = ['all', ...Object.keys(STATUS_LABELS)]
const URGENCY_FILTERS = ['all', 'critical', 'high', 'medium', 'low']

export default function Dashboard() {
  const { state, updateReport, addTimeline, toast } = useApp()
  const { reports, userRole } = state
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('all')
  const [urgencyFilter, setUrgency] = useState('all')
  const [selected, setSelected]     = useState(null)

  if (userRole === 'reporter' || !state.isAuthenticated) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Responder Authorization Required</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: '1.6' }}>
            The emergency incident dashboard is restricted to verified response personnel. Please authenticate with your agency credentials.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth?role=responder" className="btn btn-primary btn-sm">Sign In as Responder</Link>
            <Link to="/" className="btn btn-outline btn-sm">Role Selection</Link>
          </div>
        </div>
      </div>
    )
  }

  const filtered = reports.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.id.toLowerCase().includes(q) &&
          !r.description.toLowerCase().includes(q) &&
          !r.category.toLowerCase().includes(q) &&
          !r.location.address?.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Stats
  const total     = reports.length
  const pending   = reports.filter(r => r.status === 'submitted').length
  const reviewing = reports.filter(r => r.status === 'under_review').length
  const critical  = reports.filter(r => r.urgency === 'critical').length

  const quickAction = (report, newStatus, note) => {
    updateReport(report.id, { status: newStatus, assignedTo: state.userName })
    addTimeline(report.id, { event: `Status changed to "${STATUS_LABELS[newStatus]?.label}"${note ? ` — ${note}` : ''}`, by: state.userName })
    toast(`Report ${report.id} → ${STATUS_LABELS[newStatus]?.label}`, 'success')
  }

  if (selected) {
    const report = reports.find(r => r.id === selected)
    return <IncidentDetail report={report} onBack={() => setSelected(null)} />
  }

  return (
    <div className="page dashboard-page">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
              <LayoutDashboard size={22} color="var(--clr-blue)" />
              <h1 style={{ fontSize: '1.75rem' }}>Responder Dashboard</h1>
              <span className="badge badge-blue">DUTY CONSOLE</span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Review, triage, and coordinate incident reports. All AI suggestions require human verification.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => toast('Dashboard refreshed', 'info')}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Total Reports', value: total, color: 'var(--clr-blue)', icon: <Activity size={18}/> },
            { label: 'Awaiting Review', value: pending, color: 'var(--clr-yellow)', icon: <Clock size={18}/> },
            { label: 'Under Review', value: reviewing, color: 'var(--clr-purple)', icon: <Eye size={18}/> },
            { label: 'Critical', value: critical, color: 'var(--clr-primary)', icon: <AlertTriangle size={18}/> },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="dashboard-filters">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Search by ID, description, location…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-row">
            <label className="filter-label"><Filter size={13} /> Status</label>
            <div className="filter-chips">
              {STATUS_FILTERS.map(s => (
                <button key={s} className={`chip ${statusFilter === s ? 'selected' : ''}`} onClick={() => setStatus(s)}>
                  {s === 'all' ? 'All' : STATUS_LABELS[s]?.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <label className="filter-label"><AlertTriangle size={13} /> Urgency</label>
            <div className="filter-chips">
              {URGENCY_FILTERS.map(u => (
                <button key={u} className={`chip ${urgencyFilter === u ? 'selected' : ''}`} onClick={() => setUrgency(u)}>
                  {u === 'all' ? 'All' : u.charAt(0).toUpperCase() + u.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report count */}
        <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-faint)', marginBottom: '1rem' }}>
          Showing {filtered.length} of {total} reports
        </div>

        {/* Report list */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Search size={32} />
            <p>No reports match your filters.</p>
          </div>
        ) : (
          <div className="report-list">
            {filtered.map(r => (
              <ReportRow key={r.id} report={r} onOpen={() => setSelected(r.id)} onAction={quickAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportRow({ report: r, onOpen, onAction }) {
  const [expanded, setExpanded] = useState(false)
  const cat = getCategoryMeta(r.category)
  const urgColor = getUrgencyColor(r.urgency)
  const statusMeta = STATUS_LABELS[r.status] || {}

  return (
    <div className={`report-row urgency-border-${urgColor}`}>
      <div className="report-row-main" onClick={onOpen}>
        {/* Left */}
        <div className="report-row-left">
          <div className="report-id">{r.id}</div>
          <div className={`badge badge-${urgColor}`}>{r.urgency}</div>
          <div className={`badge badge-${statusMeta.color || 'gray'}`}>{statusMeta.label}</div>
        </div>

        {/* Center */}
        <div className="report-row-center">
          <div className="report-category">
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            {r.subCategory && <span className="badge badge-gray" style={{ fontSize:'0.65rem' }}>{r.subCategory}</span>}
          </div>
          <div className="report-desc">{r.description.substring(0, 120)}{r.description.length > 120 ? '…' : ''}</div>
          <div className="report-location-line">
            📍 {[r.location.address, r.location.landmark, r.location.floor].filter(Boolean).join(' · ') || 'Location not specified'}
          </div>
        </div>

        {/* Right */}
        <div className="report-row-right">
          <div className="report-time"><Clock size={12} /> {timeAgo(r.reportedAt)}</div>
          {r.reporter?.anonymous
            ? <div className="text-faint" style={{ fontSize: '0.75rem' }}>🔒 Anonymous</div>
            : <div className="text-faint" style={{ fontSize: '0.75rem' }}><User size={11} /> {r.reporter?.name}</div>
          }
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
            {r.media?.length > 0 && <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>📷 {r.media.length}</span>}
            {r.aiConfidence && <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>🤖 {Math.round(r.aiConfidence * 100)}%</span>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="report-row-actions" onClick={e => e.stopPropagation()}>
        <button className="btn btn-outline btn-sm" onClick={onOpen}>
          <Eye size={13} /> Review
        </button>
        {r.status === 'submitted' && (
          <button className="btn btn-sm" style={{ background:'var(--clr-yellow-dim)', color:'var(--clr-yellow)', border:'1px solid rgba(245,158,11,0.25)' }}
            onClick={() => onAction(r, 'under_review', 'Started review')}>
            Start Review
          </button>
        )}
        {r.status === 'under_review' && (
          <>
            <button className="btn btn-success btn-sm" onClick={() => onAction(r, 'resolved', 'Marked resolved')}>Resolve</button>
            <button className="btn btn-danger btn-sm" onClick={() => onAction(r, 'false_alarm', 'Marked false alarm')}>False Alarm</button>
          </>
        )}
        <button className="btn-icon btn-sm" onClick={() => setExpanded(p => !p)} title="AI Summary">
          <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Expanded AI summary */}
      {expanded && (
        <div className="ai-summary-panel">
          <div className="ai-summary-head">🤖 AI Summary <span className="badge badge-purple" style={{ fontSize:'0.6rem' }}>SIMULATED · Advisory Only</span></div>
          <div className="ai-summary-body">{r.aiSummary}</div>
          <div className="ai-summary-footer">
            Confidence: {r.aiConfidence ? `${Math.round(r.aiConfidence * 100)}%` : 'N/A'} · Category: {r.aiCategory} · Urgency: {r.aiUrgency}
          </div>
        </div>
      )}
    </div>
  )
}
