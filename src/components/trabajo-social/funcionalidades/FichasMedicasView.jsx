import { useEffect, useState } from 'react'
import {
  collection, collectionGroup, doc, getDoc, getDocs,
  query, updateDoc, where, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../context/AuthContext'

const TIPOS_CONDICION = ['Alergia', 'Enfermedad crónica', 'Barrera de aprendizaje', 'NEE']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nombreDesdeTS(ts) {
  const a = ts?.alumno
  if (!a) return '—'
  return `${a.apellidoPaterno ?? ''} ${a.apellidoMaterno ?? ''} ${a.nombre ?? ''}`.trim()
}

function BadgeEstado({ completada }) {
  return completada ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
      <span className="material-symbols-outlined text-xs">check_circle</span>Completada
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
      <span className="material-symbols-outlined text-xs">pending</span>Pendiente
    </span>
  )
}

// ─── Modal de ficha médica ────────────────────────────────────────────────────
function FichaModal({ curp, tsData, alumnoNombre, onClose, onGuardado }) {
  const { currentUser } = useAuth()
  const ficha = tsData?.fichaMedica ?? {}

  const [tipos,      setTipos]      = useState(ficha.tipos ?? [])
  const [diagnostico, setDiagnostico] = useState(ficha.diagnostico ?? '')
  const [situacion,  setSituacion]  = useState(ficha.situacionActual ?? '')
  const [guardando,  setGuardando]  = useState(false)
  const [error,      setError]      = useState('')

  const toggleTipo = (t) =>
    setTipos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const guardar = async () => {
    if (tipos.length === 0) { setError('Selecciona al menos un tipo de condición.'); return }
    if (!diagnostico.trim()) { setError('El diagnóstico es obligatorio.'); return }
    setError('')
    setGuardando(true)
    try {
      const ref = doc(db, 'alumnos', curp, 'trabajo_social', 'datos')
      await setDoc(ref, {
        turno: currentUser?.turno ?? '',
        fichaMedica: {
          tipos,
          diagnostico:     diagnostico.trim(),
          situacionActual: situacion.trim(),
          fechaRegistro:   new Date().toISOString(),
          registradoPor:   currentUser?.nombre ?? currentUser?.email ?? '—',
        },
        fichaCompletada: true,
      }, { merge: true })
      onGuardado()
    } catch (err) {
      console.error(err)
      setError('Error al guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const yaCompletada = !!tsData?.fichaCompletada

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col">

        {/* Cabecera */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
          <div>
            <p className="text-[11px] text-emerald-300 uppercase tracking-wider">Ficha médica</p>
            <h2 className="text-base font-bold mt-0.5">{alumnoNombre}</h2>
            <p className="text-xs font-mono text-emerald-300 mt-0.5">{curp}</p>
          </div>
          <button onClick={onClose} className="text-emerald-300 hover:text-white transition mt-0.5 shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1">

          {/* Información declarada por el tutor (solo lectura) */}
          {(tsData?.tieneEnfermedad || tsData?.cualEnfermedad) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                Declarado por el tutor en la inscripción
              </p>
              <p className="text-xs text-amber-800">
                <span className="font-semibold">¿Padece enfermedad o NEE?</span>{' '}
                {tsData.tieneEnfermedad}
              </p>
              {tsData.cualEnfermedad && (
                <p className="text-xs text-amber-800 mt-1">
                  <span className="font-semibold">Descripción:</span>{' '}
                  {tsData.cualEnfermedad}
                </p>
              )}
            </div>
          )}

          {/* Tipo de condición */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
              Tipo de condición <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_CONDICION.map(t => (
                <label
                  key={t}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition text-sm ${
                    tipos.includes(t)
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tipos.includes(t)}
                    onChange={() => toggleTipo(t)}
                    className="accent-emerald-600"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* Diagnóstico */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Diagnóstico <span className="text-red-400">*</span>
            </label>
            <textarea
              value={diagnostico}
              onChange={e => setDiagnostico(e.target.value)}
              rows={3}
              placeholder="Describe el diagnóstico o la condición identificada…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          {/* Situación actual */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Situación actual
            </label>
            <textarea
              value={situacion}
              onChange={e => setSituacion(e.target.value)}
              rows={3}
              placeholder="Condición actual del alumno, tratamiento que lleva, observaciones relevantes…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          {/* Metadatos si ya estaba completada */}
          {yaCompletada && ficha.fechaRegistro && (
            <p className="text-[11px] text-slate-400">
              Última actualización:{' '}
              {new Date(ficha.fechaRegistro).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}{ficha.registradoPor}
            </p>
          )}

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>{error}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition"
          >
            {guardando ? 'Guardando…' : yaCompletada ? 'Actualizar ficha' : 'Guardar ficha'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal para buscar alumno manualmente ─────────────────────────────────────
const GRUPOS_POR_TURNO = {
  matutino:   ['A', 'B', 'C', 'D', 'E', 'F'],
  vespertino: ['G', 'H', 'I', 'J', 'K', 'L'],
}
const GRADOS = ['1', '2', '3']

function BuscarAlumnoModal({ onSeleccionado, onClose, turno }) {
  const [modo,      setModo]      = useState('grupo')   // 'grupo' | 'curp'
  const grupos = GRUPOS_POR_TURNO[turno] ?? []

  // Búsqueda por grupo
  const [grado,    setGrado]    = useState('')
  const [grupo,    setGrupo]    = useState('')
  const [lista,    setLista]    = useState([])
  const [filtro,   setFiltro]   = useState('')
  const [cargando, setCargando] = useState(false)

  // Búsqueda por CURP
  const [curpInput, setCurpInput] = useState('')
  const [resultado, setResultado] = useState(null)
  const [buscando,  setBuscando]  = useState(false)
  const [error,     setError]     = useState('')

  const cargarGrupo = async () => {
    if (!grado || !grupo) return
    setCargando(true)
    setLista([])
    setFiltro('')
    try {
      const snap = await getDocs(
        query(collection(db, 'alumnos'), where('grado', '==', grado), where('grupo', '==', grupo))
      )
      const alumnos = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const na = `${a.primerApellido ?? ''} ${a.segundoApellido ?? ''} ${a.nombre ?? ''}`
          const nb = `${b.primerApellido ?? ''} ${b.segundoApellido ?? ''} ${b.nombre ?? ''}`
          return na.localeCompare(nb, 'es')
        })
      setLista(alumnos)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const seleccionarDeLista = async (alumno) => {
    const tsSnap = await getDoc(doc(db, 'alumnos', alumno.id, 'trabajo_social', 'datos'))
    onSeleccionado({ curp: alumno.id, alumno, ts: tsSnap.exists() ? tsSnap.data() : null })
  }

  const buscarPorCurp = async () => {
    const curp = curpInput.trim().toUpperCase()
    if (curp.length < 10) { setError('Ingresa un CURP válido.'); return }
    setError('')
    setBuscando(true)
    setResultado(null)
    try {
      const alumnoSnap = await getDoc(doc(db, 'alumnos', curp))
      if (!alumnoSnap.exists()) { setError('No se encontró ningún alumno con ese CURP.'); return }
      const tsSnap = await getDoc(doc(db, 'alumnos', curp, 'trabajo_social', 'datos'))
      setResultado({ curp, alumno: alumnoSnap.data(), ts: tsSnap.exists() ? tsSnap.data() : null })
    } catch (err) {
      console.error(err)
      setError('Error al buscar. Intenta de nuevo.')
    } finally {
      setBuscando(false)
    }
  }

  const listaFiltrada = filtro.trim()
    ? lista.filter(a => {
        const nombre = `${a.primerApellido ?? ''} ${a.segundoApellido ?? ''} ${a.nombre ?? ''}`.toLowerCase()
        return nombre.includes(filtro.toLowerCase())
      })
    : lista

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[88vh]">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Agregar ficha médica</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs de modo */}
        <div className="flex border-b border-slate-100">
          {[
            { id: 'grupo', label: 'Buscar por grupo', icon: 'group' },
            { id: 'curp',  label: 'Buscar por CURP',  icon: 'badge' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setModo(t.id); setError(''); setResultado(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
                modo === t.id
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Modo: por grupo ── */}
          {modo === 'grupo' && (
            <>
              <div className="flex gap-3 items-end">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grado</label>
                  <select
                    value={grado}
                    onChange={e => { setGrado(e.target.value); setLista([]) }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">— Grado —</option>
                    {GRADOS.map(g => <option key={g} value={g}>{g}°</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grupo</label>
                  <select
                    value={grupo}
                    onChange={e => { setGrupo(e.target.value); setLista([]) }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">— Grupo —</option>
                    {grupos.map(g => <option key={g} value={g}>Grupo {g}</option>)}
                  </select>
                </div>
                <button
                  onClick={cargarGrupo}
                  disabled={!grado || !grupo || cargando}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition shrink-0"
                >
                  {cargando ? '…' : 'Cargar'}
                </button>
              </div>

              {lista.length > 0 && (
                <>
                  <input
                    type="text"
                    value={filtro}
                    onChange={e => setFiltro(e.target.value)}
                    placeholder="Filtrar por nombre…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    {listaFiltrada.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">Sin coincidencias.</p>
                    ) : (
                      <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {listaFiltrada.map(alumno => (
                          <li key={alumno.id}>
                            <button
                              onClick={() => seleccionarDeLista(alumno)}
                              className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition flex items-center justify-between gap-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {alumno.primerApellido} {alumno.segundoApellido} {alumno.nombre}
                                </p>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{alumno.id}</p>
                              </div>
                              <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">chevron_right</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 text-right">{listaFiltrada.length} alumno(s)</p>
                </>
              )}
            </>
          )}

          {/* ── Modo: por CURP ── */}
          {modo === 'curp' && (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={curpInput}
                  onChange={e => { setCurpInput(e.target.value.toUpperCase()); setError(''); setResultado(null) }}
                  onKeyDown={e => e.key === 'Enter' && buscarPorCurp()}
                  placeholder="CURP del alumno (18 caracteres)"
                  maxLength={18}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase"
                />
                <button
                  onClick={buscarPorCurp}
                  disabled={buscando}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition"
                >
                  {buscando ? '…' : 'Buscar'}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>{error}
                </p>
              )}

              {resultado && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {resultado.alumno.primerApellido} {resultado.alumno.segundoApellido} {resultado.alumno.nombre}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {resultado.alumno.grado}° {resultado.alumno.grupo} · {resultado.curp}
                  </p>
                  {resultado.ts?.fichaCompletada && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      Ya tiene ficha médica registrada
                    </p>
                  )}
                  <button
                    onClick={() => onSeleccionado(resultado)}
                    className="mt-3 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
                  >
                    {resultado.ts?.fichaCompletada ? 'Ver / editar ficha' : 'Llenar ficha médica'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────
function FichasMedicasView() {
  const { currentUser } = useAuth()
  const turno = currentUser?.turno ?? 'matutino'

  const POR_PAGINA = 10
  const grupos = GRUPOS_POR_TURNO[turno] ?? []

  const [tab,        setTab]        = useState('pendientes')
  const [registros,  setRegistros]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [indexError, setIndexError] = useState(false)

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroGrupo,  setFiltroGrupo]  = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('')

  // Paginación
  const [pagina, setPagina] = useState(1)

  const [fichaAbierta,   setFichaAbierta]   = useState(null)
  const [modalBusqueda,  setModalBusqueda]  = useState(false)
  const [generandoPDF,   setGenerandoPDF]   = useState(false)

  const resetFiltros = () => { setFiltroNombre(''); setFiltroGrupo(''); setFiltroTipo(''); setPagina(1) }

  const cargar = async () => {
    setLoading(true)
    setIndexError(false)
    try {
      const snap = await getDocs(
        query(collectionGroup(db, 'trabajo_social'), where('turno', '==', turno))
      )
      const raw = snap.docs.map(d => ({
        curp: d.ref.parent.parent.id,
        data: d.data(),
      }))

      // Siempre buscamos el doc padre para tener grado, grupo y nombre disponibles
      await Promise.all(
        raw.map(async r => {
          try {
            const aSnap = await getDoc(doc(db, 'alumnos', r.curp))
            if (aSnap.exists()) r.alumnoFallback = aSnap.data()
          } catch {}
        })
      )

      setRegistros(raw)
    } catch (err) {
      console.error(err)
      if (err.code === 'failed-precondition') setIndexError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [turno])
  useEffect(() => { setPagina(1) }, [tab, filtroNombre, filtroGrupo, filtroTipo])

  const pendientes = registros.filter(r =>
    !r.data.fichaCompletada &&
    r.data.tieneEnfermedad &&
    !r.data.tieneEnfermedad.toLowerCase().includes('no')
  )
  const completadas = registros.filter(r => r.data.fichaCompletada)
  const lista = tab === 'pendientes' ? pendientes : completadas

  // Helpers para obtener nombre y grupo de un registro
  const getNombre = (r) => {
    const fb = r.alumnoFallback
    if (r.data.alumno?.nombre) return nombreDesdeTS(r.data)
    if (fb) return `${fb.primerApellido ?? ''} ${fb.segundoApellido ?? ''} ${fb.nombre ?? ''}`.trim()
    return ''
  }
  const getGrupo = (r) => r.data.alumno?.grupo ?? r.alumnoFallback?.grupo ?? ''

  // Aplicar filtros
  const listaFiltrada = lista.filter(r => {
    const nm  = getNombre(r).toLowerCase()
    const grp = getGrupo(r)
    const tipos = r.data.fichaMedica?.tipos ?? []

    if (filtroNombre && !nm.includes(filtroNombre.toLowerCase())) return false
    if (filtroGrupo  && grp !== filtroGrupo)                       return false
    if (filtroTipo   && !tipos.includes(filtroTipo))               return false
    return true
  })

  // Paginar
  const totalPaginas  = Math.max(1, Math.ceil(listaFiltrada.length / POR_PAGINA))
  const inicio        = (pagina - 1) * POR_PAGINA
  const listaPaginada = listaFiltrada.slice(inicio, inicio + POR_PAGINA)

  const hayFiltros = filtroNombre || filtroGrupo || filtroTipo

  const abrirFicha = ({ curp, data, alumno, alumnoFallback }) => {
    let nombre
    if (alumno) {
      nombre = `${alumno.primerApellido ?? ''} ${alumno.segundoApellido ?? ''} ${alumno.nombre ?? ''}`.trim()
    } else if (data.alumno?.nombre) {
      nombre = nombreDesdeTS(data)
    } else if (alumnoFallback) {
      nombre = `${alumnoFallback.primerApellido ?? ''} ${alumnoFallback.segundoApellido ?? ''} ${alumnoFallback.nombre ?? ''}`.trim()
    } else {
      nombre = '—'
    }
    setFichaAbierta({ curp, tsData: data, nombre })
  }

  const onGuardado = () => {
    setFichaAbierta(null)
    cargar()
  }

  const onSeleccionadoManual = ({ curp, alumno, ts }) => {
    setModalBusqueda(false)
    const nombre = `${alumno.primerApellido ?? ''} ${alumno.segundoApellido ?? ''} ${alumno.nombre ?? ''}`.trim()
    setFichaAbierta({ curp, tsData: ts, nombre })
  }

  const generarReporte911 = async () => {
    if (completadas.length === 0 || generandoPDF) return
    setGenerandoPDF(true)
    try {
      const fichas = completadas.map((r, i) => {
        const fb = r.alumnoFallback
        const a  = r.data.alumno

        const nombre = fb
          ? `${fb.primerApellido ?? ''} ${fb.segundoApellido ?? ''} ${fb.nombre ?? ''}`.trim().toUpperCase()
          : a?.nombre
          ? `${a.apellidoPaterno ?? ''} ${a.apellidoMaterno ?? ''} ${a.nombre ?? ''}`.trim().toUpperCase()
          : '—'

        const grado      = fb?.grado ?? '?'
        const grupo      = a?.grupo ?? fb?.grupo ?? '?'
        const gradoGrupo = `${grado}°${grupo}`

        const sexoRaw = fb?.sexo ?? a?.sexo ?? ''
        const sexo    = sexoRaw ? sexoRaw.charAt(0).toUpperCase() : '—'

        return {
          numero:      i + 1,
          gradoGrupo,
          nombre,
          sexo,
          tipos:       (r.data.fichaMedica?.tipos ?? []).join(', ') || '—',
          diagnostico: r.data.fichaMedica?.diagnostico     ?? '—',
          situacion:   r.data.fichaMedica?.situacionActual ?? '—',
        }
      })

      const { default: Reporte911PDF } = await import('../../reports/Reporte911PDF')
      const { pdf }                    = await import('@react-pdf/renderer')
      const { createElement }          = await import('react')

      const blob = await pdf(
        createElement(Reporte911PDF, { fichas, turno, cicloEscolar: '2025-2026' })
      ).toBlob()

      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `Reporte_911.5_${turno}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generando Reporte 911.5:', err)
    } finally {
      setGenerandoPDF(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-emerald-600 text-2xl">medical_information</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-slate-900">Fichas Médicas</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Registro de condiciones médicas y NEE del alumnado · turno{' '}
                <span className="font-medium text-emerald-700 capitalize">{turno}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {completadas.length > 0 && (
              <button
                onClick={generarReporte911}
                disabled={generandoPDF}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-800 text-sm font-semibold transition shrink-0"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                {generandoPDF ? 'Generando…' : 'Reporte 911.5'}
              </button>
            )}
            <button
              onClick={() => setModalBusqueda(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shrink-0"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Agregar ficha
            </button>
          </div>
        </div>
      </div>

      {/* Error de índice */}
      {indexError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl mt-0.5 shrink-0">warning</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Se requiere un índice en Firestore</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Revisa la consola del navegador (F12 → Console) — Firestore muestra un enlace directo
              para crear el índice con un clic. Luego regresa y recarga la página.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {[
            { id: 'pendientes',  label: 'Por atender',        count: pendientes.length },
            { id: 'completadas', label: 'Fichas registradas', count: completadas.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-4 py-3.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                tab === t.id
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
              {!loading && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filtros */}
        {!loading && lista.length > 0 && (
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">search</span>
                <input
                  value={filtroNombre}
                  onChange={e => setFiltroNombre(e.target.value)}
                  placeholder="Buscar por nombre…"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <select
              value={filtroGrupo}
              onChange={e => setFiltroGrupo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">Todos los grupos</option>
              {grupos.map(g => <option key={g} value={g}>Grupo {g}</option>)}
            </select>

            {tab === 'completadas' && (
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Todos los tipos</option>
                {TIPOS_CONDICION.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            {hayFiltros && (
              <button
                onClick={resetFiltros}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Limpiar
              </button>
            )}

            <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">
              {listaFiltrada.length} resultado{listaFiltrada.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Contenido */}
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            <p className="text-sm">Cargando registros…</p>
          </div>
        ) : lista.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-slate-300 text-4xl">
              {tab === 'pendientes' ? 'check_circle' : 'folder_off'}
            </span>
            <p className="text-sm text-slate-500 mt-3">
              {tab === 'pendientes'
                ? 'No hay fichas pendientes. ¡Todo al día!'
                : 'Aún no hay fichas médicas registradas.'}
            </p>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-slate-300 text-3xl">search_off</span>
            <p className="text-sm text-slate-500 mt-2">Sin resultados para los filtros aplicados.</p>
            <button onClick={resetFiltros} className="mt-3 text-xs text-emerald-600 hover:text-emerald-800 font-semibold transition">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">#</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Nombre</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Grupo</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">
                    {tab === 'pendientes' ? 'Condición reportada' : 'Tipo(s)'}
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaPaginada.map((r, i) => {
                  const nm  = getNombre(r) || '—'
                  const grp = getGrupo(r)  || '—'
                  const condicion = tab === 'pendientes'
                    ? (r.data.cualEnfermedad || r.data.tieneEnfermedad)
                    : r.data.fichaMedica?.tipos?.join(', ')

                  return (
                    <tr key={r.curp} className="hover:bg-emerald-50/40 transition">
                      <td className="px-6 py-3 text-xs text-slate-400">{inicio + i + 1}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">{nm}</td>
                      <td className="px-6 py-3 hidden sm:table-cell text-slate-600 text-xs font-mono">{grp}</td>
                      <td className="px-6 py-3 hidden lg:table-cell text-xs text-slate-500 max-w-[220px] truncate">
                        {condicion ?? '—'}
                      </td>
                      <td className="px-6 py-3">
                        <BadgeEstado completada={!!r.data.fichaCompletada} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => abrirFicha({ curp: r.curp, data: r.data, alumnoFallback: r.alumnoFallback })}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition whitespace-nowrap"
                        >
                          {r.data.fichaCompletada ? 'Ver / editar →' : 'Llenar ficha →'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  {inicio + 1}–{Math.min(inicio + POR_PAGINA, listaFiltrada.length)} de {listaFiltrada.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagina(p => p - 1)}
                    disabled={pagina === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === '…' ? (
                        <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPagina(p)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition ${
                            pagina === p
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )
                  }

                  <button
                    onClick={() => setPagina(p => p + 1)}
                    disabled={pagina === totalPaginas}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal ficha */}
      {fichaAbierta && (
        <FichaModal
          curp={fichaAbierta.curp}
          tsData={fichaAbierta.tsData}
          alumnoNombre={fichaAbierta.nombre}
          onClose={() => setFichaAbierta(null)}
          onGuardado={onGuardado}
        />
      )}

      {/* Modal búsqueda manual */}
      {modalBusqueda && (
        <BuscarAlumnoModal
          turno={turno}
          onSeleccionado={onSeleccionadoManual}
          onClose={() => setModalBusqueda(false)}
        />
      )}
    </div>
  )
}

export default FichasMedicasView
