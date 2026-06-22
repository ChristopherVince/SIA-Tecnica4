import { useState, useEffect } from 'react'
import InscripcionesView from './funcionalidades/InscripcionesView'
import AsignacionTallerView from './funcionalidades/AsignacionTallerView'
import EvaluacionBloqueView from './funcionalidades/evaluacion-bloque/EvaluacionBloqueView'
import InasistenciasView from './funcionalidades/evaluacion-bloque/InasistenciasView'
import EvaluacionesRecuperacionView from './funcionalidades/evaluacion-bloque/EvaluacionesRecuperacionView'
import BoletasView from './funcionalidades/BoletasView'
import ReportesView from './funcionalidades/ReportesView'
import ProcesosVariosView from './funcionalidades/ProcesosVariosView'

function ControlEscolarMenu({ activeFunction }) {
  const [currentView, setCurrentView] = useState('inicio')

  useEffect(() => {
    if (activeFunction) {
      setCurrentView(activeFunction)
    }
  }, [activeFunction])

  const renderContent = () => {
    switch (currentView) {
      case 'inicio':
        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="max-w-3xl">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-rose-600 text-3xl">home</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-slate-900">Bienvenido al Sistema de Control Escolar</h2>
              <p className="mt-3 text-sm text-slate-600 leading-6">
                Desde esta sección podrás acceder a las funciones operativas del área. Por ahora solo verás esta pantalla de bienvenida;
                más adelante agregaremos módulos, accesos rápidos y herramientas de trabajo.
              </p>
            </div>
          </div>
        )
      case 'inscripciones':
        return <InscripcionesView />
      case 'asignacion_taller':
        return <AsignacionTallerView />
      case 'evaluacion_bloque':
        return <EvaluacionBloqueView />
      case 'inasistencias':
        return <InasistenciasView />
      case 'evaluaciones_recuperacion':
        return <EvaluacionesRecuperacionView />
      case 'boletas':
        return <BoletasView />
      case 'reportes':
        return <ReportesView />
      case 'procesos_varios':
        return <ProcesosVariosView />
      default:
        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-headline font-bold text-slate-900">Selecciona una opción del menú</h2>
            <p className="mt-2 text-sm text-slate-600">Usa la barra lateral para navegar entre Inicio e Inicio de Ciclo.</p>
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

export default ControlEscolarMenu
