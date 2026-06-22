import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { getAsignaturasRegulares } from '../control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'

// ─── Constantes ───────────────────────────────────────────────────────────────

const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }
export const BLOQUE_NUM_E = { b1: '1', b2: '2', b3: '3' }

const MARGIN   = 20
const USABLE   = 595.28 - MARGIN * 2   // 555.28

const W_LABEL  = 70
const W_PROM   = 23
const W_ASIG   = 27  // TOT ASIG
const W_ALUM   = 27  // TOT ALUM

const H_HDR_TITLE = 38  // height of the fixed header block
const H_INFO  = 14      // group info row
const H_COL   = 12      // subject column headers
const H_ROW   = 11      // data rows

// ciencias no está aquí — su short viene de getAsignaturasRegulares(grado): 'Bio.' / 'Fís.' / 'Quí.'
const SUBJ_SHORT = {
  espanol:          'ESP',
  lenguaExtranjera: 'LE',
  artes:            'ART',
  matematicas:      'MAT',
  geografia:        'GEO',
  historia:         'HIS',
  formacionCivica:  'FCE',
  tecnologia:       'TEC',
  educacionFisica:  'EF',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtProm = (v) => {
  if (v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return n.toFixed(1)
}

const fmtInt = (v) => {
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}

const formatDate = () => {
  const now = new Date()
  return now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// ─── Cálculo de estadísticas por grupo ────────────────────────────────────────

export function computeGrupoStats(alumnos, calMap, grado, bloque, asignaturas) {
  const calKey    = `${bloque}_cal`
  const matricula = alumnos.length

  // Stats por asignatura
  const subjectStats = {}
  asignaturas.forEach((s) => {
    const cals = alumnos
      .map((a) => calMap?.[a.id]?.asignaturasRegulares?.[s.key]?.[calKey])
      .map((v) => (v !== '' && v !== null && v !== undefined ? Number(v) : null))

    const entered    = cals.filter((v) => v !== null && !isNaN(v))
    const reprobados = entered.filter((v) => v < 6).length
    const aprobados  = entered.length - reprobados
    const porcentaje = entered.length > 0 ? Math.round((aprobados / entered.length) * 100) : 0

    subjectStats[s.key] = {
      promedio: entered.length ? entered.reduce((a, b) => a + b, 0) / entered.length : null,
      reprobados,
      aprobados,
      porcentaje,
    }
  })

  // Stats columna PROM (promedio del bloque de cada alumno)
  const blockProms = alumnos.map((a) => {
    const cals = asignaturas
      .map((s) => calMap?.[a.id]?.asignaturasRegulares?.[s.key]?.[calKey])
      .map((v) => (v !== '' && v !== null && v !== undefined ? Number(v) : null))
      .filter((v) => v !== null && !isNaN(v))
    return cals.length ? cals.reduce((sum, v) => sum + v, 0) / cals.length : null
  })

  const enteredProms   = blockProms.filter((v) => v !== null)
  const reprobadosProm = enteredProms.filter((v) => v < 6).length
  const aprobadosProm  = enteredProms.length - reprobadosProm

  const promStats = {
    promedio:   enteredProms.length ? enteredProms.reduce((a, b) => a + b, 0) / enteredProms.length : null,
    reprobados: reprobadosProm,
    aprobados:  aprobadosProm,
    porcentaje: enteredProms.length > 0 ? Math.round((aprobadosProm / enteredProms.length) * 100) : 0,
  }

  // TOT ASIG (REPROBADOS) = suma de reprobados en todas las asignaturas
  const totAsigReprobados = asignaturas.reduce((sum, s) => sum + subjectStats[s.key].reprobados, 0)

  // TOT ALUM = alumnos con al menos una asignatura reprobada
  const totAlumReprobados = alumnos.filter((a) =>
    asignaturas.some((s) => {
      const v = calMap?.[a.id]?.asignaturasRegulares?.[s.key]?.[calKey]
      if (v === '' || v === null || v === undefined) return false
      return Number(v) < 6
    }),
  ).length

  return {
    subjectStats,
    promStats,
    totAsig: totAsigReprobados,
    totAlum: {
      reprobados: totAlumReprobados,
      aprobados:  matricula - totAlumReprobados,
      porcentaje: matricula > 0 ? Math.round(((matricula - totAlumReprobados) / matricula) * 100) : 0,
    },
    matricula,
  }
}

// Suma estadísticas de varios grupos en un total
export function computeTotals(allGrupoStats, asignaturas) {
  const totalMatricula = allGrupoStats.reduce((s, g) => s + g.matricula, 0)
  if (totalMatricula === 0) return null

  const subjectStats = {}
  asignaturas.forEach((s) => {
    const totReprobados = allGrupoStats.reduce((sum, g) => sum + (g.subjectStats[s.key]?.reprobados ?? 0), 0)
    // Promedio ponderado por matrícula
    const promedioNum = allGrupoStats.reduce((sum, g) => {
      const p = g.subjectStats[s.key]?.promedio
      return p !== null ? sum + p * g.matricula : sum
    }, 0)
    const matriculaConProm = allGrupoStats.reduce((sum, g) => {
      return g.subjectStats[s.key]?.promedio !== null ? sum + g.matricula : sum
    }, 0)

    const totAprobados = allGrupoStats.reduce((sum, g) => sum + (g.subjectStats[s.key]?.aprobados ?? 0), 0)
    const totEntered   = totReprobados + totAprobados

    subjectStats[s.key] = {
      promedio:   matriculaConProm > 0 ? promedioNum / matriculaConProm : null,
      reprobados: totReprobados,
      aprobados:  totAprobados,
      porcentaje: totEntered > 0 ? Math.round((totAprobados / totEntered) * 100) : 0,
    }
  })

  const totRepProm = allGrupoStats.reduce((sum, g) => sum + g.promStats.reprobados, 0)
  const promedioPromNum = allGrupoStats.reduce((sum, g) => {
    const p = g.promStats.promedio
    return p !== null ? sum + p * g.matricula : sum
  }, 0)
  const matriculaConProm2 = allGrupoStats.reduce((sum, g) =>
    g.promStats.promedio !== null ? sum + g.matricula : sum, 0)

  const totAprobadosProm = allGrupoStats.reduce((sum, g) => sum + (g.promStats?.aprobados ?? 0), 0)
  const totEnteredProm   = totRepProm + totAprobadosProm

  const promStats = {
    promedio:   matriculaConProm2 > 0 ? promedioPromNum / matriculaConProm2 : null,
    reprobados: totRepProm,
    aprobados:  totAprobadosProm,
    porcentaje: totEnteredProm > 0 ? Math.round((totAprobadosProm / totEnteredProm) * 100) : 0,
  }

  const totAsig = allGrupoStats.reduce((s, g) => s + g.totAsig, 0)
  const totAlumRep = allGrupoStats.reduce((s, g) => s + g.totAlum.reprobados, 0)

  return {
    subjectStats,
    promStats,
    totAsig,
    totAlum: {
      reprobados: totAlumRep,
      aprobados:  totalMatricula - totAlumRep,
      porcentaje: Math.round(((totalMatricula - totAlumRep) / totalMatricula) * 100),
    },
    matricula: totalMatricula,
  }
}

// ─── Cell base ────────────────────────────────────────────────────────────────

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

// Celda con texto en dos líneas centrado
function Cell2({ w, h, line1, line2, bold = true, fontSize = 5 }) {
  return (
    <View style={{
      width: w, height: h,
      borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#000',
      justifyContent: 'center', alignItems: 'center',
    }}>
      <Text style={{ fontSize, fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica', lineHeight: 1.3 }}>{line1}</Text>
      <Text style={{ fontSize, fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica', lineHeight: 1.3 }}>{line2}</Text>
    </View>
  )
}

// ─── MetaField (etiqueta + valor en caja) ─────────────────────────────────────

function MetaField({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
      <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginRight: 2 }}>{label}</Text>
      <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 1.5, minWidth: 28 }}>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{value}</Text>
      </View>
    </View>
  )
}

// ─── Sección de un grupo ──────────────────────────────────────────────────────

const ROW_LABELS = ['PROMEDIOS:', 'REPROBADOS:', 'APROBADOS:', 'PORCENTAJE APROB.:']

function getSubjVal(rowIdx, stats) {
  if (!stats) return ''
  switch (rowIdx) {
    case 0: return fmtProm(stats.promedio)
    case 1: return fmtInt(stats.reprobados)
    case 2: return fmtInt(stats.aprobados)
    case 3: return fmtInt(stats.porcentaje)
    default: return ''
  }
}

function getTotAsigVal(rowIdx, totAsig) {
  if (rowIdx === 1) return fmtInt(totAsig)
  return ''
}

function getTotAlumVal(rowIdx, totAlum) {
  switch (rowIdx) {
    case 1: return fmtInt(totAlum.reprobados)
    case 2: return fmtInt(totAlum.aprobados)
    case 3: return fmtInt(totAlum.porcentaje)
    default: return ''
  }
}

function GrupoSection({ gradoLabel, grupo, grupoStats, asignaturas, W_SUBJ }) {
  const { subjectStats, promStats, totAsig, totAlum, matricula } = grupoStats

  return (
    <View wrap={false} style={{ marginBottom: 5 }}>

      {/* Fila de info: GRADO / GRUPO / MATRÍCULA + encabezados TOT ASIG / TOT ALUM */}
      <View style={{ flexDirection: 'row' }}>
        {/* Info izquierda */}
        <View style={{
          flex: 1, height: H_INFO,
          borderLeftWidth: 0.5, borderTopWidth: 0.5, borderRightWidth: 0, borderBottomWidth: 0.5,
          borderColor: '#000',
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 6,
        }}>
          <Text style={{ fontSize: 6.5 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>GRADO </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{gradoLabel}  </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>GRUPO </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{grupo}  </Text>
            <Text>MATRÍCULA: </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{matricula}</Text>
          </Text>
        </View>
        {/* TOT ASIG header */}
        <Cell2 w={W_ASIG} h={H_INFO} line1="TOT" line2="ASIG" />
        {/* TOT ALUM header */}
        <Cell2 w={W_ALUM} h={H_INFO} line1="TOT" line2="ALUM" />
      </View>

      {/* Fila de encabezados de columna */}
      <View style={{ flexDirection: 'row' }}>
        <Cell w={W_LABEL} h={H_COL} bL bT />
        {asignaturas.map((s) => (
          <Cell key={s.key} w={W_SUBJ} h={H_COL} bT bold fontSize={5.5}>
            {SUBJ_SHORT[s.key] ?? s.short}
          </Cell>
        ))}
        <Cell w={W_PROM} h={H_COL} bT bold fontSize={5.5}>PROM</Cell>
        <Cell w={W_ASIG} h={H_COL} bT />
        <Cell w={W_ALUM} h={H_COL} bT />
      </View>

      {/* Filas de datos */}
      {ROW_LABELS.map((label, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row' }}>
          <Cell w={W_LABEL} h={H_ROW} bL bold={false} fontSize={5.5} align="right" px={3}>
            {label}
          </Cell>
          {asignaturas.map((s) => (
            <Cell key={s.key} w={W_SUBJ} h={H_ROW} fontSize={6}>
              {getSubjVal(rowIdx, subjectStats[s.key])}
            </Cell>
          ))}
          <Cell w={W_PROM} h={H_ROW} fontSize={6}>
            {getSubjVal(rowIdx, promStats)}
          </Cell>
          <Cell w={W_ASIG} h={H_ROW} fontSize={6}>
            {getTotAsigVal(rowIdx, totAsig)}
          </Cell>
          <Cell w={W_ALUM} h={H_ROW} fontSize={6}>
            {getTotAlumVal(rowIdx, totAlum)}
          </Cell>
        </View>
      ))}

    </View>
  )
}

// ─── Sección de totales (TOTALES DE GRADO / GRAN TOTAL) ───────────────────────

function TotalsSection({ titulo, matriculaLabel, totalStats, asignaturas, W_SUBJ }) {
  if (!totalStats) return null
  const { subjectStats, promStats, totAsig, totAlum, matricula } = totalStats

  return (
    <View wrap={false} style={{ marginBottom: 5, marginTop: 3 }}>

      {/* Línea divisoria */}
      <View style={{ borderTopWidth: 1, borderColor: '#000', marginBottom: 3 }} />

      {/* Fila de info */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{
          flex: 1, height: H_INFO,
          borderLeftWidth: 0.5, borderTopWidth: 0.5, borderRightWidth: 0, borderBottomWidth: 0.5,
          borderColor: '#000',
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4,
        }}>
          <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginRight: 8 }}>{titulo}</Text>
          <Text style={{ fontSize: 6.5 }}>
            <Text>{matriculaLabel} </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{matricula}</Text>
          </Text>
        </View>
        <Cell2 w={W_ASIG} h={H_INFO} line1="TOT" line2="ASIG" />
        <Cell2 w={W_ALUM} h={H_INFO} line1="TOT" line2="ALUM" />
      </View>

      {/* Encabezados de columna */}
      <View style={{ flexDirection: 'row' }}>
        <Cell w={W_LABEL} h={H_COL} bL bT />
        {asignaturas.map((s) => (
          <Cell key={s.key} w={W_SUBJ} h={H_COL} bT bold fontSize={5.5}>
            {SUBJ_SHORT[s.key] ?? s.short}
          </Cell>
        ))}
        <Cell w={W_PROM} h={H_COL} bT bold fontSize={5.5}>PROM</Cell>
        <Cell w={W_ASIG} h={H_COL} bT />
        <Cell w={W_ALUM} h={H_COL} bT />
      </View>

      {/* Filas de datos */}
      {ROW_LABELS.map((label, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row' }}>
          <Cell w={W_LABEL} h={H_ROW} bL fontSize={5.5} align="right" px={3}>
            {label}
          </Cell>
          {asignaturas.map((s) => (
            <Cell key={s.key} w={W_SUBJ} h={H_ROW} fontSize={6}>
              {getSubjVal(rowIdx, subjectStats[s.key])}
            </Cell>
          ))}
          <Cell w={W_PROM} h={H_ROW} fontSize={6}>
            {getSubjVal(rowIdx, promStats)}
          </Cell>
          <Cell w={W_ASIG} h={H_ROW} fontSize={6}>
            {getTotAsigVal(rowIdx, totAsig)}
          </Cell>
          <Cell w={W_ALUM} h={H_ROW} fontSize={6}>
            {getTotAlumVal(rowIdx, totAlum)}
          </Cell>
        </View>
      ))}

    </View>
  )
}

// ─── Documento principal ──────────────────────────────────────────────────────

export default function ReporteEstadisticoPDF({ gruposData, grado, bloque, cicloEscolar, turno }) {
  const asignaturas  = getAsignaturasRegulares(grado)
  const nSubj        = asignaturas.length
  const W_SUBJ       = (USABLE - W_LABEL - W_PROM - W_ASIG - W_ALUM) / nSubj

  const gradoLabel   = GRADO_LABEL[String(grado)] ?? String(grado)
  const bloqueLabel  = BLOQUE_NUM_E[bloque] ?? bloque

  // Calcular estadísticas por grupo
  const allGrupoStats = gruposData.map(({ grupo, alumnos, calMap }) => ({
    grupo,
    ...computeGrupoStats(alumnos, calMap, grado, bloque, asignaturas),
  }))

  // Totales
  const totalStats = computeTotals(allGrupoStats, asignaturas)

  return (
    <Document>
      <Page
        size="A4"
        style={{
          paddingHorizontal: MARGIN,
          paddingTop: H_HDR_TITLE + 8,
          paddingBottom: 28,
          fontFamily: 'Helvetica',
        }}
      >

        {/* ── Encabezado fijo (repite en cada página) ── */}
        <View fixed style={{ position: 'absolute', top: 10, left: MARGIN, right: MARGIN }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>
            ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>
              RESUMEN ESTADÍSTICO DE BLOQUE
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <MetaField label="CICLO"  value={cicloEscolar} />
              <MetaField label="BLOQUE" value={bloqueLabel}  />
            </View>
          </View>
        </View>

        {/* ── Secciones de grupos ── */}
        {allGrupoStats.map((gs) => (
          <GrupoSection
            key={gs.grupo}
            gradoLabel={gradoLabel}
            grupo={gs.grupo}
            grupoStats={gs}
            asignaturas={asignaturas}
            W_SUBJ={W_SUBJ}
          />
        ))}

        {/* ── Totales de grado ── */}
        <TotalsSection
          titulo="TOTALES DE GRADO"
          matriculaLabel="MATRÍCULA DE GRADO:"
          totalStats={totalStats}
          asignaturas={asignaturas}
          W_SUBJ={W_SUBJ}
        />

        {/* ── Gran total ── */}
        <TotalsSection
          titulo="GRAN TOTAL"
          matriculaLabel="MATRÍCULA ACTUAL:"
          totalStats={totalStats}
          asignaturas={asignaturas}
          W_SUBJ={W_SUBJ}
        />

        {/* ── Footer fijo (repite en cada página) ── */}
        <View
          fixed
          style={{
            position: 'absolute', bottom: 10, left: MARGIN, right: MARGIN,
            flexDirection: 'row', justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 6, color: '#555' }}>{formatDate()}</Text>
          <Text
            style={{ fontSize: 6, color: '#555' }}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}
