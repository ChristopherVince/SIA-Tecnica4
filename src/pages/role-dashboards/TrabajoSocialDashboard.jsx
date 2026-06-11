import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/layout/Layout'

const CONFIG = {
  label: 'Trabajo Social',
  badgeClasses: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  color: 'emerald',
}

function TrabajoSocialDashboard() {
  const { currentUser } = useAuth()

  return (
    <Layout user={currentUser} roleConfig={CONFIG} roleId="trabajo_social">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-slate-900">Panel de Trabajo Social</h1>
        <p className="text-sm text-slate-500 mt-1">Atención y seguimiento socioeconómico del alumnado.</p>
      </div>

      <div className="bg-surface-lowest rounded-xl shadow-sm border border-slate-200/60 p-8 text-center max-w-4xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-emerald-600 text-3xl">diversity_1</span>
        </div>
        <h2 className="text-2xl font-headline font-bold text-slate-900 mb-2">Seguimiento Social</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm">
          Realiza seguimiento socioeconómico y atención a alumnos en situación vulnerable.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-emerald-600">folder_shared</span>
              <p className="text-sm font-headline font-bold text-emerald-900">Expedientes</p>
            </div>
            <p className="text-xs text-emerald-700">Consulta para atención social y seguimiento familiar.</p>
          </div>
          <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-emerald-600">home_work</span>
              <p className="text-sm font-headline font-bold text-emerald-900">Visitas & Casos</p>
            </div>
            <p className="text-xs text-emerald-700">Registro de visitas domiciliarias y casos especiales.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default TrabajoSocialDashboard
