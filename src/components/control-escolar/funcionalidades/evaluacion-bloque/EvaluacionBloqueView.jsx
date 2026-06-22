import { useCallback, useMemo, useState } from 'react'
import ReportesBloqueModal from './ReportesBloqueModal'
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../../../../config/firebase'
import { useAuth } from '../../../../context/AuthContext'
import {
  AREAS_CURRICULARES,
  BLOQUES,
  GRUPOS_POR_TURNO,
  GRADOS_VALIDOS,
  buildPersistedCalificaciones,
  calculateBlockAverage,
  createEmptyCalificacionesDoc,
  getAsignaturasRegulares,
  normalizeInputValue,
  normalizeLoadedCalificaciones,
  updateNestedValue,
} from './evaluacionBloqueConfig'

const CURRENT_CYCLE = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

function nombreCompleto(a) {
  return [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ')
}

// Input compacto reutilizable
function NumInput({ value, disabled, onChange, placeholder, maxVal = 10 }) {
  const handleChange = (e) => {
    const raw = e.target.value
    if (raw === '') { onChange(e); return }
    const n = parseFloat(raw)
    if (!isNaN(n)) {
      const clamped = Math.min(Math.max(n, 0), maxVal)
      if (clamped !== n) {
        onChange({ target: { value: String(clamped) } })
        return
      }
    }
    onChange(e)
  }
  return (
    <input
      type="number"
      min="0"
      max={maxVal}
      step="0.1"
      value={value}
      disabled={disabled}
      onChange={handleChange}
      placeholder={placeholder ?? '—'}
      className={`w-12 rounded border px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 ${
        disabled
          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'border-slate-300 text-slate-900 focus:ring-rose-400'
      }`}
    />
  )
}

function EvaluacionBloqueView() {
  const { currentUser } = useAuth()
  const turno = (currentUser?.turno ?? '').toLowerCase()
  const gruposDisponibles = GRUPOS_POR_TURNO[turno] ?? []

  const [grado, setGrado]           = useState('')
  const [grupo, setGrupo]           = useState('')
  const [cicloEscolar, setCiclo]    = useState(CURRENT_CYCLE())
  const [activeBlock, setActiveBlock] = useState('b1')

  const [alumnos, setAlumnos] = useState([])
  const [calMap, setCalMap]   = useState({})   // { [curp]: calificacionesDoc }
  const [dirtySet, setDirty]  = useState(new Set())
  const [loaded, setLoaded]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [showReportes, setShowReportes] = useState(false)

  const currentBlock = BLOQUES.find((b) => b.id === activeBlock) ?? BLOQUES[0]
  const blockPrefix  = currentBlock.id   // 'b1' | 'b2' | 'b3'
  const canLoad      = Boolean(grado && grupo)

  // Asignaturas que aplican al grado seleccionado (varían por grado)
  const asignaturas  = useMemo(() => getAsignaturasRegulares(grado), [grado])

  // ── Cargar grupo ───────────────────────────────────────────────────────────
  const loadGrupo = async () => {
    if (!canLoad) return
    setLoading(true)
    setError('')
    setSuccess('')
    setLoaded(false)

    try {
      const alumnosSnap = await getDocs(
        query(collection(db, 'alumnos'), where('grado', '==', grado), where('grupo', '==', grupo)),
      )

      const list = alumnosSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))

      // Leer calificaciones de todos en paralelo (1 read por alumno)
      const calDocs = await Promise.all(
        list.map((a) => getDoc(doc(db, 'alumnos', a.id, 'calificaciones', cicloEscolar))),
      )

      const newCalMap = {}
      list.forEach((a, i) => {
        newCalMap[a.id] = calDocs[i].exists()
          ? normalizeLoadedCalificaciones(calDocs[i].data(), grado)
          : createEmptyCalificacionesDoc(grado)
      })

      setAlumnos(list)
      setCalMap(newCalMap)
      setDirty(new Set())
      setLoaded(true)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el grupo. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Edición individual ─────────────────────────────────────────────────────
  const handleChange = useCallback((curp, path, value) => {
    setCalMap((prev) => ({
      ...prev,
      [curp]: updateNestedValue(prev[curp] ?? createEmptyCalificacionesDoc(grado), path, value),
    }))
    setDirty((prev) => {
      const next = new Set(prev)
      next.add(curp)
      return next
    })
  }, [grado])

  // ── Guardar todo el grupo ──────────────────────────────────────────────────
  const handleSaveAll = async () => {
    if (!dirtySet.size) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const dirtyAlumnos = alumnos.filter((a) => dirtySet.has(a.id))

      await Promise.all(
        dirtyAlumnos.map((alumno) => {
          const alumnoGrado = alumno.grado ?? grado
          const calDoc  = calMap[alumno.id] ?? createEmptyCalificacionesDoc(alumnoGrado)
          const payload = buildPersistedCalificaciones(calDoc, currentBlock.shortLabel, alumnoGrado)
          const ref     = doc(db, 'alumnos', alumno.id, 'calificaciones', cicloEscolar)
          return setDoc(
            ref,
            {
              ...payload,
              updatedAt: serverTimestamp(),
              alumnoCurp: alumno.id,
              grado: alumno.grado ?? grado,
              grupo: alumno.grupo ?? grupo,
              cicloEscolar,
              turno,
            },
            { merge: true },
          )
        }),
      )

      setDirty(new Set())
      setSuccess(`${currentBlock.label} guardado: ${dirtyAlumnos.length} alumno(s) actualizados.`)
    } catch (err) {
      console.error(err)
      setError('Error al guardar. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  // ── Promedios de bloque por alumno (calculados en render) ──────────────────
  const blockAverages = useMemo(
    () => Object.fromEntries(
      alumnos.map((a) => [a.id, calculateBlockAverage(calMap[a.id], activeBlock, a.grado ?? grado)]),
    ),
    [alumnos, calMap, activeBlock, grado],
  )

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Control Escolar</p>
            <h2 className="text-2xl font-headline font-bold text-slate-900 mt-1">Evaluación de Bloque</h2>
            <p className="text-sm text-slate-500 mt-1">
              Carga un grupo completo y captura las calificaciones del bloque para todos a la vez.
            </p>
          </div>

          {/* Controles superiores */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de bloque */}
            <div className="flex flex-wrap gap-2">
              {BLOQUES.map((block) => (
                <button
                  key={block.id}
                  onClick={() => setActiveBlock(block.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeBlock === block.id
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {block.shortLabel}
                </button>
              ))}
            </div>

            {/* Divisor vertical */}
            <div className="hidden lg:block w-px h-7 bg-slate-200" />

            {/* Botón reportes */}
            <button
              type="button"
              onClick={() => setShowReportes(true)}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 transition"
            >
              <span className="material-symbols-outlined text-[16px]">summarize</span>
              Reportes de Bloque
            </button>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide mb-4">
          Seleccionar grupo
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">Grado</span>
            <select
              value={grado}
              onChange={(e) => { setGrado(e.target.value); setLoaded(false) }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Selecciona</option>
              {GRADOS_VALIDOS.map((g) => (
                <option key={g} value={g}>{g}er grado</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">Grupo</span>
            <select
              value={grupo}
              onChange={(e) => { setGrupo(e.target.value); setLoaded(false) }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Selecciona</option>
              {gruposDisponibles.map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">Ciclo escolar</span>
            <input
              type="text"
              value={cicloEscolar}
              onChange={(e) => { setCiclo(e.target.value); setLoaded(false) }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="2025-2026"
            />
          </label>

          <button
            onClick={loadGrupo}
            disabled={!canLoad || loading}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              canLoad && !loading
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Cargando...' : 'Cargar grupo'}
          </button>
        </div>
      </div>

      {/* ── Mensajes ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      {/* ── Tabla de grupo ── */}
      {loaded && alumnos.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Barra superior de la tabla */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">
                {grado}° Grado — Grupo {grupo} — {currentBlock.label}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {alumnos.length} alumno(s) · Ciclo {cicloEscolar}
                {dirtySet.size > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {dirtySet.size} con cambios
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving || dirtySet.size === 0}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                !saving && dirtySet.size > 0
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {saving
                ? 'Guardando...'
                : dirtySet.size > 0
                  ? `Guardar ${currentBlock.shortLabel} (${dirtySet.size})`
                  : 'Sin cambios'}
            </button>
          </div>

          {/* Tabla con scroll horizontal */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                {/* Fila 1: agrupador de materias */}
                <tr className="bg-slate-100">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-20 bg-slate-100 min-w-[190px] px-3 py-2 text-left font-semibold text-slate-700 border-b border-r border-slate-300"
                  >
                    Alumno
                  </th>
                  <th
                    rowSpan={2}
                    className="bg-slate-100 w-14 px-2 py-2 text-center font-semibold text-slate-600 border-b border-r border-slate-300"
                  >
                    Obs.
                  </th>
                  {asignaturas.map((s) => (
                    <th
                      key={s.key}
                      colSpan={1}
                      className="px-2 py-1 text-center font-semibold text-slate-700 border border-slate-300 bg-slate-100"
                      title={s.label}
                    >
                      {s.short ?? s.label}
                    </th>
                  ))}
                  {AREAS_CURRICULARES.map((a) => (
                    <th
                      key={a.key}
                      className="px-2 py-1 text-center font-semibold text-slate-600 border border-slate-300 bg-slate-100"
                      title={a.label}
                    >
                      {a.short ?? a.label}
                    </th>
                  ))}
                  <th
                    rowSpan={2}
                    className="bg-indigo-50 w-14 px-2 py-2 text-center font-semibold text-indigo-700 border-b border-l border-slate-300"
                  >
                    Prom.
                  </th>
                </tr>

                {/* Fila 2: Cal por materia */}
                <tr className="bg-slate-50">
                  {asignaturas.map((s) => (
                    <th key={s.key} className="w-12 px-1 py-1 text-center text-[10px] font-semibold text-slate-500 border-b border-l border-r border-slate-200">
                      Cal
                    </th>
                  ))}
                  {AREAS_CURRICULARES.map((a) => (
                    <th key={`${a.key}_cal`} className="w-12 px-1 py-1 text-center text-[10px] font-semibold text-slate-500 border-b border-r border-slate-200">
                      Cal
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {alumnos.map((alumno, idx) => {
                  const cal     = calMap[alumno.id] ?? createEmptyCalificacionesDoc(grado)
                  const isDirty = dirtySet.has(alumno.id)
                  const prom    = blockAverages[alumno.id]
                  const rowBg   = isDirty ? 'bg-amber-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'

                  return (
                    <tr key={alumno.id} className={`border-b border-slate-100 ${rowBg}`}>
                      {/* Nombre sticky */}
                      <td className={`sticky left-0 z-10 px-3 py-1.5 font-medium text-slate-800 border-r border-slate-200 ${isDirty ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <span className="text-slate-400 mr-1">{idx + 1}.</span>
                        {nombreCompleto(alumno)}
                      </td>

                      {/* Observaciones */}
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200">
                        <select
                          value={normalizeInputValue(cal.observaciones?.[blockPrefix])}
                          onChange={(e) => handleChange(alumno.id, `observaciones.${blockPrefix}`, e.target.value)}
                          className="w-14 rounded border border-slate-300 px-1 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                        >
                          <option value="">—</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                        </select>
                      </td>

                      {/* Asignaturas regulares */}
                      {asignaturas.map((subject) => {
                        const calField = `${blockPrefix}_cal`
                        const calVal   = normalizeInputValue(cal.asignaturasRegulares?.[subject.key]?.[calField])

                        return (
                          <td key={subject.key} className="px-1 py-1.5 text-center border-l border-r border-slate-200">
                            <NumInput
                              value={calVal}
                              onChange={(e) => handleChange(alumno.id, `asignaturasRegulares.${subject.key}.${calField}`, e.target.value)}
                            />
                          </td>
                        )
                      })}

                      {/* Áreas curriculares */}
                      {AREAS_CURRICULARES.map((area) => (
                        <td key={area.key} className="px-1 py-1.5 text-center border-l border-r border-slate-200">
                          <NumInput
                            value={normalizeInputValue(cal.areasCurriculares?.[area.key]?.[`${blockPrefix}_cal`])}
                            onChange={(e) => handleChange(alumno.id, `areasCurriculares.${area.key}.${blockPrefix}_cal`, e.target.value)}
                          />
                        </td>
                      ))}

                      {/* Promedio estimado del bloque */}
                      <td className="px-2 py-1.5 text-center font-semibold text-indigo-600 border-l border-slate-200">
                        {prom === '' ? '—' : prom}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pie de la tabla */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500">
              {currentBlock.label} · {grado}° {grupo} · Ciclo {cicloEscolar}
              <span className="ml-3 text-slate-400">
                Calificaciones: 0 – 10
              </span>
            </p>
            <button
              onClick={handleSaveAll}
              disabled={saving || dirtySet.size === 0}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                !saving && dirtySet.size > 0
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {saving ? 'Guardando...' : `Guardar ${currentBlock.shortLabel}`}
            </button>
          </div>
        </div>
      )}

      {/* Sin alumnos */}
      {loaded && alumnos.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No se encontraron alumnos en {grado}° Grupo {grupo}.
        </div>
      )}

      {/* Estado inicial */}
      {!loaded && !loading && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-400 text-3xl">table_view</span>
          </div>
          <p className="text-sm font-semibold text-slate-700">Selecciona grado y grupo</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Elige el grado, grupo y ciclo escolar, luego presiona "Cargar grupo" para mostrar la tabla de captura.
          </p>
        </div>
      )}

      {/* Modal de reportes */}
      {showReportes && (
        <ReportesBloqueModal
          onClose={() => setShowReportes(false)}
          defaultGrado={grado}
          defaultGrupo={grupo}
          defaultCiclo={cicloEscolar}
          defaultBloque={activeBlock}
        />
      )}

    </div>
  )
}

export default EvaluacionBloqueView
