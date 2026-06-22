import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { getAsignaturasRegulares } from '../control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'

const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }
export const BLOQUE_NUM_INAS = { b1: '1', b2: '2', b3: '3' }

const MARGIN = 20
const USABLE = 595.28 - MARGIN * 2  // portrait A4

const W_NUM    = 15
const W_ALUMNO = 148
const W_TOTAL  = 28

const H_HDR  = 15
const H_ROW  = 10
const H_FOOT = 12

const SUBJ_SHORT = {
  espanol:          'ESP',
  lenguaExtranjera: 'LE',
  artes:            'ART',
  matematicas:      'MAT',
  geografia:        'GEO',
  historia:         'HIS',
  formacionCivica:  'FCE',
  tecnologia:       'TEC',
  educacionFisica:  'E.FIS',
}

const fmtInt = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  return isNaN(n) || n === 0 ? '' : String(Math.round(n))
}

const formatDate = () => {
  const now   = new Date()
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hora  = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return `${fecha}    ${hora}`
}

function Cell({ w, h = H_ROW, children, bold = false, fontSize = 6, align = 'center', bg, bL = false, bT = false, bR = true, bB = true, px = 1 }) {
  const justifyContent = align === 'left'   ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
  const alignItems     = align === 'center' ? 'center'     : 'flex-start'

  return (
    <View style={{
      width: w, height: h, backgroundColor: bg,
      borderLeftWidth:   bL ? 0.5 : 0,
      borderTopWidth:    bT ? 0.5 : 0,
      borderRightWidth:  0.5,
      borderBottomWidth: 0.5,
      borderColor: '#000',
      justifyContent,
      alignItems,
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

function MetaField({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginRight: 2 }}>{label}</Text>
      <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 2, minWidth: 28 }}>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{value}</Text>
      </View>
    </View>
  )
}

export default function ConcentradoInasistenciasPDF({ alumnos, calMap, grado, grupo, bloque, cicloEscolar, turno }) {
  const asignaturas = getAsignaturasRegulares(grado)
  const W_SUBJ      = (USABLE - W_NUM - W_ALUMNO - W_TOTAL) / asignaturas.length

  const getInas = (id, key) => calMap?.[id]?.inasistencias?.[bloque]?.[key] ?? ''

  const getTotal = (id) =>
    asignaturas.reduce((sum, s) => {
      const n = Number(calMap?.[id]?.inasistencias?.[bloque]?.[s.key])
      return sum + (isNaN(n) ? 0 : n)
    }, 0)

  const colSum = (key) =>
    alumnos.reduce((sum, a) => {
      const n = Number(calMap?.[a.id]?.inasistencias?.[bloque]?.[key])
      return sum + (isNaN(n) ? 0 : n)
    }, 0)

  const grandTotal = alumnos.reduce((sum, a) => sum + getTotal(a.id), 0)

  const gradoLabel  = GRADO_LABEL[String(grado)] ?? String(grado)
  const bloqueLabel = BLOQUE_NUM_INAS[bloque] ?? bloque
  const turnoLabel  = (turno ?? '').toUpperCase()

  return (
    <Document>
      <Page size="A4" style={{ paddingHorizontal: MARGIN, paddingTop: 18, paddingBottom: 25 }}>

        {/* Encabezado */}
        <View style={{ alignItems: 'center', marginBottom: 5 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
            ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
          </Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 3 }}>
            INASISTENCIAS
          </Text>
        </View>

        {/* Metadatos */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <MetaField label="CICLO"  value={cicloEscolar} />
          <MetaField label="GRADO"  value={gradoLabel}   />
          <MetaField label="GRUPO"  value={grupo}        />
          <MetaField label="BLOQUE" value={bloqueLabel}  />
          <MetaField label="TURNO"  value={turnoLabel}   />
        </View>

        {/* Tabla */}
        <View>

          {/* Encabezado de columnas */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM}    h={H_HDR} bL bT bold fontSize={6.5}>#</Cell>
            <Cell w={W_ALUMNO} h={H_HDR} bT bold fontSize={6.5} align="left" px={3}>ALUMNO</Cell>
            {asignaturas.map((s) => (
              <Cell key={s.key} w={W_SUBJ} h={H_HDR} bT bold fontSize={5.5}>
                {SUBJ_SHORT[s.key] ?? s.short}
              </Cell>
            ))}
            <Cell w={W_TOTAL} h={H_HDR} bT bold fontSize={5.5}>TOTAL</Cell>
          </View>

          {/* Filas de alumnos */}
          {alumnos.map((alumno, idx) => {
            const total = getTotal(alumno.id)
            return (
              <View key={alumno.id} style={{ flexDirection: 'row' }}>
                <Cell w={W_NUM}    h={H_ROW} bL fontSize={6} align="right" px={2}>{idx + 1}</Cell>
                <Cell w={W_ALUMNO} h={H_ROW} fontSize={6} align="left" px={3}>
                  {[alumno.primerApellido, alumno.segundoApellido, alumno.nombre].filter(Boolean).join(' ').toUpperCase()}
                </Cell>
                {asignaturas.map((s) => (
                  <Cell key={s.key} w={W_SUBJ} h={H_ROW} fontSize={6}>
                    {fmtInt(getInas(alumno.id, s.key))}
                  </Cell>
                ))}
                <Cell w={W_TOTAL} h={H_ROW} fontSize={6} bold={total > 0}>
                  {total > 0 ? String(total) : ''}
                </Cell>
              </View>
            )
          })}

          {/* Fila de totales */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM + W_ALUMNO} h={H_FOOT} bL bold fontSize={7} align="right" px={4}>
              Total
            </Cell>
            {asignaturas.map((s) => {
              const t = colSum(s.key)
              return (
                <Cell key={s.key} w={W_SUBJ} h={H_FOOT} fontSize={6} bold>
                  {t > 0 ? String(t) : ''}
                </Cell>
              )
            })}
            <Cell w={W_TOTAL} h={H_FOOT} bold fontSize={7}>
              {grandTotal > 0 ? String(grandTotal) : ''}
            </Cell>
          </View>

        </View>

        {/* Fecha de generación */}
        <View style={{ position: 'absolute', bottom: 10, right: MARGIN }}>
          <Text style={{ fontSize: 6, color: '#555', fontFamily: 'Helvetica' }}>
            {formatDate()}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
