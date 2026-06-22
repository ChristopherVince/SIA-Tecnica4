import { useState } from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../context/AuthContext'

const GRUPOS_POR_TURNO = {
  matutino:   ['A', 'B', 'C', 'D', 'E', 'F'],
  vespertino: ['G', 'H', 'I', 'J', 'K', 'L'],
}
const GRADOS = ['1', '2', '3']

const turnoDeGrupo = (g) =>
  GRUPOS_POR_TURNO.matutino.includes(g) ? 'matutino' : 'vespertino'

// ─── Helpers de presentación ──────────────────────────────────────────────────
function Campo({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[11px] text-slate-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  )
}

function Seccion({ titulo, icon }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3 pb-1.5 border-b border-slate-100">
      <span className="material-symbols-outlined text-emerald-500 text-base">{icon}</span>
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{titulo}</h3>
    </div>
  )
}

// ─── Panel de detalle ─────────────────────────────────────────────────────────
function DetalleAlumno({ alumno, tsData, onClose }) {
  const nombre = `${alumno.primerApellido ?? ''} ${alumno.segundoApellido ?? ''} ${alumno.nombre ?? ''}`.trim()
  const curp   = alumno.curp ?? alumno.id
  const sexoLabel = alumno.sexo === 'H' ? 'Hombre' : alumno.sexo === 'M' ? 'Mujer' : (alumno.sexo ?? '—')
  const tieneTutor = tsData?.tutorLegalDiferente?.toLowerCase().includes('sí')

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

        {/* Cabecera */}
        <div className="bg-emerald-900 text-white p-5 sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-emerald-300 uppercase tracking-wider">Expediente</p>
              <h2 className="text-base font-bold leading-snug mt-0.5">{nombre}</h2>
              <p className="text-xs font-mono text-emerald-300 mt-0.5 truncate">{curp}</p>
            </div>
            <button onClick={onClose} className="mt-0.5 shrink-0 text-emerald-300 hover:text-white transition">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded-full">
              {alumno.grado}° {alumno.grupo}
            </span>
            <span className="text-xs bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded-full">
              {sexoLabel}
            </span>
            {tsData && (
              <span className="text-xs bg-emerald-700 text-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                Inscripción digital registrada
              </span>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-5 flex-1">

          {/* Datos del alumno (alumnos/{curp}) */}
          <Seccion titulo="Datos del alumno" icon="person" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-2"><Campo label="CURP" value={curp} /></div>
            <Campo label="Fecha de nacimiento" value={alumno.fechaNacimiento} />
            <Campo label="Sexo"   value={sexoLabel} />
            <Campo label="Grado"  value={`${alumno.grado}°`} />
            <Campo label="Grupo"  value={alumno.grupo} />
          </div>

          {/* Datos de inscripción digital (trabajo_social/datos) */}
          {tsData ? (
            <>
              {/* Domicilio */}
              <Seccion titulo="Domicilio del alumno" icon="home" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2"><Campo label="Calle y número"    value={tsData.alumno?.domicilio} /></div>
                <Campo label="Colonia"             value={tsData.alumno?.colonia} />
                <Campo label="C.P."                value={tsData.alumno?.cp} />
                <Campo label="Municipio"           value={tsData.alumno?.municipio} />
                <Campo label="Lugar de nacimiento" value={tsData.alumno?.lugarNacimiento} />
                <Campo label="Nacionalidad"        value={tsData.alumno?.nacionalidad} />
              </div>

              {/* Datos físicos */}
              <Seccion titulo="Datos físicos" icon="monitor_heart" />
              <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                <Campo label="Peso"            value={tsData.alumno?.peso} />
                <Campo label="Estatura"        value={tsData.alumno?.estatura} />
                <Campo label="Tipo de sangre"  value={tsData.alumno?.tipoSangre} />
                <div className="col-span-2"><Campo label="Núm. acta de nacimiento" value={tsData.alumno?.numActa} /></div>
                <Campo label="Libro"           value={tsData.alumno?.libro} />
                <Campo label="Año de registro" value={tsData.alumno?.anioActa} />
              </div>

              {/* Padre / Madre */}
              <Seccion titulo="Padre / Madre" icon="family_restroom" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2"><Campo label="Nombre completo"        value={tsData.padres?.nombreCompleto} /></div>
                <Campo label="Ocupación"                value={tsData.padres?.ocupacion} />
                <Campo label="Último grado de estudios" value={tsData.padres?.ultimoGrado} />
                <Campo label="Tel. particular"          value={tsData.padres?.telefonoParticular} />
                <Campo label="Celular"                  value={tsData.padres?.celular} />
                <div className="col-span-2"><Campo label="Correo electrónico" value={tsData.padres?.correo} /></div>
                <div className="col-span-2"><Campo label="Domicilio"          value={tsData.padres?.domicilio} /></div>
                <Campo label="Empresa"                  value={tsData.padres?.empresa} />
                <Campo label="Puesto"                   value={tsData.padres?.puesto} />
                <Campo label="Área"                     value={tsData.padres?.area} />
                <Campo label="Tel. trabajo"             value={tsData.padres?.telTrabajo} />
              </div>

              {/* Tutor legal */}
              {tieneTutor && (
                <>
                  <Seccion titulo="Tutor legal" icon="gavel" />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="col-span-2"><Campo label="Nombre completo"        value={tsData.tutorLegal?.nombreCompleto} /></div>
                    <Campo label="Ocupación"                value={tsData.tutorLegal?.ocupacion} />
                    <Campo label="Último grado de estudios" value={tsData.tutorLegal?.ultimoGrado} />
                    <Campo label="Tel. particular"          value={tsData.tutorLegal?.telefonoParticular} />
                    <Campo label="Celular"                  value={tsData.tutorLegal?.celular} />
                    <div className="col-span-2"><Campo label="Correo electrónico" value={tsData.tutorLegal?.correo} /></div>
                    <div className="col-span-2"><Campo label="Domicilio"          value={tsData.tutorLegal?.domicilio} /></div>
                    <Campo label="Empresa"                  value={tsData.tutorLegal?.empresa} />
                    <Campo label="Puesto"                   value={tsData.tutorLegal?.puesto} />
                    <Campo label="Área"                     value={tsData.tutorLegal?.area} />
                    <Campo label="Tel. trabajo"             value={tsData.tutorLegal?.telTrabajo} />
                    <Campo label="Núm. de oficio"           value={tsData.tutorLegal?.numOficio} />
                    <Campo label="Fecha doc. probatorio"    value={tsData.tutorLegal?.fechaDocumento} />
                  </div>
                </>
              )}

              {/* Convivencia y salud */}
              <Seccion titulo="Convivencia y salud" icon="health_and_safety" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Campo label="¿Vive con sus padres?" value={tsData.viveConPadres} />
                <Campo label="¿Con quién vive?"      value={tsData.conQuienVive} />
                <div className="col-span-2"><Campo label="Motivo" value={tsData.porQueNoVive} /></div>
                <Campo label="Responsable en plantel" value={tsData.responsablePlantel} />
                <Campo label="Parentesco"             value={tsData.parentescoResponsable} />
                <div className="col-span-2"><Campo label="¿Padece enfermedad o NEE?" value={tsData.tieneEnfermedad} /></div>
                <div className="col-span-2"><Campo label="¿Cuál?"                    value={tsData.cualEnfermedad} /></div>
              </div>

              <p className="text-[11px] text-slate-400 mt-6">
                Registrado el{' '}
                {tsData.fechaRegistro
                  ? new Date(tsData.fechaRegistro).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
                {' · '}Turno {tsData.turno ?? '—'}
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <span className="material-symbols-outlined text-slate-300 text-3xl">description</span>
              <p className="text-sm font-medium text-slate-500 mt-2">Sin datos de inscripción digital</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                El tutor aún no ha enviado el formulario en línea o está pendiente de aprobación.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────
function ExpedientesView() {
  const { currentUser } = useAuth()
  const turnoUsuario = currentUser?.turno ?? 'matutino'

  const [grado,   setGrado]   = useState('')
  const [grupo,   setGrupo]   = useState('')
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const [alumnoSel,      setAlumnoSel]      = useState(null)
  const [tsData,         setTsData]         = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const buscarAlumnos = async () => {
    if (!grado || !grupo) return
    setLoading(true)
    setBuscado(false)
    setAlumnos([])
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
    } catch (err) {
      console.error('Error buscando alumnos:', err)
    } finally {
      setLoading(false)
      setBuscado(true)
    }
  }

  const verDetalle = async (alumno) => {
    setAlumnoSel(alumno)
    setTsData(null)
    setLoadingDetalle(true)
    try {
      const snap = await getDoc(doc(db, 'alumnos', alumno.id, 'trabajo_social', 'datos'))
      setTsData(snap.exists() ? snap.data() : null)
    } catch (err) {
      console.error('Error cargando expediente TS:', err)
      setTsData(null)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const cerrarDetalle = () => { setAlumnoSel(null); setTsData(null) }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-600 text-2xl">person_search</span>
          </div>
          <div>
            <h2 className="text-xl font-headline font-bold text-slate-900">Búsqueda de Alumnos</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Consulta expedientes de cualquier grupo — matutino y vespertino.
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
              onChange={e => { setGrado(e.target.value); setAlumnos([]); setBuscado(false) }}
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
              onChange={e => { setGrupo(e.target.value); setAlumnos([]); setBuscado(false) }}
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
            onClick={buscarAlumnos}
            disabled={!grado || !grupo || loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {buscado && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {alumnos.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-slate-300 text-4xl">group_off</span>
              <p className="text-sm text-slate-500 mt-3">No se encontraron alumnos en {grado}° {grupo}.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  {grado}° {grupo} — {alumnos.length} alumnos
                </p>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                  turnoDeGrupo(grupo) === turnoUsuario
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {turnoDeGrupo(grupo)}
                </span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-10">#</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Nombre</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">CURP</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alumnos.map((alumno, i) => (
                    <tr key={alumno.id} className="hover:bg-emerald-50/40 transition">
                      <td className="px-6 py-3 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {alumno.primerApellido} {alumno.segundoApellido} {alumno.nombre}
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell font-mono text-xs text-slate-400">
                        {alumno.id}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => verDetalle(alumno)}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition"
                        >
                          Ver expediente →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Panel de detalle */}
      {alumnoSel && (
        loadingDetalle ? (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={cerrarDetalle} />
            <div className="relative w-full max-w-lg bg-white h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
                <p className="text-sm">Cargando expediente…</p>
              </div>
            </div>
          </div>
        ) : (
          <DetalleAlumno alumno={alumnoSel} tsData={tsData} onClose={cerrarDetalle} />
        )
      )}
    </div>
  )
}

export default ExpedientesView
