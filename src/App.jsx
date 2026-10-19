import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './store.jsx'
import Navbar from './components/Navbar.jsx'
import ToastContainer from './components/ToastContainer.jsx'
import Landing from './pages/Landing.jsx'
import ReportPage from './pages/ReportPage.jsx'
import MyReports from './pages/MyReports.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Coordination from './pages/Coordination.jsx'
import AuthPage from './pages/AuthPage.jsx'
import RoleSelect from './pages/RoleSelect.jsx'

export default function App() {
  return (
    <AppProvider>
      <Navbar />
      <ToastContainer />
      <Routes>
        <Route path="/"             element={<Landing />} />
        <Route path="/auth"         element={<AuthPage />} />
        <Route path="/role-select"  element={<RoleSelect />} />
        <Route path="/report"       element={<ReportPage />} />
        <Route path="/my-reports"   element={<MyReports />} />
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/coordination" element={<Coordination />} />
        <Route path="*"             element={<NotFound />} />
      </Routes>
    </AppProvider>
  )
}

function NotFound() {
  return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'2rem' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'5rem', marginBottom:'1rem' }}>🚨</div>
        <h1 style={{ marginBottom:'0.5rem' }}>Page Not Found</h1>
        <p className="text-muted" style={{ marginBottom:'1.5rem' }}>This page does not exist.</p>
        <a href="/" className="btn btn-primary">← Back to Home</a>
      </div>
    </div>
  )
}
