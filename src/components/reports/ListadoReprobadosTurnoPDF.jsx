import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { getAsignaturasRegulares } from '../control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'

const MARGIN     = 20
const USABLE     = 595.28 - MARGIN * 2

const W_NL       = 14
const W_ALUMNO   = 135
const W_ASREP    = 28
const SUBJ_AVAIL = USABLE - W_NL - W_ALUMNO - W_ASREP

const H_ROW       = 9
const H_HDR       = 10
const H_TOT_GRP   = 10
const H_TOT_GRD   = 11
const H_TOT_TURNO = 12

const BLOQUE_LABEL = { b1: '1', b2: '2', b3: '3' }

// Orden de visualización de columnas (igual que la imagen del usuario)
const DISPLAY_ORDER = [
  'espanol', 'matematicas', 'lenguaExtranjera', 'ciencias', 'historia',
  'geografia', 'formacionCivica', 'tecnologia', 'educacionFisica', 'artes',
]

const SUBJ_SHORT = {
  espanol: 'ESP', matematicas: 'MAT', lenguaExtranjera: 'LE',
  ciencias: 'CIE', historia: 'HIS', geografia: 'GEO',
  formacionCivica: 'FCE', tecnologia: 'TEC', educacionFisica: 'E.FIS', artes: 'ART',
}

const getDisplaySubjects = (grado) => {
  const asigs   = getAsignaturasRegulares(grado)
  const asigMap = Object.fromEntries(asigs.map((a) => [a.key, a]))
  return DISPLAY_ORDER.filter((k) => k in asigMap).map((k) => asigMap[k])
}

const fmtGrade = (v) => {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

const formatDate = () => {
  const now = new Date()
  return (
    now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    + '   '
    + now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  )
}

// ── Celda base ────────────────────────────────────────────────────────────────
function Cell({ w, h = H_ROW, children, bold, fontSize = 6, align = 'center', bg, bL = false, bT = false, px = 1 }) {
  return (
    <View style={{
      width: w, height: h, backgroundColor: bg,
      borderLeftWidth: bL ? 0.5 : 0, borderTopWidth: bT ? 0.5 : 0,
      borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#000',
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

function MetaField({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
      <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginRight: 2 }}>{label}</Text>
      <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 5, paddingVertical: 1.5, minWidth: 28 }}>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{value}</Text>
      </View>
    </View>
  )
}

// ── Sección de un grupo ───────────────────────────────────────────────────────
function GrupoSection({ grado, gradoLabel, grupo, alumnos }) {
  const displaySubjs = getDisplaySubjects(grado)
  const W_SUBJ = SUBJ_AVAIL / displaySubjs.length

  const totalAlumnos = alumnos.length
  const totalAsRep   = alumnos.reduce((sum, a) => sum + a.asRep, 0)

  return (
    <View>
      {/* Encabezado GRADO / GRUPO */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7, marginBottom: 2 }}>
        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', marginRight: 3 }}>GRADO</Text>
        <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 7, paddingVertical: 1.5, marginRight: 10 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{gradoLabel}</Text>
        </View>
        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', marginRight: 3 }}>GRUPO</Text>
        <View style={{ borderWidth: 0.5, borderColor: '#000', paddingHorizontal: 7, paddingVertical: 1.5 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{grupo}</Text>
        </View>
      </View>

      {/* Encabezado de columnas */}
      <View style={{ flexDirection: 'row' }}>
        <Cell w={W_NL}     h={H_HDR} bL bT />
        <Cell w={W_ALUMNO} h={H_HDR} bT align="left" px={3} bold fontSize={6.5}>ALUMNO</Cell>
        {displaySubjs.map((s) => (
          <Cell key={s.key} w={W_SUBJ} h={H_HDR} bT bold fontSize={5.5}>
            {SUBJ_SHORT[s.key] ?? s.short}
          </Cell>
        ))}
        <Cell w={W_ASREP} h={H_HDR} bT bold fontSize={5.5}>AS REP</Cell>
      </View>

      {/* Filas de alumnos */}
      {alumnos.map((alumno) => (
        <View key={alumno.id} style={{ flexDirection: 'row' }}>
          <Cell w={W_NL}     bL align="right" px={2} fontSize={5.5}>{alumno.nl}</Cell>
          <Cell w={W_ALUMNO} align="left"  px={3} fontSize={5.5}>
            {[alumno.primerApellido, alumno.segundoApellido, alumno.nombre]
              .filter(Boolean).join(' ').toUpperCase()}
          </Cell>
          {displaySubjs.map((s) => {
            const v      = alumno.grades?.[s.key]
            const isFail = v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) < 6
            return (
              <Cell key={s.key} w={W_SUBJ} fontSize={6} bold={isFail} bg={isFail ? '#D8D8D8' : undefined}>
                {fmtGrade(v)}
              </Cell>
            )
          })}
          <Cell w={W_ASREP} fontSize={6} bold>{alumno.asRep > 0 ? String(alumno.asRep) : ''}</Cell>
        </View>
      ))}

      {/* Total por grupo */}
      <View style={{ flexDirection: 'row' }}>
        <Cell w={W_NL + W_ALUMNO} bL h={H_TOT_GRP} align="left" px={3} bold fontSize={5.5}>
          TOTAL DE ALUMNOS CON ASIGNATURAS REPROBADAS POR GRUPO
        </Cell>
        <Cell w={W_SUBJ} h={H_TOT_GRP} bold>{totalAlumnos}</Cell>
        {displaySubjs.slice(1).map((s) => (
          <Cell key={s.key} w={W_SUBJ} h={H_TOT_GRP} />
        ))}
        <Cell w={W_ASREP} h={H_TOT_GRP} bold>{totalAsRep}</Cell>
      </View>
    </View>
  )
}

// ── Documento principal ───────────────────────────────────────────────────────
export default function ListadoReprobadosTurnoPDF({
  gradosData, turnoTotalAlumnos, turnoTotalAsRep, bloque, cicloEscolar, turno,
  showTurnoTotal = true,
}) {
  const bloqueLabel = BLOQUE_LABEL[bloque] ?? bloque
  const turnoLabel  = (turno ?? '').toUpperCase()

  return (
    <Document>
      <Page size="A4" style={{ paddingHorizontal: MARGIN, paddingTop: 16, paddingBottom: 28 }}>

        {/* Encabezado (solo pág. 1) */}
        <View style={{ alignItems: 'center', marginBottom: 3 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
            ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4
          </Text>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>
            LISTADO DE ALUMNOS CON ASIGNATURAS REPROBADAS
          </Text>
        </View>

        {/* Metadatos */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <MetaField label="CICLO"  value={cicloEscolar}  />
          <MetaField label="BLOQUE" value={bloqueLabel}   />
          <MetaField label="TURNO"  value={turnoLabel}    />
        </View>

        {/* Contenido: grados → grupos */}
        {gradosData.map(({ grado, gradoLabel, gruposData, totalAlumnos, totalAsRep }) => (
          <View key={grado}>
            {gruposData.map(({ grupo, alumnos }) => (
              <GrupoSection
                key={grupo}
                grado={grado}
                gradoLabel={gradoLabel}
                grupo={grupo}
                alumnos={alumnos}
              />
            ))}

            {/* Total por grado */}
            {totalAlumnos > 0 && (
              <View style={{ flexDirection: 'row', marginTop: 2, marginBottom: 4 }}>
                <Cell w={USABLE - W_ASREP} bL h={H_TOT_GRD} align="left" px={3} bold fontSize={5.5}>
                  {`TOTAL DE ALUMNOS CON ASIGNATURAS REPROBADAS POR GRADO    ${totalAlumnos}`}
                </Cell>
                <Cell w={W_ASREP} h={H_TOT_GRD} bold>{totalAsRep}</Cell>
              </View>
            )}
          </View>
        ))}

        {/* Total turno */}
        {showTurnoTotal && (
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            <Cell w={USABLE - W_ASREP} bL h={H_TOT_TURNO} align="left" px={3} bold fontSize={6}>
              {`TOTAL DE ALUMNOS CON ASIGNATURAS REPROBADAS TURNO    ${turnoTotalAlumnos}`}
            </Cell>
            <Cell w={W_ASREP} h={H_TOT_TURNO} bold fontSize={7}>{turnoTotalAsRep}</Cell>
          </View>
        )}

        {/* Pie fijo: fecha + página */}
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
