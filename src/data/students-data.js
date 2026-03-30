// Datos hardcodeados de alumnos para la demo de Dirección

export const GRADOS = [
  { id: 1, label: '1er Año' },
  { id: 2, label: '2do Año' },
  { id: 3, label: '3er Año' },
]

export const GRUPOS_MANANA = ['A', 'B', 'C', 'D', 'F']
export const GRUPOS_TARDE = ['G', 'H', 'I', 'J', 'K', 'L']

// Datos completos de un alumno
export const generateStudents = (grado, grupo) => {
  const students = []
  const studentCount = 30 // 30 alumnos por grupo

  for (let i = 1; i <= studentCount; i++) {
    const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Hernández', 'Jiménez', 'Morales']
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Rosa', 'Miguel', 'Isabel', 'Jorge', 'Carmen']
    
    const apellidoRandom = apellidos[Math.floor(Math.random() * apellidos.length)]
    const nombreRandom = nombres[Math.floor(Math.random() * nombres.length)]
    const id = `${grado}-${grupo}-${String(i).padStart(3, '0')}`
    const fia = `FIA-${grado}${grupo}${String(i).padStart(4, '0')}`

    students.push({
      id,
      fia,
      nombre: `${nombreRandom} ${apellidoRandom}`,
      apellido: apellidoRandom,
      nombreCompleto: `${nombreRandom} ${apellidoRandom}`,
      grado,
      grupo,
      matricula: `EST${grado}${grupo}${String(i).padStart(5, '0')}`,
      status: Math.random() > 0.1 ? 'activo' : 'inactivo',
      
      // ============ DATOS GENERALES ============
      datosGenerales: {
        nombre: `${nombreRandom} ${apellidoRandom}`,
        fia,
        matricula: `EST${grado}${grupo}${String(i).padStart(5, '0')}`,
        fechaNacimiento: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${2006 + grado}`,
        curp: `GARC${String(i).padStart(6, '0')}HDFRNN09`,
        sexo: Math.random() > 0.5 ? 'Masculino' : 'Femenino',
        estadoCivil: 'Soltero/a',
        nacionalidad: 'Mexicana',
        grado,
        grupo,
        turno: ['A', 'B', 'C', 'D', 'F'].includes(grupo) ? 'Matutino' : 'Vespertino',
      },

      // ============ INFORMACIÓN FAMILIAR ============
      informacionFamiliar: {
        tutor: {
          nombre: `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidoRandom}`,
          parentesco: 'Padre',
          telefono: `55${String(Math.floor(Math.random() * 90000000) + 10000000).padStart(8, '0')}`,
          email: `tutor${i}@email.com`,
          ocupacion: 'Empleado/a',
          relacionEconomica: 'Responsable financiero',
        },
        tutor2: {
          nombre: `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidoRandom}`,
          parentesco: 'Madre',
          telefono: `55${String(Math.floor(Math.random() * 90000000) + 10000000).padStart(8, '0')}`,
          email: `tutor2${i}@email.com`,
          ocupacion: 'Empleada doméstica',
          relacionEconomica: 'Apoyo emocional',
        },
        domicilio: {
          calle: `Calle ${String(i)} de la Paz`,
          numero: String(Math.floor(Math.random() * 500) + 1),
          colonia: 'Centro',
          delegacion: 'Cuauhtémoc',
          estado: 'CDMX',
          codigoPostal: '06500',
        },
      },

      // ============ FICHAS DE INSCRIPCIÓN ============
      fichasInscripcion: [
        {
          id: `FICH-${i}-1`,
          ciclo: '2024-2025',
          fechaInscripcion: `15/08/2024`,
          estatus: 'Completada',
          documentosAdjuntos: ['Acta de nacimiento', 'CURP', 'Comprobante de domicilio'],
        },
      ],

      // ============ DOCUMENTOS PROBATORIOS ============
      documentosHabilitantes: [
        { nombre: 'Acta de Nacimiento', fecha: '15/08/2023', estado: 'Validado' },
        { nombre: 'CURP', fecha: '15/08/2023', estado: 'Validado' },
        { nombre: 'Comprobante de Domicilio', fecha: '15/08/2023', estado: 'Validado' },
        { nombre: 'Certificado de Primaria', fecha: '20/07/2023', estado: 'Validado' },
        { nombre: 'Foto 4x4', fecha: '15/08/2023', estado: 'Validado' },
      ],

      // ============ FIA (Número de Control) ============
      fia: {
        numero: fia,
        fechaAsignacion: '15/08/2024',
        estado: 'Activo',
        enlaceSEP: `https://sep.gob.mx/estudiante/${fia}`,
      },

      // ============ ACUERDOS DE CONVIVENCIA ============
      acuerdosConvivencia: [
        {
          id: `ACUERDO-${i}-1`,
          fechaFirma: '15/08/2024',
          tipo: 'Compromiso de convivencia escolar',
          estado: 'Firmado',
          notas: 'Alumno/a y tutores han aceptado las normas de conducta',
        },
        {
          id: `ACUERDO-${i}-2`,
          fechaFirma: '15/08/2024',
          tipo: 'Seguimiento académico',
          estado: 'Firmado',
          notas: 'Compromiso de asistencia regular',
        },
      ],

      // ============ CALIFICACIONES ============
      calificaciones: {
        periodo1: {
          nombre: 'Período 1 (Agosto-Octubre)',
          calificacionPromedio: Math.floor(Math.random() * 4) + 7, // 7-10
          materias: [
            { nombre: 'Matemáticas', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Español', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Inglés', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Ciencias', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Historia', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Educación Física', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
          ],
        },
        periodo2: {
          nombre: 'Período 2 (Noviembre-Enero)',
          calificacionPromedio: Math.floor(Math.random() * 4) + 7,
          materias: [
            { nombre: 'Matemáticas', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Español', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Inglés', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Ciencias', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Historia', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Educación Física', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
          ],
        },
        periodo3: {
          nombre: 'Período 3 (Febrero-Abril)',
          calificacionPromedio: Math.floor(Math.random() * 4) + 7,
          materias: [
            { nombre: 'Matemáticas', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Español', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Inglés', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Ciencias', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Historia', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
            { nombre: 'Educación Física', calificacion: Math.floor(Math.random() * 4) + 7, asistencia: `${Math.floor(Math.random() * 5) + 35}/40` },
          ],
        },
      },

      // ============ ASPECTO CONDUCTUAL ============
      conductual: {
        comportamientoGeneral: Math.random() > 0.3 ? 'Excelente' : 'Bueno',
        reportesDisciplinarios: Math.random() > 0.7 ? 1 : 0,
        amonestaciones: Math.random() > 0.8 ? 1 : 0,
        suspensiones: 0,
        historialConductual: [
          {
            fecha: '20/09/2024',
            tipo: 'Reporte disciplinario',
            motivo: 'Usar celular en clase',
            accion: 'Amonestación verbal',
            responsable: 'Prefectura',
          },
          {
            fecha: '15/10/2024',
            tipo: 'Reporte disciplinario',
            motivo: 'Llegar tarde a clase',
            accion: 'Amonestación escrita',
            responsable: 'Coordinación',
          },
        ],
        observaciones: 'Alumno/a con buen desempeño académico y comportamiento general adecuado.',
      },
    })
  }

  return students
}

// Función para obtener todos los estudiantes de un grado y grupo
export const getStudentsByGradoAndGrupo = (grado, grupo) => {
  return generateStudents(grado, grupo)
}

// Función para obtener un estudiante específico
export const getStudentById = (id) => {
  const [grado, grupo] = id.split('-').slice(0, 2)
  const students = generateStudents(parseInt(grado), grupo)
  return students.find(s => s.id === id)
}
