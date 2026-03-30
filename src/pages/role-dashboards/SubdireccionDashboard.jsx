import { useAuth } from '../../context/AuthContext'
import DashboardHeader from '../../components/DashboardHeader'

const SUBDIRECCION_CONFIG = {
  label: 'Subdirección',
  badgeClasses: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300',
  headerGradient: 'bg-gradient-to-r from-indigo-700 to-indigo-950',
}

function SubdireccionDashboard() {
  const { currentUser } = useAuth()
  const nombre = currentUser?.nombre ?? currentUser?.email

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        nombreUsuario={nombre}
        rolLabel={SUBDIRECCION_CONFIG.label}
        rolConfig={SUBDIRECCION_CONFIG}
      />

      <header className={SUBDIRECCION_CONFIG.headerGradient + ' text-white'}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">Panel de Subdirección</h1>
          <p className="text-white/70">Supervisión académica y disciplinaria del plantel</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Panel de Supervisión</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Supervisa la academia y disciplina de los alumnos de la institución.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm font-medium text-indigo-900">👥 Expedientes</p>
              <p className="text-xs text-indigo-700 mt-1">Consulta historial del alumno</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm font-medium text-indigo-900">📊 Reportes</p>
              <p className="text-xs text-indigo-700 mt-1">Monitoreo de disciplina</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SubdireccionDashboard
