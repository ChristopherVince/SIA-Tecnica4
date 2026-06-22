import { useState } from 'react'
import {
  addDoc, arrayUnion, collection, doc, getDoc,
  getDocs, orderBy, query, updateDoc, where,
} from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../context/AuthContext'

// ── Constantes ────────────────────────────────────────────────────────────────
const GRUPOS_POR_TURNO = {
  matutino:   ['A','B','C','D','E','F'],
  vespertino: ['G','H','I','J','K','L'],
}
const GRADOS = ['1','2','3']

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtFecha = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}
const fmtFechaCita = (yyyymmdd) => {
  if (!yyyymmdd) return '—'
  const [y, m, d] = yyyymmdd.split('-')
  return new Date(+y, +m - 1, +d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}
const hoy = () => new Date().toISOString().slice(0, 10)

// ── Shared UI ─────────────────────────────────────────────────────────────────
const iCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400'
const btnCancel = 'px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition'

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function ErrMsg({ msg }) {
  return msg ? (
    <p className="text-xs text-red-600 flex items-center gap-1">
      <span className="material-symbols-outlined text-sm">error</span>{msg}
    </p>
  ) : null
}

function ModalShell({ title, subtitle, headerColor = 'bg-emerald-900', onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className={`${headerColor} text-white px-6 py-4 flex items-start justify-between gap-3 shrink-0`}>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider opacity-70">{title}</p>
            <h2 className="text-base font-bold mt-0.5 leading-snug truncate">{subtitle}</h2>
          </div>
          <button onClick={onClose} className="opacity-70 hover:opacity-100 transition shrink-0 mt-0.5">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Modal: Buscar Alumno ──────────────────────────────────────────────────────
function BuscarAlumnoModal({ onSeleccionado, onClose }) {
  const [modo,      setModo]      = useState('curp')
  const [curpInput, setCurpInput] = useState('')
  const [buscando,  setBuscando]  = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error,     setError]     = useState('')
  const [grado,     setGrado]     = useState('')
  const [grupo,     setGrupo]     = useState('')
  const [lista,     setLista]     = useState([])
  const [filtro,    setFiltro]    = useState('')
  const [cargando,  setCargando]  = useState(false)

  const buscarCurp = async () => {
    const curp = curpInput.trim().toUpperCase()
    if (curp.length < 10) { setError('Ingresa un CURP válido.'); return }
    setError(''); setBuscando(true); setResultado(null)
    try {
      const snap = await getDoc(doc(db, 'alumnos', curp))
      if (!snap.exists()) { setError('No se encontró ningún alumno con ese CURP.'); return }
      setResultado({ id: snap.id, ...snap.data() })
    } catch { setError('Error al buscar.') }
    finally { setBuscando(false) }
  }

  const cargarGrupo = async () => {
    if (!grado || !grupo) return
    setCargando(true); setLista([])
    try {
      const snap = await getDocs(
        query(collection(db, 'alumnos'), where('grado', '==', grado), where('grupo', '==', grupo))
      )
      setLista(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => `${a.primerApellido}${a.nombre}`.localeCompare(`${b.primerApellido}${b.nombre}`, 'es')))
    } catch { }
    finally { setCargando(false) }
  }

  const listaFiltrada = filtro
    ? lista.filter(a => `${a.primerApellido} ${a.segundoApellido} ${a.nombre}`.toLowerCase().includes(filtro.toLowerCase()))
    : lista

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[86vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-900">Buscar alumno</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex border-b border-slate-100 shrink-0">
          {[{ id: 'curp', label: 'Por CURP', icon: 'badge' }, { id: 'grupo', label: 'Por grupo', icon: 'group' }].map(t => (
            <button key={t.id} onClick={() => { setModo(t.id); setError(''); setResultado(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
                modo === t.id ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <span className="material-symbols-outlined text-base">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {modo === 'curp' ? (
            <>
              <div className="flex gap-2">
                <input value={curpInput}
                  onChange={e => { setCurpInput(e.target.value.toUpperCase()); setError(''); setResultado(null) }}
                  onKeyDown={e => e.key === 'Enter' && buscarCurp()}
                  placeholder="CURP (18 caracteres)" maxLength={18}
                  className={`${iCls} flex-1 uppercase font-mono`} />
                <button onClick={buscarCurp} disabled={buscando}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition shrink-0">
                  {buscando ? '…' : 'Buscar'}
                </button>
              </div>
              <ErrMsg msg={error} />
              {resultado && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{resultado.primerApellido} {resultado.segundoApellido} {resultado.nombre}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{resultado.grado}° {resultado.grupo} · {resultado.id}</p>
                  <button onClick={() => onSeleccionado(resultado)}
                    className="mt-3 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition">
                    Seleccionar
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex gap-2 items-end">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Grado</label>
                  <select value={grado} onChange={e => { setGrado(e.target.value); setLista([]) }} className={iCls}>
                    <option value="">— Grado —</option>
                    {GRADOS.map(g => <option key={g} value={g}>{g}°</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Grupo</label>
                  <select value={grupo} onChange={e => { setGrupo(e.target.value); setLista([]) }} className={iCls}>
                    <option value="">— Grupo —</option>
                    <optgroup label="Matutino">{GRUPOS_POR_TURNO.matutino.map(g => <option key={g} value={g}>Grupo {g}</option>)}</optgroup>
                    <optgroup label="Vespertino">{GRUPOS_POR_TURNO.vespertino.map(g => <option key={g} value={g}>Grupo {g}</option>)}</optgroup>
                  </select>
                </div>
                <button onClick={cargarGrupo} disabled={!grado || !grupo || cargando}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition shrink-0">
                  {cargando ? '…' : 'Cargar'}
                </button>
              </div>
              {lista.length > 0 && (
                <>
                  <input value={filtro} onChange={e => setFiltro(e.target.value)}
                    placeholder="Filtrar por nombre…" className={iCls} />
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {listaFiltrada.map(a => (
                      <button key={a.id} onClick={() => onSeleccionado(a)}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{a.primerApellido} {a.segundoApellido} {a.nombre}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{a.id}</p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">chevron_right</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Modal: Nuevo Citatorio ────────────────────────────────────────────────────
function NuevoCitatorioModal({ alumno, tsData, autor, onClose, onGuardado }) {
  const [tutorNombre,   setTutorNombre]   = useState(tsData?.padres?.nombreCompleto ?? '')
  const [fechaCita,     setFechaCita]     = useState('')
  const [horaCita,      setHoraCita]      = useState('')
  const [lugar,         setLugar]         = useState('Dirección')
  const [maestro,       setMaestro]       = useState('')
  const [materia,       setMateria]       = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [guardando,     setGuardando]     = useState(false)
  const [error,         setError]         = useState('')

  const guardar = async () => {
    if (!fechaCita)            { setError('La fecha de la cita es obligatoria.'); return }
    if (!observaciones.trim()) { setError('Las observaciones son obligatorias.'); return }
    setError(''); setGuardando(true)
    try {
      await addDoc(collection(db, 'alumnos', alumno.id, 'expediente'), {
        tipo:          'citatorio',
        fecha:         new Date().toISOString(),
        tutorNombre:   tutorNombre.trim(),
        fechaCita,
        horaCita,
        lugar:         lugar.trim(),
        maestro:       maestro.trim(),
        materia:       materia.trim(),
        observaciones: observaciones.trim(),
        estado:        'pendiente',
        fichaCita:     null,
        comentarios:   [],
        creadoPor:     autor,
      })
      onGuardado()
    } catch (err) { console.error(err); setError('Error al guardar.') }
    finally { setGuardando(false) }
  }

  const nb = `${alumno.primerApellido ?? ''} ${alumno.segundoApellido ?? ''} ${alumno.nombre ?? ''}`.trim()
  return (
    <ModalShell title="Nuevo citatorio" subtitle={nb} headerColor="bg-indigo-800" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Dirigido a (padre / madre / tutor)">
          <input value={tutorNombre} onChange={e => setTutorNombre(e.target.value)}
            placeholder="Nombre del responsable" className={iCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha de la cita" required>
            <input type="date" value={fechaCita} onChange={e => setFechaCita(e.target.value)} className={iCls} />
          </Field>
          <Field label="Hora de la cita">
            <input type="time" value={horaCita} onChange={e => setHoraCita(e.target.value)} className={iCls} />
          </Field>
        </div>
        <Field label="Lugar en el plantel">
          <input value={lugar} onChange={e => setLugar(e.target.value)}
            placeholder="Dirección, sala de juntas…" className={iCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Maestro que reporta">
            <input value={maestro} onChange={e => setMaestro(e.target.value)} className={iCls} />
          </Field>
          <Field label="Materia / clase">
            <input value={materia} onChange={e => setMateria(e.target.value)} className={iCls} />
          </Field>
        </div>
        <Field label="Motivo / observaciones" required>
          <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
            rows={3} placeholder="Conducta de indisciplina observada…" className={`${iCls} resize-none`} />
        </Field>
        <ErrMsg msg={error} />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className={btnCancel}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold transition">
            {guardando ? 'Guardando…' : 'Registrar citatorio'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ── Modal: Nuevo Reporte ──────────────────────────────────────────────────────
function NuevoReporteModal({ alumno, autor, onClose, onGuardado }) {
  const [fechaReporte,  setFechaReporte]  = useState(hoy())
  const [maestro,       setMaestro]       = useState('')
  const [materia,       setMateria]       = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [guardando,     setGuardando]     = useState(false)
  const [error,         setError]         = useState('')

  const guardar = async () => {
    if (!observaciones.trim()) { setError('Las observaciones son obligatorias.'); return }
    setError(''); setGuardando(true)
    try {
      await addDoc(collection(db, 'alumnos', alumno.id, 'expediente'), {
        tipo:          'reporte',
        fecha:         new Date().toISOString(),
        fechaReporte,
        maestro:       maestro.trim(),
        materia:       materia.trim(),
        observaciones: observaciones.trim(),
        enteradoPadre: false,
        comentarios:   [],
        creadoPor:     autor,
      })
      onGuardado()
    } catch (err) { console.error(err); setError('Error al guardar.') }
    finally { setGuardando(false) }
  }

  const nb = `${alumno.primerApellido ?? ''} ${alumno.segundoApellido ?? ''} ${alumno.nombre ?? ''}`.trim()
  return (
    <ModalShell title="Nuevo reporte de indisciplina" subtitle={nb} headerColor="bg-rose-800" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Fecha del reporte" required>
          <input type="date" value={fechaReporte} onChange={e => setFechaReporte(e.target.value)} className={iCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Maestro que reporta">
            <input value={maestro} onChange={e => setMaestro(e.target.value)} className={iCls} />
          </Field>
          <Field label="Materia / clase">
            <input value={materia} onChange={e => setMateria(e.target.value)} className={iCls} />
          </Field>
        </div>
        <Field label="Observaciones / conducta" required>
          <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
            rows={4} placeholder="Descripción de la conducta de indisciplina…" className={`${iCls} resize-none`} />
        </Field>
        <ErrMsg msg={error} />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className={btnCancel}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-sm font-semibold transition">
            {guardando ? 'Guardando…' : 'Registrar reporte'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ── Modal: Ficha post-cita ────────────────────────────────────────────────────
function FichaCitaModal({ alumno, expId, expData, autor, onClose, onGuardado }) {
  const [asistio,     setAsistio]     = useState(true)
  const [resumen,     setResumen]     = useState('')
  const [compromisos, setCompromisos] = useState('')
  const [guardando,   setGuardando]   = useState(false)
  const [error,       setError]       = useState('')

  const guardar = async () => {
    if (asistio && !resumen.trim()) { setError('El resumen de la cita es obligatorio.'); return }
    setError(''); setGuardando(true)
    try {
      await updateDoc(doc(db, 'alumnos', alumno.id, 'expediente', expId), {
        estado:    asistio ? 'realizada' : 'no_se_presento',
        fichaCita: {
          asistio,
          resumen:      resumen.trim(),
          compromisos:  compromisos.trim(),
          fechaRegistro: new Date().toISOString(),
          registradoPor: autor,
        },
      })
      onGuardado()
    } catch (err) { console.error(err); setError('Error al guardar.') }
    finally { setGuardando(false) }
  }

  return (
    <ModalShell title="Resultado de la cita" subtitle={`Citatorio del ${fmtFechaCita(expData.fechaCita)}`} headerColor="bg-indigo-700" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">¿Se presentó el padre / tutor?</p>
          <div className="flex gap-3">
            {[
              { val: true,  label: 'Sí se presentó', active: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
              { val: false, label: 'No se presentó', active: 'border-rose-400 bg-rose-50 text-rose-800' },
            ].map(op => (
              <label key={String(op.val)}
                className={`flex-1 flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 cursor-pointer transition text-sm font-medium ${
                  asistio === op.val ? op.active : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}>
                <input type="radio" name="asistio" checked={asistio === op.val}
                  onChange={() => setAsistio(op.val)} className="accent-emerald-600" />
                {op.label}
              </label>
            ))}
          </div>
        </div>
        {asistio && (
          <>
            <Field label="Resumen de lo tratado en la cita" required>
              <textarea value={resumen} onChange={e => setResumen(e.target.value)}
                rows={3} placeholder="Temas tratados, situación del alumno, acuerdos…" className={`${iCls} resize-none`} />
            </Field>
            <Field label="Compromisos adquiridos">
              <textarea value={compromisos} onChange={e => setCompromisos(e.target.value)}
                rows={3} placeholder="Compromisos del alumno, padre o tutor para mejorar la conducta…" className={`${iCls} resize-none`} />
            </Field>
          </>
        )}
        <ErrMsg msg={error} />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className={btnCancel}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold transition">
            {guardando ? 'Guardando…' : 'Registrar resultado'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ── Modal: Comentario de seguimiento ──────────────────────────────────────────
function ComentarioModal({ alumno, expId, autor, onClose, onGuardado }) {
  const [texto,     setTexto]     = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    if (!texto.trim()) return
    setGuardando(true)
    try {
      await updateDoc(doc(db, 'alumnos', alumno.id, 'expediente', expId), {
        comentarios: arrayUnion({ texto: texto.trim(), fecha: new Date().toISOString(), autor }),
      })
      onGuardado()
    } catch (err) { console.error(err) }
    finally { setGuardando(false) }
  }

  return (
    <ModalShell title="Agregar seguimiento" subtitle="Comentario sobre esta incidencia" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Comentario">
          <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={4} autoFocus
            placeholder="Observación, novedad o seguimiento sobre este caso…" className={`${iCls} resize-none`} />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className={btnCancel}>Cancelar</button>
          <button onClick={guardar} disabled={!texto.trim() || guardando}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition">
            {guardando ? 'Guardando…' : 'Agregar comentario'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ── Tarjeta de expediente ─────────────────────────────────────────────────────
function TarjetaExpediente({ exp, alumno, onFichaCita, onComentario, onToggleEnterado }) {
  const [abierta, setAbierta] = useState(false)
  const esCitatorio = exp.tipo === 'citatorio'

  const estadoMap = {
    pendiente:      { label: 'Cita pendiente',  cls: 'bg-amber-100 text-amber-700',    icon: 'schedule'     },
    realizada:      { label: 'Cita realizada',  cls: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
    no_se_presento: { label: 'No se presentó', cls: 'bg-red-100 text-red-700',         icon: 'person_off'   },
  }
  const estadoCfg = estadoMap[exp.estado] ?? { label: exp.estado, cls: 'bg-slate-100 text-slate-500', icon: 'help' }

  const hdr = esCitatorio
    ? { bg: 'bg-indigo-600', border: 'border-indigo-100', label: 'CITATORIO', icon: 'notification_important' }
    : { bg: 'bg-rose-600',   border: 'border-rose-100',   label: 'REPORTE',   icon: 'report'                }

  const comentarios = exp.comentarios ?? []

  return (
    <div className={`rounded-2xl border ${hdr.border} bg-white overflow-hidden shadow-sm`}>
      {/* Cabecera de la tarjeta — siempre visible */}
      <button onClick={() => setAbierta(a => !a)}
        className="w-full text-left flex items-start gap-4 p-4 hover:bg-slate-50/60 transition">
        <div className={`shrink-0 w-9 h-9 rounded-xl ${hdr.bg} flex items-center justify-center mt-0.5`}>
          <span className="material-symbols-outlined text-white text-[18px]">{hdr.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hdr.bg} text-white tracking-wide`}>
              {hdr.label}
            </span>
            {esCitatorio && (
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${estadoCfg.cls}`}>
                <span className="material-symbols-outlined text-[13px]">{estadoCfg.icon}</span>
                {estadoCfg.label}
              </span>
            )}
            {!esCitatorio && exp.enteradoPadre && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                Padre enterado
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-1.5">
            {esCitatorio
              ? `Cita programada: ${fmtFechaCita(exp.fechaCita)}${exp.horaCita ? ` · ${exp.horaCita} hrs` : ''}`
              : `Reporte del ${fmtFechaCita(exp.fechaReporte)}`}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {[exp.maestro, exp.materia].filter(Boolean).join(' · ')}
            {(exp.maestro || exp.materia) && ' · '}
            Registrado {fmtFecha(exp.fecha)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {comentarios.length > 0 && (
            <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">comment</span>{comentarios.length}
            </span>
          )}
          <span className="material-symbols-outlined text-slate-400 text-xl transition-transform duration-200"
            style={{ transform: abierta ? 'rotate(180deg)' : 'none' }}>
            expand_more
          </span>
        </div>
      </button>

      {/* Cuerpo expandible */}
      {abierta && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-5">

          {/* Datos del registro */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {esCitatorio && exp.tutorNombre && (
              <div className="col-span-2">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Dirigido a</p>
                <p className="text-slate-800 font-medium">{exp.tutorNombre}</p>
              </div>
            )}
            {exp.lugar && (
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Lugar</p>
                <p className="text-slate-800">{exp.lugar}</p>
              </div>
            )}
            {exp.maestro && (
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Maestro</p>
                <p className="text-slate-800">{exp.maestro}</p>
              </div>
            )}
            {exp.materia && (
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Materia</p>
                <p className="text-slate-800">{exp.materia}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Observaciones</p>
              <p className="text-slate-800 leading-relaxed bg-white rounded-xl px-4 py-3 border border-slate-100">
                {exp.observaciones}
              </p>
            </div>
          </div>

          {/* Ficha post-cita (si existe) */}
          {esCitatorio && exp.fichaCita && (
            <div className={`rounded-xl border p-4 space-y-3 ${
              exp.fichaCita.asistio ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
            }`}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">{exp.fichaCita.asistio ? 'event_available' : 'event_busy'}</span>
                Resultado de la cita · {fmtFecha(exp.fichaCita.fechaRegistro)}
              </p>
              {exp.fichaCita.resumen && (
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Resumen</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{exp.fichaCita.resumen}</p>
                </div>
              )}
              {exp.fichaCita.compromisos && (
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Compromisos</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{exp.fichaCita.compromisos}</p>
                </div>
              )}
              <p className="text-[11px] text-slate-400">Registrado por {exp.fichaCita.registradoPor}</p>
            </div>
          )}

          {/* Comentarios de seguimiento */}
          {comentarios.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                Seguimiento ({comentarios.length})
              </p>
              {[...comentarios].reverse().map((c, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-slate-800 leading-relaxed">{c.texto}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5">{c.autor} · {fmtFecha(c.fecha)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {esCitatorio && exp.estado === 'pendiente' && (
              <button onClick={() => onFichaCita(exp)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition">
                <span className="material-symbols-outlined text-sm">event_available</span>
                Registrar resultado de la cita
              </button>
            )}
            {!esCitatorio && !exp.enteradoPadre && (
              <button onClick={() => onToggleEnterado(exp)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Marcar padre enterado
              </button>
            )}
            <button onClick={() => onComentario(exp)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition">
              <span className="material-symbols-outlined text-sm">add_comment</span>
              Agregar seguimiento
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────
function CitatoriosView() {
  const { currentUser } = useAuth()
  const autor = currentUser?.nombre ?? currentUser?.email ?? 'Sistema'

  const [alumno,         setAlumno]         = useState(null)
  const [tsData,         setTsData]         = useState(null)
  const [expedientes,    setExpedientes]    = useState([])
  const [loadingExp,     setLoadingExp]     = useState(false)

  const [modalBusqueda,  setModalBusqueda]  = useState(false)
  const [modalCitatorio, setModalCitatorio] = useState(false)
  const [modalReporte,   setModalReporte]   = useState(false)
  const [modalFicha,     setModalFicha]     = useState(null)
  const [modalComent,    setModalComent]    = useState(null)

  const cargarExpedientes = async (curp) => {
    setLoadingExp(true)
    setExpedientes([])
    try {
      const snap = await getDocs(
        query(collection(db, 'alumnos', curp, 'expediente'), orderBy('fecha', 'desc'))
      )
      setExpedientes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error('Error cargando expediente:', err) }
    finally { setLoadingExp(false) }
  }

  const seleccionarAlumno = async (a) => {
    setAlumno(a)
    setModalBusqueda(false)
    setExpedientes([])
    try {
      const tsSnap = await getDoc(doc(db, 'alumnos', a.id, 'trabajo_social', 'datos'))
      setTsData(tsSnap.exists() ? tsSnap.data() : null)
    } catch { setTsData(null) }
    cargarExpedientes(a.id)
  }

  const onGuardado = () => {
    setModalCitatorio(false)
    setModalReporte(false)
    setModalFicha(null)
    setModalComent(null)
    if (alumno) cargarExpedientes(alumno.id)
  }

  const onToggleEnterado = async (exp) => {
    try {
      await updateDoc(doc(db, 'alumnos', alumno.id, 'expediente', exp.id), { enteradoPadre: true })
      cargarExpedientes(alumno.id)
    } catch (err) { console.error(err) }
  }

  const nombreAlumno = alumno
    ? `${alumno.primerApellido ?? ''} ${alumno.segundoApellido ?? ''} ${alumno.nombre ?? ''}`.trim()
    : ''

  const citatorios = expedientes.filter(e => e.tipo === 'citatorio')
  const reportes   = expedientes.filter(e => e.tipo === 'reporte')

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-emerald-600 text-2xl">notification_important</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-slate-900">Citatorios y Reportes</h2>
              <p className="text-sm text-slate-500 mt-0.5">Historial de incidencias conductuales por alumno</p>
            </div>
          </div>
          <button onClick={() => setModalBusqueda(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shrink-0">
            <span className="material-symbols-outlined text-base">person_search</span>
            {alumno ? 'Cambiar alumno' : 'Buscar alumno'}
          </button>
        </div>
      </div>

      {/* Sin alumno */}
      {!alumno && (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-slate-400 text-3xl">manage_search</span>
          </div>
          <p className="text-base font-semibold text-slate-700">Selecciona un alumno</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs leading-relaxed">
            Busca por CURP o por grupo para ver y registrar incidencias conductuales.
          </p>
          <button onClick={() => setModalBusqueda(true)}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition">
            <span className="material-symbols-outlined text-base">search</span>
            Buscar alumno
          </button>
        </div>
      )}

      {/* Con alumno seleccionado */}
      {alumno && (
        <>
          {/* Panel del alumno + acciones */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-slate-500 text-xl">person</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{nombreAlumno}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {alumno.grado}° {alumno.grupo} ·{' '}
                    <span className="font-mono">{alumno.id}</span>
                    {!loadingExp && expedientes.length > 0 && (
                      <span className="ml-2">
                        · <span className="text-indigo-600 font-medium">{citatorios.length} citatorio{citatorios.length !== 1 ? 's' : ''}</span>
                        {' · '}<span className="text-rose-600 font-medium">{reportes.length} reporte{reportes.length !== 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setModalReporte(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-sm font-semibold transition">
                  <span className="material-symbols-outlined text-base">report</span>
                  Nuevo reporte
                </button>
                <button onClick={() => setModalCitatorio(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">
                  <span className="material-symbols-outlined text-base">notification_important</span>
                  Nuevo citatorio
                </button>
              </div>
            </div>
          </div>

          {/* Historial */}
          {loadingExp ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center gap-3 text-slate-400 shadow-sm">
              <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
              <p className="text-sm">Cargando historial…</p>
            </div>
          ) : expedientes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-slate-300 text-4xl">history</span>
              <p className="text-sm font-semibold text-slate-600 mt-3">Sin incidencias registradas</p>
              <p className="text-xs text-slate-400 mt-1">Este alumno no tiene citatorios ni reportes en su expediente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expedientes.map(exp => (
                <TarjetaExpediente
                  key={exp.id}
                  exp={exp}
                  alumno={alumno}
                  onFichaCita={(e) => setModalFicha({ expId: e.id, expData: e })}
                  onComentario={(e) => setModalComent({ expId: e.id })}
                  onToggleEnterado={onToggleEnterado}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modales */}
      {modalBusqueda  && <BuscarAlumnoModal onSeleccionado={seleccionarAlumno} onClose={() => setModalBusqueda(false)} />}
      {modalCitatorio && alumno && (
        <NuevoCitatorioModal alumno={alumno} tsData={tsData} autor={autor}
          onClose={() => setModalCitatorio(false)} onGuardado={onGuardado} />
      )}
      {modalReporte   && alumno && (
        <NuevoReporteModal alumno={alumno} autor={autor}
          onClose={() => setModalReporte(false)} onGuardado={onGuardado} />
      )}
      {modalFicha     && alumno && (
        <FichaCitaModal alumno={alumno} expId={modalFicha.expId} expData={modalFicha.expData}
          autor={autor} onClose={() => setModalFicha(null)} onGuardado={onGuardado} />
      )}
      {modalComent    && alumno && (
        <ComentarioModal alumno={alumno} expId={modalComent.expId}
          autor={autor} onClose={() => setModalComent(null)} onGuardado={onGuardado} />
      )}
    </div>
  )
}

export default CitatoriosView
