import { useCallback, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../../../../config/firebase'
import { useAuth } from '../../../../context/AuthContext'
import {
  AREAS_CURRICULARES,
  BLOQUES,
  GRUPOS_POR_TURNO,
  GRADOS_VALIDOS,
  createEmptyCalificacionesDoc,
  getAllMaterias,
  getAsignaturasRegulares,
  normalizeInputValue,
  normalizeLoadedCalificaciones,
  parseNumberOrNull,
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

function IntInput({ value, disabled, onChange }) {
  const handleChange = (e) => {
    const raw = e.target.value
    if (raw === '') { onChange(e); return }
    const n = parseInt(raw, 10)
    if (!isNaN(n)) {
      const clamped = Math.min(Math.max(n, 0), 99)
      onChange({ target: { value: String(clamped) } })
      return
    }
    onChange(e)
  }
  return (
    <input
      type="number"
      min="0"
      max="99"
      step="1"
      value={value}
      disabled={disabled}
      onChange={handleChange}
      placeholder="0"
      className={`w-10 rounded border px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 ${
        disabled
          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'border-slate-300 text-slate-900 focus:ring-orange-400'
      }`}
    />
  )
}

function InasistenciasView() {
  const { currentUser } = useAuth()
  const turno = (currentUser?.turno ?? '').toLowerCase()
  const gruposDisponibles = GRUPOS_POR_TURNO[turno] ?? []

  const [grado, setGrado]        = useState('')
  const [grupo, setGrupo]        = useState('')
  const [cicloEscolar, setCiclo] = useState(CURRENT_CYCLE())
  const [activeBlock, setActiveBlock] = useState('b1')

  const [alumnos, setAlumnos] = useState([])
  const [calMap, setCalMap]   = useState({})
  const [dirtySet, setDirty]  = useState(new Set())
  const [loaded, setLoaded]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const currentBlock = BLOQUES.find((b) => b.id === activeBlock) ?? BLOQUES[0]
  const blockPrefix  = currentBlock.id
  const canLoad      = Boolean(grado && grupo)

  const asignaturas  = useMemo(() => getAsignaturasRegulares(grado), [grado])
  const todasMaterias = useMemo(() => getAllMaterias(grado), [grado])

  // ── Cargar grupo ──────────────────────────────────────────────────────────
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

  // ── Edición individual ────────────────────────────────────────────────────
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

  // ── Guardar todo el grupo ─────────────────────────────────────────────────
  const handleSaveAll = async () => {
    if (!dirtySet.size) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const dirtyAlumnos = alumnos.filter((a) => dirtySet.has(a.id))

      await Promise.all(
        dirtyAlumnos.map((alumno) => {
          const calDoc = calMap[alumno.id] ?? createEmptyCalificacionesDoc(grado)
          const alumnoGrado = alumno.grado ?? grado

          // Construye el objeto inasistencias limpio (todos los bloques para no perder datos)
          const inasistencias = {}
          BLOQUES.forEach(({ id }) => {
            inasistencias[id] = Object.fromEntries(
              getAllMaterias(alumnoGrado).map(({ key }) => [
                key,
                parseNumberOrNull(calDoc.inasistencias?.[id]?.[key]),
              ])
            )
          })

          const ref = doc(db, 'alumnos', alumno.id, 'calificaciones', cicloEscolar)
          return setDoc(
            ref,
            {
              inasistencias,
              updatedAt: serverTimestamp(),
              alumnoCurp: alumno.id,
              grado: alumnoGrado,
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

  // ── Total de inasistencias del bloque por alumno ──────────────────────────
  const totalesBloque = useMemo(
    () => Object.fromEntries(
      alumnos.map((a) => {
        const bloqueData = calMap[a.id]?.inasistencias?.[blockPrefix] ?? {}
        const total = Object.values(bloqueData).reduce((acc, v) => {
          const n = parseNumberOrNull(v)
          return n !== null ? acc + n : acc
        }, 0)
        return [a.id, total]
      })
    ),
    [alumnos, calMap, blockPrefix],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-600">event_busy</span>
              </div>
              <h2 className="text-xl font-headline font-bold text-slate-900">Registro de Inasistencias</h2>
            </div>
            <p className="text-sm text-slate-500 ml-13">Inasistencias por materia — por bloque y grupo</p>
          </div>

          {loaded && dirtySet.size > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold shadow hover:bg-orange-700 disabled:opacity-60 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {saving ? 'Guardando…' : `Guardar (${dirtySet.size})`}
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="mt-5 flex flex-wrap gap-3 items-end">
          {/* Ciclo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Ciclo escolar</label>
            <input
              type="text"
              value={cicloEscolar}
              onChange={(e) => { setCiclo(e.target.value); setLoaded(false) }}
              placeholder="2024-2025"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Grado */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Grado</label>
            <select
              value={grado}
              onChange={(e) => { setGrado(e.target.value); setLoaded(false) }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">— Grado —</option>
              {GRADOS_VALIDOS.map((g) => (
                <option key={g} value={g}>{g}°</option>
              ))}
            </select>
          </div>

          {/* Grupo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Grupo</label>
            <select
              value={grupo}
              onChange={(e) => { setGrupo(e.target.value); setLoaded(false) }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">— Grupo —</option>
              {gruposDisponibles.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadGrupo}
            disabled={!canLoad || loading}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Cargando…' : 'Cargar grupo'}
          </button>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            <span className="material-symbols-outlined text-[16px]">error</span>{error}
          </div>
        )}
        {success && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>{success}
          </div>
        )}
      </div>

      {/* Tabs de bloque */}
      {loaded && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            {BLOQUES.map((bloque) => (
              <button
                key={bloque.id}
                onClick={() => setActiveBlock(bloque.id)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeBlock === bloque.id
                    ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-500'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {bloque.label}
                {dirtySet.size > 0 && activeBlock === bloque.id && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold">
                    {dirtySet.size}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                {/* Fila 1: secciones */}
                <tr className="bg-slate-100">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-20 bg-slate-100 min-w-[190px] px-3 py-2 text-left font-semibold text-slate-700 border-b border-r border-slate-300"
                  >
                    Alumno
                  </th>
                  {/* Asignaturas regulares */}
                  <th
                    colSpan={asignaturas.length}
                    className="px-2 py-1 text-center font-semibold text-slate-700 border border-slate-300 bg-slate-100"
                  >
                    Asignaturas
                  </th>
                  {/* Áreas curriculares */}
                  {AREAS_CURRICULARES.length > 0 && (
                    <th
                      colSpan={AREAS_CURRICULARES.length}
                      className="px-2 py-1 text-center font-semibold text-slate-600 border border-slate-300 bg-slate-50"
                    >
                      Áreas Curriculares
                    </th>
                  )}
                  <th
                    rowSpan={2}
                    className="bg-orange-50 w-14 px-2 py-2 text-center font-semibold text-orange-700 border-b border-l border-slate-300"
                  >
                    Total
                  </th>
                </tr>
                {/* Fila 2: nombre de cada materia */}
                <tr className="bg-slate-50">
                  {asignaturas.map((s) => (
                    <th
                      key={s.key}
                      className="w-12 px-1 py-1 text-center text-[10px] font-semibold text-slate-600 border-b border-l border-r border-slate-200"
                      title={s.label}
                    >
                      {s.short ?? s.label}
                    </th>
                  ))}
                  {AREAS_CURRICULARES.map((a) => (
                    <th
                      key={a.key}
                      className="w-12 px-1 py-1 text-center text-[10px] font-semibold text-slate-500 border-b border-r border-slate-200"
                      title={a.label}
                    >
                      {a.short ?? a.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {alumnos.map((alumno, idx) => {
                  const cal     = calMap[alumno.id] ?? createEmptyCalificacionesDoc(grado)
                  const isDirty = dirtySet.has(alumno.id)
                  const total   = totalesBloque[alumno.id] ?? 0
                  const rowBg   = isDirty ? 'bg-amber-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'

                  return (
                    <tr key={alumno.id} className={`border-b border-slate-100 ${rowBg}`}>
                      {/* Nombre sticky */}
                      <td className={`sticky left-0 z-10 px-3 py-1.5 font-medium text-slate-800 border-r border-slate-200 ${isDirty ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <span className="text-slate-400 mr-1">{idx + 1}.</span>
                        {nombreCompleto(alumno)}
                      </td>

                      {/* Asignaturas regulares */}
                      {asignaturas.map((s) => (
                        <td key={s.key} className="px-1 py-1.5 text-center border-r border-slate-100">
                          <IntInput
                            value={normalizeInputValue(cal.inasistencias?.[blockPrefix]?.[s.key])}
                            onChange={(e) => handleChange(alumno.id, `inasistencias.${blockPrefix}.${s.key}`, e.target.value)}
                          />
                        </td>
                      ))}

                      {/* Áreas curriculares */}
                      {AREAS_CURRICULARES.map((a) => (
                        <td key={a.key} className="px-1 py-1.5 text-center border-r border-slate-100">
                          <IntInput
                            value={normalizeInputValue(cal.inasistencias?.[blockPrefix]?.[a.key])}
                            onChange={(e) => handleChange(alumno.id, `inasistencias.${blockPrefix}.${a.key}`, e.target.value)}
                          />
                        </td>
                      ))}

                      {/* Total del bloque */}
                      <td className="px-2 py-1.5 text-center border-l border-slate-200">
                        <span className={`inline-block min-w-[28px] text-xs font-bold rounded px-1 py-0.5 ${
                          total === 0 ? 'text-slate-400' : total >= 10 ? 'bg-red-100 text-red-700' : total >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {total}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {alumnos.length === 0 && loaded && (
                  <tr>
                    <td colSpan={todasMaterias.length + 2} className="py-8 text-center text-slate-400 text-sm">
                      No se encontraron alumnos para {grado}° {grupo}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de la tabla */}
          {alumnos.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">{alumnos.length} alumno(s) — {currentBlock.label}</span>
              {dirtySet.size > 0 && (
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 disabled:opacity-60 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">save</span>
                  {saving ? 'Guardando…' : `Guardar cambios (${dirtySet.size})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estado vacío */}
      {!loaded && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm flex flex-col items-center text-center gap-3">
          <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
          <p className="text-sm text-slate-500">Selecciona el grado y grupo, luego haz clic en <strong>Cargar grupo</strong>.</p>
        </div>
      )}
    </div>
  )
}

export default InasistenciasView
