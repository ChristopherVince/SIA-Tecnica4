import { useAuth } from '../../context/AuthContext'
import DashboardHeader from '../../components/DashboardHeader'

const COORDINACIONES_CONFIG = {
  label: 'Coordinaciones',
  badgeClasses: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300',
  headerGradient: 'bg-gradient-to-r from-violet-700 to-violet-950',
}

function CoordinacionesDashboard() {
  const { currentUser } = useAuth()
  const nombre = currentUser?.nombre ?? currentUser?.email

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        nombreUsuario={nombre}
        rolLabel={COORDINACIONES_CONFIG.label}
        rolConfig={COORDINACIONES_CONFIG}
      />

      <header className={COORDINACIONES_CONFIG.headerGradient + ' text-white'}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">Panel de Coordinaciones</h1>
          <p className="text-white/70">Seguimiento por grupo y área académica</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10h.01M11 10h.01M7 10h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Seguimiento Académico</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Coordina grupos y monitorea el desempeño académico por área.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-violet-50 rounded-lg">
              <p className="text-sm font-medium text-violet-900">👥 Grupos</p>
              <p className="text-xs text-violet-700 mt-1">Alumnos segmentados por grado</p>
            </div>
            <div className="p-4 bg-violet-50 rounded-lg">
              <p className="text-sm font-medium text-violet-900">📋 Reportes</p>
              <p className="text-xs text-violet-700 mt-1">Vinculados a tu área académica</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CoordinacionesDashboard
