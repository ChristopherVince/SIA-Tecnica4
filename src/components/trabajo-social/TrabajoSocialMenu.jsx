import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import ExpedientesView from './funcionalidades/ExpedientesView'
import FichasMedicasView from './funcionalidades/FichasMedicasView'
import ControlDocumentosView from './funcionalidades/ControlDocumentosView'
import CitatoriosView from './funcionalidades/CitatoriosView'
import SolicitudesView from './funcionalidades/SolicitudesView'

const ACCESOS_RAPIDOS = [
  { action: 'expedientes',        icon: 'person_search',          color: 'emerald', title: 'Buscar alumno',           desc: 'Consulta el expediente de cualquier alumno del turno.' },
  { action: 'control_documentos', icon: 'checklist',              color: 'sky',     title: 'Control de documentos',   desc: 'Revisa quién ha entregado sus documentos de inscripción.' },
  { action: 'citatorios',         icon: 'notification_important', color: 'amber',   title: 'Citatorios y reportes',   desc: 'Emite notificaciones y registra el historial de seguimiento.' },
  { action: 'solicitudes',        icon: 'cloud_download',         color: 'violet',  title: 'Solicitudes digitales',   desc: 'Revisa y aprueba formularios enviados en línea por tutores.' },
]

function TrabajoSocialMenu({ activeFunction }) {
  const { currentUser } = useAuth()
  const turno = currentUser?.turno ?? ''
  const [currentView, setCurrentView] = useState('inicio')

  useEffect(() => {
    if (activeFunction) setCurrentView(activeFunction)
  }, [activeFunction])

  const renderContent = () => {
    switch (currentView) {
      case 'expedientes':        return <ExpedientesView />
      case 'fichas_medicas':     return <FichasMedicasView />
      case 'control_documentos': return <ControlDocumentosView />
      case 'citatorios':         return <CitatoriosView />
      case 'solicitudes':        return <SolicitudesView />

      default:
        return (
          <div className="space-y-6">
            {/* Hero */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-emerald-300">diversity_1</span>
                    <h1 className="text-3xl font-headline font-bold">Trabajo Social</h1>
                  </div>
                  <p className="text-sm text-emerald-100 mt-2 max-w-2xl">
                    Gestión de expedientes, seguimiento familiar y documentación escolar del alumnado.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4 min-w-[220px]">
                  <p className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">Turno activo</p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {turno === 'matutino' ? 'Matutino' : turno === 'vespertino' ? 'Vespertino' : 'Sin asignar'}
                  </p>
                  <p className="text-xs text-emerald-300 mt-1">Solo gestionas alumnos de tu turno.</p>
                </div>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-headline font-bold text-slate-700 uppercase tracking-wide mb-4">
                Accesos rápidos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {ACCESOS_RAPIDOS.map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() => setCurrentView(item.action)}
                    className="text-left rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 p-4 transition"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${item.color}-100 flex items-center justify-center mb-3`}>
                      <span className={`material-symbols-outlined text-${item.color}-600 text-xl`}>{item.icon}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Info de estructura de datos */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-xl mt-0.5 shrink-0">info</span>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Datos vinculados al alumno</p>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Toda la información capturada aquí (tutor, médica, documentos, citatorios) se guarda en
                  el expediente del alumno bajo su CURP, separada de los datos académicos para no interferir
                  con el flujo de Control Escolar.
                </p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  )
}

export default TrabajoSocialMenu
