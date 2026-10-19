import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useApp } from '../store.jsx'

const icons = {
  success: <CheckCircle size={18} color="var(--clr-green)" />,
  error:   <XCircle size={18} color="var(--clr-primary)" />,
  info:    <Info size={18} color="var(--clr-blue)" />,
  warning: <AlertTriangle size={18} color="var(--clr-yellow)" />,
}

export default function ToastContainer() {
  const { state, dispatch } = useApp()
  const remove = (id) => dispatch({ type: 'REMOVE_TOAST', id })

  return (
    <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      {state.toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <span className="alert-icon">{icons[t.type] || icons.info}</span>
          <span style={{ flex: 1, fontSize: '0.875rem', lineHeight: 1.5 }}>{t.message}</span>
          <button className="btn-icon" style={{ flexShrink: 0 }} onClick={() => remove(t.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
