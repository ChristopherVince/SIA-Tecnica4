import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../context/AuthContext'
import { generarBoletasPDF } from './evaluacion-bloque/boletasPdfHelper'
import { GRADOS_VALIDOS, GRUPOS_POR_TURNO } from './evaluacion-bloque/evaluacionBloqueConfig'

const getCurrentCycle = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

const nombreCompleto = (a) =>
  [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ')

function BoletasView() {
  const { currentUser } = useAuth()
  const turno = (currentUser?.turno ?? '').toLowerCase()
  const gruposDisponibles = GRUPOS_POR_TURNO[turno] ?? []

  const [grado, setGrado]         = useState('')
  const [grupo, setGrupo]         = useState('')
  const [cicloEscolar, setCiclo]  = useState(getCurrentCycle())
  const [alumnos, setAlumnos]     = useState([])
  const [selected, setSelected]   = useState(null)
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  // Cargar alumnos cuando cambia grado/grupo
  useEffect(() => {
    if (!grado || !grupo) { setAlumnos([]); setSelected(null); return }
    setLoading(true)
    setError('')
    setSelected(null)
    getDocs(query(collection(db, 'alumnos'), where('grado', '==', grado), where('grupo', '==', grupo)))
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => !a.egresado && a.estatus !== 'egresado')
          .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))
        setAlumnos(list)
      })
      .catch(() => setError('No se pudo cargar la lista de alumnos.'))
      .finally(() => setLoading(false))
  }, [grado, grupo])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(''), 7000)
    return () => clearTimeout(t)
  }, [success])

  // Carga calificaciones para un conjunto de alumnos
  const loadCalMap = async (lista) => {
    const entries = await Promise.all(
      lista.map(async (a) => {
        const snap = await getDoc(doc(db, 'alumnos', a.id, 'calificaciones', cicloEscolar))
        return [a.id, snap.exists() ? snap.data() : {}]
      }),
    )
    return Object.fromEntries(entries)
  }

  const handleGenerarUno = async () => {
    if (!selected) return
    setGenerating(true)
    setError('')
    try {
      const calMap = await loadCalMap([selected])
      const filename = `BOLETA_${selected.id}_${cicloEscolar}.pdf`
      await generarBoletasPDF([selected], cicloEscolar, calMap, filename)
      setSuccess(`Boleta de ${nombreCompleto(selected)} generada correctamente.`)
    } catch (err) {
      console.error(err)
      setError('No se pudo generar la boleta. Revisa la consola.')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerarTodos = async () => {
    if (!alumnos.length) return
    setGenerating(true)
    setError('')
    try {
      const calMap = await loadCalMap(alumnos)
      const filename = `BOLETAS_${grado}${grupo}_${cicloEscolar}.pdf`
      await generarBoletasPDF(alumnos, cicloEscolar, calMap, filename)
      setSuccess(`Boletas del grupo ${grado}°${grupo} generadas (${alumnos.length} alumnos).`)
    } catch (err) {
      console.error(err)
      setError('No se pudo generar las boletas. Revisa la consola.')
    } finally {
      setGenerating(false)
    }
  }

  const alumnosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return alumnos
    return alumnos.filter((a) =>
      `${nombreCompleto(a)} ${a.id}`.toLowerCase().includes(q),
    )
  }, [alumnos, search])

  const canGenerarUno  = Boolean(selected && !generating)
  const canGenerarTodos = Boolean(alumnos.length && grado && grupo && !generating)

  return (
    <div className="flex-1 bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-amber-300">description</span>
            <div>
              <h1 className="text-3xl font-headline font-bold">Boletas de Calificaciones</h1>
              <p className="text-sm text-slate-300 mt-1">
                Genera boletas en formato media hoja (2 por página) para un alumno o para todo el grupo.
              </p>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

          {/* Columna izquierda: filtros + lista */}
          <div className="space-y-4">

            {/* Filtros */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide mb-4">
                Filtros
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="block">
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">Grado</span>
                  <select
                    value={grado}
                    onChange={(e) => { setGrado(e.target.value); setGrupo('') }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Selecciona</option>
                    {GRADOS_VALIDOS.map((g) => (
                      <option key={g} value={g}>{g}°</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">Grupo</span>
                  <select
                    value={grupo}
                    onChange={(e) => setGrupo(e.target.value)}
                    disabled={!grado}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Selecciona</option>
                    {gruposDisponibles.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">Ciclo escolar</span>
                  <input
                    type="text"
                    value={cicloEscolar}
                    onChange={(e) => setCiclo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="2025-2026"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">Buscar alumno</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nombre o CURP"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </label>
              </div>
            </div>

            {/* Lista de alumnos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">
                  Alumnos
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {alumnosFiltrados.length} de {alumnos.length}
                </span>
              </div>

              <div className="overflow-y-auto max-h-96">
                {loading ? (
                  <div className="p-6 text-center text-sm text-slate-500">Cargando alumnos...</div>
                ) : !grado || !grupo ? (
                  <div className="p-6 text-center text-sm text-slate-400">Selecciona grado y grupo para ver los alumnos.</div>
                ) : alumnosFiltrados.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">Sin resultados.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {alumnosFiltrados.map((a) => {
                      const isActive = selected?.id === a.id
                      return (
                        <div
                          key={a.id}
                          onClick={() => setSelected(isActive ? null : a)}
                          className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-rose-50 border-l-4 border-rose-500'
                              : 'hover:bg-slate-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-rose-600' : 'text-slate-400'}`}>
                              person
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isActive ? 'text-rose-800' : 'text-slate-800'}`}>
                              {nombreCompleto(a)}
                            </p>
                            <p className="text-xs text-slate-400 font-mono truncate">{a.id}</p>
                          </div>
                          {isActive && (
                            <span className="ml-auto shrink-0 text-xs font-semibold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                              Seleccionado
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: acciones */}
          <div className="space-y-4">

            {/* Boleta individual */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-rose-600 text-[20px]">person</span>
                </div>
                <div>
                  <h3 className="text-sm font-headline font-bold text-slate-900">Boleta individual</h3>
                  <p className="text-xs text-slate-500">Un alumno por generación</p>
                </div>
              </div>

              {selected ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 mb-4">
                  <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Alumno seleccionado</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{nombreCompleto(selected)}</p>
                  <p className="text-xs text-slate-500 font-mono">{selected.id}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
                  <p className="text-xs text-slate-400">Selecciona un alumno de la lista para generar su boleta.</p>
                </div>
              )}

              <button
                onClick={handleGenerarUno}
                disabled={!canGenerarUno}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                  canGenerarUno
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {generating ? 'Generando PDF...' : 'Descargar boleta (1 alumno)'}
              </button>
            </div>

            {/* Boletas de grupo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">group</span>
                </div>
                <div>
                  <h3 className="text-sm font-headline font-bold text-slate-900">Boletas de grupo</h3>
                  <p className="text-xs text-slate-500">Todos los alumnos del grupo</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
                {grado && grupo ? (
                  <>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Grupo seleccionado</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{grado}° Grupo {grupo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{alumnos.length} alumno(s) activos</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">Selecciona grado y grupo para continuar.</p>
                )}
              </div>

              <button
                onClick={handleGenerarTodos}
                disabled={!canGenerarTodos}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                  canGenerarTodos
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {generating ? 'Generando PDF...' : `Descargar boletas (${alumnos.length || 0} alumnos)`}
              </button>
            </div>

            {/* Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-slate-400 text-[18px] mt-0.5">info</span>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Todas las boletas usan formato <strong>media hoja</strong> (2 por página A4).</p>
                  <p>El PDF se descargará automáticamente al generarse.</p>
                  <p>Si un alumno no tiene calificaciones registradas en el ciclo seleccionado, sus celdas quedarán vacías.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoletasView
