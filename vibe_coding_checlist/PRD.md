# Documento de Requisitos de Producto (PRD) - SIA Técnica 4

## 1. Visión General del Producto
**SIA Técnica 4** (Sistema de Información Administrativa) es una aplicación web de gestión escolar diseñada específicamente para la administración interna de la Escuela Secundaria Técnica 4. Su propósito principal es digitalizar, centralizar y facilitar el acceso rápido a los expedientes de los alumnos para el personal administrativo y directivo, mejorando la toma de decisiones y el seguimiento del alumnado.

## 2. Objetivos del Producto
- **Centralización:** Unificar la información de los estudiantes (calificaciones, conducta, documentación, datos familiares) en una plataforma digital.
- **Acceso Rápido:** Permitir la búsqueda y filtrado ágil de estudiantes por grado, grupo y turno.
- **Seguridad y Privacidad:** Garantizar que cada miembro del personal solo vea la información correspondiente a su rol mediante un sistema de control de acceso basado en roles (RBAC).

## 3. Usuarios Objetivo y Roles
El sistema está diseñado para el personal de la institución educativa, segmentado en los siguientes roles:
1. **Dirección:** Acceso total y vista panorámica de la institución, expedientes completos de alumnos y estadísticas.
2. **Subdirección:** Acceso a la gestión académica y operativa, reportes de asistencia y disciplina.
3. **Control Escolar:** Gestión de inscripciones, documentación de alumnos, historial académico y altas/bajas.
4. **Coordinaciones:** Seguimiento del desempeño académico de grupos específicos o áreas.
5. **Trabajo Social:** Acceso a datos familiares, socioeconómicos, estudios de casos y seguimiento de incidencias.
6. **Prefectura:** Control de asistencia diaria, reportes de disciplina (reportes conductuales) y movilidad en el plantel.

## 4. Características y Funcionalidades Principales

### 4.1. Autenticación y Autorización
- **Inicio de sesión seguro:** Mediante correo institucional y contraseña.
- **Redirección inteligente:** El sistema detecta automáticamente el rol del usuario autenticado y lo redirige a su panel (Dashboard) correspondiente.
- **Cierre de sesión dinámico:** Modal de confirmación para cerrar sesión de forma segura.

### 4.2. Panel de Dirección (Dashboard Principal)
- **Filtros de Búsqueda:** Filtros interactivos por "Grado" (1º, 2º, 3º) y "Grupo" (Matutino: A-F, Vespertino: G-L).
- **Búsqueda en Tiempo Real:** Barra de búsqueda por nombre o matrícula del alumno.
- **Tarjetas de Alumnos:** Vista de cuadrícula (Grid) que muestra la información resumida de cada alumno (Foto, Nombre, Matrícula, Grado, Grupo).
- **Expediente Digital Multisección (Modal):** Al hacer clic en un alumno, se despliega un modal con 8 pestañas detalladas:
  1. *Datos Generales*
  2. *Información Familiar* (Tutores, contacto)
  3. *Datos de Inscripción*
  4. *Documentación* (Acta, CURP, etc.)
  5. *Ficha de Identificación del Alumno (FIA)*
  6. *Acuerdos* (Compromisos firmados)
  7. *Calificaciones* (Rendimiento por materia)
  8. *Conducta* (Historial de reportes y citatorios)

### 4.3. Paneles de Roles Específicos (En desarrollo para Fase 2)
- Dashboards independientes y limitados según las necesidades operativas de Subdirección, Control Escolar, Coordinaciones, Trabajo Social y Prefectura.

### 4.4. Gestión Documental y Reportes (Planificado para Fases Posteriores)

Almacenamiento de Archivos: Capacidad para subir y visualizar documentos probatorios (PDF, imágenes) vinculados al expediente del alumno mediante Firebase Storage.

Generación de Archivos: Exportación de reportes, fichas de inscripción y listas de alumnos en formatos descargables (PDF/Excel) procesados desde el lado del cliente (Frontend).

## 5. Requisitos No Funcionales (Técnicos)
- **Frontend:** React 19, Vite, Tailwind CSS v4. Arquitectura basada en componentes funcionales.
- **Backend/Base de Datos:** Firebase Authentication y Cloud Firestore.
- **Rendimiento:** Carga optimizada mediante Vite y estado local en React.
- **Diseño Responsivo:** Interfaz adaptable a pantallas de escritorio y tablets.
- **Manejo de Errores:** Renderizado defensivo y validaciones de formularios antes de peticiones al servidor.

## 6. Historias de Usuario Principales (MVP)
- *Como Director, quiero poder filtrar a los alumnos por grado y grupo de la mañana para revisar rápidamente una incidencia.*
- *Como Usuario, quiero que el sistema valide mis credenciales y me lleve a mi área de trabajo sin tener que navegar menús manuales.*
- *Como Prefecto, quiero ver únicamente la lista de alumnos para registrar reportes de conducta sin alterar calificaciones.*

## 7. Fases de Desarrollo
- **Fase 1 (Completada):** Prototipo funcional (Demo) con datos de prueba estructurados en formato Mock, enrutamiento basado en roles, y UI responsiva para la Dirección.
- **Fase 2 (Próxima):** Sustitución de datos Mock por consultas en tiempo real a Firebase Firestore. Creación y estructuración de colecciones en la base de datos.
- **Fase 3:** Desarrollo e implementación de la lógica y la UI de los 5 dashboards restantes con permisos granulares en Firestore.
- **Fase 4:**Implementación de Firebase Storage para documentos y librerías de generación de archivos (PDF/Excel).