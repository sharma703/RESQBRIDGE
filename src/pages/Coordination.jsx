import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Phone, CheckCircle, AlertTriangle, Clock, Activity,
  MapPin, RefreshCw, Shield, Info
} from 'lucide-react'
import { useApp, AGENCIES, STATUS_LABELS, timeAgo, getCategoryMeta, getUrgencyColor } from '../store.jsx'
import './Coordination.css'

const AGENCY_STATUS_COLORS = {
  notified:    'green',
  pending:     'yellow',
  responding:  'orange',
  'on-site':   'blue',
  cleared:     'gray',
}

export default function Coordination() {
  const { state, updateReport, addTimeline, toast } = useApp()
  const { reports, userRole } = state
  const [activeTab, setActiveTab] = useState('overview')

  if (userRole === 'reporter') {
    return (
      <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'2rem' }}>
        <div style={{ textAlign:'center', maxWidth:'420px' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔒</div>
          <h2 style={{ marginBottom:'0.5rem' }}>Responder Access Only</h2>
          <p className="text-muted" style={{ marginBottom:'1.5rem', fontSize:'0.9rem' }}>
            Multi-agency coordination is available to authorized responders and admins. Use role selection to switch to Responder or Admin mode for this demo.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/role-select" className="btn btn-primary">Switch Role</Link>
            <Link to="/" className="btn btn-outline">← Home</Link>
          </div>
        </div>
      </div>
    )
  }

  // Aggregate stats across all reports per agency
  const agencyStats = AGENCIES.map(ag => {
    const activeReports = reports.filter(r =>
      r.agencies?.[ag.id] && r.agencies[ag.id] !== 'cleared' && r.status !== 'resolved' && r.status !== 'false_alarm'
    )
    const allReports = reports.filter(r => r.agencies?.[ag.id])
    return { ...ag, activeCount: activeReports.length, totalCount: allReports.length, reports: activeReports }
  })

  const activeIncidents = reports.filter(r =>
    !['resolved', 'false_alarm'].includes(r.status)
  )
  const criticalActive = activeIncidents.filter(r => r.urgency === 'critical')

  const updateAgencyStatus = (reportId, agencyId, status) => {
    const report = reports.find(r => r.id === reportId)
    if (!report) return
    const agencies = { ...report.agencies, [agencyId]: status }
    updateReport(reportId, { agencies })
    addTimeline(reportId, {
      event: `${AGENCIES.find(a => a.id === agencyId)?.label} → ${status} [DEMO]`,
      by: userName
    })
    toast(`Agency status updated (DEMO — no real notification)`, 'info')
  }

  return (
    <div className="page coordination-page">
      <div className="container" style={{ paddingTop:'2rem', paddingBottom:'4rem' }}>
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom:'0.25rem' }}>
              <Users size={22} color="var(--clr-purple)" />
              <h1 style={{ fontSize:'1.75rem' }}>Multi-Agency Coordination</h1>
              <span className="badge badge-purple">DEMO</span>
            </div>
            <p className="text-muted" style={{ fontSize:'0.875rem' }}>
              Track and coordinate response across agencies. <strong>All agency notifications are simulated</strong> — no real services are contacted.
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => toast('Refreshed', 'info')}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Critical alert */}
        {criticalActive.length > 0 && (
          <div className="alert alert-emergency" style={{ marginBottom:'1.5rem' }}>
            <AlertTriangle size={18} className="alert-icon" />
            <span>
              <strong>{criticalActive.length} critical incident{criticalActive.length > 1 ? 's' : ''} active.</strong>
              {' '}In a real emergency, call the relevant agencies directly.
            </span>
            <a href="tel:112" className="btn btn-danger btn-sm" style={{ flexShrink:0 }}>
              <Phone size={13} /> 112
            </a>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid-4" style={{ marginBottom:'2rem' }}>
          {[
            { label:'Active Incidents', value: activeIncidents.length, color:'var(--clr-primary)', icon:<Activity size={18}/> },
            { label:'Critical', value: criticalActive.length, color:'var(--clr-primary)', icon:<AlertTriangle size={18}/> },
            { label:'Agencies Involved', value: agencyStats.filter(a => a.activeCount > 0).length, color:'var(--clr-purple)', icon:<Users size={18}/> },
            { label:'Total Reports', value: reports.length, color:'var(--clr-blue)', icon:<Shield size={18}/> },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ borderTop:`3px solid ${s.color}` }}>
              <div style={{ color:s.color }}>{s.icon}</div>
              <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="coord-tabs">
          {['overview', 'by-agency', 'active-incidents'].map(tab => (
            <button key={tab} className={`coord-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' ? 'Overview' : tab === 'by-agency' ? 'By Agency' : 'Active Incidents'}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="fade-up">
            <div className="alert alert-warning" style={{ marginBottom:'1.5rem' }}>
              <Info size={16} className="alert-icon" />
              <span style={{ fontSize:'0.825rem' }}>
                <strong>DEMO platform:</strong> Agency status changes below are for demonstration only.
                No real police, ambulance, fire, or disaster services are contacted.
                For real emergencies: call 112 (India).
              </span>
            </div>

            <div className="agency-overview-grid">
              {agencyStats.map(ag => (
                <div key={ag.id} className={`agency-overview-card ${ag.activeCount > 0 ? 'has-active' : ''}`}>
                  <div className="agency-overview-head">
                    <div className="agency-overview-icon">{ag.icon}</div>
                    <div>
                      <div className="agency-overview-name">{ag.label}</div>
                      <div className="agency-overview-number">{ag.number}</div>
                    </div>
                    <a href={`tel:${ag.number}`} className="btn btn-outline btn-sm" style={{ marginLeft:'auto' }}>
                      <Phone size={13} /> Call
                    </a>
                  </div>

                  <div className="agency-overview-stats">
                    <div className="agency-stat">
                      <span className="stat-label">Active</span>
                      <span style={{ fontWeight:700, color: ag.activeCount > 0 ? 'var(--clr-primary)' : 'var(--clr-text-muted)' }}>
                        {ag.activeCount}
                      </span>
                    </div>
                    <div className="agency-stat">
                      <span className="stat-label">Total</span>
                      <span style={{ fontWeight:700 }}>{ag.totalCount}</span>
                    </div>
                  </div>

                  {ag.reports.length > 0 ? (
                    <div className="agency-report-list">
                      {ag.reports.map(r => {
                        const agStatus = r.agencies?.[ag.id]
                        return (
                          <div key={r.id} className="agency-report-row">
                            <div>
                              <div className="flex items-center gap-1" style={{ marginBottom:'0.2rem' }}>
                                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--clr-blue)' }}>{r.id}</span>
                                <span className={`badge badge-${getUrgencyColor(r.urgency)}`} style={{ fontSize:'0.6rem' }}>{r.urgency}</span>
                              </div>
                              <div style={{ fontSize:'0.78rem', color:'var(--clr-text-faint)' }}>
                                {r.location.address || 'Location not specified'} · {timeAgo(r.reportedAt)}
                              </div>
                            </div>
                            <select
                              className="agency-status-select-sm"
                              value={agStatus || ''}
                              onChange={e => updateAgencyStatus(r.id, ag.id, e.target.value)}
                            >
                              <option value="">Not set</option>
                              <option value="pending">Pending</option>
                              <option value="notified">Notified</option>
                              <option value="responding">Responding</option>
                              <option value="on-site">On-site</option>
                              <option value="cleared">Cleared</option>
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize:'0.8rem', color:'var(--clr-text-faint)', padding:'0.5rem 0' }}>
                      No active incidents assigned.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: By Agency */}
        {activeTab === 'by-agency' && (
          <div className="fade-up">
            {AGENCIES.map(ag => {
              const agReports = reports.filter(r => r.agencies?.[ag.id])
              return (
                <div key={ag.id} className="card" style={{ marginBottom:'1rem' }}>
                  <div className="flex items-center gap-2" style={{ marginBottom:'1rem' }}>
                    <span style={{ fontSize:'1.5rem' }}>{ag.icon}</span>
                    <div>
                      <div style={{ fontWeight:700 }}>{ag.label}</div>
                      <div style={{ fontSize:'0.8rem', color:'var(--clr-text-faint)' }}>{ag.number}</div>
                    </div>
                    <span className="badge badge-gray" style={{ marginLeft:'auto' }}>{agReports.length} reports</span>
                    <a href={`tel:${ag.number}`} className="btn btn-outline btn-sm">
                      <Phone size={13} /> Call {ag.number}
                    </a>
                  </div>

                  {agReports.length === 0 ? (
                    <div style={{ fontSize:'0.875rem', color:'var(--clr-text-faint)' }}>No reports assigned to this agency.</div>
                  ) : (
                    <div className="agency-full-table">
                      <div className="table-head">
                        <span>Report ID</span><span>Category</span><span>Urgency</span><span>Location</span><span>Status</span><span>Time</span><span>Action</span>
                      </div>
                      {agReports.map(r => {
                        const cat = getCategoryMeta(r.category)
                        const agStatus = r.agencies?.[ag.id]
                        const statusColor = AGENCY_STATUS_COLORS[agStatus] || 'gray'
                        return (
                          <div key={r.id} className="table-row">
                            <span style={{ fontWeight:700, color:'var(--clr-blue)', fontSize:'0.8rem' }}>{r.id}</span>
                            <span style={{ fontSize:'0.8rem' }}>{cat.icon} {cat.label}</span>
                            <span><div className={`badge badge-${getUrgencyColor(r.urgency)}`} style={{ fontSize:'0.65rem' }}>{r.urgency}</div></span>
                            <span style={{ fontSize:'0.78rem', color:'var(--clr-text-faint)' }}>{r.location.address || '—'}</span>
                            <span>{agStatus ? <div className={`badge badge-${statusColor}`} style={{ fontSize:'0.65rem' }}>{agStatus}</div> : <span className="text-faint" style={{ fontSize:'0.78rem' }}>—</span>}</span>
                            <span style={{ fontSize:'0.75rem', color:'var(--clr-text-faint)' }}>{timeAgo(r.reportedAt)}</span>
                            <span>
                              <select className="agency-status-select-sm"
                                value={agStatus || ''}
                                onChange={e => updateAgencyStatus(r.id, ag.id, e.target.value)}>
                                <option value="">Not set</option>
                                <option value="pending">Pending</option>
                                <option value="notified">Notified</option>
                                <option value="responding">Responding</option>
                                <option value="on-site">On-site</option>
                                <option value="cleared">Cleared</option>
                              </select>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tab: Active Incidents */}
        {activeTab === 'active-incidents' && (
          <div className="fade-up">
            {activeIncidents.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={32} color="var(--clr-green)" />
                <p>No active incidents. All reports are resolved or cleared.</p>
              </div>
            ) : (
              <div className="active-incidents-list">
                {activeIncidents.map(r => {
                  const cat = getCategoryMeta(r.category)
                  const urgColor = getUrgencyColor(r.urgency)
                  const statusMeta = STATUS_LABELS[r.status] || {}
                  return (
                    <div key={r.id} className={`active-incident-card urgency-left-${urgColor}`}>
                      <div className="active-incident-head">
                        <div className="flex items-center gap-2" style={{ flexWrap:'wrap' }}>
                          <span style={{ fontFamily:'var(--font-head)', fontWeight:700, color:'var(--clr-blue)' }}>{r.id}</span>
                          <span>{cat.icon}</span>
                          <span style={{ fontWeight:600 }}>{cat.label}</span>
                          <div className={`badge badge-${urgColor}`}>{r.urgency}</div>
                          <div className={`badge badge-${statusMeta.color || 'gray'}`}>{statusMeta.label}</div>
                        </div>
                        <div className="flex items-center gap-1" style={{ color:'var(--clr-text-faint)', fontSize:'0.78rem' }}>
                          <Clock size={12} /> {timeAgo(r.reportedAt)}
                        </div>
                      </div>

                      <p style={{ fontSize:'0.875rem', color:'var(--clr-text-muted)', margin:'0.5rem 0' }}>
                        {r.description.substring(0, 150)}{r.description.length > 150 ? '…' : ''}
                      </p>

                      {r.location.address && (
                        <div style={{ fontSize:'0.8rem', color:'var(--clr-text-faint)', display:'flex', gap:'0.4rem', alignItems:'center', marginBottom:'0.875rem' }}>
                          <MapPin size={12} /> {r.location.address} {r.location.landmark && `· ${r.location.landmark}`}
                        </div>
                      )}

                      {/* Agency status per incident */}
                      <div className="incident-agencies">
                        {AGENCIES.map(ag => {
                          const agStatus = r.agencies?.[ag.id]
                          return (
                            <div key={ag.id} className="incident-agency-pill">
                              <span>{ag.icon}</span>
                              <span style={{ fontSize:'0.75rem' }}>{ag.label}</span>
                              <select className="agency-status-select-sm"
                                value={agStatus || ''}
                                onChange={e => updateAgencyStatus(r.id, ag.id, e.target.value)}>
                                <option value="">—</option>
                                <option value="pending">Pending</option>
                                <option value="notified">Notified</option>
                                <option value="responding">Responding</option>
                                <option value="on-site">On-site</option>
                                <option value="cleared">Cleared</option>
                              </select>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
