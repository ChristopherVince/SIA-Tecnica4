import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { getAsignaturasRegulares } from '../control-escolar/funcionalidades/evaluacion-bloque/evaluacionBloqueConfig'

// ─── Campos formativos por asignatura ────────────────────────────────────────
const CF_NUM = {
  espanol: 1, lenguaExtranjera: 1, artes: 1,
  matematicas: 2, ciencias: 2,
  geografia: 3, historia: 3, formacionCivica: 3,
  tecnologia: 4, educacionFisica: 4,
}

// ─── Anchos de columna (pts) ─────────────────────────────────────────────────
const W_CF   = 12   // campo formativo (col vertical)
const W_NUM  = 14   // número de CF
const W_CAL  = 24   // cada col CAL/REC (×5 = 120)
const W_PROM = 28   // PROM (trim 3 + prom gral)
const W_T    = 19   // cada col inas T1/T2/T3 (×3 = 57)
const W_NIEV = 50   // columna NIEV (fuera de la tabla principal)

// subj = flex:1 → ocupa el resto de mainTable

// ─── Alturas de fila (pts) ───────────────────────────────────────────────────
const H1 = 11  // header: CALIFICACIONES / INASISTENCIAS
const H2 = 10  // header: TRIM. / T1 T2 T3
const H3 = 10  // header: CAL / REC / PROM
const HD = 11  // fila de asignatura
const HP = 11  // fila PROMEDIO

// ─── Estilos base ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 16,
    color: '#000',
  },

  half: {},
  sep: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#555',
    borderBottomStyle: 'dashed',
    marginVertical: 4,
  },

  // Encabezado
  title: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  clavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 1.5,
    gap: 10,
  },
  lbl: { fontFamily: 'Helvetica' },
  val: { fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },

  // Área de tabla
  tableArea: {
    flexDirection: 'row',
    marginTop: 3,
  },

  // Col campo formativo (texto vertical letra a letra)
  cfCol: {
    width: W_CF,
    borderLeftWidth: 0.5,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderRightWidth: 0,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  cfChar: {
    fontSize: 5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    lineHeight: 1.15,
  },

  // Tabla principal (flex: 1)
  mainTable: { flex: 1 },

  // Col NIEV
  niévOuter: {
    width: W_NIEV,
    paddingLeft: 5,
  },
  niévLbl: {
    borderWidth: 0.5,
    borderColor: '#000',
    backgroundColor: '#e0e0e0',
    paddingVertical: 2,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  niévVal: {
    borderWidth: 0.5,
    borderTopWidth: 0,
    borderColor: '#000',
    padding: 3,
    minHeight: 18,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Sección inferior
  bottomBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 3,
    gap: 8,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  areaLbl: {
    fontSize: 6.5,
    textTransform: 'uppercase',
    width: 145,
  },
  areaBox: {
    width: 22,
    height: 13,
    borderWidth: 0.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legHdr: {
    borderWidth: 0.5,
    borderColor: '#000',
    backgroundColor: '#e0e0e0',
    paddingVertical: 1.5,
    paddingHorizontal: 2,
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  legItem: {
    fontSize: 5.5,
    marginBottom: 1,
  },
  legNum: { fontFamily: 'Helvetica-Bold' },
  legCie: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 5.5,
    marginTop: 1,
  },
})

// ─── Helpers de datos ─────────────────────────────────────────────────────────

const gv = (cal, key, blk, t) => {
  const v = cal?.asignaturasRegulares?.[key]?.[`${blk}_${t}`]
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}
const gpro = (cal, key) => {
  const v = cal?.asignaturasRegulares?.[key]?.promedio
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}
const garea = (cal, key, blk) => {
  const v = cal?.areasCurriculares?.[key]?.[`${blk}_cal`]
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}
const ginas = (cal, blk) => {
  const v = cal?.inasistencias?.[blk]
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}

// Calificación reprobatoria (numérica menor a 6)
const FAIL_BG = '#ffd2d2'
const isFail = (str) => {
  if (str === '' || str === null || str === undefined) return false
  const n = Number(str)
  return !Number.isNaN(n) && n < 6
}

// Formatea un promedio a 2 decimales (deja vacío/no numérico tal cual)
const fmt2 = (val) => {
  if (val === '' || val === null || val === undefined) return ''
  const n = Number(val)
  if (Number.isNaN(n)) return String(val)
  return n.toFixed(2)
}

// ─── Celda de tabla genérica ──────────────────────────────────────────────────

function Cell({
  w, h, flex,
  children,
  bold = false,
  fontSize = 6.5,
  align = 'center',
  bg,
  bL = true, bT = true, bR = true, bB = true,
  padH,
}) {
  const textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center'
  const alignItems = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
  const baseStyle = {
    ...(w !== undefined ? { width: w } : {}),
    ...(h !== undefined ? { height: h } : {}),
    ...(flex !== undefined ? { flex } : {}),
    justifyContent: 'center',
    alignItems,
    overflow: 'hidden',
    paddingHorizontal: padH ?? (align === 'left' ? 2 : 0.5),
    ...(bg ? { backgroundColor: bg } : {}),
    borderLeftWidth:   bL ? 0.5 : 0,
    borderTopWidth:    bT ? 0.5 : 0,
    borderRightWidth:  bR ? 0.5 : 0,
    borderBottomWidth: bB ? 0.5 : 0,
    borderColor: '#000',
  }
  return (
    <View style={baseStyle}>
      {children !== undefined && children !== null && children !== '' ? (
        <Text style={{
          fontSize,
          fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica',
          textAlign,
          textTransform: 'uppercase',
        }}>
          {String(children)}
        </Text>
      ) : null}
    </View>
  )
}

// ─── Boleta media hoja ────────────────────────────────────────────────────────

function BoletaHalf({ alumno, cal, cicloEscolar }) {
  const { grado, grupo, taller = '', niev = '' } = alumno
  const nombre = [alumno.primerApellido, alumno.segundoApellido, alumno.nombre]
    .filter(Boolean).join(' ').toUpperCase()
  const gradoLabel = grado == 1 ? 'PRIMERO' : grado == 2 ? 'SEGUNDO' : grado == 3 ? 'TERCERO' : String(grado ?? '')
  const turnoLabel = String(grupo ?? '').toUpperCase() <= 'F' ? 'MATUTINO' : 'VESPERTINO'
  const subjects = getAsignaturasRegulares(grado)

  // Anchos derivados
  const W_CAL6  = W_CAL * 5 + W_PROM  // CALIFICACIONES (6 cols)
  const W_INAS3 = W_T * 3              // INASISTENCIAS (3 cols)
  const W_NUMSUB = W_NUM               // col número (flexible subj)

  return (
    <View style={s.half} wrap={false}>

      {/* ── Encabezado ── */}
      <Text style={s.title}>ESCUELA SECUNDARIA TÉCNICA INDUSTRIAL No. 4</Text>
      <View style={s.clavRow}>
        <Text>CLAVE   30DST0077R</Text>
        <Text>ORIZABA, VERACRUZ</Text>
      </View>

      {/* ── Info alumno ── */}
      <View style={s.infoRow}>
        <Text><Text style={s.lbl}>CICLO: </Text><Text style={s.val}>{cicloEscolar}</Text></Text>
        <Text style={s.val}>{gradoLabel} &quot;{grupo}&quot;</Text>
        <Text><Text style={s.lbl}>TURNO: </Text><Text style={s.val}>{turnoLabel}</Text></Text>
      </View>
      <View style={[s.infoRow, { gap: 16 }]}>
        <Text><Text style={s.lbl}>ALUMNO: </Text><Text style={s.val}>{nombre}</Text></Text>
        <Text><Text style={s.lbl}>TALLER: </Text><Text style={s.val}>{taller.toUpperCase()}</Text></Text>
      </View>

      {/* ── Área central (CF + tabla + NIEV) ── */}
      <View style={s.tableArea}>

        {/* Columna CAMPO FORMATIVO (texto vertical, letra a letra) */}
        <View style={s.cfCol}>
          {'CAMPO FORMATIVO'.split('').map((ch, i) => (
            <Text key={i} style={s.cfChar}>{ch === ' ' ? ' ' : ch}</Text>
          ))}
        </View>

        {/* Tabla principal */}
        <View style={s.mainTable}>

          {/* Header fila 1: [num blank][subj blank][CALIFICACIONES][INASISTENCIAS] */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUMSUB} h={H1} bL bT={false} bR={false} bB={false} />
            <Cell flex={1}     h={H1} bL bT={false} bR={false} bB={false} />
            <Cell w={W_CAL6}  h={H1} bL bT bR={false} bB bold>CALIFICACIONES</Cell>
            <Cell w={W_INAS3} h={H1} bL bT bR bB bold>INASISTENCIAS</Cell>
          </View>

          {/* Header fila 2: [num][ASIGNATURA][TRIM.1][TRIM.2][TRIM.3][T1][T2][T3] */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUMSUB} h={H2} bL bT bR={false} bB={false} />
            <Cell flex={1}     h={H2} bL bT bR={false} bB bold>ASIGNATURA</Cell>
            <Cell w={W_CAL*2} h={H2} bL bT bR={false} bB bold>TRIM. 1</Cell>
            <Cell w={W_CAL*2} h={H2} bL={false} bT bR={false} bB bold>TRIM. 2</Cell>
            <Cell w={W_CAL+W_PROM} h={H2} bL={false} bT bR={false} bB bold>TRIM. 3</Cell>
            <Cell w={W_T} h={H2} bL bT bR={false} bB bold>T1</Cell>
            <Cell w={W_T} h={H2} bL={false} bT bR={false} bB bold>T2</Cell>
            <Cell w={W_T} h={H2} bL={false} bT bR bB bold>T3</Cell>
          </View>

          {/* Header fila 3: [num][subj][CAL][REC][CAL][REC][CAL][PROM][blanks] */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUMSUB} h={H3} bL bT bR={false} bB />
            <Cell flex={1}     h={H3} bL bT={false} bR={false} bB />
            <Cell w={W_CAL}  h={H3} bL bT bR={false} bB bold>CAL</Cell>
            <Cell w={W_CAL}  h={H3} bL={false} bT bR={false} bB bold>REC</Cell>
            <Cell w={W_CAL}  h={H3} bL={false} bT bR={false} bB bold>CAL</Cell>
            <Cell w={W_CAL}  h={H3} bL={false} bT bR={false} bB bold>REC</Cell>
            <Cell w={W_CAL}  h={H3} bL={false} bT bR={false} bB bold>CAL</Cell>
            <Cell w={W_PROM} h={H3} bL={false} bT bR={false} bB bold>PROM</Cell>
            <Cell w={W_T} h={H3} bL bT={false} bR={false} bB={false} />
            <Cell w={W_T} h={H3} bL={false} bT={false} bR={false} bB={false} />
            <Cell w={W_T} h={H3} bL={false} bT={false} bR bB={false} />
          </View>

          {/* Filas de asignatura */}
          {subjects.map((subj, idx) => {
            const isFirst = idx === 0
            const isLast  = idx === subjects.length - 1
            const b1c = gv(cal, subj.key, 'b1', 'cal')
            const b1r = gv(cal, subj.key, 'b1', 'r')
            const b2c = gv(cal, subj.key, 'b2', 'cal')
            const b2r = gv(cal, subj.key, 'b2', 'r')
            const b3c = gv(cal, subj.key, 'b3', 'cal')
            const proRaw = gpro(cal, subj.key)
            // Ocultar promedio de la materia si no llega a 6; si no, a 2 decimales
            const proShow = isFail(proRaw) ? '' : fmt2(proRaw)
            return (
              <View key={subj.key} style={{ flexDirection: 'row' }}>
                <Cell w={W_NUMSUB} h={HD} bL bT bR={false} bB={isLast} bold>
                  {String(CF_NUM[subj.key] ?? '')}
                </Cell>
                <Cell flex={1} h={HD} bL bT bR={false} bB={isLast} align="left" fontSize={6.5}>
                  {subj.label}
                </Cell>
                <Cell w={W_CAL}  h={HD} bL bT bR={false} bB={isLast} bg={isFail(b1c) ? FAIL_BG : undefined}>{b1c}</Cell>
                <Cell w={W_CAL}  h={HD} bL={false} bT bR={false} bB={isLast} bg={isFail(b1r) ? FAIL_BG : undefined}>{b1r}</Cell>
                <Cell w={W_CAL}  h={HD} bL={false} bT bR={false} bB={isLast} bg={isFail(b2c) ? FAIL_BG : undefined}>{b2c}</Cell>
                <Cell w={W_CAL}  h={HD} bL={false} bT bR={false} bB={isLast} bg={isFail(b2r) ? FAIL_BG : undefined}>{b2r}</Cell>
                <Cell w={W_CAL}  h={HD} bL={false} bT bR={false} bB={isLast} bg={isFail(b3c) ? FAIL_BG : undefined}>{b3c}</Cell>
                <Cell w={W_PROM} h={HD} bL={false} bT bR={false} bB={isLast} bold>{proShow}</Cell>
                {/* INASISTENCIAS: valores en la primera fila, celdas vacías abajo */}
                {isFirst ? (
                  <>
                    <Cell w={W_T} h={HD} bL bT bR={false} bB={false}>{ginas(cal, 'b1')}</Cell>
                    <Cell w={W_T} h={HD} bL={false} bT bR={false} bB={false}>{ginas(cal, 'b2')}</Cell>
                    <Cell w={W_T} h={HD} bL={false} bT bR bB={false}>{ginas(cal, 'b3')}</Cell>
                  </>
                ) : (
                  <>
                    <Cell w={W_T} h={HD} bL bT={false} bR={false} bB={isLast ? false : false} />
                    <Cell w={W_T} h={HD} bL={false} bT={false} bR={false} bB={false} />
                    <Cell w={W_T} h={HD} bL={false} bT={false} bR bB={false} />
                  </>
                )}
              </View>
            )
          })}

          {/* Fila PROMEDIO */}
          <View style={{ flexDirection: 'row' }}>
            <Cell w={W_NUMSUB} h={HP} bL bT bR={false} bB />
            {/* PROMEDIO label (ocupa subj + 5 cols cal) */}
            <View style={{
              flex: 1,
              height: HP,
              borderLeftWidth: 0.5, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderRightWidth: 0,
              borderColor: '#000',
              justifyContent: 'center',
              alignItems: 'flex-end',
              paddingRight: 4,
            }}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' }}>
                PROMEDIO
              </Text>
            </View>
            <View style={{
              width: W_CAL * 5,
              height: HP,
              borderTopWidth: 0.5, borderBottomWidth: 0.5, borderRightWidth: 0,
              borderLeftWidth: 0,
              borderColor: '#000',
            }} />
            <Cell w={W_PROM} h={HP} bL bT bR={false} bB bold>{fmt2(cal?.promedioGeneral)}</Cell>
            {/* INASISTENCIAS fila promedio: cierre inferior */}
            <Cell w={W_T} h={HP} bL bT={false} bR={false} bB />
            <Cell w={W_T} h={HP} bL={false} bT={false} bR={false} bB />
            <Cell w={W_T} h={HP} bL={false} bT={false} bR bB />
          </View>
        </View>

        {/* Columna NIEV */}
        <View style={s.niévOuter}>
          <Text style={s.niévLbl}>NIEV</Text>
          <Text style={s.niévVal}>{niev ? String(niev).toUpperCase() : ''}</Text>
        </View>
      </View>

      {/* ── Sección inferior: áreas + leyenda ── */}
      <View style={s.bottomBlock}>

        {/* Áreas curriculares */}
        <View>
          <View style={s.areaRow}>
            <Text style={s.areaLbl}>EDUCACIÓN SOCIOEMOCIONAL</Text>
            <View style={s.areaBox}><Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>{garea(cal, 'educacionSocioemocional', 'b1')}</Text></View>
            <View style={s.areaBox}><Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>{garea(cal, 'educacionSocioemocional', 'b2')}</Text></View>
            <View style={s.areaBox}><Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>{garea(cal, 'educacionSocioemocional', 'b3')}</Text></View>
          </View>
          <View style={s.areaRow}>
            <Text style={s.areaLbl}>INTEGRACIÓN CURRICULAR</Text>
            <View style={s.areaBox}><Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>{garea(cal, 'autonomiaVidaSaludable', 'b1')}</Text></View>
            <View style={s.areaBox}><Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>{garea(cal, 'autonomiaVidaSaludable', 'b2')}</Text></View>
            <View style={s.areaBox}><Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>{garea(cal, 'autonomiaVidaSaludable', 'b3')}</Text></View>
          </View>
        </View>

        {/* Leyenda */}
        <View style={{ flex: 1 }}>
          <Text style={s.legHdr}>IDENTIFICACIÓN CAMPOS FORMATIVOS</Text>
          <Text style={s.legItem}><Text style={s.legNum}>1 </Text>LENGUAJES</Text>
          <Text style={s.legItem}><Text style={s.legNum}>2 </Text>SABERES Y PENSAMIENTO CIENTÍFICO</Text>
          <Text style={s.legItem}><Text style={s.legNum}>3 </Text>ÉTICA, NATURALEZA Y SOCIEDADES</Text>
          <Text style={s.legItem}><Text style={s.legNum}>4 </Text>DE LO HUMANO Y LO COMUNITARIO</Text>
          <Text style={[s.legHdr, { marginTop: 2 }]}>IDENTIFICACIÓN CIENCIAS</Text>
          <View style={s.legCie}>
            <Text>1o. BIOLOGÍA</Text>
            <Text>2o. FÍSICA</Text>
            <Text>3o. QUÍMICA</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

// ─── Documento principal ──────────────────────────────────────────────────────

function BoletaGrupoPDF({ alumnos, cicloEscolar, calMap }) {
  const pages = []
  for (let i = 0; i < alumnos.length; i += 2) {
    pages.push(alumnos.slice(i, i + 2))
  }

  return (
    <Document>
      {pages.map((pair, pageIdx) => (
        <Page key={pageIdx} size="A4" style={s.page}>
          {pair.map((alumno, i) => (
            <React.Fragment key={alumno.id}>
              <BoletaHalf
                alumno={alumno}
                cal={calMap[alumno.id] ?? {}}
                cicloEscolar={cicloEscolar}
              />
              {i === 0 && pair.length === 2 && <View style={s.sep} />}
            </React.Fragment>
          ))}
        </Page>
      ))}
    </Document>
  )
}

export default BoletaGrupoPDF
