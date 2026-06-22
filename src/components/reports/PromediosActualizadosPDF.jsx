import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { getAsignaturasRegulares } from '../control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'

// ─── Constantes ───────────────────────────────────────────────────────────────

const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }

const MARGIN   = 20
const USABLE   = 595.28 - MARGIN * 2

const W_NUM    = 14
const W_ALUMNO = 155
const W_PROM   = 32

const H_HDR = 14
const H_ROW = 10
const H_FOOT = 12

// Labels fijos por key — ciencias NO incluida: su short viene del config (Bio./Fís./Quí. según grado)
const SUBJ_SHORT = {
  espanol:          'ESP',
  matematicas:      'MAT',
  lenguaExtranjera: 'LE',
  historia:         'HIS',
  geografia:        'GEO',
  formacionCivica:  'FCE',
  tecnologia:       'TEC',
  educacionFisica:  'E.FIS',
  artes:            'ART',
}

// Orden de columnas específico para este reporte
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtProm = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return n.toFixed(1)
}

const fmtProm2 = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return n.toFixed(2)
}

const avg = (vals) => {
  const nums = vals.filter((v) => v !== '' && v !== null && v !== undefined).map(Number).filter((n) => !isNaN(n))
  if (!nums.length) return ''
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

const nombreCompleto = (a) =>
  [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ').toUpperCase()

const formatDateTime = () => {
  const now = new Date()
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hora  = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return { fecha, hora }
}

// ─── Celda base ───────────────────────────────────────────────────────────────

function Cell({ w, h = H_ROW, children, bold = false, fontSize = 6, align = 'center',
  bg, bL = false, bT = false, bR = true, bB = true, px = 1 }) {
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
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginRight: 2 }}>{label}</Text>
      <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 2, minWidth: 28 }}>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{value}</Text>
      </View>
    </View>
  )
}

// ─── Documento ────────────────────────────────────────────────────────────────

export default function PromediosActualizadosPDF({ alumnos, calMap, grado, grupo, cicloEscolar, turno }) {
  const asignaturas = getSubjOrder(grado)
  const nSubj       = asignaturas.length
  const W_SUBJ      = (USABLE - W_NUM - W_ALUMNO - W_PROM) / nSubj

  const gradoLabel = GRADO_LABEL[String(grado)] ?? String(grado)
  const turnoLabel = (turno ?? '').toUpperCase()

  const getProm = (id, key) => calMap?.[id]?.asignaturasRegulares?.[key]?.promedio ?? ''

  // Promedio general calculado inline: solo materias regulares mostradas, 2 decimales
  const getGeneral = (id) => avg(asignaturas.map((s) => getProm(id, s.key)))

  const colAvg = (key) => avg(alumnos.map((a) => getProm(a.id, key)))

  const { fecha, hora } = formatDateTime()

  return (
    <Document>
      <Page size="A4" style={{ paddingHorizontal: MARGIN, paddingTop: 18, paddingBottom: 25 }}>

        {/* ── Títulos ── */}
        <View style={{ alignItems: 'center', marginBottom: 3 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
            ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
          </Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 3 }}>
            PROMEDIOS ACTUALIZADOS
          </Text>
        </View>

        {/* ── Metadatos ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
          <MetaField label="CICLO"  value={cicloEscolar} />
          <MetaField label="GRADO"  value={gradoLabel}   />
          <MetaField label="GRUPO"  value={grupo}        />
          <MetaField label="TURNO"  value={turnoLabel}   />
        </View>

        {/* ── Tabla ── */}
        <View>

          {/* Encabezados */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM}    h={H_HDR} bL bT bold fontSize={6}>#</Cell>
            <Cell w={W_ALUMNO} h={H_HDR} bT bold fontSize={6.5} align="left" px={3}>ALUMNO</Cell>
            {asignaturas.map((s) => (
              <Cell key={s.key} w={W_SUBJ} h={H_HDR} bT bold fontSize={5.5}>{s.short}</Cell>
            ))}
            <Cell w={W_PROM} h={H_HDR} bT bold fontSize={6.5}>PROM</Cell>
          </View>

          {/* Filas de alumnos */}
          {alumnos.map((alumno, idx) => {
            const general = getGeneral(alumno.id)
            return (
              <View key={alumno.id} style={{ flexDirection: 'row' }}>
                <Cell w={W_NUM}    h={H_ROW} bL fontSize={6} align="right" px={2}>{idx + 1}</Cell>
                <Cell w={W_ALUMNO} h={H_ROW} fontSize={6} align="left" px={3}>
                  {nombreCompleto(alumno)}
                </Cell>
                {asignaturas.map((s) => {
                  const v      = getProm(alumno.id, s.key)
                  const isFail = v !== '' && v !== null && !isNaN(Number(v)) && Number(v) < 6
                  return (
                    <Cell key={s.key} w={W_SUBJ} h={H_ROW} fontSize={6} bg={isFail ? '#D8D8D8' : undefined} bold={isFail}>
                      {fmtProm(v)}
                    </Cell>
                  )
                })}
                <Cell w={W_PROM} h={H_ROW} fontSize={6} bold>{fmtProm2(general)}</Cell>
              </View>
            )
          })}

          {/* Fila de promedios del grupo */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM + W_ALUMNO} h={H_FOOT} bL bold fontSize={7} align="right" px={4}>
              Promedio
            </Cell>
            {asignaturas.map((s) => (
              <Cell key={s.key} w={W_SUBJ} h={H_FOOT} fontSize={6} bold>
                {fmtProm(colAvg(s.key))}
              </Cell>
            ))}
            <Cell w={W_PROM} h={H_FOOT} bold fontSize={7}>
              {fmtProm2(avg(alumnos.map((a) => getGeneral(a.id))))}
            </Cell>
          </View>

        </View>

        {/* ── Footer: fecha izquierda, hora derecha ── */}
        <View style={{ position: 'absolute', bottom: 10, left: MARGIN, right: MARGIN, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 6, color: '#555' }}>{fecha}</Text>
          <Text style={{ fontSize: 6, color: '#555' }}>{hora}</Text>
        </View>

      </Page>
    </Document>
  )
}
