import { useState } from 'react'
import {
  ArrowLeft, MapPin, Clock, User, Brain, AlertTriangle,
  MessageSquare, Send, Phone, Shield, Activity
} from 'lucide-react'
import { useApp, STATUS_LABELS, AGENCIES, timeAgo, getCategoryMeta, getUrgencyColor } from '../store.jsx'
import './IncidentDetail.css'

export default function IncidentDetail({ report: r, onBack }) {
  const { updateReport, addTimeline, toast, state } = useApp()
  const [note, setNote]         = useState('')
  const [newStatus, setNewStatus] = useState(r.status)
  const [saving, setSaving]     = useState(false)

  const cat      = getCategoryMeta(r.category)
  const urgColor = getUrgencyColor(r.urgency)
  const statusMeta = STATUS_LABELS[r.status] || {}

  const saveAction = async () => {
    if (!note.trim() && newStatus === r.status) { toast('Add a note or change status', 'warning'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    const updates = {}
    if (newStatus !== r.status) updates.status = newStatus
    if (note.trim()) updates.reviewNotes = [...(r.reviewNotes || []), note.trim()]
    updates.assignedTo = state.userName
    updateReport(r.id, updates)
    addTimeline(r.id, {
      event: [
        newStatus !== r.status ? `Status → ${STATUS_LABELS[newStatus]?.label}` : null,
        note.trim() ? `Note: "${note.trim()}"` : null,
      ].filter(Boolean).join(' | '),
      by: state.userName
    })
    toast('Report updated', 'success')
    setSaving(false)
    setNote('')
  }

  const notifyAgency = (agencyId, status) => {
    const agencies = { ...r.agencies, [agencyId]: status }
    updateReport(r.id, { agencies })
    addTimeline(r.id, { event: `${AGENCIES.find(a=>a.id===agencyId)?.label} status → ${status} [DEMO — no real notification sent]`, by: state.userName })
    toast(`${AGENCIES.find(a=>a.id===agencyId)?.label} status updated (DEMO)`, 'info')
  }

  return (
    <div className="page incident-detail-page">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Back */}
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="incident-grid">
          {/* ---- Left column ---- */}
          <div className="incident-main">
            {/* Header */}
            <div className="card incident-header-card">
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily:'var(--font-head)', fontWeight:700, color:'var(--clr-blue)', fontSize:'1.1rem' }}>{r.id}</span>
                  <div className={`badge badge-${urgColor}`}>{r.urgency}</div>
                  <div className={`badge badge-${statusMeta.color || 'gray'}`}>{statusMeta.label}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} color="var(--clr-text-faint)" />
                  <span className="text-faint" style={{ fontSize:'0.8rem' }}>{timeAgo(r.reportedAt)} · {new Date(r.reportedAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize:'1.25rem' }}>{cat.icon}</span>
                <span style={{ fontWeight:700, fontSize:'1rem' }}>{cat.label}</span>
                {r.subCategory && <span className="badge badge-gray">{r.subCategory}</span>}
              </div>

              <div className="description-box">
                <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--clr-text-faint)', marginBottom:'0.5rem' }}>Original Description</div>
                <p style={{ fontSize:'0.9rem', lineHeight:1.7 }}>{r.description}</p>
              </div>
            </div>

            {/* Location */}
            <div className="card">
              <h3 className="section-title"><MapPin size={16} /> Location</h3>
              <div className="detail-rows">
                {r.location.lat     && <div className="detail-row"><span>GPS</span><span>{r.location.lat}, {r.location.lng}</span></div>}
                {r.location.address && <div className="detail-row"><span>Address</span><span>{r.location.address}</span></div>}
                {r.location.landmark && <div className="detail-row"><span>Landmark</span><span>{r.location.landmark}</span></div>}
                {r.location.floor   && <div className="detail-row"><span>Floor</span><span>{r.location.floor}</span></div>}
                {r.location.room    && <div className="detail-row"><span>Room</span><span>{r.location.room}</span></div>}
                {!r.location.lat && !r.location.address && <div className="text-muted" style={{fontSize:'0.875rem'}}>No location data provided.</div>}
              </div>
              {r.location.lat && (
                <div className="map-placeholder" style={{ marginTop: '0.875rem', minHeight: 140 }}>
                  <MapPin size={24} />
                  <span>Map view — GPS: {r.location.lat}, {r.location.lng}</span>
                  <span style={{ fontSize: '0.75rem' }}>Interactive map requires API key configuration</span>
                </div>
              )}
            </div>

            {/* AI Summary */}
            <div className="card ai-panel">
              <h3 className="section-title">
                <Brain size={16} color="var(--clr-purple)" /> AI Triage Summary
                <span className="badge badge-purple" style={{ fontSize:'0.6rem', marginLeft:'0.5rem' }}>SIMULATED · Advisory Only</span>
              </h3>
              <div className="ai-summary-text">{r.aiSummary}</div>
              <div className="ai-metrics">
                <div className="ai-metric"><span>AI Category</span><span className="badge badge-gray">{r.aiCategory}</span></div>
                <div className="ai-metric"><span>AI Urgency</span><div className={`badge badge-${getUrgencyColor(r.aiUrgency)}`}>{r.aiUrgency}</div></div>
                <div className="ai-metric"><span>Confidence</span><span>{r.aiConfidence ? `${Math.round(r.aiConfidence * 100)}%` : 'N/A'}</span></div>
              </div>
              <div className="alert alert-warning" style={{ marginTop: '0.75rem', padding: '0.625rem 0.875rem' }}>
                <AlertTriangle size={14} className="alert-icon" />
                <span style={{ fontSize: '0.8rem' }}>AI analysis is simulated and may be inaccurate. Authorized responders must verify all details before acting.</span>
              </div>
            </div>

            {/* Media */}
            {r.media?.length > 0 && (
              <div className="card">
                <h3 className="section-title">📷 Media ({r.media.length})</h3>
                <div className="media-review-grid">
                  {r.media.map((m, i) => (
                    <div key={i} className="media-review-item">
                      {m.type === 'photo'
                        ? <img src={m.url} alt={m.name} style={{ width:'100%', borderRadius:'8px' }} />
                        : <video src={m.url} controls style={{ width:'100%', borderRadius:'8px' }} />
                      }
                      <div style={{ fontSize:'0.72rem', color:'var(--clr-text-faint)', marginTop:'0.35rem' }}>{m.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="card">
              <h3 className="section-title"><Activity size={16} /> Audit Timeline</h3>
              <div className="timeline">
                {r.timeline.map((t, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-body">
                      <div className="timeline-event">{t.event}</div>
                      <div className="timeline-meta">
                        <span>{t.by}</span>
                        <span>·</span>
                        <span>{timeAgo(t.at)} · {new Date(t.at).toLocaleTimeString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---- Right column: Actions ---- */}
          <div className="incident-sidebar">
            {/* Reporter info */}
            <div className="card">
              <h3 className="section-title"><User size={16} /> Reporter</h3>
              <div className="detail-rows">
                <div className="detail-row"><span>Name</span><span>{r.reporter?.name || '—'}</span></div>
                {r.reporter?.contact && <div className="detail-row"><span>Contact</span><a href={`tel:${r.reporter.contact}`} style={{ color:'var(--clr-blue)' }}>{r.reporter.contact}</a></div>}
                <div className="detail-row"><span>Anonymous</span><span>{r.reporter?.anonymous ? 'Yes' : 'No'}</span></div>
              </div>
            </div>

            {/* Human verification */}
            <div className="card action-card">
              <h3 className="section-title"><Shield size={16} /> Human Verification</h3>
              <p className="text-muted" style={{ fontSize:'0.825rem', marginBottom:'1rem', lineHeight:1.5 }}>
                Review the report and AI suggestions. Only you can change the status and add notes. AI cannot take action.
              </p>

              <div className="form-group">
                <label className="form-label">Change Status</label>
                <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              {r.assignedTo && (
                <div className="detail-row" style={{ marginTop:'0.5rem', marginBottom:'0.5rem' }}>
                  <span>Assigned to</span><span>{r.assignedTo}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label"><MessageSquare size={13} /> Add Note</label>
                <textarea className="form-textarea" style={{ minHeight:80 }}
                  placeholder="Add a review note, action taken, or correction…"
                  value={note} onChange={e => setNote(e.target.value)}
                />
              </div>

              <button className="btn btn-primary w-full" onClick={saveAction} disabled={saving}>
                {saving ? 'Saving…' : <><Send size={14} /> Save Action</>}
              </button>

              {r.reviewNotes?.length > 0 && (
                <div className="review-notes">
                  <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--clr-text-faint)', marginBottom:'0.5rem' }}>Previous Notes</div>
                  {r.reviewNotes.map((n, i) => (
                    <div key={i} className="review-note-item">{n}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Agency coordination */}
            <div className="card">
              <h3 className="section-title"><Phone size={16} /> Agency Status</h3>
              <div className="alert alert-warning" style={{ padding:'0.625rem', marginBottom:'0.875rem', fontSize:'0.78rem' }}>
                DEMO ONLY — No real agency is contacted.
              </div>
              <div className="agencies-status-list">
                {AGENCIES.map(ag => {
                  const st = r.agencies?.[ag.id]
                  return (
                    <div key={ag.id} className="agency-status-row">
                      <div className="flex items-center gap-2">
                        <span>{ag.icon}</span>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{ag.label}</div>
                          <div style={{ fontSize:'0.72rem', color:'var(--clr-text-faint)' }}>{ag.number}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {st && <span className={`badge badge-${st === 'notified' ? 'green' : st === 'pending' ? 'yellow' : 'gray'}`}>{st}</span>}
                        {!st && <span className="badge badge-gray">—</span>}
                        <select className="agency-status-select"
                          value={st || ''} onChange={e => notifyAgency(ag.id, e.target.value)}
                        >
                          <option value="">Not set</option>
                          <option value="pending">Pending</option>
                          <option value="notified">Notified [DEMO]</option>
                          <option value="responding">Responding [DEMO]</option>
                          <option value="on-site">On-site [DEMO]</option>
                          <option value="cleared">Cleared [DEMO]</option>
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Emergency reference */}
            <div className="card" style={{ background:'rgba(255,59,59,0.05)', borderColor:'rgba(255,59,59,0.2)' }}>
              <h3 className="section-title" style={{ color:'var(--clr-primary)' }}><Phone size={16} /> Emergency Numbers</h3>
              {AGENCIES.map(a => (
                <a key={a.id} href={`tel:${a.number}`} className="emergency-ref-link">
                  {a.icon} {a.label} — {a.number}
                </a>
              ))}
              <a href="tel:112" className="btn btn-danger w-full" style={{ marginTop:'0.75rem' }}>
                <Phone size={14} /> Call 112 Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
