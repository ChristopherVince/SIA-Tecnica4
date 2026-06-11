import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/layout/Layout'
import { db } from '../../config/firebase'
import {
  BLOQUES,
  GRADOS_VALIDOS,
  GRUPOS_POR_TURNO,
  getAsignaturasRegulares,
  normalizeLoadedCalificaciones,
} from '../../components/control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'
import { generarBoletasPDF } from '../../components/control-escolar/funcionalidades/evaluacion-bloque/boletasPdfHelper'

const DIRECCION_CONFIG = {
  label: 'Direccion Principal',
  badgeClasses: 'bg-primary/10 text-primary border border-primary/20',
  color: 'primary',
}

const RESULT_LIMIT = 200

const getCurrentCycle = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

const getTurnoByGrupo = (grupo) => {
  const group = String(grupo ?? '').toUpperCase()
  if (GRUPOS_POR_TURNO.matutino.includes(group)) return 'Matutino'
  if (GRUPOS_POR_TURNO.vespertino.includes(group)) return 'Vespertino'
  return '-'
}

const formatTimestamp = (value) => {
  if (!value) return '-'
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString('es-MX')
  }
  return String(value)
}

function StudentDetailModal({
  student,
  cicloEscolar,
  isOpen,
  onClose,
  onToggleCalificaciones,
  showCalificaciones,
  calificaciones,
  calLoading,
  calError,
  onGenerarBoleta,
  boletaLoading,
  actionError,
  actionSuccess,
}) {
  if (!isOpen || !student) return null

  const fullName = [student.primerApellido, student.segundoApellido, student.nombre].filter(Boolean).join(' ')
  const normalized = calificaciones ? normalizeLoadedCalificaciones(calificaciones, student.grado) : null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-body">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-headline font-bold text-slate-900">{fullName || 'Alumno'}</h2>
            <p className="text-xs text-slate-500 mt-1">CURP: {student.curp ?? student.id}</p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Grado y grupo</p>
            <p className="text-sm text-slate-900 mt-1">{student.grado ?? '-'}° {student.grupo ?? '-'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Turno</p>
            <p className="text-sm text-slate-900 mt-1">{student.turno ?? getTurnoByGrupo(student.grupo)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Taller</p>
            <p className="text-sm text-slate-900 mt-1">{student.taller || 'Sin asignar'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Registro</p>
            <p className="text-sm text-slate-900 mt-1">{formatTimestamp(student.createdAt)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Ciclo escolar</p>
            <p className="text-sm text-slate-900 mt-1">{cicloEscolar || '-'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Ultima actualizacion</p>
            <p className="text-sm text-slate-900 mt-1">{formatTimestamp(student.updatedAt)}</p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onToggleCalificaciones}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900 transition"
            >
              {showCalificaciones ? 'Ocultar calificaciones' : 'Ver calificaciones'}
            </button>
            <button
              type="button"
              onClick={onGenerarBoleta}
              disabled={boletaLoading}
              className="flex-1 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
            >
              {boletaLoading ? 'Generando boleta...' : 'Generar boleta'}
            </button>
          </div>

          {actionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}
          {actionSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionSuccess}
            </div>
          )}

          {showCalificaciones && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Calificaciones</p>
                <span className="text-xs text-slate-500">{cicloEscolar || '-'}</span>
              </div>

              {calLoading && (
                <div className="mt-3 text-sm text-slate-500">Cargando calificaciones...</div>
              )}
              {calError && !calLoading && (
                <div className="mt-3 text-sm text-red-600">{calError}</div>
              )}

              {!calLoading && !calError && normalized && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-xs text-slate-700">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="py-2 pr-4">Asignatura</th>
                        {BLOQUES.map((block) => (
                          <th key={block.id} className="py-2 pr-3 text-center">{block.shortLabel}</th>
                        ))}
                        <th className="py-2 text-center">Prom</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {getAsignaturasRegulares(student.grado).map((subject) => {
                        const record = normalized.asignaturasRegulares?.[subject.key] ?? {}
                        return (
                          <tr key={subject.key}>
                            <td className="py-2 pr-4 font-medium text-slate-800">{subject.label}</td>
                            {BLOQUES.map((block) => (
                              <td key={block.id} className="py-2 pr-3 text-center">
                                {record[`${block.id}_cal`] ?? ''}
                              </td>
                            ))}
                            <td className="py-2 text-center font-semibold text-slate-800">
                              {record.promedio ?? ''}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DireccionDashboard() {
  const { currentUser, loading } = useAuth()

  const [searchMode, setSearchMode] = useState('grupo')
  const [filters, setFilters] = useState({
    grado: '',
    grupo: '',
    curp: '',
  })
  const [cicloEscolar, setCicloEscolar] = useState(getCurrentCycle())
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingRows, setLoadingRows] = useState(false)
  const [error, setError] = useState('')
  const [limitHit, setLimitHit] = useState(false)
  const [calCache, setCalCache] = useState({})
  const [calificaciones, setCalificaciones] = useState(null)
  const [calLoading, setCalLoading] = useState(false)
  const [calError, setCalError] = useState('')
  const [showCalificaciones, setShowCalificaciones] = useState(false)
  const [boletaLoading, setBoletaLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const gruposMatutino = GRUPOS_POR_TURNO.matutino
  const gruposVespertino = GRUPOS_POR_TURNO.vespertino

  const nombreCompleto = (alumno) =>
    [alumno.primerApellido, alumno.segundoApellido, alumno.nombre].filter(Boolean).join(' ')

  const filteredStudents = useMemo(() => {
    const text = searchTerm.trim().toLowerCase()
    if (!text) return students

    return students.filter((student) => {
      const fullName = nombreCompleto(student).toLowerCase()
      const curp = String(student.curp ?? student.id ?? '').toLowerCase()
      return fullName.includes(text) || curp.includes(text)
    })
  }, [students, searchTerm])

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const resetActionState = () => {
    setCalificaciones(null)
    setCalError('')
    setShowCalificaciones(false)
    setActionError('')
    setActionSuccess('')
  }

  const resetResults = () => {
    setStudents([])
    setSelectedStudent(null)
    setSearchTerm('')
    setLimitHit(false)
    resetActionState()
  }

  useEffect(() => {
    resetActionState()
  }, [selectedStudent, cicloEscolar])

  const loadCalificaciones = async (student) => {
    if (!student) return null

    const ciclo = String(cicloEscolar ?? '').trim()
    if (!ciclo) {
      setCalError('Captura el ciclo escolar para consultar calificaciones.')
      return null
    }

    const alumnoId = student.curp ?? student.id
    const cacheKey = `${alumnoId}-${ciclo}`
    if (calCache[cacheKey]) {
      setCalificaciones(calCache[cacheKey])
      return calCache[cacheKey]
    }

    setCalLoading(true)
    setCalError('')

    try {
      const calRef = doc(db, 'alumnos', alumnoId, 'calificaciones', ciclo)
      const snap = await getDoc(calRef)

      if (!snap.exists()) {
        setCalError('No hay calificaciones registradas para este ciclo.')
        setCalificaciones(null)
        return null
      }

      const data = snap.data()
      setCalificaciones(data)
      setCalCache((prev) => ({ ...prev, [cacheKey]: data }))
      return data
    } catch {
      setCalError('No se pudieron cargar las calificaciones.')
      setCalificaciones(null)
      return null
    } finally {
      setCalLoading(false)
    }
  }

  const handleToggleCalificaciones = async () => {
    setActionError('')
    setActionSuccess('')

    if (showCalificaciones) {
      setShowCalificaciones(false)
      return
    }

    setShowCalificaciones(true)
    await loadCalificaciones(selectedStudent)
  }

  const handleGenerarBoleta = async () => {
    if (!selectedStudent) return

    setActionError('')
    setActionSuccess('')

    const ciclo = String(cicloEscolar ?? '').trim()
    if (!ciclo) {
      setActionError('Captura el ciclo escolar para generar la boleta.')
      return
    }

    setBoletaLoading(true)

    try {
      const data = calificaciones ?? (await loadCalificaciones(selectedStudent))
      if (!data) {
        setActionError('No hay calificaciones registradas para este ciclo.')
        setBoletaLoading(false)
        return
      }

      const alumnoId = selectedStudent.curp ?? selectedStudent.id
      const alumnoForBoleta = { ...selectedStudent, id: alumnoId }
      const calMap = { [alumnoId]: data }
      const filename = `BOLETA_${alumnoId}_${ciclo}.pdf`
      await generarBoletasPDF([alumnoForBoleta], ciclo, calMap, filename)
      setActionSuccess('Boleta generada correctamente.')
    } catch {
      setActionError('No se pudo generar la boleta. Intenta de nuevo.')
    } finally {
      setBoletaLoading(false)
    }
  }

  const handleSearch = async () => {
    setError('')
    resetResults()

    if (searchMode === 'curp') {
      const curp = String(filters.curp ?? '').trim().toUpperCase()

      if (!curp) {
        setError('Ingresa la CURP para buscar.')
        return
      }

      if (!/^[A-Z0-9]{18}$/.test(curp)) {
        setError('La CURP debe tener 18 caracteres alfanumericos en mayusculas.')
        return
      }

      setLoadingRows(true)
      try {
        const alumnoRef = doc(db, 'alumnos', curp)
        const snap = await getDoc(alumnoRef)

        if (!snap.exists()) {
          setError('No se encontro un alumno con esa CURP.')
          setLoadingRows(false)
          return
        }

        const data = { id: snap.id, ...snap.data() }
        setStudents([data])
      } catch {
        setError('No se pudo cargar el alumno. Intenta de nuevo.')
      } finally {
        setLoadingRows(false)
      }

      return
    }

    if (!filters.grado || !filters.grupo) {
      setError('Selecciona grado y grupo para buscar.')
      return
    }

    setLoadingRows(true)
    try {
      const q = query(
        collection(db, 'alumnos'),
        where('grado', '==', String(filters.grado)),
        where('grupo', '==', String(filters.grupo).toUpperCase()),
        limit(RESULT_LIMIT + 1),
      )
      const snap = await getDocs(q)
      const rows = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))

      if (rows.length > RESULT_LIMIT) {
        setLimitHit(true)
        rows.splice(RESULT_LIMIT)
      }

      rows.sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))
      setStudents(rows)
    } catch {
      setError('No se pudieron cargar los alumnos. Intenta nuevamente.')
    } finally {
      setLoadingRows(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">autorenew</span>
      </div>
    )
  }

  return (
    <Layout user={currentUser} roleConfig={DIRECCION_CONFIG} roleId="direccion">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-slate-900">Panel de Direccion</h1>
        <p className="text-sm text-slate-500 mt-1">Acceso global al padron y expedientes del alumnado.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">Filtros de consulta</h2>
            <p className="text-xs text-slate-500 mt-1">Selecciona los datos de busqueda para encontrar alumnos.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchMode('grupo')
                setFilters((prev) => ({ ...prev, curp: '' }))
                resetResults()
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                searchMode === 'grupo'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              Buscar por grado y grupo
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode('curp')
                resetResults()
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                searchMode === 'curp'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              Buscar por CURP
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {searchMode === 'curp' ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_auto] gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-2">Ciclo escolar</span>
              <input
                type="text"
                value={cicloEscolar}
                onChange={(event) => setCicloEscolar(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="2025-2026"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-2">CURP</span>
              <input
                type="text"
                value={filters.curp}
                onChange={handleFilterChange('curp')}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="CURP del alumno"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-2">Busqueda rapida</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Filtrar resultados"
              />
            </label>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loadingRows}
              className="h-[42px] rounded-lg bg-slate-900 text-white px-5 text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
            >
              {loadingRows ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-2">Ciclo escolar</span>
              <input
                type="text"
                value={cicloEscolar}
                onChange={(event) => setCicloEscolar(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="2025-2026"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-2">Grado</span>
              <select
                value={filters.grado}
                onChange={handleFilterChange('grado')}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="" disabled>Selecciona un grado</option>
                {GRADOS_VALIDOS.map((grado) => (
                  <option key={grado} value={grado}>
                    {grado}°
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-2">Grupo</span>
              <select
                value={filters.grupo}
                onChange={handleFilterChange('grupo')}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="" disabled>Selecciona un grupo</option>
                <optgroup label="Matutino">
                  {gruposMatutino.map((grupo) => (
                    <option key={grupo} value={grupo}>
                      {grupo}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Vespertino">
                  {gruposVespertino.map((grupo) => (
                    <option key={grupo} value={grupo}>
                      {grupo}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-2">Busqueda rapida</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Filtrar resultados"
              />
            </label>

            <button
              type="button"
              onClick={handleSearch}
              disabled={loadingRows}
              className="h-[42px] rounded-lg bg-slate-900 text-white px-5 text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
            >
              {loadingRows ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 mb-4">
        <h2 className="font-headline font-bold text-slate-800 text-lg">Resultados</h2>
        <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full">
          {filteredStudents.length} alumnos
        </span>
      </div>

      {limitHit && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Se muestran los primeros {RESULT_LIMIT} resultados. Ajusta filtros para cargar un grupo mas pequeno.
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200/60 border-dashed">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">person_search</span>
          <h3 className="font-headline font-bold text-slate-700">No hay coincidencias</h3>
          <p className="text-slate-500 text-sm mt-1">Selecciona filtros y presiona Buscar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="bg-white border border-slate-200/60 rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="flex gap-4 items-start mb-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-headline font-bold text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {(student.nombre ?? 'A').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-headline font-bold text-slate-800 text-sm leading-tight truncate"
                    title={nombreCompleto(student)}
                  >
                    {nombreCompleto(student)}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] opacity-70">tag</span>
                    {student.curp ?? student.id}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  {student.grado ?? '-'}° {student.grupo ?? '-'}
                </span>
                <span className="text-xs text-slate-500">{student.turno ?? getTurnoByGrupo(student.grupo)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <StudentDetailModal
        student={selectedStudent}
        cicloEscolar={cicloEscolar}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        onToggleCalificaciones={handleToggleCalificaciones}
        showCalificaciones={showCalificaciones}
        calificaciones={calificaciones}
        calLoading={calLoading}
        calError={calError}
        onGenerarBoleta={handleGenerarBoleta}
        boletaLoading={boletaLoading}
        actionError={actionError}
        actionSuccess={actionSuccess}
      />
    </Layout>
  )
}

export default DireccionDashboard
