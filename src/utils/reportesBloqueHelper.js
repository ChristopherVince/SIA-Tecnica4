import React from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import {
  createEmptyCalificacionesDoc,
  normalizeLoadedCalificaciones,
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

// ─── Reporte 1: Concentrado de calificaciones por grupo ───────────────────────

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
