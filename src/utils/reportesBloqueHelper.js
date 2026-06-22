import React from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import {
  createEmptyCalificacionesDoc,
  getAsignaturasRegulares,
  normalizeLoadedCalificaciones,
  GRUPOS_POR_TURNO,
} from '../components/control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'
import { BLOQUE_NUM } from '../components/reports/ConcentradoCalificacionesPDF'

// ─── Helpers internos ─────────────────────────────────────────────────────────

function nombreCompleto(a) {
  return [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ')
}

async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function renderPDF(element) {
  const { pdf } = await import('@react-pdf/renderer')
  const inst = pdf()
  inst.updateContainer(element)
  return inst.toBlob()
}

// Descarga alumnos + calificaciones para un grado/grupo/ciclo
export async function fetchGrupoData(grado, grupo, cicloEscolar) {
  const alumnosSnap = await getDocs(
    query(collection(db, 'alumnos'), where('grado', '==', grado), where('grupo', '==', grupo)),
  )

  const alumnos = alumnosSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))

  const calDocs = await Promise.all(
    alumnos.map((a) => getDoc(doc(db, 'alumnos', a.id, 'calificaciones', cicloEscolar))),
  )

  const calMap = {}
  alumnos.forEach((a, i) => {
    calMap[a.id] = calDocs[i].exists()
      ? normalizeLoadedCalificaciones(calDocs[i].data(), grado)
      : createEmptyCalificacionesDoc(grado)
  })

  return { alumnos, calMap }
}

// ─── Reporte: Concentrado de calificaciones por grupo ────────────────────────

export async function generarConcentradoCalificaciones({ grado, grupo, bloque, cicloEscolar, turno }) {
  const [{ alumnos, calMap }, { default: ConcentradoCalificacionesPDF }] = await Promise.all([
    fetchGrupoData(grado, grupo, cicloEscolar),
    import('../components/reports/ConcentradoCalificacionesPDF'),
  ])

  const blob = await renderPDF(
    React.createElement(ConcentradoCalificacionesPDF, { alumnos, calMap, grado, grupo, bloque, cicloEscolar, turno }),
  )

  const b = BLOQUE_NUM[bloque] ?? bloque
  await downloadBlob(blob, `concentrado_cal_${grado}${grupo}_B${b}_${cicloEscolar}.pdf`)
}

// ─── Reporte: Calificaciones y observaciones por grupo ───────────────────────

export async function generarCalificacionesObservaciones({ grado, grupo, bloque, cicloEscolar, turno }) {
  const [{ alumnos, calMap }, { default: CalificacionesObservacionesPDF }] = await Promise.all([
    fetchGrupoData(grado, grupo, cicloEscolar),
    import('../components/reports/CalificacionesObservacionesPDF'),
  ])

  const blob = await renderPDF(
    React.createElement(CalificacionesObservacionesPDF, { alumnos, calMap, grado, grupo, bloque, cicloEscolar, turno }),
  )

  const b = BLOQUE_NUM[bloque] ?? bloque
  await downloadBlob(blob, `cal_observaciones_${grado}${grupo}_B${b}_${cicloEscolar}.pdf`)
}

// ─── Reporte: Concentrado de inasistencias por grupo ─────────────────────────

export async function generarConcentradoInasistencias({ grado, grupo, bloque, cicloEscolar, turno }) {
  const [{ alumnos, calMap }, { default: ConcentradoInasistenciasPDF, BLOQUE_NUM_INAS }] = await Promise.all([
    fetchGrupoData(grado, grupo, cicloEscolar),
    import('../components/reports/ConcentradoInasistenciasPDF'),
  ])

  const blob = await renderPDF(
    React.createElement(ConcentradoInasistenciasPDF, { alumnos, calMap, grado, grupo, bloque, cicloEscolar, turno }),
  )

  const b = BLOQUE_NUM_INAS[bloque] ?? bloque
  await downloadBlob(blob, `inasistencias_${grado}${grupo}_B${b}_${cicloEscolar}.pdf`)
}

// ─── Reporte: Concentrado de calificaciones por asignatura (todos los grupos) ─

export async function generarConcentradoCaliAsignatura({ grado, grupo, asignatura, cicloEscolar, turno }) {
  const [{ alumnos, calMap }, { default: ConcentradoCaliAsignaturaPDF }] = await Promise.all([
    fetchGrupoData(grado, grupo, cicloEscolar),
    import('../components/reports/ConcentradoCaliAsignaturaPDF'),
  ])

  const gruposData = [{ grupo, alumnos, calMap }]

  const blob = await renderPDF(
    React.createElement(ConcentradoCaliAsignaturaPDF, { gruposData, grado, asignaturaKey: asignatura, cicloEscolar, turno }),
  )

  await downloadBlob(blob, `conc_asignatura_${asignatura}_${grado}${grupo}_${cicloEscolar}.pdf`)
}

// ─── Reporte: Concentrado de calificaciones por Tecnología (todos los grupos con ese taller) ─

export async function generarConcentradoCaliTecnologia({ grado, taller, cicloEscolar, turno }) {
  const grupos = GRUPOS_POR_TURNO[turno] ?? []

  // Obtener todos los alumnos por grupo y asignar NL dentro de cada grupo
  const gruposConTodos = await Promise.all(
    grupos.map(async (grupo) => {
      const snap = await getDocs(
        query(collection(db, 'alumnos'), where('grado', '==', grado), where('grupo', '==', grupo)),
      )
      const todos = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))
        .map((alumno, idx) => ({ ...alumno, nl: idx + 1 }))
      return { grupo, todos }
    }),
  )

  // Filtrar por taller seleccionado
  const gruposEnTaller = gruposConTodos
    .map(({ grupo, todos }) => ({ grupo, alumnos: todos.filter((a) => a.taller === taller) }))
    .filter(({ alumnos }) => alumnos.length > 0)

  // Cargar calificaciones solo de los alumnos filtrados
  const alumnosFiltrados = gruposEnTaller.flatMap(({ alumnos }) => alumnos)
  const calDocs = await Promise.all(
    alumnosFiltrados.map((a) => getDoc(doc(db, 'alumnos', a.id, 'calificaciones', cicloEscolar))),
  )

  const calMap = {}
  alumnosFiltrados.forEach((a, i) => {
    calMap[a.id] = calDocs[i].exists()
      ? normalizeLoadedCalificaciones(calDocs[i].data(), grado)
      : createEmptyCalificacionesDoc(grado)
  })

  const { default: ConcentradoCaliTecnologiaPDF } = await import('../components/reports/ConcentradoCaliTecnologiaPDF')

  const blob = await renderPDF(
    React.createElement(ConcentradoCaliTecnologiaPDF, { gruposData: gruposEnTaller, calMap, grado, taller, cicloEscolar, turno }),
  )

  const tallerSlug = taller.replace(/\s+/g, '_').toLowerCase()
  await downloadBlob(blob, `conc_tec_${tallerSlug}_${grado}grado_${cicloEscolar}.pdf`)
}

// ─── Reporte: Listado de reprobados por turno (todos los grados) ─────────────

const GRADO_LABELS_REP = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }

// Orden de visualización de columnas (debe coincidir con ListadoReprobadosTurnoPDF)
const DISPLAY_ORDER_REP = [
  'espanol', 'matematicas', 'lenguaExtranjera', 'ciencias', 'historia',
  'geografia', 'formacionCivica', 'tecnologia', 'educacionFisica', 'artes',
]

function getDisplaySubjectsRep(grado) {
  const asigs   = getAsignaturasRegulares(grado)
  const asigMap = Object.fromEntries(asigs.map((a) => [a.key, a]))
  return DISPLAY_ORDER_REP.filter((k) => k in asigMap).map((k) => asigMap[k])
}

function getEffectiveGrade(calMap, alumnoId, subjectKey, bloqueId) {
  const subject = calMap?.[alumnoId]?.asignaturasRegulares?.[subjectKey]
  if (!subject) return null
  const cal = subject[`${bloqueId}_cal`]
  const rec = subject[`${bloqueId}_r`]
  const hasRec = rec !== null && rec !== undefined && rec !== ''
  if (hasRec) { const n = Number(rec); return isNaN(n) ? null : n }
  if (cal !== null && cal !== undefined && cal !== '') { const n = Number(cal); return isNaN(n) ? null : n }
  return null
}

export async function generarListadoReprobadosTurno({ bloque, cicloEscolar, turno }) {
  const grupos = GRUPOS_POR_TURNO[turno] ?? []
  const GRADOS = ['1', '2', '3']

  const gradosData = await Promise.all(
    GRADOS.map(async (grado) => {
      const displaySubjs = getDisplaySubjectsRep(grado)

      const gruposRaw = await Promise.all(
        grupos.map((grupo) =>
          fetchGrupoData(grado, grupo, cicloEscolar).then(({ alumnos, calMap }) => {
            const alumnosRep = alumnos
              .map((alumno, idx) => {
                const grades = {}
                let asRep   = 0
                displaySubjs.forEach(({ key }) => {
                  const v = getEffectiveGrade(calMap, alumno.id, key, bloque)
                  grades[key] = v
                  if (v !== null && v < 6) asRep++
                })
                return { ...alumno, nl: idx + 1, grades, asRep }
              })
              .filter((a) => a.asRep > 0)
            return { grupo, alumnos: alumnosRep }
          }),
        ),
      )

      const gruposData   = gruposRaw.filter((g) => g.alumnos.length > 0)
      const totalAlumnos = gruposData.reduce((s, g) => s + g.alumnos.length, 0)
      const totalAsRep   = gruposData.reduce((s, g) => s + g.alumnos.reduce((ss, a) => ss + a.asRep, 0), 0)

      return { grado, gradoLabel: GRADO_LABELS_REP[grado] ?? grado, gruposData, totalAlumnos, totalAsRep }
    }),
  )

  const turnoTotalAlumnos = gradosData.reduce((s, g) => s + g.totalAlumnos, 0)
  const turnoTotalAsRep   = gradosData.reduce((s, g) => s + g.totalAsRep, 0)

  const { default: ListadoReprobadosTurnoPDF } = await import('../components/reports/ListadoReprobadosTurnoPDF')

  const blob = await renderPDF(
    React.createElement(ListadoReprobadosTurnoPDF, {
      gradosData,
      turnoTotalAlumnos,
      turnoTotalAsRep,
      bloque,
      cicloEscolar,
      turno,
    }),
  )

  const b = BLOQUE_NUM[bloque] ?? bloque
  await downloadBlob(blob, `listado_reprobados_turno_B${b}_${cicloEscolar}.pdf`)
}

// ─── Reporte: Listado de reprobados por grado ─────────────────────────────────

export async function generarListadoReprobadosGrado({ grado, bloque, cicloEscolar, turno }) {
  const grupos       = GRUPOS_POR_TURNO[turno] ?? []
  const displaySubjs = getDisplaySubjectsRep(grado)

  const gruposRaw = await Promise.all(
    grupos.map((grupo) =>
      fetchGrupoData(grado, grupo, cicloEscolar).then(({ alumnos, calMap }) => {
        const alumnosRep = alumnos
          .map((alumno, idx) => {
            const grades = {}
            let asRep   = 0
            displaySubjs.forEach(({ key }) => {
              const v = getEffectiveGrade(calMap, alumno.id, key, bloque)
              grades[key] = v
              if (v !== null && v < 6) asRep++
            })
            return { ...alumno, nl: idx + 1, grades, asRep }
          })
          .filter((a) => a.asRep > 0)
        return { grupo, alumnos: alumnosRep }
      }),
    ),
  )

  const gruposData   = gruposRaw.filter((g) => g.alumnos.length > 0)
  const totalAlumnos = gruposData.reduce((s, g) => s + g.alumnos.length, 0)
  const totalAsRep   = gruposData.reduce((s, g) => s + g.alumnos.reduce((ss, a) => ss + a.asRep, 0), 0)

  const gradosData = [{
    grado,
    gradoLabel: GRADO_LABELS_REP[grado] ?? grado,
    gruposData,
    totalAlumnos,
    totalAsRep,
  }]

  const { default: ListadoReprobadosTurnoPDF } = await import('../components/reports/ListadoReprobadosTurnoPDF')

  const blob = await renderPDF(
    React.createElement(ListadoReprobadosTurnoPDF, {
      gradosData,
      bloque,
      cicloEscolar,
      turno,
      showTurnoTotal: false,
    }),
  )

  const b = BLOQUE_NUM[bloque] ?? bloque
  await downloadBlob(blob, `listado_reprobados_${grado}grado_B${b}_${cicloEscolar}.pdf`)
}

// ─── Reporte: Listado de reprobados por grupo (todos los grados) ──────────────

export async function generarListadoReprobadosGrupo({ grupo, bloque, cicloEscolar, turno }) {
  const GRADOS = ['1', '2', '3']

  const gradosData = await Promise.all(
    GRADOS.map(async (grado) => {
      const displaySubjs = getDisplaySubjectsRep(grado)
      const { alumnos, calMap } = await fetchGrupoData(grado, grupo, cicloEscolar)

      const alumnosRep = alumnos
        .map((alumno, idx) => {
          const grades = {}
          let asRep   = 0
          displaySubjs.forEach(({ key }) => {
            const v = getEffectiveGrade(calMap, alumno.id, key, bloque)
            grades[key] = v
            if (v !== null && v < 6) asRep++
          })
          return { ...alumno, nl: idx + 1, grades, asRep }
        })
        .filter((a) => a.asRep > 0)

      const gruposData   = alumnosRep.length > 0 ? [{ grupo, alumnos: alumnosRep }] : []
      const totalAlumnos = alumnosRep.length
      const totalAsRep   = alumnosRep.reduce((s, a) => s + a.asRep, 0)

      return { grado, gradoLabel: GRADO_LABELS_REP[grado] ?? grado, gruposData, totalAlumnos, totalAsRep }
    }),
  )

  // Solo incluir grados que tengan alumnos reprobados
  const gradosConRep = gradosData.filter((g) => g.totalAlumnos > 0)

  const { default: ListadoReprobadosTurnoPDF } = await import('../components/reports/ListadoReprobadosTurnoPDF')

  const blob = await renderPDF(
    React.createElement(ListadoReprobadosTurnoPDF, {
      gradosData: gradosConRep,
      bloque,
      cicloEscolar,
      turno,
      showTurnoTotal: false,
    }),
  )

  const b = BLOQUE_NUM[bloque] ?? bloque
  await downloadBlob(blob, `listado_reprobados_grupo${grupo}_B${b}_${cicloEscolar}.pdf`)
}

// ─── Reporte estadístico por turno/grado ─────────────────────────────────────

export async function generarReporteEstadistico({ grado, bloque, cicloEscolar, turno }) {
  const grupos = GRUPOS_POR_TURNO[turno] ?? []

  // Fetch todos los grupos del turno en paralelo
  const gruposRaw = await Promise.all(
    grupos.map((grupo) =>
      fetchGrupoData(grado, grupo, cicloEscolar).then(({ alumnos, calMap }) => ({ grupo, alumnos, calMap })),
    ),
  )

  // Solo incluir grupos que tengan alumnos registrados
  const gruposData = gruposRaw.filter((g) => g.alumnos.length > 0)

  const { default: ReporteEstadisticoPDF } = await import('../components/reports/ReporteEstadisticoPDF')

  const blob = await renderPDF(
    React.createElement(ReporteEstadisticoPDF, { gruposData, grado, bloque, cicloEscolar, turno }),
  )

  const b = BLOQUE_NUM[bloque] ?? bloque
  await downloadBlob(blob, `reporte_estadistico_${grado}grado_B${b}_${cicloEscolar}.pdf`)
}

// ─── Reporte: Promedios actualizados por grupo ────────────────────────────────

export async function generarPromediosActualizados({ grado, grupo, cicloEscolar, turno }) {
  const [{ alumnos, calMap }, { default: PromediosActualizadosPDF }] = await Promise.all([
    fetchGrupoData(grado, grupo, cicloEscolar),
    import('../components/reports/PromediosActualizadosPDF'),
  ])

  const blob = await renderPDF(
    React.createElement(PromediosActualizadosPDF, { alumnos, calMap, grado, grupo, cicloEscolar, turno }),
  )

  await downloadBlob(blob, `promedios_actualizados_${grado}${grupo}_${cicloEscolar}.pdf`)
}

// ─── Reporte: Alumnos irregulares por grado ───────────────────────────────────

export async function generarAlumnosIrregulares({ grado, cicloEscolar, turno }) {
  const grupos = GRUPOS_POR_TURNO[turno] ?? []

  const gruposRaw = await Promise.all(
    grupos.map((grupo) =>
      fetchGrupoData(grado, grupo, cicloEscolar).then(({ alumnos, calMap }) => ({ grupo, alumnos, calMap })),
    ),
  )

  // Solo grupos que tienen al menos un alumno registrado
  const gruposData = gruposRaw.filter((g) => g.alumnos.length > 0)

  const { default: AlumnosIrregularesPDF } = await import('../components/reports/AlumnosIrregularesPDF')

  const blob = await renderPDF(
    React.createElement(AlumnosIrregularesPDF, { gruposData, grado, cicloEscolar, turno }),
  )

  await downloadBlob(blob, `alumnos_irregulares_${grado}grado_${cicloEscolar}.pdf`)
}

// ─── Reporte: Alumnos repetidores (todos los grados del turno) ────────────────

export async function generarAlumnosRepetidores({ grado, cicloEscolar, turno }) {
  const grupos = GRUPOS_POR_TURNO[turno] ?? []

  const gruposRaw = await Promise.all(
    grupos.map((grupo) =>
      fetchGrupoData(grado, grupo, cicloEscolar).then(({ alumnos, calMap }) => ({ grupo, alumnos, calMap })),
    ),
  )

  const gradosData = [{ grado, gruposData: gruposRaw.filter((g) => g.alumnos.length > 0) }]

  const { default: AlumnosRepetidoresPDF } = await import('../components/reports/AlumnosRepetidoresPDF')

  const blob = await renderPDF(
    React.createElement(AlumnosRepetidoresPDF, { gradosData, cicloEscolar, turno }),
  )

  await downloadBlob(blob, `alumnos_repetidores_${grado}grado_${cicloEscolar}.pdf`)
}
