import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './store.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Navbar from './components/Navbar.jsx'
import ToastContainer from './components/ToastContainer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Landing from './pages/Landing.jsx'
import ReportPage from './pages/ReportPage.jsx'
import MyReports from './pages/MyReports.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Coordination from './pages/Coordination.jsx'
import AuthPage from './pages/AuthPage.jsx'
import RoleSelect from './pages/RoleSelect.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Navbar />
        <ToastContainer />
        <Routes>
        {/* First Page: Role Selection Gateway */}
        <Route path="/"             element={<RoleSelect />} />
        <Route path="/role-select"  element={<RoleSelect />} />
        <Route path="/about"        element={<Landing />} />

        {/* Authentication */}
        <Route path="/auth"         element={<AuthPage />} />

        {/* Public Citizen Incident Reporting */}
        <Route path="/report"       element={<ReportPage />} />
        <Route path="/my-reports"   element={<MyReports />} />

        {/* Protected Responder Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['responder', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Administrator Coordination Console */}
        <Route
          path="/coordination"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Coordination />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppProvider>
  </ErrorBoundary>
  )
}

function NotFound() {
  return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'2rem' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'5rem', marginBottom:'1rem' }}>🚨</div>
        <h1 style={{ marginBottom:'0.5rem' }}>Page Not Found</h1>
        <p className="text-muted" style={{ marginBottom:'1.5rem' }}>The requested resource does not exist.</p>
        <a href="/" className="btn btn-primary">← Return to Role Selection</a>
      </div>
    </div>
  )
}
