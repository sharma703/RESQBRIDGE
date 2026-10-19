import { useState } from 'react'
import { FileText, Clock, MapPin, Eye, Phone, CheckCircle } from 'lucide-react'
import { useApp, STATUS_LABELS, timeAgo, getCategoryMeta, getUrgencyColor } from '../store.jsx'
import IncidentDetail from '../components/IncidentDetail.jsx'
import './MyReports.css'

export default function MyReports() {
  const { state } = useApp()
  const [selected, setSelected] = useState(null)

  // In demo mode, show all reports as "my" reports for the reporter role
  // In real app, filter by reporter's session/user ID
  const myReports = state.reports

  if (selected) {
    const report = state.reports.find(r => r.id === selected)
    return <IncidentDetail report={report} onBack={() => setSelected(null)} />
  }

  return (
    <div className="page my-reports-page">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
            <FileText size={22} color="var(--clr-accent)" />
            <h1 style={{ fontSize: '1.75rem' }}>My Reports</h1>
            <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>{myReports.length}</span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Track the status of your submitted incident reports. Reports are reviewed by authorized human responders.
          </p>
        </div>

        <div className="alert alert-emergency" style={{ marginBottom: '1.5rem' }}>
          <Phone size={16} className="alert-icon" />
          <span style={{ fontSize: '0.875rem' }}>
            <strong>If you need immediate help, call <a href="tel:112" style={{ color: 'var(--clr-primary)' }}>112</a>.</strong>
            {' '}Submitting a report does not dispatch emergency services.
          </span>
        </div>

        {myReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--clr-text-faint)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>No reports submitted yet.</p>
            <a href="/report" className="btn btn-primary" style={{ marginTop: '1.25rem', display: 'inline-flex' }}>
              Submit a Report
            </a>
          </div>
        ) : (
          <div className="my-reports-list">
            {myReports.map(r => {
              const cat = getCategoryMeta(r.category)
              const urgColor = getUrgencyColor(r.urgency)
              const statusMeta = STATUS_LABELS[r.status] || {}
              return (
                <div key={r.id} className={`my-report-card urgency-left-${urgColor}`}>
                  <div className="my-report-top">
                    <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                      <span style={{ fontFamily:'var(--font-head)', fontWeight:700, color:'var(--clr-blue)' }}>{r.id}</span>
                      <div className={`badge badge-${urgColor}`}>{r.urgency}</div>
                      <div className={`badge badge-${statusMeta.color || 'gray'}`}>
                        {statusMeta.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={12} color="var(--clr-text-faint)" />
                      <span style={{ fontSize:'0.78rem', color:'var(--clr-text-faint)' }}>{timeAgo(r.reportedAt)}</span>
                    </div>
                  </div>

                  <div className="my-report-body">
                    <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                      <span>{cat.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.label}</span>
                      {r.subCategory && <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{r.subCategory}</span>}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                      {r.description.substring(0, 180)}{r.description.length > 180 ? '…' : ''}
                    </p>
                  </div>

                  {(r.location.address || r.location.landmark) && (
                    <div className="my-report-location">
                      <MapPin size={12} />
                      {[r.location.address, r.location.landmark].filter(Boolean).join(' · ')}
                    </div>
                  )}

                  <div className="my-report-footer">
                    {/* Status description */}
                    <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-faint)', flex: 1 }}>
                      {statusMeta.desc}
                    </div>

                    <div className="flex items-center gap-2">
                      {r.status === 'resolved' && (
                        <div className="flex items-center gap-1" style={{ fontSize: '0.78rem', color: 'var(--clr-green)' }}>
                          <CheckCircle size={13} /> Resolved
                        </div>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => setSelected(r.id)}>
                        <Eye size={13} /> View Details
                      </button>
                    </div>
                  </div>

                  {/* Timeline preview */}
                  {r.timeline?.length > 0 && (
                    <div className="my-report-timeline">
                      {r.timeline.slice(-2).map((t, i) => (
                        <div key={i} className="timeline-mini">
                          <div className="timeline-mini-dot" />
                          <span className="text-faint" style={{ fontSize: '0.75rem' }}>{t.event} <span style={{ color: 'var(--clr-text-faint)' }}>— {timeAgo(t.at)}</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
