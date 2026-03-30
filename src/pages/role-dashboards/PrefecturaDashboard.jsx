import { useAuth } from '../../context/AuthContext'
import DashboardHeader from '../../components/DashboardHeader'

const PREFECTURA_CONFIG = {
  label: 'Prefectura',
  badgeClasses: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300',
  headerGradient: 'bg-gradient-to-r from-orange-500 to-orange-800',
}

function PrefecturaDashboard() {
  const { currentUser } = useAuth()
  const nombre = currentUser?.nombre ?? currentUser?.email

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        nombreUsuario={nombre}
        rolLabel={PREFECTURA_CONFIG.label}
        rolConfig={PREFECTURA_CONFIG}
      />

      <header className={PREFECTURA_CONFIG.headerGradient + ' text-white'}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">Panel de Prefectura</h1>
          <p className="text-white/70">Control disciplinario y registro de asistencia</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Control Disciplinario</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Levanta reportes disciplinarios y registra la asistencia diaria del alumnado.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-900">📋 Reportes</p>
              <p className="text-xs text-orange-700 mt-1">Levanta reportes de conducta</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-900">📅 Asistencias</p>
              <p className="text-xs text-orange-700 mt-1">Registro diario de asistencias</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PrefecturaDashboard
