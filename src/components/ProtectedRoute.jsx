import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg
          className="animate-spin h-10 w-10 text-white/60"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-white/50 text-sm tracking-wide">Verificando sesión...</p>
      </div>
    </div>
  )
}

// allowedRoles: string[] — roles que pueden acceder a las rutas hijas.
// Si se omite, cualquier usuario autenticado puede acceder.
function ProtectedRoute({ allowedRoles }) {
  const { currentUser, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!currentUser) return <Navigate to="/" replace />

  if (allowedRoles && !allowedRoles.includes(currentUser.rol)) {
    return <Navigate to="/sin-acceso" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
