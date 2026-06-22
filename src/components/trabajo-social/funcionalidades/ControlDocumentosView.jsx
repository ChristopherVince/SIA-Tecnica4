import { useState } from 'react'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../context/AuthContext'

const CICLO = '2025-2026'

const DOCS = [
  { key: 'hojaInscripcion',      label: 'Hoja de inscripción',         short: 'Hoja Inscr.'  },
  { key: 'ineTutor',             label: 'INE del tutor',               short: 'INE Tutor'    },
  { key: 'comprobanteDomicilio', label: 'Comprobante de domicilio',    short: 'Comp. Dom.'   },
  { key: 'curpAlumno',           label: 'CURP del alumno',             short: 'CURP'         },
  { key: 'acuerdoConvivencia',   label: 'Acuerdo de convivencia',      short: 'Acuerdo'      },
  { key: 'cuestionarioSocio',    label: 'Cuest. socioeconómico',       short: 'C. Socioec.'  },
]

// Campos a comparar entre el doc raíz (alumnos/{curp}) y el formulario (trabajo_social/datos.alumno)
const CAMPOS_VERIFICACION = [
  { label: 'Primer apellido', getSistema: a => a.primerApellido,  getForm: ts => ts.alumno?.apellidoPaterno, critico: false },
  { label: 'Segundo apellido',getSistema: a => a.segundoApellido, getForm: ts => ts.alumno?.apellidoMaterno, critico: false },
  { label: 'Nombre',          getSistema: a => a.nombre,          getForm: ts => ts.alumno?.nombre,          critico: false },
  { label: 'Grupo',           getSistema: a => a.grupo,           getForm: ts => ts.alumno?.grupo,           critico: false },
]

const GRUPOS_POR_TURNO = {
  matutino:   ['A', 'B', 'C', 'D', 'E', 'F'],
  vespertino: ['G', 'H', 'I', 'J', 'K', 'L'],
}
const GRADOS = ['1', '2', '3']
const turnoDeGrupo = (g) => GRUPOS_POR_TURNO.matutino.includes(g) ? 'matutino' : 'vespertino'

function norm(val) {
  return (val ?? '').toString().trim().toUpperCase()
}

function calcularVerificacion(alumno, tsData) {
  return CAMPOS_VERIFICACION.map(c => ({
    label:        c.label,
    critico:      c.critico,
    enSistema:    c.getSistema(alumno) ?? '',
    enFormulario: c.getForm(tsData) ?? '',
    ok:           norm(c.getSistema(alumno)) === norm(c.getForm(tsData)),
  }))
}

// ─── Modal de verificación ─────────────────────────────────────────────────────
function VerificacionModal({ alumno, tsData, onClose }) {
  const nombre   = `${alumno.primerApellido ?? ''} ${alumno.segundoApellido ?? ''} ${alumno.nombre ?? ''}`.trim()
  const campos   = calcularVerificacion(alumno, tsData)
  const errores  = campos.filter(c => !c.ok)
  const sinDatos = !tsData?.alumno?.nombre

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Cabecera */}
        <div className={`px-6 py-5 flex items-start justify-between gap-4 ${
          sinDatos         ? 'bg-slate-800'
          : errores.length ? 'bg-amber-600'
          : 'bg-emerald-800'
        } text-white`}>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider opacity-70">Verificación · Hoja de inscripción</p>
            <h2 className="text-base font-bold mt-0.5 leading-snug">{nombre}</h2>
            <p className="text-xs font-mono opacity-60 mt-0.5">{alumno.id}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!sinDatos && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                errores.length
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {errores.length === 0
                  ? 'Sin incongruencias'
                  : `${errores.length} incongruencia${errores.length > 1 ? 's' : ''}`}
              </span>
            )}
            <button onClick={onClose} className="opacity-70 hover:opacity-100 transition">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {sinDatos ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <span className="material-symbols-outlined text-slate-300 text-4xl">cloud_off</span>
              <p className="text-sm font-semibold text-slate-600 mt-3">Sin datos del formulario</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-sm mx-auto">
                Este alumno aún no tiene datos registrados en el sistema provenientes de la hoja de inscripción digitalizada.
              </p>
            </div>
          ) : (
            <>
              {/* Tabla de comparación */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-36">Campo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-blue-500">database</span>
                          En el sistema
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-slate-400">description</span>
                          En el formulario
                        </span>
                      </th>
                      <th className="px-4 py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campos.map(c => (
                      <tr
                        key={c.label}
                        className={
                          !c.ok
                            ? c.critico ? 'bg-red-50' : 'bg-amber-50'
                            : 'bg-white'
                        }
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            {c.critico && <span className="material-symbols-outlined text-[14px] text-red-400">priority_high</span>}
                            {c.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-blue-800 bg-blue-50 px-2 py-1 rounded-lg">
                            {c.enSistema || <span className="text-slate-400 italic">vacío</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-xs px-2 py-1 rounded-lg ${
                            !c.ok
                              ? c.critico ? 'text-red-800 bg-red-100' : 'text-amber-800 bg-amber-100'
                              : 'text-slate-700 bg-slate-100'
                          }`}>
                            {c.enFormulario || <span className="italic opacity-60">vacío</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.ok ? (
                            <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                          ) : (
                            <span className={`material-symbols-outlined text-[18px] ${c.critico ? 'text-red-500' : 'text-amber-500'}`}>
                              {c.critico ? 'cancel' : 'warning'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Nota de referencia */}
              <p className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
                <span>
                  <strong>En el sistema</strong> corresponde a los datos maestros del alumno en la base de datos (fuente de verdad).
                  <strong> En el formulario</strong> es lo que el administrativo capturó al digitalizar la hoja física.
                  Las incongruencias deben corregirse en la hoja original o en el sistema según corresponda.
                </span>
              </p>
            </>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Celda de documento genérica ─────────────────────────────────────────────
function CeldaDoc({ curp, docKey, valor, saving, onToggle }) {
  const isSaving = saving[`${curp}_${docKey}`]
  return (
    <td className="px-0 py-0 text-center border-l border-slate-100">
      <button
        onClick={() => !isSaving && onToggle(curp, docKey, valor)}
        title={valor ? 'Entregado — clic para revertir' : 'No entregado — clic para marcar'}
        className={`w-full h-full min-h-[44px] flex items-center justify-center transition-colors ${
          isSaving     ? 'cursor-wait bg-slate-50'
          : valor      ? 'bg-emerald-50 hover:bg-emerald-100'
          : 'bg-white hover:bg-slate-50'
        }`}
      >
        {isSaving ? (
          <span className="material-symbols-outlined text-[18px] text-slate-400 animate-spin">progress_activity</span>
        ) : valor ? (
          <span className="material-symbols-outlined text-[20px] text-emerald-500">check_circle</span>
        ) : (
          <span className="material-symbols-outlined text-[20px] text-slate-300">radio_button_unchecked</span>
        )}
      </button>
    </td>
  )
}

// ─── Celda especial para Hoja de inscripción ──────────────────────────────────
function CeldaHojaInscripcion({ alumno, tsData, docValor, saving, onToggle, onVerificar }) {
  const tieneDigital = !!tsData?.alumno?.nombre
  const isSaving     = saving[`${alumno.id}_hojaInscripcion`]

  if (!tieneDigital) {
    // Sin datos digitales — toggle manual igual que los demás documentos
    return (
      <CeldaDoc
        curp={alumno.id}
        docKey="hojaInscripcion"
        valor={docValor}
        saving={saving}
        onToggle={onToggle}
      />
    )
  }

  // Con datos digitales — celda enlazada con verificación
  const incs        = calcularVerificacion(alumno, tsData).filter(c => !c.ok).length
  const hayErrores  = incs > 0

  return (
    <td className="px-0 py-0 text-center border-l border-slate-100">
      <button
        onClick={onVerificar}
        title={hayErrores ? `${incs} incongruencia(s) detectada(s) — clic para revisar` : 'Datos digitalizados — clic para verificar'}
        className={`w-full h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
          isSaving      ? 'cursor-wait bg-slate-50'
          : hayErrores  ? 'bg-amber-50 hover:bg-amber-100'
          : 'bg-emerald-50 hover:bg-emerald-100'
        }`}
      >
        {isSaving ? (
          <span className="material-symbols-outlined text-[18px] text-slate-400 animate-spin">progress_activity</span>
        ) : hayErrores ? (
          <>
            <span className="material-symbols-outlined text-[18px] text-amber-500">warning</span>
            <span className="text-[9px] font-bold text-amber-600">{incs} err.</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px] text-emerald-500">task_alt</span>
            <span className="text-[9px] text-emerald-600">digital</span>
          </>
        )}
      </button>
    </td>
  )
}

// ─── Badge de progreso ────────────────────────────────────────────────────────
function BadgeProgreso({ entregados, total }) {
  const color =
    entregados === total  ? 'text-emerald-700 bg-emerald-100'
    : entregados >= total / 2 ? 'text-amber-700 bg-amber-100'
    : 'text-slate-500 bg-slate-100'
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${color}`}>
      {entregados}/{total}
    </span>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────
function ControlDocumentosView() {
  const { currentUser } = useAuth()
  const turnoUsuario    = currentUser?.turno ?? 'matutino'

  const [grado,   setGrado]   = useState('')
  const [grupo,   setGrupo]   = useState('')
  const [alumnos, setAlumnos] = useState([])
  const [docs,    setDocs]    = useState({})   // { curp: { key: bool, ... } }
  const [tsMap,   setTsMap]   = useState({})   // { curp: tsData | null }
  const [saving,  setSaving]  = useState({})   // { 'curp_key': true }
  const [loading, setLoading] = useState(false)
  const [cargado, setCargado] = useState(false)
  const [errores, setErrores] = useState({})

  // Modal de verificación
  const [verificando, setVerificando] = useState(null)  // { alumno, tsData }

  const cargarGrupo = async () => {
    if (!grado || !grupo) return
    setLoading(true)
    setCargado(false)
    setAlumnos([])
    setDocs({})
    setTsMap({})
    setErrores({})
    try {
      const snap = await getDocs(
        query(collection(db, 'alumnos'), where('grado', '==', grado), where('grupo', '==', grupo))
      )
      const lista = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const na = `${a.primerApellido ?? ''} ${a.segundoApellido ?? ''} ${a.nombre ?? ''}`
          const nb = `${b.primerApellido ?? ''} ${b.segundoApellido ?? ''} ${b.nombre ?? ''}`
          return na.localeCompare(nb, 'es')
        })
      setAlumnos(lista)

      // Cargar docs y ts de cada alumno en paralelo
      const docsMap = {}
      const tsMapa  = {}

      await Promise.all(lista.map(async (alumno) => {
        const [dSnap, tsSnap] = await Promise.all([
          getDoc(doc(db, 'alumnos', alumno.id, 'documentos', CICLO)),
          getDoc(doc(db, 'alumnos', alumno.id, 'trabajo_social', 'datos')),
        ])
        docsMap[alumno.id] = dSnap.exists() ? dSnap.data() : {}
        tsMapa[alumno.id]  = tsSnap.exists() ? tsSnap.data() : null

        // Auto-marcar hojaInscripcion si hay datos del formulario y no estaba ya marcada
        const tsData = tsMapa[alumno.id]
        if (tsData?.alumno?.nombre && !docsMap[alumno.id]?.hojaInscripcion) {
          docsMap[alumno.id] = { ...docsMap[alumno.id], hojaInscripcion: true }
          // Guardar en segundo plano, sin bloquear la UI
          setDoc(
            doc(db, 'alumnos', alumno.id, 'documentos', CICLO),
            { hojaInscripcion: true, ultimaActualizacion: new Date().toISOString() },
            { merge: true }
          ).catch(err => console.warn('Auto-save hojaInscripcion fallido:', err))
        }
      }))

      setDocs(docsMap)
      setTsMap(tsMapa)
    } catch (err) {
      console.error('Error cargando grupo:', err)
    } finally {
      setLoading(false)
      setCargado(true)
    }
  }

  const toggleDoc = async (curp, key, valorActual) => {
    const saveKey  = `${curp}_${key}`
    const nuevoVal = !valorActual

    setSaving(prev => ({ ...prev, [saveKey]: true }))
    setDocs(prev => ({ ...prev, [curp]: { ...prev[curp], [key]: nuevoVal } }))
    setErrores(prev => { const n = { ...prev }; delete n[saveKey]; return n })

    try {
      await setDoc(
        doc(db, 'alumnos', curp, 'documentos', CICLO),
        { [key]: nuevoVal, ultimaActualizacion: new Date().toISOString() },
        { merge: true }
      )
    } catch (err) {
      console.error('Error guardando documento:', err)
      setDocs(prev => ({ ...prev, [curp]: { ...prev[curp], [key]: valorActual } }))
      setErrores(prev => ({ ...prev, [saveKey]: true }))
    } finally {
      setSaving(prev => { const n = { ...prev }; delete n[saveKey]; return n })
    }
  }

  // ── Métricas del grupo ──────────────────────────────────────────────────────
  // Para la hoja de inscripción: si tiene datos digitales cuenta como entregada
  const efectivoHoja = (alumno) =>
    !!(tsMap[alumno.id]?.alumno?.nombre || docs[alumno.id]?.hojaInscripcion)

  const countEntregados = (alumno) => {
    const d = docs[alumno.id] ?? {}
    return DOCS.filter(dc =>
      dc.key === 'hojaInscripcion' ? efectivoHoja(alumno) : !!d[dc.key]
    ).length
  }

  const totalDocs  = alumnos.length * DOCS.length
  const entregadosTotales = alumnos.reduce((sum, a) => sum + countEntregados(a), 0)
  const completos  = alumnos.filter(a => countEntregados(a) === DOCS.length).length
  const porcentaje = totalDocs > 0 ? Math.round((entregadosTotales / totalDocs) * 100) : 0

  // Alumnos con incongruencias en la hoja de inscripción
  const conErrores = alumnos.filter(a =>
    tsMap[a.id]?.alumno?.nombre &&
    calcularVerificacion(a, tsMap[a.id]).some(c => !c.ok)
  ).length

  const hayErroresGuardado = Object.keys(errores).length > 0

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-600 text-2xl">checklist</span>
          </div>
          <div>
            <h2 className="text-xl font-headline font-bold text-slate-900">Control de Documentos</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Seguimiento de entrega de documentos por alumno · ciclo{' '}
              <span className="font-medium text-slate-700">{CICLO}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grado</label>
            <select
              value={grado}
              onChange={e => { setGrado(e.target.value); setCargado(false); setAlumnos([]) }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[130px]"
            >
              <option value="">— Grado —</option>
              {GRADOS.map(g => <option key={g} value={g}>{g}°</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grupo</label>
            <select
              value={grupo}
              onChange={e => { setGrupo(e.target.value); setCargado(false); setAlumnos([]) }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[130px]"
            >
              <option value="">— Grupo —</option>
              <optgroup label="Matutino">
                {GRUPOS_POR_TURNO.matutino.map(g => <option key={g} value={g}>Grupo {g}</option>)}
              </optgroup>
              <optgroup label="Vespertino">
                {GRUPOS_POR_TURNO.vespertino.map(g => <option key={g} value={g}>Grupo {g}</option>)}
              </optgroup>
            </select>
          </div>

          <button
            onClick={cargarGrupo}
            disabled={!grado || !grupo || loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
          >
            {loading ? 'Cargando…' : 'Cargar grupo'}
          </button>
        </div>
      </div>

      {/* Error de guardado */}
      {hayErroresGuardado && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500 text-lg shrink-0">error</span>
          <p className="text-sm text-red-700">
            Algunos cambios no pudieron guardarse. Revisa tu conexión e intenta de nuevo.
          </p>
        </div>
      )}

      {/* Cargando */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center gap-3 text-slate-400 shadow-sm">
          <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
          <p className="text-sm">Cargando alumnos del grupo {grado}°{grupo}…</p>
        </div>
      )}

      {/* Sin resultados */}
      {cargado && !loading && alumnos.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-slate-300 text-4xl">group_off</span>
          <p className="text-sm text-slate-500 mt-3">No se encontraron alumnos en {grado}°{grupo}.</p>
        </div>
      )}

      {/* Tabla principal */}
      {cargado && !loading && alumnos.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Resumen */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                turnoDeGrupo(grupo) === turnoUsuario
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {turnoDeGrupo(grupo)}
              </span>
              <h3 className="text-base font-bold text-slate-900">{grado}° {grupo}</h3>
              <span className="text-sm text-slate-400">
                {alumnos.length} alumnos · {completos} expedientes completos
              </span>
              {conErrores > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {conErrores} con incongruencias en la hoja
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400">{entregadosTotales} / {totalDocs} documentos</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{porcentaje}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-wrap gap-x-5 gap-y-1">
            {DOCS.map((d, i) => (
              <span key={d.key} className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="font-bold text-slate-700">{i + 1}.</span> {d.label}
              </span>
            ))}
            <span className="text-[11px] text-emerald-600 flex items-center gap-1 ml-auto">
              <span className="material-symbols-outlined text-sm">task_alt</span>
              digital = hoja digitalizada detectada
            </span>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide min-w-[180px]">Nombre</th>
                  {DOCS.map((d, i) => (
                    <th
                      key={d.key}
                      title={d.label}
                      className="px-2 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-[82px] border-l border-slate-200 cursor-help"
                    >
                      <span className="block">{i + 1}.</span>
                      <span className="block font-normal normal-case text-slate-500 mt-0.5 leading-tight">{d.short}</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide border-l border-slate-200 w-16">
                    Avance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alumnos.map((alumno, i) => {
                  const d         = docs[alumno.id] ?? {}
                  const ts        = tsMap[alumno.id]
                  const entregados = countEntregados(alumno)
                  const completo  = entregados === DOCS.length

                  // ¿Tiene incongruencias en la hoja?
                  const incsHoja  = ts?.alumno?.nombre
                    ? calcularVerificacion(alumno, ts).filter(c => !c.ok).length
                    : 0

                  return (
                    <tr
                      key={alumno.id}
                      className={completo ? 'bg-emerald-50/30' : 'bg-white hover:bg-slate-50/30 transition-colors'}
                    >
                      <td className="px-4 py-0 text-xs text-slate-400 text-center">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <p className={`font-medium leading-tight ${completo ? 'text-emerald-800' : 'text-slate-900'}`}>
                              {alumno.primerApellido} {alumno.segundoApellido} {alumno.nombre}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{alumno.id}</p>
                          </div>
                          {incsHoja > 0 && (
                            <button
                              onClick={() => setVerificando({ alumno, tsData: ts })}
                              title="Ver incongruencias en la hoja de inscripción"
                              className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-full transition"
                            >
                              <span className="material-symbols-outlined text-[13px]">warning</span>
                              {incsHoja}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Celda especial para hoja de inscripción */}
                      <CeldaHojaInscripcion
                        alumno={alumno}
                        tsData={ts}
                        docValor={!!d.hojaInscripcion}
                        saving={saving}
                        onToggle={toggleDoc}
                        onVerificar={() => setVerificando({ alumno, tsData: ts })}
                      />

                      {/* Resto de documentos */}
                      {DOCS.slice(1).map(dc => (
                        <CeldaDoc
                          key={dc.key}
                          curp={alumno.id}
                          docKey={dc.key}
                          valor={!!d[dc.key]}
                          saving={saving}
                          onToggle={toggleDoc}
                        />
                      ))}

                      <td className="px-3 py-3 border-l border-slate-100 text-center">
                        <BadgeProgreso entregados={entregados} total={DOCS.length} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pie */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              Haz clic en cualquier celda para marcar o desmarcar. Los cambios se guardan automáticamente.
            </p>
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">warning</span>
              La columna <strong>Hoja Inscr.</strong> se detecta automáticamente si el formulario fue digitalizado.
            </p>
          </div>
        </div>
      )}

      {/* Modal de verificación */}
      {verificando && (
        <VerificacionModal
          alumno={verificando.alumno}
          tsData={verificando.tsData}
          onClose={() => setVerificando(null)}
        />
      )}
    </div>
  )
}

export default ControlDocumentosView
