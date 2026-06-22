import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { getAsignaturasRegulares, AREAS_CURRICULARES } from '../control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'

const GRADO_LABEL = { '1': 'PRIMERO', '2': 'SEGUNDO', '3': 'TERCERO' }

const MARGIN = 20
const USABLE = 595.28 - MARGIN * 2  // portrait A4

const W_NUM    = 15
const W_ALUMNO = 145
const W_PROM   = 26
// 11 sub-columnas: B1(C,R,I,CR) + B2(C,R,I,CR) + B3(C,R,I) — B3 no tiene CR
const W_SUB    = (USABLE - W_NUM - W_ALUMNO - W_PROM) / 11

const H_HDR1 = 11  // fila de BLOQUE 1 / BLOQUE 2 / BLOQUE 3
const H_HDR2 = 9   // fila de C / R / I / CR
const H_ROW  = 10
const H_FOOT = 11

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
  if (v === '' || v === null || v === undefined) return ''
  const s = String(v).trim()
  return s === '1' || s === '2' ? s : ''
}

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
      justifyContent: align === 'left' ? 'flex-start' : 'center',
      alignItems:     align === 'left' ? 'flex-start' : 'center',
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
      <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 2, minWidth: wide ? 80 : 28 }}>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{value}</Text>
      </View>
    </View>
  )
}

// ── Página por grupo ──────────────────────────────────────────────────────────
function PaginaGrupo({ alumnos, calMap, grado, grupo, asignaturaKey, asignaturaLabel, cicloEscolar, turno, pageNum, totalPages }) {
  const gradoLabel = GRADO_LABEL[String(grado)] ?? String(grado)
  const turnoLabel = (turno ?? '').toUpperCase()

  const getC  = (id, b) => fmtGrade(calMap?.[id]?.asignaturasRegulares?.[asignaturaKey]?.[`${b}_cal`])
  const getR  = (id, b) => fmtRec(calMap?.[id]?.observaciones?.[b])
  const getI  = (id, b) => fmtInt(calMap?.[id]?.inasistencias?.[b]?.[asignaturaKey])
  const getCR = (id, b) => fmtGrade(calMap?.[id]?.asignaturasRegulares?.[asignaturaKey]?.[`${b}_r`])

  // Calcula el promedio en línea: CR sustituye a C en B1/B2; B3 no tiene recuperación
  const getProm = (id) => {
    const s = calMap?.[id]?.asignaturasRegulares?.[asignaturaKey]
    if (!s) return ''
    const hasR = (v) => v !== null && v !== undefined && String(v).trim() !== ''
    const ef1 = hasR(s.b1_r) ? s.b1_r : s.b1_cal
    const ef2 = hasR(s.b2_r) ? s.b2_r : s.b2_cal
    const ef3 = s.b3_cal
    const nums = [ef1, ef2, ef3]
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(Number)
      .filter((n) => !isNaN(n))
    if (!nums.length) return ''
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    return Number.isInteger(avg) ? String(avg) : avg.toFixed(1)
  }

  return (
    <Page size="A4" style={{ paddingHorizontal: MARGIN, paddingTop: 16, paddingBottom: 28 }}>

      {/* Encabezado */}
      <View style={{ alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
          ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
        </Text>
      </View>

      {/* Metadatos fila 1 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
        <MetaField label="CICLO"  value={cicloEscolar} />
        <MetaField label="GRADO"  value={gradoLabel}   />
        <View style={{ flex: 1 }} />
        <MetaField label="GRUPO"  value={grupo}        />
        <View style={{ flex: 1 }} />
        <MetaField label="TURNO"  value={turnoLabel}   />
      </View>

      {/* Metadatos fila 2: asignatura */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
        <MetaField label="ASIGNATURA" value={asignaturaLabel.toUpperCase()} wide />
      </View>

      {/* Tabla */}
      <View>

        {/* Encabezado fila 1: NL + ALUMNO (doble altura) + BLOQUE labels + PROM (doble altura) */}
        <View style={{ flexDirection: 'row' }}>

          {/* NL — doble altura */}
          <View style={{
            width: W_NUM, height: H_HDR1 + H_HDR2,
            borderLeftWidth: 0.5, borderTopWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5,
            borderColor: '#000', justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>NL</Text>
          </View>

          {/* ALUMNO — doble altura */}
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
              {/* Fila 1: etiqueta del bloque */}
              <View style={{
                height: H_HDR1,
                borderTopWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5,
                borderColor: '#000', justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>{bloque.label}</Text>
              </View>
              {/* Fila 2: sub-cols según bloque */}
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

        {/* Filas de alumnos */}
        {alumnos.map((alumno, idx) => (
          <View key={alumno.id} style={{ flexDirection: 'row' }}>
            <Cell w={W_NUM}    bL fontSize={5.5} align="right" px={2}>{idx + 1}</Cell>
            <Cell w={W_ALUMNO} fontSize={5.5} align="left" px={3}>
              {[alumno.primerApellido, alumno.segundoApellido, alumno.nombre].filter(Boolean).join(' ').toUpperCase()}
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
        ))}

        {/* Fila vacía si no hay alumnos */}
        {alumnos.length === 0 && (
          <View style={{ flexDirection: 'row' }}>
            <Cell w={USABLE} bL fontSize={6} align="left" px={4}>Sin alumnos registrados</Cell>
          </View>
        )}

      </View>

      {/* Clave de columnas */}
      <View style={{ marginTop: 6 }}>
        <Text style={{ fontSize: 5.5, fontFamily: 'Helvetica' }}>
          CLAVES:  C= CALIFICACIÓN    R= RECOMENDACIÓN    I= INASISTENCIAS    CR= CALIFICACIÓN DE RECUPERACIÓN
        </Text>
      </View>

      {/* Pie: fecha + página */}
      <View style={{ position: 'absolute', bottom: 10, left: MARGIN, right: MARGIN, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 6, color: '#555', fontFamily: 'Helvetica' }}>
          {formatDate()}
        </Text>
        <Text style={{ fontSize: 6, color: '#555', fontFamily: 'Helvetica' }}>
          {`Página ${pageNum} de ${totalPages}`}
        </Text>
      </View>

    </Page>
  )
}

// ── Documento principal ───────────────────────────────────────────────────────
export default function ConcentradoCaliAsignaturaPDF({ gruposData, grado, asignaturaKey, cicloEscolar, turno }) {
  const asignaturas    = getAsignaturasRegulares(grado)
  const areasCurric    = AREAS_CURRICULARES
  const allMaterias    = [...asignaturas, ...areasCurric]
  const materiaInfo    = allMaterias.find((m) => m.key === asignaturaKey)
  const asignaturaLabel = materiaInfo?.label ?? asignaturaKey

  const totalPages = gruposData.length

  return (
    <Document>
      {gruposData.map(({ grupo, alumnos, calMap }, i) => (
        <PaginaGrupo
          key={grupo}
          alumnos={alumnos}
          calMap={calMap}
          grado={grado}
          grupo={grupo}
          asignaturaKey={asignaturaKey}
          asignaturaLabel={asignaturaLabel}
          cicloEscolar={cicloEscolar}
          turno={turno}
          pageNum={i + 1}
          totalPages={totalPages}
        />
      ))}
    </Document>
  )
}
