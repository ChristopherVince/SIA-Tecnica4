import React from 'react'

/**
 * Genera un PDF con boletas en formato de media hoja (2 por página A4).
 * Usa @react-pdf/renderer — mismo método que los reportes de matrícula.
 *
 * @param {Array}  alumnos       - array de objetos alumno
 * @param {string} cicloEscolar  - e.g. "2025-2026"
 * @param {Object} calMap        - { [alumno.id]: calificacionesDoc }
 * @param {string} filename      - nombre del archivo descargado
 */
export const generarBoletasPDF = async (alumnos, cicloEscolar, calMap, filename) => {
  const [{ pdf }, { default: BoletaGrupoPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../../../reports/BoletaGrupoPDF'),
  ])

  const asPdf = pdf()
  asPdf.updateContainer(
    React.createElement(BoletaGrupoPDF, { alumnos, cicloEscolar, calMap }),
  )

  const blob = await asPdf.toBlob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
