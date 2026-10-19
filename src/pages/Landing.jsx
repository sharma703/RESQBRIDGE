import { Link } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { Shield, AlertTriangle, Mic, Camera, MapPin, Brain, Users, CheckCircle, ArrowRight, Phone, Activity, Clock, Lock } from 'lucide-react'
import './Landing.css'

const features = [
  { icon: <AlertTriangle size={22} />, title: 'Multi-modal Reporting', desc: 'Report via text, voice, or photo. No single method required — whatever works under stress.', color: 'red' },
  { icon: <MapPin size={22} />,        title: 'Smart Location',         desc: 'GPS auto-capture with manual landmark correction. Buildings, floors, rooms — all captured.', color: 'blue' },
  { icon: <Brain size={22} />,         title: 'AI-Assisted Triage',     desc: 'AI suggests categories and urgency levels. Authorized humans always make the final call.', color: 'purple' },
  { icon: <Users size={22} />,         title: 'Responder Dashboard',    desc: 'Authorized teams review, assign, and update incident status in a unified view.', color: 'green' },
  { icon: <Activity size={22} />,      title: 'Live Status Tracking',   desc: 'Reporters see their submission status. No silent black holes — successes and failures both shown.', color: 'orange' },
  { icon: <Lock size={22} />,          title: 'Privacy-First Design',   desc: 'Minimum necessary data collection. Role-based access. Audit trail. DPDP 2023 aware.', color: 'yellow' },
]

const stats = [
  { value: '< 30s', label: 'Avg. report time', icon: <Clock size={18} /> },
  { value: '6',     label: 'Incident categories', icon: <Shield size={18} /> },
  { value: '112',   label: 'India emergency no.', icon: <Phone size={18} /> },
  { value: '24/7',  label: 'Platform available', icon: <Activity size={18} /> },
]

const steps = [
  { n: '01', title: 'Report the incident', desc: 'Describe what you see — type, speak, or add a photo safely.' },
  { n: '02', title: 'Confirm your location', desc: 'GPS plus landmarks. Correct it if needed. Add floor and room.' },
  { n: '03', title: 'AI structures the report', desc: 'Category and urgency suggested — preserved alongside your exact words.' },
  { n: '04', title: 'Human review decides', desc: 'Authorized responder verifies and acts. AI never dispatches on its own.' },
]

export default function Landing() {
  return (
    <div className="page landing">
      {/* ---- Emergency bar ---- */}
      <div className="container" style={{ paddingTop: '1.5rem' }}>
        <div className="emergency-bar fade-up">
          <div className="flex items-center gap-2">
            <Phone size={16} color="var(--clr-primary)" />
            <span style={{ fontSize: '0.875rem' }}>
              <strong>In immediate danger?</strong> Call <a href="tel:112" style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>112</a> (India) first. Do not wait for this platform.
            </span>
          </div>
          <a href="tel:112" className="btn btn-danger btn-sm" style={{ flexShrink: 0 }}>
            <Phone size={13} /> 112
          </a>
        </div>
      </div>

      {/* ---- Hero ---- */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-content">
          <div className="badge badge-red fade-up" style={{ marginBottom: '1.5rem' }}>
            <span className="pulse-dot" style={{ color: 'var(--clr-primary)' }} />
            AI-Powered Emergency Response · India-First
          </div>

          <h1 className="hero-title fade-up fade-up-1">
            Bridge the gap between<br />
            <span className="gradient-text">emergency and response</span>
          </h1>

          <p className="hero-subtitle fade-up fade-up-2">
            RESQBRIDGE turns stressed, incomplete reports into structured, actionable incident information —
            reviewed by authorized humans, powered by AI, and designed to complement 112, not replace it.
          </p>

          <div className="hero-cta fade-up fade-up-3">
            <Link to="/report" className="btn btn-primary btn-lg">
              <AlertTriangle size={18} />
              Report an Incident
            </Link>
            <Link to="/dashboard" className="btn btn-outline btn-lg">
              <Users size={18} />
              Responder Dashboard
            </Link>
          </div>

          <div className="hero-disclaimer fade-up fade-up-4">
            <CheckCircle size={14} />
            <span>DEMO platform — AI features are simulated. Real emergencies: call 112 immediately.</span>
          </div>
        </div>
      </section>

      {/* ---- Stats ---- */}
      <section className="landing-stats">
        <div className="container">
          <div className="grid-4">
            {stats.map((s, i) => (
              <div key={i} className="stat-card fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{ color: 'var(--clr-primary)' }}>{s.icon}</div>
                <div className="stat-value gradient-text">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section className="landing-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="badge badge-blue" style={{ marginBottom: '1rem' }}>Features</div>
            <h2>Designed for real emergencies</h2>
            <p className="text-muted" style={{ maxWidth: '520px', margin: '0.75rem auto 0' }}>
              Every feature is built around one principle: making the first report clearer so the human who reads it can act faster and more confidently.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className={`feature-card feature-${f.color}`}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="landing-section" style={{ background: 'var(--clr-bg-2)' }}>
        <div className="container">
          <div className="section-header text-center">
            <div className="badge badge-purple" style={{ marginBottom: '1rem' }}>How It Works</div>
            <h2>From report to response in 4 steps</h2>
          </div>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p className="text-muted">{s.desc}</p>
                {i < steps.length - 1 && <div className="step-arrow"><ArrowRight size={18} /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Input methods ---- */}
      <section className="landing-section">
        <div className="container">
          <div className="input-methods-grid">
            <div className="input-methods-text">
              <div className="badge badge-orange" style={{ marginBottom: '1rem' }}>Reporting Methods</div>
              <h2>Report any way that works for you</h2>
              <p className="text-muted" style={{ marginTop: '0.75rem', marginBottom: '1.5rem' }}>
                In an emergency you might be shaking, injured, or unable to type clearly. RESQBRIDGE accepts whatever you can manage.
              </p>
              <div className="method-list">
                {[
                  { icon: <AlertTriangle size={18} />, title: 'Text', desc: 'Type freely — prompts help fill key details' },
                  { icon: <Mic size={18} />,            title: 'Voice', desc: 'Speak your report, auto-transcribed' },
                  { icon: <Camera size={18} />,         title: 'Photo / Video', desc: 'Optional safe scene context — never required' },
                  { icon: <MapPin size={18} />,         title: 'Location', desc: 'GPS + landmark + floor/room for precision' },
                ].map((m, i) => (
                  <div key={i} className="method-item">
                    <div className="method-icon">{m.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{m.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="input-methods-visual">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="phone-bar">
                    <div className="phone-dot" />
                    <div className="phone-pill" />
                    <div className="phone-dot" />
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(255,59,59,0.12)', border: '1px solid rgba(255,59,59,0.2)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.72rem', color: '#ffbbbb' }}>
                      📞 Emergency? Call 112 first
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', fontWeight: 600 }}>DESCRIBE THE INCIDENT</div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.75rem', minHeight: '60px', fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                      Person collapsed near main gate...
                    </div>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {['🏥 Medical','🔥 Fire','🚨 Security'].map(c => (
                        <div key={c} className="chip" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>{c}</div>
                      ))}
                    </div>
                    <div style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.2)', borderRadius: '8px', padding: '0.625rem', fontSize: '0.7rem', color: 'var(--clr-blue)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <MapPin size={12} /> Main Gate, Block A · Floor G
                    </div>
                    <button style={{ background: 'var(--clr-primary)', border: 'none', borderRadius: '8px', padding: '0.625rem', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Submit Report →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Safety disclaimer ---- */}
      <section className="landing-section">
        <div className="container-sm">
          <div className="alert alert-emergency">
            <Shield size={22} className="alert-icon" style={{ color: 'var(--clr-primary)', flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.4rem' }}>This is a demonstration platform</strong>
              RESQBRIDGE is not a certified emergency service. Reports submitted here are <em>not</em> automatically forwarded to 112, police, fire, or ambulance services. Always call 112 (India) for immediate emergencies. This platform is designed to complement — never replace — official emergency channels. AI suggestions are advisory only; authorized humans make all consequential decisions.
            </div>
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="landing-section landing-cta-section">
        <div className="container text-center">
          <h2 className="fade-up">Ready to see it in action?</h2>
          <p className="text-muted fade-up fade-up-1" style={{ marginTop: '0.75rem', marginBottom: '2rem' }}>
            Try submitting a demo report or explore the responder dashboard.
          </p>
          <div className="flex justify-center gap-2 fade-up fade-up-2" style={{ flexWrap: 'wrap' }}>
            <Link to="/report" className="btn btn-primary btn-lg">
              <AlertTriangle size={18} /> Submit a Report
            </Link>
            <Link to="/dashboard" className="btn btn-outline btn-lg">
              <LayoutDashboard size={18} /> View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="navbar-logo" style={{ marginBottom: '0.75rem' }}>
                <div className="navbar-logo-icon"><Shield size={18} fill="white" /></div>
                <span className="navbar-logo-text">RESQ<span className="navbar-logo-accent">BRIDGE</span></span>
              </div>
              <p className="text-faint" style={{ fontSize: '0.825rem', maxWidth: '260px', lineHeight: 1.6 }}>
                AI-assisted emergency reporting and coordination. India-first, institution-independent.
              </p>
            </div>
            <div>
              <div className="footer-heading">Emergency Numbers</div>
              <div className="footer-links">
                <a href="tel:112">🚨 112 — National Emergency</a>
                <a href="tel:100">👮 100 — Police</a>
                <a href="tel:101">🔥 101 — Fire Brigade</a>
                <a href="tel:108">🚑 108 — Ambulance</a>
                <a href="tel:1078">⛑️ 1078 — Disaster Relief</a>
              </div>
            </div>
            <div>
              <div className="footer-heading">Platform</div>
              <div className="footer-links">
                <Link to="/">Home</Link>
                <Link to="/report">Submit Report</Link>
                <Link to="/my-reports">My Reports</Link>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/coordination">Coordination</Link>
              </div>
            </div>
            <div>
              <div className="footer-heading">About</div>
              <div className="footer-links">
                <span>Team CyberCrew</span>
                <span>Project Lead: Nikhil Sharma</span>
                <span>Hackathon Project · Round 2 ✓</span>
              </div>
            </div>
          </div>
          <hr className="divider" />
          <div className="footer-bottom">
            <span className="text-faint" style={{ fontSize: '0.8rem' }}>
              © 2024 RESQBRIDGE · Team CyberCrew · Demo Platform · Not a registered emergency service
            </span>
            <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>DEMO</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

