// Configuración de menús dinámicos por rol
// Cada rol tiene sus propias funcionalidades que aparecen en la sidebar

export const SIDEBAR_MENU_CONFIG = {
  direccion: [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', path: '/dashboard/direccion' },
    { id: 'estudiantes', name: 'Padrón de Alumnos', icon: 'groups', path: '#' },
    { id: 'reportes', name: 'Reportes Disciplinarios', icon: 'assignment', path: '#' },
    { id: 'estadisticas', name: 'Estadísticas', icon: 'analytics', path: '#' },
    { id: 'usuarios', name: 'Gestión de Usuarios', icon: 'admin_panel_settings', path: '#' },
  ],
  
  subdireccion: [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', path: '/dashboard/subdireccion' },
    { id: 'estudiantes', name: 'Padrón de Alumnos', icon: 'groups', path: '#' },
    { id: 'reportes', name: 'Reportes Disciplinarios', icon: 'assignment', path: '#' },
    { id: 'estadisticas', name: 'Estadísticas', icon: 'analytics', path: '#' },
  ],
  
  control_escolar: [
    { id: 'inicio', name: 'Inicio', icon: 'home', action: 'inicio' },
    {
      id: 'inicio_ciclo',
      name: 'Inicio de Ciclo',
      icon: 'school',
      submenu: [
        { id: 'inscripciones', name: 'Inscripciones', icon: 'person_add', action: 'inscripciones' },
        { id: 'asignacion_taller', name: 'Asignación de Taller', icon: 'build', action: 'asignacion_taller' },
      ],
    },
    {
      id: 'calificaciones',
      name: 'Calificaciones',
      icon: 'grade',
      submenu: [
        { id: 'evaluacion_bloque', name: 'Evaluación de Bloque', icon: 'assignment_turned_in', action: 'evaluacion_bloque' },
        { id: 'inasistencias', name: 'Inasistencias', icon: 'event_busy', action: 'inasistencias' },
        { id: 'evaluaciones_recuperacion', name: 'Evaluaciones de Recuperación', icon: 'healing', action: 'evaluaciones_recuperacion' },
        { id: 'boletas', name: 'Boletas', icon: 'description', action: 'boletas' },
      ],
    },
    {
      id: 'fin_ciclo',
      name: 'Fin de Ciclo',
      icon: 'event_busy',
      submenu: [
        { id: 'extraordinarios', name: 'Extraordinarios', icon: 'quiz' },
      ],
    },
    {
      id: 'general',
      name: 'General',
      icon: 'tune',
      submenu: [
        { id: 'reportes', name: 'Reportes', icon: 'assignment', action: 'reportes' },
        { id: 'procesos_varios', name: 'Procesos Varios', icon: 'category', action: 'procesos_varios' },
      ],
    },
  ],
  
  coordinaciones: [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', path: '/dashboard/coordinaciones' },
    { id: 'alumnos_grupo', name: 'Alumnos por Grupo', icon: 'groups', path: '#' },
    { id: 'reportes', name: 'Reportes Disciplinarios', icon: 'assignment', path: '#' },
  ],
  
  trabajo_social: [
    { id: 'inicio', name: 'Inicio', icon: 'home', action: 'inicio' },
    {
      id: 'expedientes',
      name: 'Expedientes',
      icon: 'folder_shared',
      submenu: [
        { id: 'busqueda_alumnos', name: 'Búsqueda de Alumnos', icon: 'person_search', action: 'expedientes' },
        { id: 'fichas_medicas', name: 'Fichas Médicas', icon: 'medical_information', action: 'fichas_medicas' },
      ],
    },
    { id: 'control_docs', name: 'Control de Documentos', icon: 'checklist', action: 'control_documentos' },
    {
      id: 'seguimiento',
      name: 'Seguimiento',
      icon: 'policy',
      submenu: [
        { id: 'citatorios', name: 'Citatorios y Reportes', icon: 'notification_important', action: 'citatorios' },
      ],
    },
  ],
  
  prefectura: [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', path: '/dashboard/prefectura' },
    { id: 'reportes', name: 'Reportes Disciplinarios', icon: 'assignment', path: '#' },
    { id: 'estudiantes', name: 'Padrón de Alumnos', icon: 'groups', path: '#' },
    { id: 'asistencias', name: 'Asistencias', icon: 'event_note', path: '#' },
  ],
}
