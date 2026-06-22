import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const SCHOOL = 'ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4'
const CLAVE  = '30DST0077R'
const TITLE  = 'REPORTE 911.5 — ALUMNOS CON CONDICIÓN MÉDICA O NEE'

// Portrait A4 usable ≈ 555pt (20pt margins each side)
const W = { no: 18, grado: 42, nombre: 130, sexo: 18, tipo: 72, diag: 138, sit: 137 }

const s = StyleSheet.create({
  page:    { fontFamily: 'Helvetica', fontSize: 7, paddingHorizontal: 20, paddingVertical: 18 },
  row:     { flexDirection: 'row', alignItems: 'stretch' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 8 },
  tbl:     { borderTop: '0.5pt solid #333', borderLeft: '0.5pt solid #333' },
})

function Cell({ w, bold, bg, align = 'center', color = '#1a1a1a', small, children }) {
  return (
    <View style={{
      width: w,
      borderRight: '0.5pt solid #333',
      borderBottom: '0.5pt solid #333',
      backgroundColor: bg ?? 'transparent',
      padding: 3,
      justifyContent: 'center',
    }}>
      <Text style={{
        fontSize:   small ? 6.5 : 7,
        fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica',
        textAlign:  align,
        color,
      }}>
        {String(children ?? '')}
      </Text>
    </View>
  )
}

function MetaField({ label, value }) {
  return (
    <View>
      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#555' }}>{label}</Text>
      <Text style={{ fontSize: 7, marginTop: 1 }}>{value}</Text>
    </View>
  )
}

export default function Reporte911PDF({ fichas = [], turno = '', cicloEscolar = '' }) {
  const turnoLabel = turno ? turno.charAt(0).toUpperCase() + turno.slice(1) : ''

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={s.page}>

        {/* Encabezado */}
        <View style={{ alignItems: 'center', marginBottom: 2 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{SCHOOL}</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, marginTop: 2 }}>{TITLE}</Text>
        </View>

        <View style={s.metaRow}>
          <MetaField label="CLAVE"          value={CLAVE} />
          <MetaField label="CICLO ESCOLAR"  value={cicloEscolar} />
          <MetaField label="TURNO"          value={turnoLabel} />
          <MetaField label="TOTAL ALUMNOS"  value={String(fichas.length)} />
        </View>

        {/* Tabla */}
        <View style={s.tbl}>

          {/* Encabezado de tabla */}
          <View style={s.row}>
            <Cell w={W.no}     bold bg="#1a3a2a" color="#fff" align="center">No</Cell>
            <Cell w={W.grado}  bold bg="#1a3a2a" color="#fff" align="center">Gdo/Gpo</Cell>
            <Cell w={W.nombre} bold bg="#1a3a2a" color="#fff" align="left"  >Nombre completo</Cell>
            <Cell w={W.sexo}   bold bg="#1a3a2a" color="#fff" align="center">Sexo</Cell>
            <Cell w={W.tipo}   bold bg="#1a3a2a" color="#fff" align="center">Tipo de condición</Cell>
            <Cell w={W.diag}   bold bg="#1a3a2a" color="#fff" align="left"  >Diagnóstico</Cell>
            <Cell w={W.sit}    bold bg="#1a3a2a" color="#fff" align="left"  >Situación actual</Cell>
          </View>

          {/* Filas de datos */}
          {fichas.map((f, i) => (
            <View key={i} style={[s.row, { backgroundColor: i % 2 === 1 ? '#f0faf4' : '#fff' }]}>
              <Cell w={W.no}     align="center">{f.numero}</Cell>
              <Cell w={W.grado}  align="center">{f.gradoGrupo}</Cell>
              <Cell w={W.nombre} align="left"  >{f.nombre}</Cell>
              <Cell w={W.sexo}   align="center">{f.sexo}</Cell>
              <Cell w={W.tipo}   align="left" small>{f.tipos}</Cell>
              <Cell w={W.diag}   align="left" small>{f.diagnostico}</Cell>
              <Cell w={W.sit}    align="left" small>{f.situacion}</Cell>
            </View>
          ))}

          {fichas.length === 0 && (
            <View style={s.row}>
              <Cell w={555} align="center" color="#888">Sin registros</Cell>
            </View>
          )}
        </View>

        {/* Firma y fecha */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 6.5, color: '#888', textAlign: 'right' }}>
            Generado el{' '}
            {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
