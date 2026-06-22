export const GRUPOS_POR_TURNO = {
  matutino: ['A', 'B', 'C', 'D', 'E', 'F'],
  vespertino: ['G', 'H', 'I', 'J', 'K', 'L'],
}

export const GRADOS_VALIDOS = ['1', '2', '3']

export const BLOQUES = [
  { id: 'b1', label: 'Bloque 1', shortLabel: 'B1' },
  { id: 'b2', label: 'Bloque 2', shortLabel: 'B2' },
  { id: 'b3', label: 'Bloque 3', shortLabel: 'B3' },
]

/**
 * Asignaturas regulares POR GRADO.
 *
 * Notas de modelo de datos (importante):
 * - El "slot" de Ciencias se almacena SIEMPRE bajo la key `ciencias` en
 *   Firestore, pero su nombre cambia por grado: Biología (1°), Física (2°),
 *   Química (3°). Así no se requiere migrar datos existentes y un alumno solo
 *   tiene una ciencia por grado.
 * - Geografía solo se cursa en 1°.
 * - Historia y el resto se cursan en los 3 grados.
 */
export const ASIGNATURAS_POR_GRADO = {
  '1': [
    { key: 'espanol', label: 'Español', short: 'Esp.' },
    { key: 'lenguaExtranjera', label: 'Inglés', short: 'Ing.' },
    { key: 'artes', label: 'Artes', short: 'Art.' },
    { key: 'matematicas', label: 'Matemáticas', short: 'Mat.' },
    { key: 'ciencias', label: 'Biología', short: 'Bio.' },
    { key: 'geografia', label: 'Geografía', short: 'Geo.' },
    { key: 'historia', label: 'Historia', short: 'His.' },
    { key: 'formacionCivica', label: 'Formación Cívica y Ética', short: 'F.C.E.' },
    { key: 'tecnologia', label: 'Tecnología', short: 'Tec.' },
    { key: 'educacionFisica', label: 'Educación Física', short: 'E.F.' },
  ],
  '2': [
    { key: 'espanol', label: 'Español', short: 'Esp.' },
    { key: 'lenguaExtranjera', label: 'Inglés', short: 'Ing.' },
    { key: 'artes', label: 'Artes', short: 'Art.' },
    { key: 'matematicas', label: 'Matemáticas', short: 'Mat.' },
    { key: 'ciencias', label: 'Física', short: 'Fís.' },
    { key: 'historia', label: 'Historia', short: 'His.' },
    { key: 'formacionCivica', label: 'Formación Cívica y Ética', short: 'F.C.E.' },
    { key: 'tecnologia', label: 'Tecnología', short: 'Tec.' },
    { key: 'educacionFisica', label: 'Educación Física', short: 'E.F.' },
  ],
  '3': [
    { key: 'espanol', label: 'Español', short: 'Esp.' },
    { key: 'lenguaExtranjera', label: 'Inglés', short: 'Ing.' },
    { key: 'artes', label: 'Artes', short: 'Art.' },
    { key: 'matematicas', label: 'Matemáticas', short: 'Mat.' },
    { key: 'ciencias', label: 'Química', short: 'Quí.' },
    { key: 'historia', label: 'Historia', short: 'His.' },
    { key: 'formacionCivica', label: 'Formación Cívica y Ética', short: 'F.C.E.' },
    { key: 'tecnologia', label: 'Tecnología', short: 'Tec.' },
    { key: 'educacionFisica', label: 'Educación Física', short: 'E.F.' },
  ],
}

/**
 * Unión de todas las asignaturas posibles. Sirve para:
 * - lookups globales de etiquetas (p.ej. selects de reportes sin grado fijado),
 * - mantener la forma del documento backward-compatible cuando no se conoce el grado.
 */
export const ASIGNATURAS_UNION = [
  { key: 'espanol', label: 'Español', short: 'Esp.' },
  { key: 'lenguaExtranjera', label: 'Inglés', short: 'Ing.' },
  { key: 'artes', label: 'Artes', short: 'Art.' },
  { key: 'matematicas', label: 'Matemáticas', short: 'Mat.' },
  { key: 'ciencias', label: 'Ciencias (Biología / Física / Química)', short: 'Cie.' },
  { key: 'geografia', label: 'Geografía', short: 'Geo.' },
  { key: 'historia', label: 'Historia', short: 'His.' },
  { key: 'formacionCivica', label: 'Formación Cívica y Ética', short: 'F.C.E.' },
  { key: 'tecnologia', label: 'Tecnología', short: 'Tec.' },
  { key: 'educacionFisica', label: 'Educación Física', short: 'E.F.' },
]

/**
 * Devuelve las asignaturas regulares correspondientes a un grado.
 * Si el grado no es válido / no se proporciona, regresa la unión completa
 * (comportamiento seguro: no se pierde ningún campo del documento).
 */
export const getAsignaturasRegulares = (grado) =>
  ASIGNATURAS_POR_GRADO[String(grado ?? '').trim()] ?? ASIGNATURAS_UNION

/** Alias backward-compat: módulos antiguos importan ASIGNATURAS_REGULARES como lista global. */
export const ASIGNATURAS_REGULARES = ASIGNATURAS_UNION

/** Áreas curriculares (se cursan en los 3 grados). */
export const AREAS_CURRICULARES = [
  { key: 'educacionSocioemocional', label: 'Educación Socioemocional', short: 'E.Soc.' },
  { key: 'autonomiaVidaSaludable', label: 'Integración Curricular', short: 'Int.C.' },
]

/** Todas las materias con inasistencias (regulares + áreas curriculares). */
export const getAllMaterias = (grado) => [
  ...getAsignaturasRegulares(grado),
  ...AREAS_CURRICULARES,
]

const createRegularSubjectTemplate = () => ({
  b1_cal: '',
  b1_r: '',
  b2_cal: '',
  b2_r: '',
  b3_cal: '',
  b3_r: '',
  promedio: '',
})

const createAreaCurricularTemplate = () => ({
  b1_cal: '',
  b2_cal: '',
  b3_cal: '',
  promedio: '',
})

// Crea un objeto de inasistencias vacío (por materia) para un bloque
const createEmptyInasistenciasBloque = (grado) =>
  Object.fromEntries(getAllMaterias(grado).map(({ key }) => [key, '']))

export const createEmptyCalificacionesDoc = (grado) => ({
  updatedAt: null,
  periodoActual: 'B1',
  promedioGeneral: '',
  observaciones: {
    b1: '',
    b2: '',
    b3: '',
  },
  inasistencias: {
    b1: createEmptyInasistenciasBloque(grado),
    b2: createEmptyInasistenciasBloque(grado),
    b3: createEmptyInasistenciasBloque(grado),
  },
  asignaturasRegulares: Object.fromEntries(
    getAsignaturasRegulares(grado).map(({ key }) => [key, createRegularSubjectTemplate()]),
  ),
  areasCurriculares: Object.fromEntries(
    AREAS_CURRICULARES.map(({ key }) => [key, createAreaCurricularTemplate()]),
  ),
})

export const normalizeInputValue = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
}

export const parseNumberOrNull = (value) => {
  const text = String(value ?? '').trim()
  if (text === '') return null

  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return null

  return parsed
}

export const updateNestedValue = (state, path, value) => {
  const keys = String(path).split('.')
  const nextState = { ...state }
  let cursor = nextState

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value
      return
    }

    const currentValue = cursor[key]
    cursor[key] = Array.isArray(currentValue)
      ? [...currentValue]
      : { ...(currentValue ?? {}) }
    cursor = cursor[key]
  })

  return nextState
}

// Normaliza un bloque de inasistencias; el formato antiguo (número general) se descarta
const normalizeInasistenciasBloque = (bloqueData, grado) => {
  const empty = createEmptyInasistenciasBloque(grado)
  if (!bloqueData || typeof bloqueData !== 'object' || Array.isArray(bloqueData)) return empty
  return { ...empty, ...bloqueData }
}

export const normalizeLoadedCalificaciones = (data = {}, grado) => {
  const base = createEmptyCalificacionesDoc(grado)

  return {
    ...base,
    ...data,
    observaciones: {
      ...base.observaciones,
      ...(data.observaciones ?? {}),
    },
    inasistencias: {
      b1: normalizeInasistenciasBloque(data.inasistencias?.b1, grado),
      b2: normalizeInasistenciasBloque(data.inasistencias?.b2, grado),
      b3: normalizeInasistenciasBloque(data.inasistencias?.b3, grado),
    },
    asignaturasRegulares: Object.fromEntries(
      getAsignaturasRegulares(grado).map(({ key }) => [
        key,
        {
          ...base.asignaturasRegulares[key],
          ...(data.asignaturasRegulares?.[key] ?? {}),
        },
      ]),
    ),
    areasCurriculares: Object.fromEntries(
      AREAS_CURRICULARES.map(({ key }) => [
        key,
        {
          ...base.areasCurriculares[key],
          ...(data.areasCurriculares?.[key] ?? {}),
        },
      ]),
    ),
  }
}

export const calculateAverage = (values) => {
  const numbers = values
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  if (numbers.length === 0) return ''

  const sum = numbers.reduce((accumulator, value) => accumulator + value, 0)
  return Number((sum / numbers.length).toFixed(1))
}

export const calculateBlockAverage = (data, blockId, grado) => {
  const normalized = normalizeLoadedCalificaciones(data, grado)
  const blockPrefix = `${blockId}_`
  const values = []

  getAsignaturasRegulares(grado).forEach(({ key }) => {
    const subject = normalized.asignaturasRegulares[key] ?? {}
    const cal = subject[`${blockPrefix}cal`]
    const rec = subject[`${blockPrefix}r`]
    // CR sustituye a C cuando existe; de lo contrario se usa C
    const efectiva = (rec !== null && rec !== undefined && rec !== '') ? rec : cal
    values.push(efectiva)
  })

  // Áreas curriculares se excluyen del promedio (no cuentan para la calificación oficial)
  return calculateAverage(values)
}

export const buildPersistedCalificaciones = (data, periodoActual, grado) => {
  const normalized = normalizeLoadedCalificaciones(data, grado)
  const asignaturasRegulares = {}
  const areasCurriculares = {}

  getAsignaturasRegulares(grado).forEach(({ key }) => {
    const subject = normalized.asignaturasRegulares[key] ?? {}
    const nextSubject = {
      ...subject,
      b1_cal: parseNumberOrNull(subject.b1_cal),
      b1_r: parseNumberOrNull(subject.b1_r),
      b2_cal: parseNumberOrNull(subject.b2_cal),
      b2_r: parseNumberOrNull(subject.b2_r),
      b3_cal: parseNumberOrNull(subject.b3_cal),
      b3_r: parseNumberOrNull(subject.b3_r),
    }

    // CR sustituye a C para B1 y B2; B3 no tiene recuperación
    const ef1 = nextSubject.b1_r !== null ? nextSubject.b1_r : nextSubject.b1_cal
    const ef2 = nextSubject.b2_r !== null ? nextSubject.b2_r : nextSubject.b2_cal
    const ef3 = nextSubject.b3_cal
    nextSubject.promedio = calculateAverage([ef1, ef2, ef3])

    asignaturasRegulares[key] = nextSubject
  })

  AREAS_CURRICULARES.forEach(({ key }) => {
    const area = normalized.areasCurriculares[key] ?? {}
    const nextArea = {
      ...area,
      b1_cal: parseNumberOrNull(area.b1_cal),
      b2_cal: parseNumberOrNull(area.b2_cal),
      b3_cal: parseNumberOrNull(area.b3_cal),
    }

    nextArea.promedio = calculateAverage([nextArea.b1_cal, nextArea.b2_cal, nextArea.b3_cal])

    areasCurriculares[key] = nextArea
  })

  // Solo asignaturas regulares (10 en 1°, 9 en 2° y 3°); áreas curriculares no cuentan
  const promedioGeneral = calculateAverage(
    Object.values(asignaturasRegulares).map((subject) => subject.promedio),
  )

  // Limpia valores de inasistencias a número o null
  const inasistencias = {}
  BLOQUES.forEach(({ id }) => {
    inasistencias[id] = Object.fromEntries(
      getAllMaterias(grado).map(({ key }) => [
        key,
        parseNumberOrNull(normalized.inasistencias?.[id]?.[key]),
      ])
    )
  })

  return {
    ...normalized,
    periodoActual,
    promedioGeneral,
    asignaturasRegulares,
    areasCurriculares,
    inasistencias,
  }
}

export const formatTimestamp = (value) => {
  if (!value) return 'Sin registrar'
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString('es-MX')
  }
  return String(value)
}
