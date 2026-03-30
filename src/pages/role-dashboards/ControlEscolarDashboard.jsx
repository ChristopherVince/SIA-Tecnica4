import { useAuth } from '../../context/AuthContext'
import DashboardHeader from '../../components/DashboardHeader'

const CONTROL_ESCOLAR_CONFIG = {
  label: 'Control Escolar',
  badgeClasses: 'bg-teal-100 text-teal-800 ring-1 ring-teal-300',
  headerGradient: 'bg-gradient-to-r from-teal-600 to-teal-900',
}

function ControlEscolarDashboard() {
  const { currentUser } = useAuth()
  const nombre = currentUser?.nombre ?? currentUser?.email

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        nombreUsuario={nombre}
        rolLabel={CONTROL_ESCOLAR_CONFIG.label}
        rolConfig={CONTROL_ESCOLAR_CONFIG}
      />

      <header className={CONTROL_ESCOLAR_CONFIG.headerGradient + ' text-white'}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">Panel de Control Escolar</h1>
          <p className="text-white/70">Gestión del registro académico del alumnado</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestión de Registros</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Administra el padrón de alumnos y su información académica.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-teal-50 rounded-lg">
              <p className="text-sm font-medium text-teal-900">📚 Padrón</p>
              <p className="text-xs text-teal-700 mt-1">Alta, baja y edición de registros</p>
            </div>
            <div className="p-4 bg-teal-50 rounded-lg">
              <p className="text-sm font-medium text-teal-900">📖 Historial</p>
              <p className="text-xs text-teal-700 mt-1">Calificaciones por período</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ControlEscolarDashboard
