import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled React rendering error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <div style={{ color: 'var(--clr-primary)', marginBottom: '1rem' }}>
              <AlertTriangle size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--clr-text)' }}>
              Application Render Error
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              RESQBRIDGE encountered an unexpected interface error. Your session data remains safe.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: 'rgba(255, 59, 59, 0.08)',
                border: '1px solid rgba(255, 59, 59, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                fontSize: '0.8rem',
                color: '#ff9999',
                fontFamily: 'monospace',
                textAlign: 'left',
                marginBottom: '1.5rem',
                overflowX: 'auto'
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={14} /> Refresh Page
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={this.handleReset}
              >
                <Home size={14} /> Return to Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
