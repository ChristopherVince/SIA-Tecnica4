import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const COL = {
  num:    25,
  curp:   128,
  nombre: 175,
  sexo:   32,
  edad:   32,
  taller: 123,
}
const TOTAL_W = COL.num + COL.curp + COL.nombre + COL.sexo + COL.edad + COL.taller // 515

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    color: '#1a1a1a',
  },
  /* ─── header ─── */
  headerBlock: { marginBottom: 10 },
  schoolName: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', textTransform: 'uppercase' },
  subHeader: { fontSize: 8, textAlign: 'center', marginTop: 2 },
  reportTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center', textTransform: 'uppercase', marginTop: 5 },
  metaRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 4 },
  metaItem: { fontSize: 7.5, textAlign: 'center' },
  metaLabel: { fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  separator: { borderBottomWidth: 1, borderBottomColor: '#334155', marginVertical: 6 },
  /* ─── table ─── */
  tableWrap: { width: TOTAL_W },
  theadRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  th: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    borderLeftWidth: 1,
    borderLeftColor: '#94a3b8',
    borderRightWidth: 1,
    borderRightColor: '#94a3b8',
  },
  rowAlt: { backgroundColor: '#f8fafc' },
  td: {
    fontSize: 7.5,
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  tdCenter: { textAlign: 'center' },
  /* ─── footer ─── */
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#64748b',
  },
})

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '—'
  const parts = String(fechaNacimiento).split('-')
  if (parts.length < 3) return '—'
  const [yr, mo, dy] = parts.map(Number)
  if (!yr || !mo || !dy) return '—'
  const hoy = new Date()
  let edad = hoy.getFullYear() - yr
  if (hoy.getMonth() + 1 < mo || (hoy.getMonth() + 1 === mo && hoy.getDate() < dy)) edad--
  return isNaN(edad) ? '—' : String(edad)
}

const nombreCompleto = (a) =>
  [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ')

const GRADOS_LABEL = { '1': '1°', '2': '2°', '3': '3°' }

function ReporteListadoGrupoPDF({ dataReporte }) {
  const { escuela, grado, grupo, turno, alumnos, fechaGeneracion } = dataReporte
  const gradoLabel = GRADOS_LABEL[String(grado)] ?? `${grado}°`

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ─── Encabezado ─── */}
        <View style={s.headerBlock} fixed>
          <Text style={s.schoolName}>{escuela.nombre}</Text>
          <Text style={s.subHeader}>{escuela.localidad} · C.C.T.: {escuela.clave} · Turno {turno}</Text>
          <Text style={s.reportTitle}>Listado de alumnos por grupo</Text>
          <View style={s.metaRow}>
            <Text style={s.metaItem}><Text style={s.metaLabel}>Grado: </Text>{gradoLabel}</Text>
            <Text style={s.metaItem}><Text style={s.metaLabel}>Grupo: </Text>{grupo}</Text>
            <Text style={s.metaItem}><Text style={s.metaLabel}>Total alumnos: </Text>{alumnos.length}</Text>
            <Text style={s.metaItem}><Text style={s.metaLabel}>Fecha: </Text>{fechaGeneracion}</Text>
          </View>
          <View style={s.separator} />
        </View>

        {/* ─── Tabla ─── */}
        <View style={s.tableWrap}>
          {/* Encabezados columnas */}
          <View style={s.theadRow} fixed>
            <Text style={[s.th, { width: COL.num }]}>#</Text>
            <Text style={[s.th, { width: COL.curp }]}>CURP</Text>
            <Text style={[s.th, { width: COL.nombre }]}>Nombre</Text>
            <Text style={[s.th, { width: COL.sexo }]}>Sexo</Text>
            <Text style={[s.th, { width: COL.edad }]}>Edad</Text>
            <Text style={[s.th, { width: COL.taller }]}>Taller</Text>
          </View>

          {/* Filas */}
          {alumnos.map((alumno, idx) => (
            <View
              key={alumno.curp ?? idx}
              style={[s.row, idx % 2 !== 0 && s.rowAlt]}
              wrap={false}
            >
              <Text style={[s.td, s.tdCenter, { width: COL.num }]}>{idx + 1}</Text>
              <Text style={[s.td, { width: COL.curp, fontSize: 7 }]}>{alumno.curp ?? '—'}</Text>
              <Text style={[s.td, { width: COL.nombre }]}>{nombreCompleto(alumno)}</Text>
              <Text style={[s.td, s.tdCenter, { width: COL.sexo }]}>{(alumno.sexo ?? '—').toUpperCase()}</Text>
              <Text style={[s.td, s.tdCenter, { width: COL.edad }]}>{calcularEdad(alumno.fechaNacimiento)}</Text>
              <Text style={[s.td, { width: COL.taller, fontSize: 7 }]}>{alumno.taller ?? '—'}</Text>
            </View>
          ))}
        </View>

        {/* ─── Pie de página ─── */}
        <View style={s.footer} fixed>
          <Text>SIA Técnica 4 · Sistema de Información Administrativa</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export default ReporteListadoGrupoPDF
