import { useAuth } from '../../context/AuthContext'
import DashboardHeader from '../../components/DashboardHeader'

const TRABAJO_SOCIAL_CONFIG = {
  label: 'Trabajo Social',
  badgeClasses: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  headerGradient: 'bg-gradient-to-r from-emerald-600 to-emerald-900',
}

function TrabajoSocialDashboard() {
  const { currentUser } = useAuth()
  const nombre = currentUser?.nombre ?? currentUser?.email

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        nombreUsuario={nombre}
        rolLabel={TRABAJO_SOCIAL_CONFIG.label}
        rolConfig={TRABAJO_SOCIAL_CONFIG}
      />

      <header className={TRABAJO_SOCIAL_CONFIG.headerGradient + ' text-white'}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">Panel de Trabajo Social</h1>
          <p className="text-white/70">Atención y seguimiento socioeconómico del alumnado</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Seguimiento Social</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Realiza seguimiento socioeconómico y atención a alumnos en situación vulnerable.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm font-medium text-emerald-900">👥 Expedientes</p>
              <p className="text-xs text-emerald-700 mt-1">Consulta para atención social</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm font-medium text-emerald-900">💼 Casos</p>
              <p className="text-xs text-emerald-700 mt-1">Registro y visitas domiciliarias</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TrabajoSocialDashboard
