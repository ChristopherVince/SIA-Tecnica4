import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const EDADES = ['11', '12', '13', '14', '15', '16', '17']
const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }

// Dimensiones de columnas (pt)
const W_SEXO  = 40   // etiqueta SEXO H/M
const W_GRUPO = 30   // letra de grupo
const W_EDAD  = 28   // cada columna de edad (×7 = 196)
const W_TOTAL = 38   // columna TOTAL
const W_EDADES_TOTAL = EDADES.length * W_EDAD  // 196

const GRAY_BG   = '#f0f0f0'
const DARK_BG   = '#d8d8d8'
const BLACK     = '#000000'

const s = StyleSheet.create({
  page: {
    fontSize: 8,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 28,
    fontFamily: 'Helvetica',
  },

  // ── Encabezado ──────────────────────────────────────────
  headerWrap:    { marginBottom: 6, alignItems: 'center' },
  escuelaNombre: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  headerRow:     { flexDirection: 'row', width: '100%', marginBottom: 1 },
  headerLabel:   { fontSize: 8, fontFamily: 'Helvetica-Bold', marginRight: 2 },
  headerValue:   { fontSize: 8 },
  headerRight:   { marginLeft: 'auto' },
  titleBox: {
    borderWidth: 1, borderColor: BLACK,
    paddingVertical: 4, paddingHorizontal: 8,
    marginTop: 4, marginBottom: 6,
    width: '100%', alignItems: 'center',
  },
  titleText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  // ── Bloque de grado ─────────────────────────────────────
  gradeBlock:    { marginBottom: 4 },
  gradeSep:      { borderTopWidth: 2, borderTopColor: BLACK, marginBottom: 4, marginTop: 4 },

  gradeHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gradeLabelText: { fontSize: 8, marginRight: 4 },
  gradeNameBox: {
    borderWidth: 1, borderColor: BLACK,
    paddingVertical: 2, paddingHorizontal: 6,
    backgroundColor: GRAY_BG,
  },
  gradeNameText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  // ── Fila de encabezado "EDAD" ────────────────────────────
  edadSpanRow: { flexDirection: 'row', marginLeft: W_SEXO + W_GRUPO },
  edadSpanCell: {
    width: W_EDADES_TOTAL,
    borderWidth: 1, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2,
    fontSize: 8, fontFamily: 'Helvetica-Bold',
    backgroundColor: GRAY_BG,
  },
  edadSpanTotal: { width: W_TOTAL, paddingVertical: 2 },

  // ── Fila de números de columna ───────────────────────────
  colNumRow:   { flexDirection: 'row', marginLeft: W_SEXO },
  colNumGrupo: {
    width: W_GRUPO,
    borderWidth: 1, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  colNumEdad: {
    width: W_EDAD,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  colNumTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Sección de sexo ─────────────────────────────────────
  sexoSection:  { flexDirection: 'column', marginBottom: 0 },
  sexoBodyRow:  { flexDirection: 'row' },
  sexoLabelBox: {
    width: W_SEXO,
    borderWidth: 1, borderColor: BLACK, borderBottomWidth: 0,
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 4,
  },
  sexoLabelText: { fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  sexoContent:   { flex: 1 },

  // ── Fila de datos ────────────────────────────────────────
  dataRow: { flexDirection: 'row' },
  dataGrupo: {
    width: W_GRUPO,
    borderWidth: 1, borderTopWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
  },
  dataEdad: {
    width: W_EDAD,
    borderWidth: 1, borderTopWidth: 0, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
  },
  dataTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderTopWidth: 0, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
  },

  // ── Fila subtotal por sexo ───────────────────────────────
  subtotalRow: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: BLACK,
  },
  subtotalSexoBox: {
    width: W_SEXO,
    borderWidth: 1, borderTopWidth: 0, borderColor: BLACK,
    justifyContent: 'center', alignItems: 'center',
  },
  subtotalLabelCell: {
    width: W_GRUPO,
    borderWidth: 1, borderTopWidth: 0, borderLeftWidth: 0, borderColor: BLACK,
    paddingVertical: 2, paddingHorizontal: 1,
    fontSize: 5.5, fontFamily: 'Helvetica-Bold',
    backgroundColor: GRAY_BG,
    textAlign: 'center', justifyContent: 'center',
  },
  subtotalEdad: {
    width: W_EDAD,
    borderWidth: 1, borderTopWidth: 0, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: GRAY_BG,
  },
  subtotalTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderTopWidth: 0, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: GRAY_BG,
  },

  // ── Fila total por grado ─────────────────────────────────
  totalGradoRow: {
    flexDirection: 'row',
    borderTopWidth: 2, borderTopColor: BLACK,
    marginTop: 2,
  },
  totalGradoLabel: {
    width: W_SEXO + W_GRUPO,
    paddingVertical: 3, paddingHorizontal: 2,
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  totalGradoEdad: {
    width: W_EDAD,
    borderWidth: 1, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },
  totalGradoEdadFirst: {
    width: W_EDAD,
    borderWidth: 1, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },
  totalGradoTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },

  // ── Totales de escuela ───────────────────────────────────
  escuelaSep: { borderTopWidth: 2, borderTopColor: BLACK, marginTop: 6, marginBottom: 2 },
  totalEscuelaRow: { flexDirection: 'row' },
  totalEscuelaLabel: {
    width: W_SEXO + W_GRUPO,
    paddingVertical: 3, paddingHorizontal: 2,
    fontSize: 8, fontFamily: 'Helvetica-Bold',
  },
  totalEscuelaEdad: {
    width: W_EDAD,
    borderWidth: 1, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },
  totalEscuelaEdadNext: {
    width: W_EDAD,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },
  totalEscuelaTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 9,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },

  // ── Encabezado de edades repetido antes de total escuela ─
  edadHeaderRepeat: { flexDirection: 'row', marginLeft: W_SEXO + W_GRUPO },
  edadColRepeat: {
    width: W_EDAD,
    borderWidth: 1, borderColor: BLACK, borderBottomWidth: 0,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  edadColRepeatNext: {
    width: W_EDAD,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK, borderBottomWidth: 0,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  edadColRepeatTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK, borderBottomWidth: 0,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Pie de página ────────────────────────────────────────
  footerDate: { position: 'absolute', bottom: 12, left: 18, fontSize: 8 },
  footerPage: { position: 'absolute', bottom: 12, right: 18, fontSize: 8 },
})

function val(n) {
  return n ? String(n) : ''
}

function GradoBlock({ gradoObj, grupos }) {
  const gradoLabel = gradoObj.gradoLabel ?? GRADO_LABEL[gradoObj.grado] ?? `GRADO ${gradoObj.grado}`

  return (
    <View style={s.gradeBlock} wrap={false}>
      <View style={s.gradeSep} />

      {/* Etiqueta de grado */}
      <View style={s.gradeHeaderRow}>
        <Text style={s.gradeLabelText}>GRADO</Text>
        <View style={s.gradeNameBox}>
          <Text style={s.gradeNameText}>{gradoLabel}</Text>
        </View>
      </View>

      {/* Fila "EDAD" centrada sobre las columnas de edad */}
      <View style={s.edadSpanRow}>
        <Text style={s.edadSpanCell}>EDAD</Text>
        <Text style={s.edadSpanTotal}> </Text>
      </View>

      {/* Números de columna */}
      <View style={s.colNumRow}>
        <Text style={s.colNumGrupo}>GRUPO</Text>
        {EDADES.map((e) => (
          <Text key={e} style={s.colNumEdad}>{e}</Text>
        ))}
        <Text style={s.colNumTotal}>TOTAL</Text>
      </View>

      {/* Secciones H y M */}
      {['H', 'M'].map((sexo) => {
        const sexoObj = gradoObj.sexos?.[sexo] ?? { grupos: {}, totalPorEdad: {}, totalSexo: 0 }
        return (
          <View key={sexo} style={s.sexoSection} wrap={false}>
            <View style={s.sexoBodyRow}>
              {/* Etiqueta SEXO */}
              <View style={s.sexoLabelBox}>
                <Text style={s.sexoLabelText}>{'SEXO\n' + sexo}</Text>
              </View>

              {/* Filas de grupos */}
              <View style={s.sexoContent}>
                {grupos.map((grupo) => {
                  const row = sexoObj.grupos?.[grupo] ?? { edades: {}, total: 0 }
                  return (
                    <View key={grupo} style={s.dataRow}>
                      <Text style={s.dataGrupo}>{grupo}</Text>
                      {EDADES.map((edad) => (
                        <Text key={edad} style={s.dataEdad}>{val(row.edades?.[edad])}</Text>
                      ))}
                      <Text style={s.dataTotal}>{val(row.total)}</Text>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Subtotal por sexo */}
            <View style={s.subtotalRow}>
              <View style={s.subtotalSexoBox}><Text> </Text></View>
              <Text style={s.subtotalLabelCell}>{'SUBTOTAL\nPOR SEXO'}</Text>
              {EDADES.map((edad) => (
                <Text key={edad} style={s.subtotalEdad}>{val(sexoObj.totalPorEdad?.[edad])}</Text>
              ))}
              <Text style={s.subtotalTotal}>{val(sexoObj.totalSexo)}</Text>
            </View>
          </View>
        )
      })}

      {/* Total por grado */}
      <View style={s.totalGradoRow}>
        <Text style={s.totalGradoLabel}>TOTAL POR GRADO</Text>
        {EDADES.map((edad, i) => (
          <Text key={edad} style={i === 0 ? s.totalGradoEdadFirst : { ...s.totalGradoEdad, borderLeftWidth: 0 }}>
            {val(gradoObj.totalPorGrado?.[edad])}
          </Text>
        ))}
        <Text style={s.totalGradoTotal}>{val(gradoObj.totalPorGrado?.total)}</Text>
      </View>
    </View>
  )
}

export default function ReporteMatriculaEdadesPDF({ dataReporte }) {
  const escuela    = dataReporte?.escuela ?? {}
  const grados     = dataReporte?.grados ?? []
  const grupos     = dataReporte?.grupos ?? []
  const totalEsc   = dataReporte?.totalEscuela ?? {}
  const fechaTexto = dataReporte?.fechaGeneracion ?? new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Encabezado ── */}
        <View style={s.headerWrap} fixed>
          <Text style={s.escuelaNombre}>{escuela.nombre ?? 'ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4'}</Text>
          <View style={s.headerRow}>
            <Text style={s.headerLabel}>CLAVE</Text>
            <Text style={s.headerValue}>{escuela.clave ?? ''}</Text>
            <Text style={[s.headerValue, { marginLeft: 20 }]}>{escuela.localidad ?? ''}</Text>
          </View>
          <View style={[s.headerRow, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={s.headerLabel}>CICLO: </Text>
              <Text style={s.headerValue}>{dataReporte?.ciclo ?? ''}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={s.headerLabel}>TURNO: </Text>
              <Text style={s.headerValue}>{dataReporte?.turno ?? ''}</Text>
            </View>
          </View>
          <View style={s.titleBox}>
            <Text style={s.titleText}>MATRÍCULA DE INICIO DE CICLO ORGANIZADA POR SEXO</Text>
          </View>
        </View>

        {/* ── Bloques por grado ── */}
        {grados.map((gradoObj) => (
          <GradoBlock
            key={gradoObj.grado}
            gradoObj={gradoObj}
            grupos={grupos}
          />
        ))}

        {/* ── Total escuela ── */}
        <View style={s.escuelaSep} />
        <View style={s.edadHeaderRepeat}>
          {EDADES.map((e, i) => (
            <Text key={e} style={i === 0 ? s.edadColRepeat : s.edadColRepeatNext}>{e}</Text>
          ))}
          <Text style={s.edadColRepeatTotal}>TOTAL</Text>
        </View>
        <View style={s.totalEscuelaRow}>
          <Text style={s.totalEscuelaLabel}>TOTAL ESCUELA</Text>
          {EDADES.map((edad, i) => (
            <Text key={edad} style={i === 0 ? s.totalEscuelaEdad : s.totalEscuelaEdadNext}>
              {val(totalEsc[edad])}
            </Text>
          ))}
          <Text style={s.totalEscuelaTotal}>{val(totalEsc.total)}</Text>
        </View>

        {/* ── Pie de página ── */}
        <Text style={s.footerDate} fixed>{fechaTexto}</Text>
        <Text
          style={s.footerPage}
          fixed
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </Page>
    </Document>
  )
}
