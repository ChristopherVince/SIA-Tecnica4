import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../context/AuthContext'

const TALLERES = [
  { id: 'ADMINISTRACION', label: 'ADMINISTRACION', icon: 'business_center' },
  { id: 'ADMINISTRACION CONTABLE', label: 'ADMINISTRACION CONTABLE', icon: 'calculate' },
  { id: 'CONFEC. VESTIDO E IND. TEXTIL', label: 'CONFEC. VESTIDO E IND. TEXTIL', icon: 'checkroom' },
  { id: 'DISENO DE CIRCUITOS ELECTRICOS', label: 'DISENO DE CIRCUITOS ELECTRICOS', icon: 'electric_bolt' },
  { id: 'DISENO INDUSTRIAL', label: 'DISENO INDUSTRIAL', icon: 'design_services' },
  { id: 'ELECTRONICA', label: 'ELECTRONICA', icon: 'memory' },
  { id: 'INFORMATICA', label: 'INFORMATICA', icon: 'computer' },
  { id: 'MECANICA', label: 'MECANICA', icon: 'precision_manufacturing' },
  { id: 'OFIMATICA', label: 'OFIMATICA', icon: 'keyboard' },
]

const OPCION_SIN_TALLER = '__SIN_TALLER__'

const TODOS_LOS_GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const GRUPOS_POR_TURNO = {
  matutino: ['A', 'B', 'C', 'D', 'E', 'F'],
  vespertino: ['G', 'H', 'I', 'J', 'K', 'L'],
}

function AsignacionTallerView() {
  const { currentUser } = useAuth()
  const [grado, setGrado] = useState('')
  const [grupo, setGrupo] = useState('')
  const [tallerSeleccionado, setTallerSeleccionado] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [alumnos, setAlumnos] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const turnoUsuario = (currentUser?.turno ?? '').toLowerCase()
  const gruposEditables = GRUPOS_POR_TURNO[turnoUsuario] ?? []

  const nombreCompleto = (alumno) =>
    [alumno.primerApellido, alumno.segundoApellido, alumno.nombre].filter(Boolean).join(' ')

  const tieneTallerAsignado = (alumno) => {
    const taller = alumno?.taller
    if (typeof taller === 'string') return taller.trim().length > 0
    return Boolean(taller)
  }

  const cargarAlumnos = async () => {
    if (!grupo) {
      setAlumnos([])
      setSelectedIds([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const filters = [where('grupo', '==', grupo)]
      if (grado) filters.push(where('grado', '==', grado))

      const q = query(collection(db, 'alumnos'), ...filters)
      const snap = await getDocs(q)
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

      rows.sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))
      setAlumnos(rows)
      setSelectedIds([])
    } catch {
      setError('No se pudieron cargar los alumnos para asignación de taller.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarAlumnos()
  }, [grado, grupo])

  const alumnosFiltrados = useMemo(() => {
    if (estadoFiltro === 'sin_taller') {
      return alumnos.filter((a) => !tieneTallerAsignado(a))
    }
    if (estadoFiltro === 'con_taller') {
      return alumnos.filter((a) => tieneTallerAsignado(a))
    }
    return alumnos
  }, [alumnos, estadoFiltro])

  const estadisticas = useMemo(() => {
    const conTaller = alumnos.filter((a) => tieneTallerAsignado(a)).length
    const sinTaller = alumnos.filter((a) => !tieneTallerAsignado(a)).length
    return {
      total: alumnos.length,
      conTaller,
      sinTaller,
      seleccionados: selectedIds.length,
    }
  }, [alumnos, selectedIds])

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const seleccionarTodosVisibles = (checked) => {
    if (!checked) {
      setSelectedIds([])
      return
    }

    const idsAsignables = alumnosFiltrados
      .filter((alumno) => gruposEditables.includes(String(alumno.grupo ?? '').toUpperCase()))
      .map((alumno) => alumno.id)

    setSelectedIds(idsAsignables)
  }

  const aplicarTaller = async (ids) => {
    if (!tallerSeleccionado) {
      setError('Selecciona un taller antes de asignar.')
      return
    }

    if (ids.length === 0) {
      setError('Selecciona al menos un alumno para asignar taller.')
      return
    }

    setAssigning(true)
    setError('')
    setSuccess('')

    const tallerParaGuardar =
      tallerSeleccionado === OPCION_SIN_TALLER ? '' : tallerSeleccionado

    try {
      const chunkSize = 300
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize)
        const batch = writeBatch(db)

        chunk.forEach((id) => {
          const ref = doc(db, 'alumnos', id)
          batch.set(
            ref,
            {
              taller: tallerParaGuardar,
              tallerAssignedAt: serverTimestamp(),
              tallerAssignedBy: currentUser?.uid ?? null,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          )
        })

        await batch.commit()
      }

      setSuccess(
        tallerSeleccionado === OPCION_SIN_TALLER
          ? `Taller eliminado correctamente para ${ids.length} alumno(s).`
          : `Taller asignado correctamente a ${ids.length} alumno(s).`,
      )
      setSelectedIds([])
      await cargarAlumnos()
    } catch {
      setError('No se pudo asignar el taller. Intenta de nuevo.')
    } finally {
      setAssigning(false)
    }
  }

  const allVisibleSelected =
    alumnosFiltrados.length > 0 &&
    alumnosFiltrados
      .filter((alumno) => gruposEditables.includes(String(alumno.grupo ?? '').toUpperCase()))
      .every((alumno) => selectedIds.includes(alumno.id))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-headline font-bold text-slate-900">Asignación de Taller de Tecnología</h2>
        <p className="text-sm text-slate-500 mt-1">Visualiza alumnos con/sin taller y asigna su taller en Firestore.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-headline font-bold text-slate-700 mb-4 uppercase tracking-wide">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Grado</label>
            <select
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Todos los grados</option>
              <option value="1">1er Grado</option>
              <option value="2">2do Grado</option>
              <option value="3">3er Grado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Grupo</label>
            <select
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Selecciona un grupo</option>
              {TODOS_LOS_GRUPOS.map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="todos">Todos</option>
              <option value="sin_taller">Sin taller</option>
              <option value="con_taller">Con taller</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Taller a asignar</label>
            <select
              value={tallerSeleccionado}
              onChange={(e) => setTallerSeleccionado(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Selecciona un taller</option>
              <option value={OPCION_SIN_TALLER}>Dejar vacio (Sin taller)</option>
              {TALLERES.map((taller) => (
                <option key={taller.id} value={taller.label}>
                  {taller.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-headline font-bold text-slate-700 mb-4 uppercase tracking-wide">Talleres Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => setTallerSeleccionado(OPCION_SIN_TALLER)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              tallerSeleccionado === OPCION_SIN_TALLER
                ? 'border-rose-500 bg-rose-50'
                : 'border-slate-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined ${
                tallerSeleccionado === OPCION_SIN_TALLER ? 'text-rose-600' : 'text-slate-500'
              }`}>remove_circle</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Sin taller</p>
                <p className="text-xs text-slate-500">Dejar vacio el campo taller</p>
              </div>
            </div>
          </button>

          {TALLERES.map((taller) => (
            <button
              key={taller.id}
              onClick={() => setTallerSeleccionado(taller.label)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                tallerSeleccionado === taller.label
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-slate-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${
                  tallerSeleccionado === taller.label ? 'text-rose-600' : 'text-slate-500'
                }`}>{taller.icon}</span>
                <p className="text-sm font-semibold text-slate-800">{taller.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-slate-700">{estadisticas.total}</p>
          <p className="text-xs text-slate-600 font-semibold mt-1">Total en filtro</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{estadisticas.conTaller}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Con taller</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{estadisticas.sinTaller}</p>
          <p className="text-xs text-amber-700 font-semibold mt-1">Sin taller</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{estadisticas.seleccionados}</p>
          <p className="text-xs text-indigo-700 font-semibold mt-1">Seleccionados</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-sm font-headline font-bold text-slate-700 uppercase tracking-wide">Asignaciones por grupo</h3>
          <button
            onClick={() => aplicarTaller(selectedIds)}
            disabled={assigning || selectedIds.length === 0 || !tallerSeleccionado}
            className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            {assigning ? 'Asignando...' : `Asignar seleccionados (${selectedIds.length})`}
          </button>
        </div>

        {!grupo ? (
          <div className="text-center py-8 text-slate-500 text-sm">Selecciona un grupo en filtros para visualizar alumnos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={allVisibleSelected}
                      onChange={(e) => seleccionarTodosVisibles(e.target.checked)}
                    />
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">CURP</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">Nombre</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">Grado-Grupo</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">Taller actual</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">Cargando alumnos...</td>
                  </tr>
                ) : alumnosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">No hay alumnos para los filtros seleccionados.</td>
                  </tr>
                ) : (
                  alumnosFiltrados.map((alumno) => {
                    const alumnoGrupo = String(alumno.grupo ?? '').toUpperCase()
                    const puedeEditar = gruposEditables.includes(alumnoGrupo)
                    const tieneTaller = tieneTallerAsignado(alumno)
                    return (
                      <tr key={alumno.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedIds.includes(alumno.id)}
                            disabled={!puedeEditar}
                            onChange={() => toggleSelected(alumno.id)}
                          />
                        </td>
                        <td className="py-3 px-2 text-xs font-mono text-slate-700">{alumno.curp ?? alumno.id}</td>
                        <td className="py-3 px-2 text-sm text-slate-800">{nombreCompleto(alumno)}</td>
                        <td className="py-3 px-2 text-sm text-slate-700">{alumno.grado}-{alumno.grupo}</td>
                        <td className="py-3 px-2">
                          {tieneTaller ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {alumno.taller}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              Sin taller
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {puedeEditar ? (
                            <button
                              onClick={() => aplicarTaller([alumno.id])}
                              disabled={assigning || !tallerSeleccionado}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Asignar
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Solo lectura</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AsignacionTallerView
