import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../../../../config/firebase'
import { useAuth } from '../../../../context/AuthContext'
import {
  BLOQUES,
  GRUPOS_POR_TURNO,
  buildPersistedCalificaciones,
  getAsignaturasRegulares,
  normalizeLoadedCalificaciones,
  parseNumberOrNull,
} from './evaluacionBloqueConfig'

const getCurrentCycle = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

function EvaluacionesRecuperacionView() {
  const { currentUser } = useAuth()
  const turno = (currentUser?.turno ?? '').toLowerCase()
  const gruposDisponibles = GRUPOS_POR_TURNO[turno] ?? []

  const [grupo, setGrupo] = useState('')
  const [grado, setGrado] = useState('')
  const [estado, setEstado] = useState('pendientes')
  const [cicloEscolar, setCicloEscolar] = useState(getCurrentCycle())
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState('')
  const [rows, setRows] = useState([])
  const [docsByAlumno, setDocsByAlumno] = useState({})
  const [recuperacionValues, setRecuperacionValues] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const nombreCompleto = (alumno) =>
    [alumno.primerApellido, alumno.segundoApellido, alumno.nombre].filter(Boolean).join(' ')

  const normalizeGrade = (value) => String(value ?? '').trim()

  const hasRecoveryValue = (value) => {
    if (value === null || value === undefined || value === '') return false
    const parsed = Number(value)
    return Number.isFinite(parsed)
  }

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(''), 6000)
    return () => clearTimeout(timer)
  }, [success])

  const buildNoAprobatorias = (alumnos, docsMap) => {
    const list = []

    alumnos.forEach((alumno) => {
      // Solo procesar alumnos que tienen documento de calificaciones registrado
      if (!docsMap[alumno.id]) return

      const calificaciones = normalizeLoadedCalificaciones(docsMap[alumno.id], alumno.grado)

      getAsignaturasRegulares(alumno.grado).forEach((subject) => {
        BLOQUES.forEach((block) => {
          const calField = `${block.id}_cal`
          const recField = `${block.id}_r`
          const calValue = Number(calificaciones.asignaturasRegulares?.[subject.key]?.[calField])
          const recValue = calificaciones.asignaturasRegulares?.[subject.key]?.[recField]

          // Ignorar ceros automáticos o calificaciones aún no cargadas
          if (!Number.isFinite(calValue) || calValue === 0 || calValue >= 6) return

          const rowId = `${alumno.id}-${subject.key}-${block.id}`

          list.push({
            id: rowId,
            alumnoId: alumno.id,
            alumnoNombre: nombreCompleto(alumno),
            curp: alumno.curp ?? alumno.id,
            grado: alumno.grado ?? '-',
            grupo: alumno.grupo ?? '-',
            materiaKey: subject.key,
            materiaLabel: subject.label,
            bloqueId: block.id,
            bloqueLabel: block.shortLabel,
            calificacion: calValue,
            recuperacionActual: recValue ?? '',
            estaReevaluado: hasRecoveryValue(recValue),
          })
        })
      })
    })

    list.sort((a, b) => {
      const byName = a.alumnoNombre.localeCompare(b.alumnoNombre, 'es')
      if (byName !== 0) return byName
      if (a.bloqueId !== b.bloqueId) return a.bloqueId.localeCompare(b.bloqueId)
      return a.materiaLabel.localeCompare(b.materiaLabel, 'es')
    })

    return list
  }

  const loadRecuperaciones = async () => {
    if (!grupo) {
      setGrado('')
      setEstado('pendientes')
      setRows([])
      setRecuperacionValues({})
      setDocsByAlumno({})
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const alumnosSnap = await getDocs(query(collection(db, 'alumnos'), where('grupo', '==', grupo)))
      const alumnos = alumnosSnap.docs.map((snap) => ({ id: snap.id, ...snap.data() }))

      const docsEntries = await Promise.all(
        alumnos.map(async (alumno) => {
          const calRef = doc(db, 'alumnos', alumno.id, 'calificaciones', cicloEscolar)
          const calSnap = await getDoc(calRef)
          return [alumno.id, calSnap.exists() ? calSnap.data() : null]
        }),
      )

      const docsMap = Object.fromEntries(docsEntries)
      const noAprobatorias = buildNoAprobatorias(alumnos, docsMap)
      const initialRecuperaciones = Object.fromEntries(
        noAprobatorias.map((item) => [item.id, item.recuperacionActual === null ? '' : String(item.recuperacionActual)]),
      )

      const gradosEncontrados = [...new Set(alumnos.map((alumno) => normalizeGrade(alumno.grado)).filter(Boolean))]
      if (gradosEncontrados.length === 1) {
        setGrado(gradosEncontrados[0])
      } else if (grado && !gradosEncontrados.includes(grado)) {
        setGrado('')
      }

      setDocsByAlumno(docsMap)
      setRows(noAprobatorias)
      setRecuperacionValues(initialRecuperaciones)
    } catch {
      setError('No se pudo cargar la evaluación de recuperación para el grupo seleccionado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecuperaciones()
  }, [grupo, cicloEscolar])

  const gradosDisponibles = useMemo(() => {
    return [...new Set(rows.map((row) => normalizeGrade(row.grado)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (grado && normalizeGrade(row.grado) !== grado) return false
      if (estado === 'pendientes' && row.estaReevaluado) return false
      if (estado === 're-evaluados' && !row.estaReevaluado) return false
      return true
    })
  }, [rows, grado, estado])

  const handleSaveRecuperacion = async (row) => {
    const rawValue = String(recuperacionValues[row.id] ?? '').trim()
    const parsed = parseNumberOrNull(rawValue)

    if (rawValue !== '' && (parsed === null || parsed < 0 || parsed > 10)) {
      setError('La calificación de recuperación debe estar entre 0 y 10.')
      return
    }

    const currentDoc = normalizeLoadedCalificaciones(docsByAlumno[row.alumnoId] ?? {}, row.grado)
    const recField = `${row.bloqueId}_r`
    const updatedDoc = {
      ...currentDoc,
      asignaturasRegulares: {
        ...currentDoc.asignaturasRegulares,
        [row.materiaKey]: {
          ...currentDoc.asignaturasRegulares[row.materiaKey],
          [recField]: parsed,
        },
      },
    }

    const bloqueActual = BLOQUES.find((item) => item.id === row.bloqueId)
    const payload = buildPersistedCalificaciones(updatedDoc, bloqueActual?.shortLabel ?? 'B1', row.grado)

    setSavingId(row.id)
    setError('')
    setSuccess('')

    try {
      const ref = doc(db, 'alumnos', row.alumnoId, 'calificaciones', cicloEscolar)
      await setDoc(
        ref,
        {
          ...payload,
          updatedAt: serverTimestamp(),
          alumnoCurp: row.alumnoId,
          grado: row.grado,
          grupo: row.grupo,
          cicloEscolar,
          turno,
        },
        { merge: true },
      )

      setSuccess(`Recuperación guardada para ${row.alumnoNombre} (${row.materiaLabel}, ${row.bloqueLabel}).`)
      
      setTimeout(() => {
        loadRecuperaciones()
      }, 2500)
    } catch {
      setError('No se pudo guardar la calificación de recuperación.')
    } finally {
      setSavingId('')
    }
  }

  const stats = useMemo(() => {
    const alumnosUnicos = new Set(filteredRows.map((row) => row.alumnoId)).size
    return {
      incidencias: filteredRows.length,
      alumnos: alumnosUnicos,
    }
  }, [filteredRows])

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Calificaciones</p>
        <h2 className="text-2xl font-headline font-bold text-slate-900 mt-1">Evaluaciones de Recuperación</h2>
        <p className="text-sm text-slate-500 mt-1">
          Selecciona el grupo y registra la R para materias no aprobatorias (calificación menor a 6).
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Grupo</label>
            <select
              value={grupo}
              onChange={(e) => {
                setGrupo(e.target.value)
                setGrado('')
                setEstado('pendientes')
              }}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Selecciona un grupo</option>
              {gruposDisponibles.map((item) => (
                <option key={item} value={item}>Grupo {item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Grado</label>
            <select
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              disabled={!grupo}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Todos los grados</option>
              {gradosDisponibles.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ciclo escolar</label>
            <input
              value={cicloEscolar}
              onChange={(e) => setCicloEscolar(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="2025-2026"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              disabled={!grupo}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="pendientes">Aun sin re-evaluar</option>
              <option value="re-evaluados">Ya re-evaluados</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.alumnos}</p>
              <p className="text-xs font-semibold text-amber-700">Alumnos</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-rose-700">{stats.incidencias}</p>
              <p className="text-xs font-semibold text-rose-700">No aprobatorias</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {!grupo ? (
          <div className="text-sm text-slate-500 text-center py-8">Selecciona un grupo para consultar evaluaciones de recuperación.</div>
        ) : loading ? (
          <div className="text-sm text-slate-500 text-center py-8">Cargando incidencias del grupo...</div>
        ) : filteredRows.length === 0 ? (
          <div className="text-sm text-emerald-700 text-center py-8">
            No hay incidencias para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Alumno</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Grado</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">CURP</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Bloque</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Materia</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Calificación</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Estado</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">R (Recuperación)</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-800">{row.alumnoNombre}</p>
                      <p className="text-xs text-slate-500">{row.grado}-{row.grupo}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{row.grado}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">{row.curp}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {row.bloqueLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{row.materiaLabel}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                        {row.calificacion}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.estaReevaluado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {row.estaReevaluado ? 'Ya re-evaluado' : 'Aun sin re-evaluar'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={recuperacionValues[row.id] ?? ''}
                        onChange={(e) =>
                          setRecuperacionValues((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                        className="w-full max-w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Capturar R"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => handleSaveRecuperacion(row)}
                        disabled={savingId === row.id}
                        className="inline-flex items-center rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                      >
                        {savingId === row.id ? 'Guardando...' : 'Guardar R'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default EvaluacionesRecuperacionView
