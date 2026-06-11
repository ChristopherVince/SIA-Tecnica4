import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/layout/Layout'

const CONFIG = {
  label: 'Prefectura',
  badgeClasses: 'bg-amber-100 text-amber-800 border border-amber-200',
  color: 'amber',
}

function PrefecturaDashboard() {
  const { currentUser } = useAuth()

  return (
    <Layout user={currentUser} roleConfig={CONFIG} roleId="prefectura">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-slate-900">Panel de Prefectura</h1>
        <p className="text-sm text-slate-500 mt-1">Control de asistencia y seguimiento disciplinario.</p>
      </div>

      <div className="bg-surface-lowest rounded-xl shadow-sm border border-slate-200/60 p-8 text-center max-w-4xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-amber-600 text-3xl">rule</span>
        </div>
        <h2 className="text-2xl font-headline font-bold text-slate-900 mb-2">Orden y Disciplina</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm">
          Registros de inasistencias, retardos y reportes conductuales.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-amber-600">how_to_reg</span>
              <p className="text-sm font-headline font-bold text-amber-900">Asistencias</p>
            </div>
            <p className="text-xs text-amber-700">Toma de lista y registro de inasistencias por grupo.</p>
          </div>
          <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-amber-600">report_problem</span>
              <p className="text-sm font-headline font-bold text-amber-900">Reportes</p>
            </div>
            <p className="text-xs text-amber-700">Gestión de incidencias y reportes disciplinarios.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default PrefecturaDashboard
