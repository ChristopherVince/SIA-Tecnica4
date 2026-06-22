import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'

const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }

const MARGIN = 20
const USABLE = 595.28 - MARGIN * 2

const W_GPO    = 18
const W_NUM    = 18
const W_ALUMNO = 138
const W_PROM   = 24
// 11 sub-cols: B1(C,R,I,CR) + B2(C,R,I,CR) + B3(C,R,I)
const W_SUB    = (USABLE - W_GPO - W_NUM - W_ALUMNO - W_PROM) / 11

const H_HDR1 = 11
const H_HDR2 = 9
const H_ROW  = 10

const BLOQUES = [
  { id: 'b1', label: 'BLOQUE 1', subCols: ['C', 'R', 'I', 'CR'] },
  { id: 'b2', label: 'BLOQUE 2', subCols: ['C', 'R', 'I', 'CR'] },
  { id: 'b3', label: 'BLOQUE 3', subCols: ['C', 'R', 'I'] },
]

const fmtGrade = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

const fmtInt = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  return isNaN(n) || n === 0 ? '' : String(Math.round(n))
}

const fmtRec = (v) => {
  const s = String(v ?? '').trim()
  return s === '1' || s === '2' ? s : ''
}

const hasVal = (v) => v !== null && v !== undefined && String(v).trim() !== ''

const nombreCompleto = (a) =>
  [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ').toUpperCase()

const formatDate = () => {
  const now   = new Date()
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hora  = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return `${fecha}    ${hora}`
}

// ── Celda base ────────────────────────────────────────────────────────────────
function Cell({ w, h = H_ROW, children, bold = false, fontSize = 6, align = 'center', bg, bL = false, bT = false, bR = true, bB = true, px = 1 }) {
  return (
    <View style={{
      width: w, height: h, backgroundColor: bg,
      borderLeftWidth:   bL ? 0.5 : 0,
      borderTopWidth:    bT ? 0.5 : 0,
      borderRightWidth:  0.5,
      borderBottomWidth: 0.5,
      borderColor: '#000',
      justifyContent: 'center',
      alignItems: align === 'left' ? 'flex-start' : 'center',
      paddingHorizontal: px,
    }}>
      {children !== '' && children !== null && children !== undefined && (
        <Text style={{ fontSize, fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica' }}>
          {String(children)}
        </Text>
      )}
    </View>
  )
}

function MetaField({ label, value, wide }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginRight: 2 }}>{label}</Text>
      <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 2, minWidth: wide ? 100 : 28 }}>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{value}</Text>
      </View>
    </View>
  )
}

// ── Encabezado de tabla (repetido en cada página con fixed) ───────────────────
function TablaHeader() {
  return (
    <View fixed style={{ flexDirection: 'row' }}>

      {/* GPO + NL + ALUMNO — doble altura */}
      {[{ w: W_GPO, label: 'GPO' }, { w: W_NUM, label: 'NL' }].map(({ w, label }) => (
        <View key={label} style={{
          width: w, height: H_HDR1 + H_HDR2,
          borderLeftWidth: label === 'GPO' ? 0.5 : 0,
          borderTopWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5,
          borderColor: '#000', justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>{label}</Text>
        </View>
      ))}
      <View style={{
        width: W_ALUMNO, height: H_HDR1 + H_HDR2,
        borderTopWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5,
        borderColor: '#000', justifyContent: 'center', alignItems: 'flex-start',
        paddingHorizontal: 3,
      }}>
        <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>ALUMNO</Text>
      </View>

      {/* Bloques — dos filas */}
      {BLOQUES.map((bloque) => (
        <View key={bloque.id} style={{ flexDirection: 'column', width: W_SUB * bloque.subCols.length }}>
          <View style={{
            height: H_HDR1,
            borderTopWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5,
            borderColor: '#000', justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>{bloque.label}</Text>
          </View>
          <View style={{ flexDirection: 'row', height: H_HDR2 }}>
            {bloque.subCols.map((sc) => (
              <View key={sc} style={{
                width: W_SUB, height: H_HDR2,
                borderRightWidth: 0.5, borderBottomWidth: 0.5,
                borderColor: '#000', justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{ fontSize: 5.5, fontFamily: 'Helvetica-Bold' }}>{sc}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* PROM — doble altura */}
      <View style={{
        width: W_PROM, height: H_HDR1 + H_HDR2,
        borderTopWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5,
        borderColor: '#000', justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>PROM</Text>
      </View>
    </View>
  )
}

// ── Documento ────────────────────────────────────────────────────────────────
export default function ConcentradoCaliTecnologiaPDF({ gruposData, calMap, grado, taller, cicloEscolar, turno }) {
  const gradoLabel = GRADO_LABEL[String(grado)] ?? String(grado)
  const turnoLabel = (turno ?? '').toUpperCase()

  const getC  = (id, b) => fmtGrade(calMap?.[id]?.asignaturasRegulares?.tecnologia?.[`${b}_cal`])
  const getR  = (id, b) => fmtRec(calMap?.[id]?.observaciones?.[b])
  const getI  = (id, b) => fmtInt(calMap?.[id]?.inasistencias?.[b]?.tecnologia)
  const getCR = (id, b) => fmtGrade(calMap?.[id]?.asignaturasRegulares?.tecnologia?.[`${b}_r`])

  const getProm = (id) => {
    const s = calMap?.[id]?.asignaturasRegulares?.tecnologia
    if (!s) return ''
    const ef1 = hasVal(s.b1_r) ? s.b1_r : s.b1_cal
    const ef2 = hasVal(s.b2_r) ? s.b2_r : s.b2_cal
    const ef3 = s.b3_cal
    const nums = [ef1, ef2, ef3]
      .filter((v) => hasVal(v))
      .map(Number)
      .filter((n) => !isNaN(n))
    if (!nums.length) return ''
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    return Number.isInteger(avg) ? String(avg) : avg.toFixed(1)
  }

  return (
    <Document>
      <Page size="A4" style={{ paddingHorizontal: MARGIN, paddingTop: 16, paddingBottom: 28 }}>

        {/* Encabezado — fijo en cada página */}
        <View fixed>
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
              ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
            <MetaField label="CICLO"  value={cicloEscolar} />
            <MetaField label="GRADO"  value={gradoLabel}   />
            <MetaField label="TURNO"  value={turnoLabel}   />
            <MetaField label="TALLER" value={taller}       wide />
          </View>
        </View>

        {/* Encabezado de tabla — se repite en cada página */}
        <TablaHeader />

        {/* Filas de alumnos agrupadas por GPO */}
        {gruposData.flatMap(({ grupo, alumnos }) =>
          alumnos.map((alumno, idx) => (
            <View key={alumno.id} style={{ flexDirection: 'row' }}>
              <Cell w={W_GPO} bL fontSize={6} bold={idx === 0}>
                {idx === 0 ? grupo : ''}
              </Cell>
              <Cell w={W_NUM} fontSize={5.5}>{alumno.nl}</Cell>
              <Cell w={W_ALUMNO} fontSize={5.5} align="left" px={3}>
                {nombreCompleto(alumno)}
              </Cell>
              {BLOQUES.map((bloque) => (
                <React.Fragment key={bloque.id}>
                  <Cell w={W_SUB} fontSize={6}>{getC(alumno.id, bloque.id)}</Cell>
                  <Cell w={W_SUB} fontSize={6}>{getR(alumno.id, bloque.id)}</Cell>
                  <Cell w={W_SUB} fontSize={6}>{getI(alumno.id, bloque.id)}</Cell>
                  {bloque.subCols.includes('CR') && (
                    <Cell w={W_SUB} fontSize={6}>{getCR(alumno.id, bloque.id)}</Cell>
                  )}
                </React.Fragment>
              ))}
              <Cell w={W_PROM} fontSize={6} bold>{getProm(alumno.id)}</Cell>
            </View>
          ))
        )}

        {/* Clave de columnas */}
        <View style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 5.5, fontFamily: 'Helvetica' }}>
            CLAVES:  C= CALIFICACIÓN    R= RECOMENDACIÓN    I= INASISTENCIAS    CR= CALIFICACIÓN DE RECUPERACIÓN
          </Text>
        </View>

        {/* Pie fijo: fecha + número de página */}
        <View fixed style={{ position: 'absolute', bottom: 10, left: MARGIN, right: MARGIN, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 6, color: '#555', fontFamily: 'Helvetica' }}>
            {formatDate()}
          </Text>
          <Text
            style={{ fontSize: 6, color: '#555', fontFamily: 'Helvetica' }}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}
