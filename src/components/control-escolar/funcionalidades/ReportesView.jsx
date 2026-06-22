import { useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import {
  BLOQUES,
  GRADOS_VALIDOS,
  GRUPOS_POR_TURNO,
  getAsignaturasRegulares,
} from './evaluacion-bloque/evaluacionBloqueConfig'
import exampleReporte from '../../../data/exampleReporteMatricula.json'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../../config/firebase'

const getCurrentCycle = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

const TALLERES = [
  'ADMINISTRACION',
  'ADMINISTRACION CONTABLE',
  'CONFEC. VESTIDO E IND. TEXTIL',
  'DISENO DE CIRCUITOS ELECTRICOS',
  'DISENO INDUSTRIAL',
  'ELECTRONICA',
  'INFORMATICA',
  'MECANICA',
  'OFIMATICA',
]

const REPORTES = [
  {
    id: 'matricula',
    title: 'Reportes de matricula',
    description: 'Listados y resumenes de inscripcion por edad, sexo y grupo.',
    icon: 'groups',
    accent: 'emerald',
    requiereCriterios: false,
  },
  {
    id: 'estadisticos',
    title: 'Reportes estadisticos de bloque',
    description: 'Promedios, aprobatorios, reprobatorios y porcentajes.',
    icon: 'insights',
    accent: 'indigo',
    requiereCriterios: true,
  },
  {
    id: 'promedios',
    title: 'Promedios actualizados',
    description: 'Consolidado de promedios vigentes por alumno y grupo.',
    icon: 'trending_up',
    accent: 'sky',
    requiereCriterios: true,
  },
  {
    id: 'irregulares',
    title: 'Alumnos irregulares',
    description: 'Listado de alumnos con materias pendientes o rezagos.',
    icon: 'report_problem',
    accent: 'amber',
    requiereCriterios: true,
  },
  {
    id: 'repetidores',
    title: 'Alumnos repetidores',
    description: 'Identificacion de alumnos en repeticion de grado.',
    icon: 'restart_alt',
    accent: 'rose',
    requiereCriterios: true,
  },
  {
    id: 'listado',
    title: 'Listado de alumnos por grupo',
    description: 'Lista de alumnos de un grupo con CURP, sexo, edad y taller asignado.',
    icon: 'format_list_numbered',
    accent: 'violet',
    requiereCriterios: false,
  },
]

const MATRICULA_OPCIONES = [
  {
    id: 'inicio_sexo',
    label: 'Matricula inicio de ciclo con edades (organizada por sexo)',
  },
  {
    id: 'inicio_grupo',
    label: 'Matricula inicio de ciclo con edades (organizada por grupo)',
  },
]

const ACCENT_STYLES = {
  emerald: {
    ring: 'border-emerald-300 bg-emerald-50/60',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    badgeActive: 'bg-emerald-100 text-emerald-800',
  },
  indigo: {
    ring: 'border-indigo-300 bg-indigo-50/60',
    icon: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700',
    badgeActive: 'bg-indigo-100 text-indigo-800',
  },
  sky: {
    ring: 'border-sky-300 bg-sky-50/60',
    icon: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700',
    badgeActive: 'bg-sky-100 text-sky-800',
  },
  amber: {
    ring: 'border-amber-300 bg-amber-50/60',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    badgeActive: 'bg-amber-100 text-amber-800',
  },
  rose: {
    ring: 'border-rose-300 bg-rose-50/60',
    icon: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-700',
    badgeActive: 'bg-rose-100 text-rose-800',
  },
  violet: {
    ring: 'border-violet-300 bg-violet-50/60',
    icon: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
    badgeActive: 'bg-violet-100 text-violet-800',
  },
}

const EMPTY_FORM = {
  cicloEscolar: getCurrentCycle(),
  bloque: '',
  grado: '',
  grupo: '',
  asignatura: '',
  tecnologia: '',
}

function ReportesView() {
  const { currentUser } = useAuth()
  const turno = (currentUser?.turno ?? '').toLowerCase()
  const gruposDisponibles =
    GRUPOS_POR_TURNO[turno] ?? [...GRUPOS_POR_TURNO.matutino, ...GRUPOS_POR_TURNO.vespertino]

  const [reporteSeleccionado, setReporteSeleccionado] = useState('')
  const [matriculaSeleccionada, setMatriculaSeleccionada] = useState('')
  const [cicloReporte, setCicloReporte] = useState(getCurrentCycle())
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isGenerating, setIsGenerating] = useState(false)
  const [listadoGrado, setListadoGrado] = useState('')
  const [listadoGrupo, setListadoGrupo] = useState('')

  const reporteActual = REPORTES.find((r) => r.id === reporteSeleccionado) ?? null

  const isCriteriosCompleto = useMemo(
    () => Boolean(
      formData.cicloEscolar &&
      formData.bloque &&
      formData.grado &&
      formData.grupo &&
      formData.asignatura &&
      formData.tecnologia
    ),
    [formData],
  )

  const isReadyToGenerate = useMemo(() => {
    if (!reporteSeleccionado) return false
    if (reporteSeleccionado === 'matricula') {
      return matriculaSeleccionada === 'inicio_sexo' || matriculaSeleccionada === 'inicio_grupo'
    }
    if (reporteSeleccionado === 'listado') {
      return Boolean(listadoGrado && listadoGrupo)
    }
    if (reporteSeleccionado === 'estadisticos') {
      return Boolean(formData.cicloEscolar && formData.bloque && formData.grado)
    }
    if (reporteSeleccionado === 'promedios') {
      return Boolean(formData.cicloEscolar && formData.grado && formData.grupo)
    }
    if (reporteSeleccionado === 'irregulares') {
      return Boolean(formData.cicloEscolar && formData.grado)
    }
    if (reporteSeleccionado === 'repetidores') {
      return Boolean(formData.cicloEscolar && formData.grado)
    }
    return isCriteriosCompleto
  }, [reporteSeleccionado, matriculaSeleccionada, isCriteriosCompleto, listadoGrado, listadoGrupo, formData])

  const handleSeleccionarReporte = (id) => {
    setReporteSeleccionado(id)
    setMatriculaSeleccionada('')
    setListadoGrado('')
    setListadoGrupo('')
    if (id === 'matricula') setFormData(EMPTY_FORM)
  }

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const resetCriterios = () => {
    setFormData(EMPTY_FORM)
  }

  const resumen = useMemo(() => {
    if (reporteSeleccionado === 'promedios') {
      return [
        { label: 'Ciclo',  value: formData.cicloEscolar || 'Pendiente' },
        { label: 'Grado',  value: formData.grado ? `${formData.grado}°` : 'Pendiente' },
        { label: 'Grupo',  value: formData.grupo || 'Pendiente' },
      ]
    }
    if (reporteSeleccionado === 'irregulares') {
      return [
        { label: 'Ciclo',  value: formData.cicloEscolar || 'Pendiente' },
        { label: 'Grado',  value: formData.grado ? `${formData.grado}°` : 'Pendiente' },
      ]
    }
    if (reporteSeleccionado === 'repetidores') {
      return [
        { label: 'Ciclo',  value: formData.cicloEscolar || 'Pendiente' },
        { label: 'Grado',  value: formData.grado ? `${formData.grado}°` : 'Pendiente' },
      ]
    }
    const base = [
      { label: 'Ciclo',  value: formData.cicloEscolar || 'Pendiente' },
      { label: 'Bloque', value: formData.bloque || 'Pendiente' },
      { label: 'Grado',  value: formData.grado ? `${formData.grado}°` : 'Pendiente' },
    ]
    if (reporteSeleccionado !== 'estadisticos') {
      base.push(
        { label: 'Grupo', value: formData.grupo || 'Pendiente' },
        {
          label: 'Asignatura',
          value: formData.asignatura
            ? getAsignaturasRegulares(formData.grado).find((item) => item.key === formData.asignatura)?.label ?? formData.asignatura
            : 'Pendiente',
        },
        { label: 'Tecnologia', value: formData.tecnologia || 'Pendiente' },
      )
    }
    return base
  }, [formData, reporteSeleccionado])

  const buildMatriculaSexoData = async () => {
    const GRADOS_ETIQUETAS = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }
    const grupos = GRUPOS_POR_TURNO[turno] ?? []
    const startYear = parseInt(cicloReporte.split('-')[0], 10)

    const snap = await getDocs(query(collection(db, 'alumnos'), where('turno', '==', turno)))

    const gradosMap = {}

    snap.forEach((docSnap) => {
      const a = docSnap.data()
      const grado = String(a.grado ?? '')
      if (!['1', '2', '3'].includes(grado)) return
      if (a.egresado || a.estatus === 'egresado') return

      const grupo = String(a.grupo ?? '').toUpperCase()
      if (!grupos.includes(grupo)) return

      const sexo = String(a.sexo ?? 'H').toUpperCase() === 'M' ? 'M' : 'H'

      let edadKey = null
      if (a.fechaNacimiento) {
        const birthYear = parseInt(String(a.fechaNacimiento).substring(0, 4), 10)
        if (!isNaN(birthYear)) edadKey = String(startYear - birthYear)
      }

      if (!gradosMap[grado]) {
        gradosMap[grado] = {
          grado,
          gradoLabel: GRADOS_ETIQUETAS[grado] ?? grado,
          sexos: {
            H: { grupos: {}, totalPorEdad: {}, totalSexo: 0 },
            M: { grupos: {}, totalPorEdad: {}, totalSexo: 0 },
          },
          totalPorGrado: { total: 0 },
        }
      }

      const gradoObj = gradosMap[grado]
      const sexoObj = gradoObj.sexos[sexo]

      if (!sexoObj.grupos[grupo]) sexoObj.grupos[grupo] = { edades: {}, total: 0 }
      const grupoObj = sexoObj.grupos[grupo]

      grupoObj.total += 1
      sexoObj.totalSexo += 1
      gradoObj.totalPorGrado.total += 1

      if (edadKey) {
        grupoObj.edades[edadKey] = (grupoObj.edades[edadKey] ?? 0) + 1
        sexoObj.totalPorEdad[edadKey] = (sexoObj.totalPorEdad[edadKey] ?? 0) + 1
        gradoObj.totalPorGrado[edadKey] = (gradoObj.totalPorGrado[edadKey] ?? 0) + 1
      }
    })

    const grados = ['1', '2', '3'].filter((g) => gradosMap[g]).map((g) => gradosMap[g])

    const totalEscuela = { total: 0 }
    grados.forEach((g) => {
      Object.entries(g.totalPorGrado).forEach(([key, val]) => {
        totalEscuela[key] = (totalEscuela[key] ?? 0) + val
      })
    })

    return {
      ciclo: cicloReporte,
      escuela: {
        nombre: 'ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4',
        clave: '30DST0',
        localidad: 'ORIZABA, VERACRUZ',
      },
      turno: turno.toUpperCase(),
      fechaGeneracion: new Date().toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }),
      grupos,
      grados,
      totalEscuela,
    }
  }

  const handleGenerarReporte = async () => {
    if (!isReadyToGenerate || reporteSeleccionado !== 'matricula') return
    setIsGenerating(true)
    try {
      const dataReporte = await buildMatriculaSexoData()
      const isGrupo = matriculaSeleccionada === 'inicio_grupo'

      const [{ pdf }, { default: PDFComponent }] = await Promise.all([
        import('@react-pdf/renderer'),
        isGrupo
          ? import('../../reports/ReporteMatriculaGrupoPDF')
          : import('../../reports/ReporteMatriculaEdadesPDF'),
      ])

      const docEl = <PDFComponent dataReporte={dataReporte} />
      const asPdf = pdf()
      asPdf.updateContainer(docEl)
      const blob = await asPdf.toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matricula_inicio_${isGrupo ? 'grupo' : 'sexo'}_${cicloReporte}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generating PDF', err)
      alert('Error al generar el PDF. Revisa la consola para mas detalles.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerarListado = async () => {
    if (!isReadyToGenerate || reporteSeleccionado !== 'listado') return
    setIsGenerating(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'alumnos'),
          where('grado', '==', listadoGrado),
          where('grupo', '==', listadoGrupo),
        ),
      )
      const alumnos = snap.docs
        .map((d) => ({ curp: d.id, ...d.data() }))
        .filter((a) => !a.egresado && a.estatus !== 'egresado')
        .sort((a, b) => {
          const nA = [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ')
          const nB = [b.primerApellido, b.segundoApellido, b.nombre].filter(Boolean).join(' ')
          return nA.localeCompare(nB, 'es')
        })

      const dataReporte = {
        escuela: {
          nombre: 'ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4',
          clave: '30DST0',
          localidad: 'ORIZABA, VERACRUZ',
        },
        turno: turno.toUpperCase() || 'GENERAL',
        grado: listadoGrado,
        grupo: listadoGrupo,
        alumnos,
        fechaGeneracion: new Date().toLocaleDateString('es-MX', {
          day: 'numeric', month: 'long', year: 'numeric',
        }),
      }

      const [{ pdf }, { default: PDFComponent }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../../reports/ReporteListadoGrupoPDF'),
      ])

      const asPdf = pdf()
      asPdf.updateContainer(<PDFComponent dataReporte={dataReporte} />)
      const blob = await asPdf.toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `listado_${listadoGrado}${listadoGrupo}_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generating PDF', err)
      alert('Error al generar el PDF. Revisa la consola para mas detalles.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerarEstadistico = async () => {
    if (!isReadyToGenerate || reporteSeleccionado !== 'estadisticos') return
    setIsGenerating(true)
    try {
      const { generarReporteEstadistico } = await import('../../../utils/reportesBloqueHelper')
      await generarReporteEstadistico({
        grado:        formData.grado,
        bloque:       formData.bloque,
        cicloEscolar: formData.cicloEscolar,
        turno,
      })
    } catch (err) {
      console.error('Error generating PDF', err)
      alert('Error al generar el PDF. Revisa la consola para mas detalles.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerarRepetidores = async () => {
    if (!isReadyToGenerate || reporteSeleccionado !== 'repetidores') return
    setIsGenerating(true)
    try {
      const { generarAlumnosRepetidores } = await import('../../../utils/reportesBloqueHelper')
      await generarAlumnosRepetidores({
        grado:        formData.grado,
        cicloEscolar: formData.cicloEscolar,
        turno,
      })
    } catch (err) {
      console.error('Error generating PDF', err)
      alert('Error al generar el PDF. Revisa la consola para mas detalles.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerarIrregulares = async () => {
    if (!isReadyToGenerate || reporteSeleccionado !== 'irregulares') return
    setIsGenerating(true)
    try {
      const { generarAlumnosIrregulares } = await import('../../../utils/reportesBloqueHelper')
      await generarAlumnosIrregulares({
        grado:        formData.grado,
        cicloEscolar: formData.cicloEscolar,
        turno,
      })
    } catch (err) {
      console.error('Error generating PDF', err)
      alert('Error al generar el PDF. Revisa la consola para mas detalles.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerarPromedios = async () => {
    if (!isReadyToGenerate || reporteSeleccionado !== 'promedios') return
    setIsGenerating(true)
    try {
      const { generarPromediosActualizados } = await import('../../../utils/reportesBloqueHelper')
      await generarPromediosActualizados({
        grado:        formData.grado,
        grupo:        formData.grupo,
        cicloEscolar: formData.cicloEscolar,
        turno,
      })
    } catch (err) {
      console.error('Error generating PDF', err)
      alert('Error al generar el PDF. Revisa la consola para mas detalles.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex-1 bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-amber-300">assignment</span>
                <h1 className="text-3xl font-headline font-bold">Reportes</h1>
              </div>
              <p className="text-sm text-slate-200 mt-2 max-w-2xl">
                Selecciona el tipo de reporte y luego configura los criterios necesarios antes de generar el PDF.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 min-w-[240px]">
              <p className="text-xs uppercase tracking-wider text-slate-200 font-semibold">Turno activo</p>
              <p className="text-lg font-semibold text-white mt-1">
                {turno ? (turno === 'matutino' ? 'Matutino' : 'Vespertino') : 'Sin asignar'}
              </p>
              <p className="text-xs text-slate-300 mt-1">Solo se generan reportes de tu turno.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
          {/* COLUMNA IZQUIERDA — Paso 1: tipo de reporte */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">
                    Tipo de reporte
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Elige el tipo de reporte que deseas generar.</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  Paso 1
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REPORTES.map((reporte) => {
                  const isActive = reporteSeleccionado === reporte.id
                  const accents = ACCENT_STYLES[reporte.accent]

                  return (
                    <button
                      key={reporte.id}
                      type="button"
                      onClick={() => handleSeleccionarReporte(reporte.id)}
                      className={`text-left rounded-2xl border-2 p-4 transition ${
                        isActive ? accents.ring : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? accents.badge : 'bg-slate-100'
                        }`}>
                          <span className={`material-symbols-outlined text-[20px] ${
                            isActive ? accents.icon : 'text-slate-500'
                          }`}>
                            {reporte.icon}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 leading-tight">{reporte.title}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">{reporte.description}</p>
                          {!reporte.requiereCriterios && (
                            <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                              Sin criterios
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              <p className="font-semibold text-slate-700">Sugerencia</p>
              <p className="mt-2">
                Los reportes de matricula son generales y no necesitan criterios adicionales. Los demas requieren configurar grado, grupo y otros filtros.
              </p>
            </div>
          </div>

          {/* COLUMNA DERECHA — Paso 2: subopciones o criterios */}
          <div className="space-y-6">
            {/* Placeholder cuando nada está seleccionado */}
            {!reporteSeleccionado && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400 text-3xl">arrow_back</span>
                </div>
                <p className="text-sm font-semibold text-slate-700">Selecciona un tipo de reporte</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  El paso 2 se habilitara automaticamente en funcion del tipo seleccionado.
                </p>
              </div>
            )}

            {/* Matricula: subopciones + sin criterios */}
            {reporteSeleccionado === 'matricula' && (
              <>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">
                        Tipo de matricula
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Selecciona el formato del listado.</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      Paso 2
                    </span>
                  </div>

                  <div className="space-y-2">
                    {MATRICULA_OPCIONES.map((opcion) => {
                      const isActive = matriculaSeleccionada === opcion.id
                      return (
                        <button
                          key={opcion.id}
                          type="button"
                          onClick={() => setMatriculaSeleccionada(opcion.id)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                            isActive
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-[18px] ${
                              isActive ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {isActive ? 'radio_button_checked' : 'radio_button_unchecked'}
                            </span>
                            <p className="text-sm font-semibold text-slate-800">{opcion.label}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ciclo escolar</label>
                  <input
                    type="text"
                    value={cicloReporte}
                    onChange={(e) => setCicloReporte(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="2025-2026"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Se usará como encabezado del reporte y para calcular edades de los alumnos.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px] mt-0.5">check_circle</span>
                  <p className="text-sm text-emerald-800">
                    Este reporte consulta <span className="font-semibold">todos los alumnos activos de tu turno</span> y calcula las edades a partir de las fechas de nacimiento en sus CURPs.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <button
                    type="button"
                    onClick={handleGenerarReporte}
                    disabled={!isReadyToGenerate || isGenerating}
                    className={`w-full rounded-xl font-semibold py-3 transition ${
                      isReadyToGenerate && !isGenerating
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? 'Generando PDF...' : 'Generar reporte'}
                  </button>
                  {!isReadyToGenerate && matriculaSeleccionada === 'actualizada_resumen' && (
                    <p className="text-xs text-amber-600 text-center mt-2">
                      Esta opcion esta en desarrollo.
                    </p>
                  )}
                  {!isReadyToGenerate && matriculaSeleccionada !== 'actualizada_resumen' && (
                    <p className="text-xs text-slate-400 text-center mt-2">
                      Selecciona el tipo de matricula para continuar.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Listado de alumnos por grupo */}
            {reporteSeleccionado === 'listado' && (
              <>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">
                        Filtros del reporte
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Selecciona el grado y grupo a listar.</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      Paso 2
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-2">Grado</span>
                      <select
                        value={listadoGrado}
                        onChange={(e) => setListadoGrado(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="" disabled>Selecciona</option>
                        {GRADOS_VALIDOS.map((g) => (
                          <option key={g} value={g}>{g}°</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-2">Grupo</span>
                      <select
                        value={listadoGrupo}
                        onChange={(e) => setListadoGrupo(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="" disabled>Selecciona</option>
                        {gruposDisponibles.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-violet-600 text-[18px] mt-0.5">info</span>
                  <p className="text-sm text-violet-800">
                    Se listarán todos los alumnos activos del grupo seleccionado con su CURP, sexo, edad actual y taller asignado.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <button
                    type="button"
                    onClick={handleGenerarListado}
                    disabled={!isReadyToGenerate || isGenerating}
                    className={`w-full rounded-xl font-semibold py-3 transition ${
                      isReadyToGenerate && !isGenerating
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? 'Generando PDF...' : 'Generar listado'}
                  </button>
                  {!isReadyToGenerate && (
                    <p className="text-xs text-slate-400 text-center mt-2">
                      Selecciona grado y grupo para continuar.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Cualquier otro tipo: criterios + resumen + generar */}
            {reporteActual?.requiereCriterios && (
              <>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">
                        Criterios del reporte
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Ajusta los filtros para enfocar el reporte de{' '}
                        <span className="font-semibold">{reporteActual.title.toLowerCase()}</span>.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        Paso 2
                      </span>
                      <button
                        type="button"
                        onClick={resetCriterios}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5"
                      >
                        Restablecer
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-2">Ciclo escolar</span>
                      <input
                        type="text"
                        value={formData.cicloEscolar}
                        onChange={handleChange('cicloEscolar')}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="2025-2026"
                      />
                    </label>

                    {reporteSeleccionado !== 'promedios' && reporteSeleccionado !== 'irregulares' && reporteSeleccionado !== 'repetidores' && (
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-2">Bloque</span>
                      <select
                        value={formData.bloque}
                        onChange={handleChange('bloque')}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="" disabled>Selecciona un bloque</option>
                        {BLOQUES.map((block) => (
                          <option key={block.id} value={block.id}>{block.label}</option>
                        ))}
                      </select>
                    </label>
                    )}

                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-2">Grado</span>
                      <select
                        value={formData.grado}
                        onChange={handleChange('grado')}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="" disabled>Selecciona un grado</option>
                        {GRADOS_VALIDOS.map((grado) => (
                          <option key={grado} value={grado}>{grado}°</option>
                        ))}
                      </select>
                    </label>

                    {reporteSeleccionado !== 'estadisticos' && reporteSeleccionado !== 'irregulares' && reporteSeleccionado !== 'repetidores' && (
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-2">Grupo</span>
                      <select
                        value={formData.grupo}
                        onChange={handleChange('grupo')}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="" disabled>Selecciona un grupo</option>
                        {gruposDisponibles.map((grupo) => (
                          <option key={grupo} value={grupo}>{grupo}</option>
                        ))}
                      </select>
                    </label>
                    )}

                    {reporteSeleccionado !== 'estadisticos' && reporteSeleccionado !== 'promedios' && reporteSeleccionado !== 'irregulares' && reporteSeleccionado !== 'repetidores' && (
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-2">Asignatura</span>
                      <select
                        value={formData.asignatura}
                        onChange={handleChange('asignatura')}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="" disabled>
                          {formData.grado ? 'Selecciona una asignatura' : 'Primero elige un grado'}
                        </option>
                        {getAsignaturasRegulares(formData.grado).map((materia) => (
                          <option key={materia.key} value={materia.key}>{materia.label}</option>
                        ))}
                      </select>
                    </label>
                    )}

                    {reporteSeleccionado !== 'estadisticos' && reporteSeleccionado !== 'promedios' && reporteSeleccionado !== 'irregulares' && reporteSeleccionado !== 'repetidores' && (
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-2">Tecnologia</span>
                      <select
                        value={formData.tecnologia}
                        onChange={handleChange('tecnologia')}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="" disabled>Selecciona una tecnologia</option>
                        {TALLERES.map((taller) => (
                          <option key={taller} value={taller}>{taller}</option>
                        ))}
                      </select>
                    </label>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-headline font-bold text-slate-700 uppercase tracking-wide mb-3">
                    Resumen de criterios
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {resumen.map((item) => (
                      <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{item.label}</p>
                        <p className={`text-sm mt-0.5 font-medium ${item.value === 'Pendiente' ? 'text-slate-400' : 'text-slate-900'}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  {!isReadyToGenerate && (
                    <p className="text-xs text-slate-400 text-center mb-3">
                      {reporteSeleccionado === 'promedios'
                        ? 'Selecciona ciclo, grado y grupo para continuar.'
                        : reporteSeleccionado === 'irregulares'
                          ? 'Selecciona ciclo y grado para continuar.'
                          : reporteSeleccionado === 'repetidores'
                            ? 'Selecciona ciclo y grado para continuar.'
                            : 'Selecciona ciclo, bloque y grado para continuar.'}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={
                      reporteSeleccionado === 'promedios'   ? handleGenerarPromedios   :
                      reporteSeleccionado === 'irregulares' ? handleGenerarIrregulares :
                      reporteSeleccionado === 'repetidores' ? handleGenerarRepetidores :
                      handleGenerarEstadistico
                    }
                    disabled={!isReadyToGenerate || isGenerating}
                    className={`w-full rounded-xl font-semibold py-3 transition ${
                      isReadyToGenerate && !isGenerating
                        ? reporteSeleccionado === 'promedios'
                          ? 'bg-sky-600 text-white hover:bg-sky-700'
                          : reporteSeleccionado === 'irregulares'
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : reporteSeleccionado === 'repetidores'
                              ? 'bg-rose-600 text-white hover:bg-rose-700'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? 'Generando PDF...' : 'Generar reporte'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportesView
