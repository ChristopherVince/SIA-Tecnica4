import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const EDADES = ['11', '12', '13', '14', '15', '16', '17']
const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }

// Columnas (pt)
const W_GRUPO = 36   // letra de grupo (izquierda, abarca H y M)
const W_SEXO  = 32   // H / M
const W_EDAD  = 28   // cada edad ×7 = 196
const W_TOTAL = 38   // columna TOTAL
const W_LEFT  = W_GRUPO + W_SEXO      // 68 — offset izquierdo para EDAD header
const W_EDADES_TOTAL = EDADES.length * W_EDAD  // 196

const GRAY_BG = '#f0f0f0'
const DARK_BG = '#d8d8d8'
const BLACK   = '#000000'

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
  titleBox: {
    borderWidth: 1, borderColor: BLACK,
    paddingVertical: 4, paddingHorizontal: 8,
    marginTop: 4, marginBottom: 6,
    width: '100%', alignItems: 'center',
  },
  titleText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  // ── Bloque de grado ─────────────────────────────────────
  gradeBlock:  { marginBottom: 4 },
  gradeSep:    { borderTopWidth: 2, borderTopColor: BLACK, marginBottom: 4, marginTop: 4 },

  // Fila que combina "GRADO PRIMERO" + header EDAD en la misma línea
  gradeTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  gradeLeft: {
    width: W_LEFT,
    flexDirection: 'row', alignItems: 'center',
  },
  gradeLabelText: { fontSize: 7, marginRight: 3 },
  gradeNameBox: {
    borderWidth: 1, borderColor: BLACK,
    paddingVertical: 2, paddingHorizontal: 5,
    backgroundColor: GRAY_BG,
  },
  gradeNameText: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  edadSpanCell: {
    width: W_EDADES_TOTAL,
    borderWidth: 1, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2,
    fontSize: 8, fontFamily: 'Helvetica-Bold',
    backgroundColor: GRAY_BG,
  },

  // ── Fila de números de columna ───────────────────────────
  colHeaderRow: { flexDirection: 'row' },
  colGrupo: {
    width: W_GRUPO,
    borderWidth: 1, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  colSexo: {
    width: W_SEXO,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  colEdad: {
    width: W_EDAD,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  colTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Bloque de grupo (G, H, I…) ───────────────────────────
  grupoBlock: { flexDirection: 'column' },

  // Fila H — el box de grupo tiene borderBottomWidth: 0 para fusionarse con M
  rowH: { flexDirection: 'row' },
  grupoBoxH: {
    width: W_GRUPO,
    borderWidth: 1, borderBottomWidth: 0, borderColor: BLACK,
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 3,
  },
  grupoBoxM: {
    width: W_GRUPO,
    borderWidth: 1, borderTopWidth: 0, borderColor: BLACK,
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 3,
  },
  grupoLetra: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  sexoCellH: {
    width: W_SEXO,
    borderWidth: 1, borderLeftWidth: 0, borderBottomWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 3, fontSize: 8,
  },
  sexoCellM: {
    width: W_SEXO,
    borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 3, fontSize: 8,
  },
  edadCellH: {
    width: W_EDAD,
    borderWidth: 1, borderLeftWidth: 0, borderBottomWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 3, fontSize: 8,
  },
  edadCellM: {
    width: W_EDAD,
    borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 3, fontSize: 8,
  },
  totalCellH: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderBottomWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 3, fontSize: 8,
  },
  totalCellM: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 3, fontSize: 8,
  },

  // ── Subtotal por grupo ───────────────────────────────────
  subtotalRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: BLACK },
  subtotalLabel: {
    width: W_LEFT,
    borderWidth: 1, borderTopWidth: 0, borderColor: BLACK,
    paddingVertical: 2, paddingHorizontal: 2,
    fontSize: 6, fontFamily: 'Helvetica-Bold',
    backgroundColor: GRAY_BG, textAlign: 'center',
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

  // ── Total por grado ──────────────────────────────────────
  totalGradoRow: {
    flexDirection: 'row',
    borderTopWidth: 2, borderTopColor: BLACK,
    marginTop: 2,
  },
  totalGradoLabel: {
    width: W_LEFT,
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
  totalGradoEdadNext: {
    width: W_EDAD,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },
  totalGradoTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },

  // ── Total escuela ────────────────────────────────────────
  escuelaSep: { borderTopWidth: 2, borderTopColor: BLACK, marginTop: 6, marginBottom: 2 },
  totalEscHeaderRow: { flexDirection: 'row', marginLeft: W_LEFT },
  totalEscHeaderEdad: {
    width: W_EDAD,
    borderWidth: 1, borderColor: BLACK, borderBottomWidth: 0,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  totalEscHeaderEdadNext: {
    width: W_EDAD,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK, borderBottomWidth: 0,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  totalEscHeaderTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK, borderBottomWidth: 0,
    textAlign: 'center', paddingVertical: 2, fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  totalEscRow: { flexDirection: 'row' },
  totalEscLabel: {
    width: W_LEFT,
    paddingVertical: 3, paddingHorizontal: 2,
    fontSize: 8, fontFamily: 'Helvetica-Bold',
  },
  totalEscEdad: {
    width: W_EDAD,
    borderWidth: 1, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },
  totalEscEdadNext: {
    width: W_EDAD,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 8,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },
  totalEscTotal: {
    width: W_TOTAL,
    borderWidth: 1, borderLeftWidth: 0, borderColor: BLACK,
    textAlign: 'center', paddingVertical: 2, fontSize: 9,
    fontFamily: 'Helvetica-Bold', backgroundColor: DARK_BG,
  },

  // ── Pie de página ────────────────────────────────────────
  footerDate: { position: 'absolute', bottom: 12, left: 18, fontSize: 8 },
  footerPage: { position: 'absolute', bottom: 12, right: 18, fontSize: 8 },
})

function val(n) {
  return n ? String(n) : ''
}

function grupoSubtotal(hData, mData) {
  const sub = { edades: {}, total: 0 }
  EDADES.forEach((edad) => {
    const v = (hData.edades?.[edad] ?? 0) + (mData.edades?.[edad] ?? 0)
    if (v > 0) sub.edades[edad] = v
  })
  sub.total = (hData.total ?? 0) + (mData.total ?? 0)
  return sub
}

function GradoBlock({ gradoObj, grupos }) {
  const gradoLabel = gradoObj.gradoLabel ?? GRADO_LABEL[gradoObj.grado] ?? gradoObj.grado

  return (
    <View style={s.gradeBlock} wrap={false}>
      <View style={s.gradeSep} />

      {/* GRADO + EDAD en la misma fila */}
      <View style={s.gradeTopRow}>
        <View style={s.gradeLeft}>
          <Text style={s.gradeLabelText}>GRADO</Text>
          <View style={s.gradeNameBox}>
            <Text style={s.gradeNameText}>{gradoLabel}</Text>
          </View>
        </View>
        <Text style={s.edadSpanCell}>EDAD</Text>
      </View>

      {/* Cabeceras de columna */}
      <View style={s.colHeaderRow}>
        <Text style={s.colGrupo}>GRUPO</Text>
        <Text style={s.colSexo}>SEXO</Text>
        {EDADES.map((e) => (
          <Text key={e} style={s.colEdad}>{e}</Text>
        ))}
        <Text style={s.colTotal}>TOTAL</Text>
      </View>

      {/* Filas por grupo */}
      {grupos.map((grupo) => {
        const hData = gradoObj.sexos?.H?.grupos?.[grupo] ?? { edades: {}, total: 0 }
        const mData = gradoObj.sexos?.M?.grupos?.[grupo] ?? { edades: {}, total: 0 }
        const sub   = grupoSubtotal(hData, mData)

        return (
          <View key={grupo} style={s.grupoBlock} wrap={false}>
            {/* Fila H */}
            <View style={s.rowH}>
              <View style={s.grupoBoxH}>
                <Text style={s.grupoLetra}>{grupo}</Text>
              </View>
              <Text style={s.sexoCellH}>H</Text>
              {EDADES.map((edad) => (
                <Text key={edad} style={s.edadCellH}>{val(hData.edades?.[edad])}</Text>
              ))}
              <Text style={s.totalCellH}>{val(hData.total)}</Text>
            </View>

            {/* Fila M */}
            <View style={s.rowH}>
              <View style={s.grupoBoxM}>
                <Text> </Text>
              </View>
              <Text style={s.sexoCellM}>M</Text>
              {EDADES.map((edad) => (
                <Text key={edad} style={s.edadCellM}>{val(mData.edades?.[edad])}</Text>
              ))}
              <Text style={s.totalCellM}>{val(mData.total)}</Text>
            </View>

            {/* Subtotal por grupo */}
            <View style={s.subtotalRow}>
              <Text style={s.subtotalLabel}>{'SUBTOTAL\nPOR GRUPO'}</Text>
              {EDADES.map((edad) => (
                <Text key={edad} style={s.subtotalEdad}>{val(sub.edades?.[edad])}</Text>
              ))}
              <Text style={s.subtotalTotal}>{val(sub.total)}</Text>
            </View>
          </View>
        )
      })}

      {/* Total por grado */}
      <View style={s.totalGradoRow}>
        <Text style={s.totalGradoLabel}>TOTAL POR GRADO</Text>
        {EDADES.map((edad, i) => (
          <Text key={edad} style={i === 0 ? s.totalGradoEdad : s.totalGradoEdadNext}>
            {val(gradoObj.totalPorGrado?.[edad])}
          </Text>
        ))}
        <Text style={s.totalGradoTotal}>{val(gradoObj.totalPorGrado?.total)}</Text>
      </View>
    </View>
  )
}

export default function ReporteMatriculaGrupoPDF({ dataReporte }) {
  const escuela    = dataReporte?.escuela ?? {}
  const grados     = dataReporte?.grados  ?? []
  const grupos     = dataReporte?.grupos  ?? []
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
            <Text style={s.titleText}>MATRÍCULA DE INICIO DE CICLO ORGANIZADA POR GRUPO</Text>
          </View>
        </View>

        {/* ── Bloques por grado ── */}
        {grados.map((gradoObj) => (
          <GradoBlock key={gradoObj.grado} gradoObj={gradoObj} grupos={grupos} />
        ))}

        {/* ── Total escuela ── */}
        <View style={s.escuelaSep} />
        <View style={s.totalEscHeaderRow}>
          {EDADES.map((e, i) => (
            <Text key={e} style={i === 0 ? s.totalEscHeaderEdad : s.totalEscHeaderEdadNext}>{e}</Text>
          ))}
          <Text style={s.totalEscHeaderTotal}>TOTAL</Text>
        </View>
        <View style={s.totalEscRow}>
          <Text style={s.totalEscLabel}>TOTAL ESCUELA</Text>
          {EDADES.map((edad, i) => (
            <Text key={edad} style={i === 0 ? s.totalEscEdad : s.totalEscEdadNext}>
              {val(totalEsc[edad])}
            </Text>
          ))}
          <Text style={s.totalEscTotal}>{val(totalEsc.total)}</Text>
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
