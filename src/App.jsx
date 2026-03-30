import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SinAcceso from './pages/SinAcceso'
import DireccionDashboard from './pages/role-dashboards/DireccionDashboard'
import SubdireccionDashboard from './pages/role-dashboards/SubdireccionDashboard'
import ControlEscolarDashboard from './pages/role-dashboards/ControlEscolarDashboard'
import CoordinacionesDashboard from './pages/role-dashboards/CoordinacionesDashboard'
import TrabajoSocialDashboard from './pages/role-dashboards/TrabajoSocialDashboard'
import PrefecturaDashboard from './pages/role-dashboards/PrefecturaDashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/" element={<Login />} />

          {/* Rutas protegidas — requieren sesión activa */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sin-acceso" element={<SinAcceso />} />
          </Route>

          {/* Dashboards específicos por rol */}
          <Route element={<ProtectedRoute allowedRoles={['direccion']} />}>
            <Route path="/dashboard/direccion" element={<DireccionDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['subdireccion']} />}>
            <Route path="/dashboard/subdireccion" element={<SubdireccionDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['control_escolar']} />}>
            <Route path="/dashboard/control-escolar" element={<ControlEscolarDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['coordinaciones']} />}>
            <Route path="/dashboard/coordinaciones" element={<CoordinacionesDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['trabajo_social']} />}>
            <Route path="/dashboard/trabajo-social" element={<TrabajoSocialDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['prefectura']} />}>
            <Route path="/dashboard/prefectura" element={<PrefecturaDashboard />} />
          </Route>

          {/* Cualquier ruta desconocida redirige al login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
