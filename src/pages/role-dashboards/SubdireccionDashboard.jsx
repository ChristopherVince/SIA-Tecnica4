import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/layout/Layout'

const CONFIG = {
  label: 'Subdirección',
  badgeClasses: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  color: 'indigo',
}

function SubdireccionDashboard() {
  const { currentUser } = useAuth()

  return (
    <Layout user={currentUser} roleConfig={CONFIG} roleId="subdireccion">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-slate-900">Panel de Subdirección</h1>
        <p className="text-sm text-slate-500 mt-1">Supervisión académica y coordinación general.</p>
      </div>

      <div className="bg-surface-lowest rounded-xl shadow-sm border border-slate-200/60 p-8 text-center max-w-4xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-indigo-600 text-3xl">admin_panel_settings</span>
        </div>
        <h2 className="text-2xl font-headline font-bold text-slate-900 mb-2">Supervisión General</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm">
          Vista general de estadísticas y control académico de todos los turnos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-indigo-600">bar_chart</span>
              <p className="text-sm font-headline font-bold text-indigo-900">Métricas</p>
            </div>
            <p className="text-xs text-indigo-700">Analítica de rendimiento y asistencia general.</p>
          </div>
          <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-indigo-600">groups</span>
              <p className="text-sm font-headline font-bold text-indigo-900">Plantilla</p>
            </div>
            <p className="text-xs text-indigo-700">Revisión del personal docente y horarios.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SubdireccionDashboard
