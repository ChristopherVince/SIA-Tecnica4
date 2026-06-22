import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import {
  getAsignaturasRegulares,
  AREAS_CURRICULARES,
} from '../control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'
import { BLOQUE_NUM } from './ConcentradoCalificacionesPDF'

// ─── Constantes ───────────────────────────────────────────────────────────────

const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }

const AREAS_SHORT = {
  educacionSocioemocional: 'SOC\nEM',
  autonomiaVidaSaludable:  'VIDA\nSAL',
}

const MARGIN   = 20
const USABLE_W = 841.89 - MARGIN * 2   // landscape A4

const W_NUM    = 14
const W_ALUMNO = 148
const W_PROM   = 28
const W_AREA   = 24    // por cada área curricular
const W_CAL    = 20    // columna C por materia (número)

const H_HDR1 = 14      // fila de nombre de materia
const H_HDR2 = 9       // fila C | O
const H_ROW  = 10
const H_FOOT = 12

// ─── Orden de columnas ────────────────────────────────────────────────────────

const SUBJ_SHORT = {
  espanol:          'ESP',
  matematicas:      'MAT',
  lenguaExtranjera: 'LE',
  artes:            'ART',
  geografia:        'GEO',
  historia:         'HIS',
  formacionCivica:  'FCE',
  tecnologia:       'TEC',
  educacionFisica:  'E.FIS',
}

const ORDER_1  = ['espanol','matematicas','lenguaExtranjera','ciencias','historia','geografia','formacionCivica','tecnologia','educacionFisica','artes']
const ORDER_23 = ['espanol','matematicas','lenguaExtranjera','ciencias','historia','formacionCivica','tecnologia','educacionFisica','artes']

const getSubjOrder = (grado) => {
  const order     = String(grado) === '1' ? ORDER_1 : ORDER_23
  const configMap = Object.fromEntries(getAsignaturasRegulares(grado).map((s) => [s.key, s]))
  return order.filter((k) => configMap[k]).map((k) => ({
    key:   k,
    short: SUBJ_SHORT[k] ?? configMap[k].short,
  }))
}

// ─── Escala de color ──────────────────────────────────────────────────────────

const getFailBg = (v) => {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  if (isNaN(n) || n >= 6) return undefined
  return '#A0A0A0'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtGrade = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

const colAvg = (vals) => {
  const nums = vals
    .filter((v) => v !== '' && v !== null && v !== undefined)
    .map(Number)
    .filter((n) => !isNaN(n))
  if (!nums.length) return ''
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

const nombreCompleto = (a) =>
  [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ').toUpperCase()

const formatDateTime = () => {
  const now   = new Date()
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hora  = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return { fecha, hora }
}

// ─── Celda base ───────────────────────────────────────────────────────────────

function Cell({ w, h = H_ROW, children, bold = false, fontSize = 6, align = 'center',
  bg, bL = false, bT = false, px = 1 }) {
  const alignItems = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'
  return (
    <View style={{
      width: w, height: h, backgroundColor: bg,
      borderLeftWidth:   bL ? 0.5 : 0,
      borderTopWidth:    bT ? 0.5 : 0,
      borderRightWidth:  0.5,
      borderBottomWidth: 0.5,
      borderColor: '#000',
      justifyContent: 'center',
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
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 6 }}>
      <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginRight: 2 }}>{label}</Text>
      <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 2, minWidth: 28 }}>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{value}</Text>
      </View>
    </View>
  )
}

// ─── Documento principal ──────────────────────────────────────────────────────

export default function CalificacionesObservacionesPDF({
  alumnos, calMap, grado, grupo, bloque, cicloEscolar, turno,
}) {
  const asignaturas = getSubjOrder(grado)
  const nSubj       = asignaturas.length
  const nAreas      = AREAS_CURRICULARES.length

  // Ancho de la columna O (observaciones), calculado para usar todo el espacio disponible
  const W_OBS = (USABLE_W - W_NUM - W_ALUMNO - W_PROM - W_AREA * nAreas - nSubj * W_CAL) / nSubj

  const calKey = `${bloque}_cal`

  const getCal    = (id, key) => calMap?.[id]?.asignaturasRegulares?.[key]?.[calKey] ?? ''
  const getArea   = (id, key) => calMap?.[id]?.areasCurriculares?.[key]?.[calKey] ?? ''
  const getPromRow = (id) => colAvg(asignaturas.map((s) => getCal(id, s.key)))

  const avgSubj = (key) => colAvg(alumnos.map((a) => getCal(a.id, key)))
  const avgArea = (key) => colAvg(alumnos.map((a) => getArea(a.id, key)))
  const avgProm = colAvg(alumnos.map((a) => getPromRow(a.id)))

  const gradoLabel  = GRADO_LABEL[String(grado)] ?? String(grado)
  const bloqueLabel = BLOQUE_NUM[bloque] ?? bloque
  const turnoLabel  = (turno ?? '').toUpperCase()
  const { fecha, hora } = formatDateTime()

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={{ paddingHorizontal: MARGIN, paddingTop: 18, paddingBottom: 25, fontFamily: 'Helvetica' }}
      >

        {/* Títulos */}
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
            ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
          </Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>
            CALIFICACIONES  Y  OBSERVACIONES DE BLOQUE
          </Text>
        </View>

        {/* Metadatos */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <MetaField label="CICLO"  value={cicloEscolar} />
          <MetaField label="GRADO"  value={gradoLabel}   />
          <MetaField label="GRUPO"  value={grupo}        />
          <MetaField label="BLOQUE" value={bloqueLabel}  />
          <MetaField label="TURNO"  value={turnoLabel}   />
        </View>

        {/* Tabla */}
        <View>

          {/* ── Encabezado doble (nombre de materia + C|O) ── */}
          <View style={{ flexDirection: 'row' }}>

            {/* Celdas "altas" que abarcan las 2 filas del header */}
            <Cell w={W_NUM}    h={H_HDR1 + H_HDR2} bL bT bold fontSize={5.5}>#</Cell>
            <Cell w={W_ALUMNO} h={H_HDR1 + H_HDR2} bT bold fontSize={6.5} align="left" px={3}>ALUMNO</Cell>

            {/* Por cada materia: nombre arriba, C y O abajo */}
            {asignaturas.map((s) => (
              <View key={s.key} style={{ flexDirection: 'column' }}>
                <Cell w={W_CAL + W_OBS} h={H_HDR1} bT bold fontSize={5}>{s.short}</Cell>
                <View style={{ flexDirection: 'row' }}>
                  <Cell w={W_CAL} h={H_HDR2} bold fontSize={5}>C</Cell>
                  <Cell w={W_OBS} h={H_HDR2} bold fontSize={5}>O</Cell>
                </View>
              </View>
            ))}

            {/* PROM — alta */}
            <Cell w={W_PROM} h={H_HDR1 + H_HDR2} bT bold fontSize={6}>PROM</Cell>

            {/* Áreas curriculares — altas */}
            {AREAS_CURRICULARES.map((a) => (
              <Cell key={a.key} w={W_AREA} h={H_HDR1 + H_HDR2} bT bold fontSize={4.5}>
                {AREAS_SHORT[a.key] ?? a.short}
              </Cell>
            ))}
          </View>

          {/* ── Filas de alumnos ── */}
          {alumnos.map((alumno, idx) => {
            const prom    = getPromRow(alumno.id)
            const promBg  = getFailBg(prom)
            return (
              <View key={alumno.id} style={{ flexDirection: 'row' }}>
                <Cell w={W_NUM}    h={H_ROW} bL fontSize={5.5} align="right" px={2}>{idx + 1}</Cell>
                <Cell w={W_ALUMNO} h={H_ROW} fontSize={5.5} align="left" px={3}>{nombreCompleto(alumno)}</Cell>

                {asignaturas.map((s) => {
                  const cal = getCal(alumno.id, s.key)
                  return (
                    <React.Fragment key={s.key}>
                      <Cell w={W_CAL} h={H_ROW} fontSize={5.5} bg={getFailBg(cal)}>{fmtGrade(cal)}</Cell>
                      <Cell w={W_OBS} h={H_ROW} />
                    </React.Fragment>
                  )
                })}

                <Cell w={W_PROM} h={H_ROW} fontSize={5.5} bold={promBg !== undefined} bg={promBg}>
                  {fmtGrade(prom)}
                </Cell>

                {AREAS_CURRICULARES.map((a) => {
                  const val = getArea(alumno.id, a.key)
                  return (
                    <Cell key={a.key} w={W_AREA} h={H_ROW} fontSize={5.5} bg={getFailBg(val)}>
                      {fmtGrade(val)}
                    </Cell>
                  )
                })}
              </View>
            )
          })}

          {/* ── Fila de promedios ── */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM + W_ALUMNO} h={H_FOOT} bL bold fontSize={6} align="right" px={4}>Promedio</Cell>
            {asignaturas.map((s) => (
              <React.Fragment key={s.key}>
                <Cell w={W_CAL} h={H_FOOT} bold fontSize={6}>{fmtGrade(avgSubj(s.key))}</Cell>
                <Cell w={W_OBS} h={H_FOOT} />
              </React.Fragment>
            ))}
            <Cell w={W_PROM} h={H_FOOT} bold fontSize={6}>{fmtGrade(avgProm)}</Cell>
            {AREAS_CURRICULARES.map((a) => (
              <Cell key={a.key} w={W_AREA} h={H_FOOT} bold fontSize={6}>{fmtGrade(avgArea(a.key))}</Cell>
            ))}
          </View>

        </View>

        {/* Leyenda */}
        <View style={{ marginTop: 5 }}>
          <Text style={{ fontSize: 5.5, color: '#555' }}>C: CALIFICACIÓN    O: OBSERVACIONES</Text>
        </View>

        {/* Footer fecha/hora */}
        <View style={{ position: 'absolute', bottom: 10, left: MARGIN, right: MARGIN, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 6, color: '#555' }}>{fecha}</Text>
          <Text style={{ fontSize: 6, color: '#555' }}>{hora}</Text>
        </View>

      </Page>
    </Document>
  )
}
