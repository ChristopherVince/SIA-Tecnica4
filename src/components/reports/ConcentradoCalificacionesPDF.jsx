import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { getAsignaturasRegulares } from '../control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'

// ─── Constantes de diseño ─────────────────────────────────────────────────────

const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }
export const BLOQUE_NUM = { b1: '1', b2: '2', b3: '3' }
const FAIL_BG = '#FFD2D2'

const MARGIN  = 20
const USABLE  = 595.28 - MARGIN * 2

const W_NUM    = 15
const W_ALUMNO = 148
const W_TALLER = 28
const W_PROM   = 32

const H_HDR  = 15
const H_ROW  = 10
const H_FOOT = 12

// Valores exactos almacenados en Firestore (campo taller.label de AsignacionTallerView)
const TALLER_CODE = {
  'ADMINISTRACION CONTABLE':        '6011',
  'CONFEC. VESTIDO E IND. TEXTIL':  '3071',
  'DISENO DE CIRCUITOS ELECTRICOS': '4021',
  'DISENO INDUSTRIAL':              '3011',
  'MECANICA':                       '3041',
  'ELECTRONICA':                    '3061',
  'INFORMATICA':                    '5021',
}

const getTallerCode = (taller) => {
  if (!taller) return ''
  const key = String(taller).trim().toUpperCase()
  return TALLER_CODE[key] ?? taller
}

const SUBJ_SHORT = {
  espanol:          'ESP',
  lenguaExtranjera: 'LE',
  artes:            'ART',
  matematicas:      'MAT',
  ciencias:         'CIE',
  geografia:        'GEO',
  historia:         'HIS',
  formacionCivica:  'FCE',
  tecnologia:       'TEC',
  educacionFisica:  'E.FIS',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isFail = (v) => {
  if (v === '' || v === null || v === undefined) return false
  const n = Number(v)
  return !isNaN(n) && n < 6
}

const avg = (vals) => {
  const nums = vals
    .filter((v) => v !== '' && v !== null && v !== undefined)
    .map(Number)
    .filter((n) => !isNaN(n))
  if (!nums.length) return ''
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

const fmtDisp = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

const fmt2 = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return n.toFixed(2)
}

const nombreCompleto = (a) =>
  [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ').toUpperCase()

const formatDate = () => {
  const now = new Date()
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hora  = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return `${fecha}    ${hora}`
}

// ─── Celda base ───────────────────────────────────────────────────────────────
// Convención de bordes: cada celda lleva right+bottom siempre.
// La primera columna de cada fila añade bL=true.
// La primera fila añade bT=true.

function Cell({
  w, h = H_ROW, children,
  bold = false, fontSize = 6, align = 'center', bg,
  bL = false, bT = false, bR = true, bB = true, px = 1,
}) {
  const justifyContent = align === 'center' ? 'center' : 'flex-start'
  const alignItems     = align === 'right'  ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'

  return (
    <View
      style={{
        width: w,
        height: h,
        backgroundColor: bg,
        borderLeftWidth:   bL ? 0.5 : 0,
        borderTopWidth:    bT ? 0.5 : 0,
        borderRightWidth:  0.5,
        borderBottomWidth: 0.5,
        borderColor: '#000',
        justifyContent,
        alignItems,
        paddingHorizontal: px,
      }}
    >
      {children !== '' && children !== null && children !== undefined && (
        <Text style={{ fontSize, fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica' }}>
          {String(children)}
        </Text>
      )}
    </View>
  )
}

// ─── Etiqueta de metadato (CICLO, GRADO…) ────────────────────────────────────

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

// ─── Documento PDF ────────────────────────────────────────────────────────────

export default function ConcentradoCalificacionesPDF({
  alumnos, calMap, grado, grupo, bloque, cicloEscolar, turno,
}) {
  const asignaturas = getAsignaturasRegulares(grado)
  const calKey      = `${bloque}_cal`
  const nSubj       = asignaturas.length
  const W_SUBJ      = (USABLE - W_NUM - W_ALUMNO - W_TALLER - W_PROM) / nSubj

  const getCal       = (id, key) => calMap?.[id]?.asignaturasRegulares?.[key]?.[calKey] ?? ''
  const getBlockProm = (id)      => avg(asignaturas.map((s) => getCal(id, s.key)))
  const colAvg       = (key)     => avg(alumnos.map((a) => getCal(a.id, key)))
  const promAvg                  = avg(alumnos.map((a) => getBlockProm(a.id)))

  const gradoLabel  = GRADO_LABEL[String(grado)] ?? String(grado)
  const bloqueLabel = BLOQUE_NUM[bloque]          ?? bloque
  const turnoLabel  = (turno ?? '').toUpperCase()

  return (
    <Document>
      <Page size="A4" style={{ paddingHorizontal: MARGIN, paddingTop: 18, paddingBottom: 25 }}>

        {/* ── Encabezados ── */}
        <View style={{ alignItems: 'center', marginBottom: 5 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
            ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
          </Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 3 }}>
            REPORTE DE EVALUACIONES DE BLOQUE
          </Text>
        </View>

        {/* ── Metadatos ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <MetaField label="CICLO"  value={cicloEscolar} />
          <MetaField label="GRADO"  value={gradoLabel}   />
          <MetaField label="GRUPO"  value={grupo}        />
          <MetaField label="BLOQUE" value={bloqueLabel}  />
          <MetaField label="TURNO"  value={turnoLabel}   />
        </View>

        {/* ── Tabla ── */}
        <View>

          {/* Encabezado de columnas */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM}    h={H_HDR} bL bT bold fontSize={6.5}>#</Cell>
            <Cell w={W_ALUMNO} h={H_HDR} bT bold fontSize={6.5} align="left" px={3}>ALUMNO</Cell>
            <Cell w={W_TALLER} h={H_HDR} bT bold fontSize={5.5}>TALLER</Cell>
            {asignaturas.map((s) => (
              <Cell key={s.key} w={W_SUBJ} h={H_HDR} bT bold fontSize={5.5}>
                {SUBJ_SHORT[s.key] ?? s.short}
              </Cell>
            ))}
            <Cell w={W_PROM} h={H_HDR} bT bold fontSize={6.5}>PROM</Cell>
          </View>

          {/* Filas de alumnos */}
          {alumnos.map((alumno, idx) => {
            const blockProm = getBlockProm(alumno.id)
            const promFail  = isFail(blockProm)
            return (
              <View key={alumno.id} style={{ flexDirection: 'row' }}>
                <Cell w={W_NUM}    h={H_ROW} bL fontSize={6} align="right" px={2}>{idx + 1}</Cell>
                <Cell w={W_ALUMNO} h={H_ROW} fontSize={6} align="left" px={3}>
                  {nombreCompleto(alumno)}
                </Cell>
                <Cell w={W_TALLER} h={H_ROW} fontSize={6}>{getTallerCode(alumno.taller)}</Cell>
                {asignaturas.map((s) => {
                  const cal = getCal(alumno.id, s.key)
                  return (
                    <Cell key={s.key} w={W_SUBJ} h={H_ROW} fontSize={6}
                      bg={isFail(cal) ? FAIL_BG : undefined}>
                      {fmtDisp(cal)}
                    </Cell>
                  )
                })}
                <Cell w={W_PROM} h={H_ROW} fontSize={6} bold={promFail}
                  bg={promFail ? FAIL_BG : undefined}>
                  {fmt2(blockProm)}
                </Cell>
              </View>
            )
          })}

          {/* Fila de promedios (footer) */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM + W_ALUMNO} h={H_FOOT} bL bold fontSize={7} align="right" px={4}>
              Promedio
            </Cell>
            <Cell w={W_TALLER} h={H_FOOT} fontSize={6} />
            {asignaturas.map((s) => {
              const a = colAvg(s.key)
              return (
                <Cell key={s.key} w={W_SUBJ} h={H_FOOT} fontSize={6} bold>
                  {fmt2(a)}
                </Cell>
              )
            })}
            <Cell w={W_PROM} h={H_FOOT} bold fontSize={7}>
              {fmt2(promAvg)}
            </Cell>
          </View>

        </View>

        {/* ── Fecha de generación ── */}
        <View style={{ position: 'absolute', bottom: 10, right: MARGIN }}>
          <Text style={{ fontSize: 6, color: '#555', fontFamily: 'Helvetica' }}>
            {formatDate()}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
