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

const H_HDR      = 13
const H_ROW      = 10
const H_GRUPO    = 9
const H_FOOT     = 11

// ─── Orden de columnas (mismo que irregulares/promedios) ─────────────────────

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
  if (count >= 8) return '#A0A0A0'
  if (count >= 6) return '#C0C0C0'
  if (count >= 5) return '#D8D8D8'
  return undefined
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THRESHOLD = 5  // >= 5 materias reprobadas → repetidor

const fmtGrade = (v) => {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

const nombreCompleto = (a) =>
  [a.primerApellido, a.segundoApellido, a.nombre].filter(Boolean).join(' ').toUpperCase()

const countAsigRep = (a, calMap, asignaturas) =>
  asignaturas.filter((s) => {
    const prom = calMap?.[a.id]?.asignaturasRegulares?.[s.key]?.promedio
    if (prom === '' || prom === null || prom === undefined) return false
    const n = Number(prom)
    return !isNaN(n) && n < 6
  }).length

const isRepetidor = (a, calMap, asignaturas) =>
  countAsigRep(a, calMap, asignaturas) >= THRESHOLD

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
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginRight: 2 }}>{label}</Text>
      <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 2, minWidth: 30 }}>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{value}</Text>
      </View>
    </View>
  )
}

// ─── Fila de sub-encabezado de grupo ──────────────────────────────────────────

function GrupoRow({ grupo, totalW }) {
  return (
    <View style={{ flexDirection: 'row', height: H_GRUPO }}>
      <View style={{
        width: totalW, height: H_GRUPO,
        borderLeftWidth: 0.5, borderBottomWidth: 0.5, borderRightWidth: 0.5, borderColor: '#000',
        flexDirection: 'row', alignItems: 'center', paddingLeft: 8,
      }}>
        <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', marginRight: 3 }}>GRUPO</Text>
        <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>{grupo}</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Sección por grado ────────────────────────────────────────────────────────

function GradoSection({ grado, gruposData }) {
  const asignaturas  = getSubjOrder(grado)
  const nSubj        = asignaturas.length
  const W_SUBJ       = (USABLE - W_NUM - W_ALUMNO - W_ASIG_REP) / nSubj
  const totalW       = W_NUM + W_ALUMNO + W_SUBJ * nSubj + W_ASIG_REP

  const gradoLabel   = GRADO_LABEL[String(grado)] ?? String(grado)

  // Calcular totales del grado
  let gradoAlumnos = 0
  let gradoAsigRep = 0
  gruposData.forEach(({ alumnos, calMap }) => {
    const reps = alumnos.filter((a) => isRepetidor(a, calMap, asignaturas))
    gradoAlumnos += reps.length
    gradoAsigRep += reps.reduce((s, a) => s + countAsigRep(a, calMap, asignaturas), 0)
  })

  if (gradoAlumnos === 0) return null

  return (
    <View style={{ marginBottom: 4 }}>

      {/* Etiqueta de grado */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', marginRight: 3 }}>GRADO</Text>
        <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 6, paddingVertical: 1 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{gradoLabel}</Text>
        </View>
      </View>

      {/* Encabezado de columnas */}
      <View style={{ flexDirection: 'row' }}>
        <Cell w={W_NUM}      h={H_HDR} bL bT bold fontSize={5}>#</Cell>
        <Cell w={W_ALUMNO}   h={H_HDR} bT bold fontSize={6} align="left" px={3}>ALUMNO</Cell>
        {asignaturas.map((s) => (
          <Cell key={s.key} w={W_SUBJ} h={H_HDR} bT bold fontSize={5}>{s.short}</Cell>
        ))}
        <Cell w={W_ASIG_REP} h={H_HDR} bT bold fontSize={4.5}>ASIG.{'\n'}REP</Cell>
      </View>

      {/* Grupos */}
      {gruposData.map(({ grupo, alumnos, calMap }) => {
        const repetidores   = alumnos.filter((a) => isRepetidor(a, calMap, asignaturas))
        if (repetidores.length === 0) return null

        const grupoAsigRep = repetidores.reduce((s, a) => s + countAsigRep(a, calMap, asignaturas), 0)

        return (
          <View key={grupo}>

            {/* Sub-cabecera de grupo */}
            <GrupoRow grupo={grupo} totalW={totalW} />

            {/* Filas de repetidores */}
            {repetidores.map((alumno) => {
              const rowNum  = alumnos.indexOf(alumno) + 1
              const asigRep = countAsigRep(alumno, calMap, asignaturas)
              const calDoc  = calMap?.[alumno.id]
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
                  <Cell w={W_ASIG_REP} h={H_ROW} fontSize={5.5} bold
                    bg={getAsigRepBg(asigRep)}>
                    {asigRep}
                  </Cell>
                </View>
              )
            })}

            {/* Pie del grupo */}
            <View style={{ flexDirection: 'row' }}>
              <Cell w={W_NUM + W_ALUMNO} h={H_FOOT} bL bold fontSize={5.5} align="right" px={4}>
                ALUMNOS REPETIDORES POR GRUPO
              </Cell>
              <View style={{ borderWidth: 0.5, borderColor: '#000', width: 22, height: H_FOOT,
                justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{repetidores.length}</Text>
              </View>
              <Cell w={W_SUBJ * nSubj - 22} h={H_FOOT} />
              <Cell w={W_ASIG_REP} h={H_FOOT} bold fontSize={7}>{grupoAsigRep}</Cell>
            </View>

          </View>
        )
      })}

      {/* Pie del grado */}
      <View style={{ flexDirection: 'row' }}>
        <Cell w={W_NUM + W_ALUMNO} h={H_FOOT} bL bold fontSize={5.5} align="right" px={4}>
          ALUMNOS REPETIDORES POR GRADO
        </Cell>
        <View style={{ borderWidth: 0.5, borderColor: '#000', width: 40, height: H_FOOT,
          justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>{gradoLabel}</Text>
        </View>
        <View style={{ borderWidth: 0.5, borderColor: '#000', width: 22, height: H_FOOT,
          justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{gradoAlumnos}</Text>
        </View>
        <Cell w={W_SUBJ * nSubj - 62} h={H_FOOT} />
        <Cell w={W_ASIG_REP} h={H_FOOT} bold fontSize={7}>{gradoAsigRep}</Cell>
      </View>

      {/* Separador */}
      <View style={{ borderTopWidth: 1, borderColor: '#000', marginTop: 3, marginBottom: 3 }} />

    </View>
  )
}

// ─── Documento principal ──────────────────────────────────────────────────────

export default function AlumnosRepetidoresPDF({ gradosData, cicloEscolar, turno }) {
  const turnoLabel = (turno ?? '').toUpperCase()
  const { fecha, hora } = formatDateTime()

  // Total general
  let totalAlumnos = 0
  let totalAsigRep = 0
  gradosData.forEach(({ grado, gruposData }) => {
    const asignaturas = getSubjOrder(grado)
    gruposData.forEach(({ alumnos, calMap }) => {
      const reps = alumnos.filter((a) => isRepetidor(a, calMap, asignaturas))
      totalAlumnos += reps.length
      totalAsigRep += reps.reduce((s, a) => s + countAsigRep(a, calMap, asignaturas), 0)
    })
  })

  return (
    <Document>
      <Page size="A4" style={{ paddingHorizontal: MARGIN, paddingTop: 18, paddingBottom: 25, fontFamily: 'Helvetica' }}>

        {/* Títulos */}
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
            ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
          </Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>
            ALUMNOS REPETIDORES
          </Text>
        </View>

        {/* Metadatos (sin grado — se muestra por sección) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <MetaField label="CICLO"  value={cicloEscolar} />
          <MetaField label="TURNO"  value={turnoLabel}   />
        </View>

        {/* Secciones por grado */}
        {gradosData.map(({ grado, gruposData }) => (
          <GradoSection key={grado} grado={grado} gruposData={gruposData} />
        ))}

        {/* Total general del turno */}
        <View wrap={false} style={{ marginTop: 2 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{
              flex: 1, height: H_FOOT,
              borderLeftWidth: 0.5, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#000',
              justifyContent: 'center', alignItems: 'flex-end', paddingRight: 6,
            }}>
              <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>
                TOTAL REPETIDORES EN EL TURNO
              </Text>
            </View>
            <View style={{ borderWidth: 0.5, borderColor: '#000', width: 22, height: H_FOOT,
              justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{totalAlumnos}</Text>
            </View>
            <View style={{ borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#000',
              flex: 1, height: H_FOOT }} />
            <View style={{ borderWidth: 0.5, borderColor: '#000', width: W_ASIG_REP, height: H_FOOT,
              justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{totalAsigRep}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 10, left: MARGIN, right: MARGIN,
          flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 6, color: '#555' }}>{fecha}</Text>
          <Text style={{ fontSize: 6, color: '#555' }}>{hora}</Text>
        </View>

      </Page>
    </Document>
  )
}
