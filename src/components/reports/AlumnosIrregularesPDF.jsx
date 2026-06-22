import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { getAsignaturasRegulares } from '../control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'

// ─── Constantes ───────────────────────────────────────────────────────────────

const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }

const MARGIN     = 20
const USABLE     = 595.28 - MARGIN * 2

const W_NUM      = 14
const W_ALUMNO   = 145
const W_ASIG_REP = 32

const H_HDR  = 13
const H_ROW  = 10
const H_FOOT = 11

// ─── Orden de columnas (mismo que PromediosActualizados) ──────────────────────

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

// ─── Escala de gris por criticidad ───────────────────────────────────────────
// < 4    → gris oscuro   (crítico)
// 4–4.9  → gris medio    (serio)
// 5–5.4  → gris claro    (moderado)
// 5.5–5.9 → gris muy claro (leve)
// ≥ 6    → sin color

const getFailBg = (v) => {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  if (isNaN(n) || n >= 6) return undefined
  if (n < 4)   return '#A0A0A0'
  if (n < 5)   return '#C0C0C0'
  if (n < 5.5) return '#D8D8D8'
  return '#EFEFEF'
}

const getAsigRepBg = (count) => {
  if (count >= 4) return '#B8B8B8'
  if (count >= 3) return '#D8D8D8'
  return undefined
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtGrade = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

const nombreCompleto = (a) =>
  [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ').toUpperCase()

const formatDateTime = () => {
  const now   = new Date()
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hora  = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return { fecha, hora }
}

const countAsigRep = (a, calMap, asignaturas) =>
  asignaturas.filter((s) => {
    const prom = calMap?.[a.id]?.asignaturasRegulares?.[s.key]?.promedio
    if (prom === '' || prom === null || prom === undefined) return false
    const n = Number(prom)
    return !isNaN(n) && n < 6
  }).length

const isIrregular = (a, calMap, asignaturas) => countAsigRep(a, calMap, asignaturas) > 0

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
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginRight: 2 }}>{label}</Text>
      <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 2, minWidth: 30 }}>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{value}</Text>
      </View>
    </View>
  )
}

// ─── Sección por grupo ────────────────────────────────────────────────────────

function GrupoSection({ grupo, alumnos, calMap, asignaturas, W_SUBJ }) {
  const irregulares = alumnos.filter((a) => isIrregular(a, calMap, asignaturas))
  if (irregulares.length === 0) return null

  const totalAsigRep = irregulares.reduce((sum, a) => sum + countAsigRep(a, calMap, asignaturas), 0)

  return (
    <View style={{ marginBottom: 6 }}>

      {/* Etiqueta de grupo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', marginRight: 3 }}>GRUPO</Text>
        <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 1 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{grupo}</Text>
        </View>
      </View>

      {/* Encabezados */}
      <View style={{ flexDirection: 'row' }}>
        <Cell w={W_NUM}      h={H_HDR} bL bT bold fontSize={5}>#</Cell>
        <Cell w={W_ALUMNO}   h={H_HDR} bT bold fontSize={6} align="left" px={3}>ALUMNO</Cell>
        {asignaturas.map((s) => (
          <Cell key={s.key} w={W_SUBJ} h={H_HDR} bT bold fontSize={5}>{s.short}</Cell>
        ))}
        <Cell w={W_ASIG_REP} h={H_HDR} bT bold fontSize={4.5}>ASIG.{'\n'}REP</Cell>
      </View>

      {/* Filas de alumnos irregulares */}
      {irregulares.map((alumno) => {
        const rowNum   = alumnos.indexOf(alumno) + 1
        const asigRep  = countAsigRep(alumno, calMap, asignaturas)
        const calDoc   = calMap?.[alumno.id]
        return (
          <View key={alumno.id} style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM}    h={H_ROW} bL fontSize={5} align="right" px={2}>{rowNum}</Cell>
            <Cell w={W_ALUMNO} h={H_ROW} fontSize={5.5} align="left" px={3}>
              {nombreCompleto(alumno)}
            </Cell>
            {asignaturas.map((s) => {
              const prom = calDoc?.asignaturasRegulares?.[s.key]?.promedio
              return (
                <Cell key={s.key} w={W_SUBJ} h={H_ROW} fontSize={5.5} bg={getFailBg(prom)}>
                  {fmtGrade(prom)}
                </Cell>
              )
            })}
            <Cell w={W_ASIG_REP} h={H_ROW} fontSize={5.5} bold={asigRep >= 3}
              bg={getAsigRepBg(asigRep)}>
              {asigRep}
            </Cell>
          </View>
        )
      })}

      {/* Pie del grupo */}
      <View style={{ flexDirection: 'row' }}>
        <Cell w={W_NUM + W_ALUMNO} h={H_FOOT} bL bold fontSize={5.5} align="right" px={4}>
          ALUMNOS IRREGULARES POR GRUPO
        </Cell>
        <Cell w={W_SUBJ * asignaturas.length} h={H_FOOT} bold fontSize={7}>
          {irregulares.length}
        </Cell>
        <Cell w={W_ASIG_REP} h={H_FOOT} bold fontSize={7}>{totalAsigRep}</Cell>
      </View>

    </View>
  )
}

// ─── Documento principal ──────────────────────────────────────────────────────

export default function AlumnosIrregularesPDF({ gruposData, grado, cicloEscolar, turno }) {
  const asignaturas = getSubjOrder(grado)
  const nSubj       = asignaturas.length
  const W_SUBJ      = (USABLE - W_NUM - W_ALUMNO - W_ASIG_REP) / nSubj

  const gradoLabel  = GRADO_LABEL[String(grado)] ?? String(grado)
  const turnoLabel  = (turno ?? '').toUpperCase()

  const { fecha, hora } = formatDateTime()

  const totalIrregulares = gruposData.reduce(
    (sum, { alumnos, calMap }) =>
      sum + alumnos.filter((a) => isIrregular(a, calMap, asignaturas)).length,
    0,
  )
  const totalAsigRep = gruposData.reduce(
    (sum, { alumnos, calMap }) =>
      sum + alumnos.reduce((s2, a) => s2 + countAsigRep(a, calMap, asignaturas), 0),
    0,
  )

  return (
    <Document>
      <Page size="A4" style={{ paddingHorizontal: MARGIN, paddingTop: 18, paddingBottom: 25, fontFamily: 'Helvetica' }}>

        {/* Títulos */}
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
            ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
          </Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>
            ALUMNOS IRREGULARES POR GRADO
          </Text>
        </View>

        {/* Metadatos */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <MetaField label="CICLO"  value={cicloEscolar} />
          <MetaField label="GRADO"  value={gradoLabel}   />
          <MetaField label="TURNO"  value={turnoLabel}   />
        </View>

        {/* Secciones por grupo */}
        {gruposData.map(({ grupo, alumnos, calMap }) => (
          <GrupoSection
            key={grupo}
            grupo={grupo}
            alumnos={alumnos}
            calMap={calMap}
            asignaturas={asignaturas}
            W_SUBJ={W_SUBJ}
          />
        ))}

        {/* Total del grado */}
        <View wrap={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM + W_ALUMNO} h={H_FOOT} bL bT bold fontSize={5.5} align="right" px={4}>
              ALUMNOS IRREGULARES POR GRADO
            </Cell>
            <Cell w={W_SUBJ * 2} h={H_FOOT} bT bold fontSize={6.5}>{gradoLabel}</Cell>
            <Cell w={W_SUBJ * (nSubj - 2)} h={H_FOOT} bT bold fontSize={7}>{totalIrregulares}</Cell>
            <Cell w={W_ASIG_REP} h={H_FOOT} bT bold fontSize={7}>{totalAsigRep}</Cell>
          </View>
        </View>

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 10, left: MARGIN, right: MARGIN, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 6, color: '#555' }}>{fecha}</Text>
          <Text style={{ fontSize: 6, color: '#555' }}>{hora}</Text>
        </View>

      </Page>
    </Document>
  )
}
