import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import {
  AREAS_CURRICULARES,
  BLOQUES,
  GRADOS_VALIDOS,
  GRUPOS_POR_TURNO,
  getAsignaturasRegulares,
} from './evaluacionBloqueConfig'

// ─── Catálogo de reportes ────────────────────────────────────────────────────

const REPORTES = [
  {
    id: 'conc_cal_grupo',
    label: 'Concentrados de calificaciones por grupo',
    icon: 'table_view',
    scope: 'grupo',
    desc: 'Tabla completa de calificaciones (cal., rec. y prom.) de todos los alumnos del grupo en el bloque seleccionado.',
  },
  {
    id: 'conc_cal_rec_grupo',
    label: 'Concentrados calif. y recomend. por grupo',
    icon: 'rate_review',
    scope: 'grupo',
    desc: 'Tabla horizontal con la calificación (C) y espacio de observaciones (O) de cada materia, promedio de bloque, Educación Socioemocional y Vida Saludable.',
  },
  {
    id: 'conc_inas_grupo',
    label: 'Concentrados inasistencias por grupo',
    icon: 'event_busy',
    scope: 'grupo',
    desc: 'Registro de inasistencias por trimestre para todos los alumnos del grupo.',
  },
  {
    id: 'conc_cal_asig',
    label: 'Concentrados calif. por asignatura',
    icon: 'menu_book',
    scope: 'grupo',
    needsAsignatura: true,
    desc: 'Calificaciones de todos los bloques para una asignatura específica del grupo seleccionado.',
  },
  {
    id: 'conc_cal_tec',
    label: 'Concentrados calif. por Tecnología',
    icon: 'build',
    scope: 'taller',
    desc: 'Concentrado de Tecnología para todos los grupos del turno que pertenecen al taller seleccionado.',
  },
  {
    id: 'list_repr_turno',
    label: 'Listado de reprobados por turno',
    icon: 'playlist_remove',
    scope: 'turno',
    desc: 'Alumnos con una o más materias reprobadas en el turno completo para el bloque indicado.',
  },
  {
    id: 'list_repr_grado',
    label: 'Listado de reprobados por grado',
    icon: 'format_list_numbered',
    scope: 'grado',
    desc: 'Alumnos con materias reprobadas en todos los grupos de un grado, en el bloque indicado.',
  },
  {
    id: 'list_repr_grupo',
    label: 'Listado de reprobados por grupo',
    icon: 'group_remove',
    scope: 'turno',
    needsGrupo: true,
    desc: 'Alumnos con materias reprobadas en el grupo seleccionado, mostrando los 3 grados.',
  },
  {
    id: 'reporte_estadistico',
    label: 'Reporte estadístico',
    icon: 'bar_chart',
    scope: 'grado',
    sublabel: 'Promedios / Aprob. / Reprob. / %',
    desc: 'Resumen estadístico por grupo: promedios, reprobados, aprobados y porcentajes por asignatura. Incluye totales de grado.',
  },
]

// ─── Etiqueta de scope ───────────────────────────────────────────────────────

const SCOPE_BADGE = {
  grupo:      { label: 'Por grupo',      color: 'bg-rose-100 text-rose-700' },
  grado:      { label: 'Por grado',      color: 'bg-indigo-100 text-indigo-700' },
  turno:      { label: 'Por turno',      color: 'bg-amber-100 text-amber-700' },
  asignatura: { label: 'Por asignatura', color: 'bg-emerald-100 text-emerald-700' },
  taller:     { label: 'Por taller',     color: 'bg-teal-100 text-teal-700' },
}

const TALLERES = [
  'ADMINISTRACION CONTABLE',
  'CONFEC. VESTIDO E IND. TEXTIL',
  'DISENO DE CIRCUITOS ELECTRICOS',
  'DISENO INDUSTRIAL',
  'MECANICA',
  'ELECTRONICA',
  'INFORMATICA',
]

// ─── Componente principal ────────────────────────────────────────────────────

export default function ReportesBloqueModal({ onClose, defaultGrado, defaultGrupo, defaultCiclo, defaultBloque }) {
  const { currentUser } = useAuth()
  const turno = (currentUser?.turno ?? '').toLowerCase()
  const gruposDisponibles = GRUPOS_POR_TURNO[turno] ?? []

  const [reporteId, setReporteId]   = useState(REPORTES[0].id)
  const [grado, setGrado]           = useState(defaultGrado ?? '')
  const [grupo, setGrupo]           = useState(defaultGrupo ?? '')
  const [bloque, setBloque]         = useState(defaultBloque ?? 'b1')
  const [ciclo, setCiclo]           = useState(defaultCiclo ?? '')
  const [asignatura, setAsignatura] = useState('')
  const [taller, setTaller]         = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError]         = useState('')

  const reporte     = useMemo(() => REPORTES.find((r) => r.id === reporteId), [reporteId])
  const asignaturas = useMemo(() => getAsignaturasRegulares(grado), [grado])
  const badge       = SCOPE_BADGE[reporte?.scope] ?? SCOPE_BADGE.grupo

  const handleSelectReporte = (id) => {
    setReporteId(id)
    setAsignatura('')
    setTaller('')
  }

  const handleGradoChange = (val) => {
    setGrado(val)
    setGrupo('')
    setAsignatura('')
  }

  // Validación básica para el botón
  const canGenerar = useMemo(() => {
    if (!ciclo) return false
    if (reporte?.scope !== 'taller' && !bloque) return false
    if (reporte?.needsAsignatura && !asignatura) return false
    if (reporte?.scope === 'grupo')      return Boolean(grado && grupo)
    if (reporte?.scope === 'grado')      return Boolean(grado)
    if (reporte?.scope === 'turno' && reporte?.needsGrupo) return Boolean(turno && grupo)
    if (reporte?.scope === 'turno')      return Boolean(turno)
    if (reporte?.scope === 'asignatura') return Boolean(grado && asignatura)
    if (reporte?.scope === 'taller')     return Boolean(grado && taller)
    return false
  }, [reporte, grado, grupo, bloque, ciclo, asignatura, turno, taller])

  // ── Generar PDF ──────────────────────────────────────────────────────────────
  const handleGenerar = useCallback(async () => {
    if (!canGenerar || isGenerating) return
    setIsGenerating(true)
    setGenError('')
    try {
      const helpers = await import('../../../../utils/reportesBloqueHelper')
      const params  = { grado, grupo, bloque, cicloEscolar: ciclo, turno, asignatura, taller }

      switch (reporteId) {
        case 'conc_cal_grupo':
          await helpers.generarConcentradoCalificaciones(params)
          break
        case 'conc_cal_rec_grupo':
          await helpers.generarCalificacionesObservaciones(params)
          break
        case 'conc_inas_grupo':
          await helpers.generarConcentradoInasistencias(params)
          break
        case 'conc_cal_asig':
          await helpers.generarConcentradoCaliAsignatura(params)
          break
        case 'conc_cal_tec':
          await helpers.generarConcentradoCaliTecnologia(params)
          break
        case 'list_repr_turno':
          await helpers.generarListadoReprobadosTurno(params)
          break
        case 'list_repr_grado':
          await helpers.generarListadoReprobadosGrado(params)
          break
        case 'list_repr_grupo':
          await helpers.generarListadoReprobadosGrupo(params)
          break
        case 'reporte_estadistico':
          await helpers.generarReporteEstadistico(params)
          break
        default:
          setGenError('Este reporte aún no está implementado.')
      }
    } catch (err) {
      console.error(err)
      setGenError('Ocurrió un error al generar el PDF. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }, [canGenerar, isGenerating, reporteId, grado, grupo, bloque, ciclo, turno, asignatura, taller])

  // ── Sección de filtros según scope ────────────────────────────────────────
  const renderFiltros = () => {
    const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500'
    const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5'

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Ciclo escolar — siempre presente */}
        <label className="block">
          <span className={labelCls}>Ciclo escolar</span>
          <input
            type="text"
            value={ciclo}
            onChange={(e) => setCiclo(e.target.value)}
            placeholder="2025-2026"
            className={inputCls}
          />
        </label>

        {/* Bloque — no aplica para scope taller (genera los 3) */}
        {reporte?.scope !== 'taller' && (
          <label className="block">
            <span className={labelCls}>Bloque</span>
            <select value={bloque} onChange={(e) => setBloque(e.target.value)} className={inputCls}>
              {BLOQUES.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </label>
        )}

        {/* Grado — aparece si el scope lo requiere */}
        {(reporte?.scope === 'grupo' || reporte?.scope === 'grado' || reporte?.scope === 'asignatura' || reporte?.scope === 'taller') && (
          <label className="block">
            <span className={labelCls}>Grado</span>
            <select value={grado} onChange={(e) => handleGradoChange(e.target.value)} className={inputCls}>
              <option value="">Selecciona</option>
              {GRADOS_VALIDOS.map((g) => (
                <option key={g} value={g}>{g}°</option>
              ))}
            </select>
          </label>
        )}

        {/* Grupo — solo para scope grupo */}
        {reporte?.scope === 'grupo' && (
          <label className="block">
            <span className={labelCls}>Grupo</span>
            <select
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              disabled={!grado}
              className={`${inputCls} disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <option value="">Selecciona</option>
              {gruposDisponibles.map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          </label>
        )}

        {/* Taller — solo scope taller */}
        {reporte?.scope === 'taller' && (
          <label className="block">
            <span className={labelCls}>Taller</span>
            <select
              value={taller}
              onChange={(e) => setTaller(e.target.value)}
              disabled={!grado}
              className={`${inputCls} disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <option value="">Selecciona</option>
              {TALLERES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        )}

        {/* Asignatura — scope asignatura O reportes que la requieran */}
        {(reporte?.scope === 'asignatura' || reporte?.needsAsignatura) && (
          <label className="block">
            <span className={labelCls}>Asignatura</span>
            <select
              value={asignatura}
              onChange={(e) => setAsignatura(e.target.value)}
              disabled={!grado}
              className={`${inputCls} disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <option value="">Selecciona</option>
              <optgroup label="Asignaturas">
                {asignaturas.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </optgroup>
              <optgroup label="Áreas Curriculares">
                {AREAS_CURRICULARES.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </optgroup>
            </select>
          </label>
        )}

        {/* Grupo — solo cuando el reporte lo requiere explícitamente */}
        {reporte?.needsGrupo && (
          <label className="block">
            <span className={labelCls}>Grupo</span>
            <select
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className={inputCls}
            >
              <option value="">Selecciona</option>
              {gruposDisponibles.map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          </label>
        )}

        {/* Turno — solo scope turno sin needsGrupo, modo informativo */}
        {reporte?.scope === 'turno' && !reporte?.needsGrupo && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:col-span-2">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Turno activo</p>
            <p className="text-sm font-bold text-amber-900 uppercase">{turno || 'Sin turno asignado'}</p>
            <p className="text-xs text-amber-600 mt-1">
              Este reporte incluirá todos los grupos de tu turno en el ciclo y bloque seleccionados.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[92vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">

        {/* ── Cabecera del modal ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-violet-600 text-[20px]">summarize</span>
            </div>
            <div>
              <h2 className="text-base font-headline font-bold text-slate-900">Reportes de Bloque</h2>
              <p className="text-xs text-slate-500">Selecciona el tipo de concentrado y configura los filtros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* ── Cuerpo (lista + detalle) ── */}
        <div className="flex flex-1 min-h-0 divide-x divide-slate-200">

          {/* ─ Columna izquierda: lista de reportes ─ */}
          <div className="w-64 shrink-0 overflow-y-auto py-3">
            {REPORTES.map((r) => {
              const isActive = r.id === reporteId
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectReporte(r.id)}
                  className={`w-full text-left px-4 py-3 transition flex items-start gap-3 border-l-[3px] ${
                    isActive
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${
                    isActive ? 'text-violet-600' : 'text-slate-400'
                  }`}>
                    {r.icon}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${
                      isActive ? 'text-violet-700' : 'text-slate-700'
                    }`}>
                      {r.label}
                    </p>
                    {r.sublabel && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.sublabel}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* ─ Columna derecha: detalle + filtros ─ */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Encabezado del reporte seleccionado */}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-violet-600 text-[22px]">
                  {reporte?.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base font-headline font-bold text-slate-900">{reporte?.label}</h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{reporte?.desc}</p>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-slate-100" />

            {/* Filtros dinámicos */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Configurar reporte
              </p>
              {renderFiltros()}
            </div>

            {/* Nota de validación */}
            {!canGenerar && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">info</span>
                <p className="text-xs text-slate-500">
                  {!ciclo
                    ? 'Ingresa el ciclo escolar para continuar.'
                    : reporte?.scope === 'grupo' && !grado
                      ? 'Selecciona grado y grupo para generar este reporte.'
                    : reporte?.scope === 'grupo' && !grupo
                      ? 'Selecciona el grupo para generar este reporte.'
                    : reporte?.needsGrupo && !grupo
                      ? 'Selecciona el grupo para generar este reporte.'
                    : reporte?.scope === 'grado' && !grado
                      ? 'Selecciona el grado para generar este reporte.'
                    : reporte?.scope === 'asignatura' && (!grado || !asignatura)
                      ? 'Selecciona grado y asignatura para generar este reporte.'
                    : reporte?.scope === 'taller' && !grado
                      ? 'Selecciona el grado para continuar.'
                    : reporte?.scope === 'taller' && !taller
                      ? 'Selecciona el taller para generar este reporte.'
                    : 'Completa los filtros requeridos.'}
                </p>
              </div>
            )}

            {/* Error de generación */}
            {genError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
                <p className="text-xs text-red-700">{genError}</p>
              </div>
            )}

            {/* Botón generar */}
            <button
              type="button"
              disabled={!canGenerar || isGenerating}
              onClick={handleGenerar}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
                canGenerar && !isGenerating
                  ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isGenerating ? 'hourglass_top' : 'picture_as_pdf'}
              </span>
              {isGenerating ? 'Generando PDF...' : 'Generar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
