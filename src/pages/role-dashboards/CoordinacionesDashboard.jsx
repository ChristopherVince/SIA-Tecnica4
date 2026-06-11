import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/layout/Layout'

const CONFIG = {
  label: 'Coordinaciones',
  badgeClasses: 'bg-purple-100 text-purple-800 border border-purple-200',
  color: 'purple',
}

function CoordinacionesDashboard() {
  const { currentUser } = useAuth()

  return (
    <Layout user={currentUser} roleConfig={CONFIG} roleId="coordinaciones">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-slate-900">Panel de Coordinaciones</h1>
        <p className="text-sm text-slate-500 mt-1">Gestión académica por áreas y academias.</p>
      </div>

      <div className="bg-surface-lowest rounded-xl shadow-sm border border-slate-200/60 p-8 text-center max-w-4xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-purple-600 text-3xl">category</span>
        </div>
        <h2 className="text-2xl font-headline font-bold text-slate-900 mb-2">Academias</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm">
          Planeación y evaluación del cuerpo docente por asignatura técnica o general.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="p-5 bg-purple-50/50 border border-purple-100 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-purple-600">book</span>
              <p className="text-sm font-headline font-bold text-purple-900">Planeaciones</p>
            </div>
            <p className="text-xs text-purple-700">Revisión de planes de estudio y secuencias didácticas.</p>
          </div>
          <div className="p-5 bg-purple-50/50 border border-purple-100 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-purple-600">fact_check</span>
              <p className="text-sm font-headline font-bold text-purple-900">Evaluaciones</p>
            </div>
            <p className="text-xs text-purple-700">Seguimiento a los métodos y criterios de evaluación.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CoordinacionesDashboard
