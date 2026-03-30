# Documento de Tech Stack y Arquitectura - SIA Técnica 4

Este documento define el conjunto de tecnologías, librerías y patrones arquitectónicos elegidos para el desarrollo de la aplicación web educativa **SIA Técnica 4**.

---

## 1. Core Frontend (Capa de Vista)

* **Framework Principal:** [React 19](https://react.dev/)
  * Elegido por su ecosistema robusto, componentes funcionales y hooks.
  * Uso intensivo de *Context API* para el manejo de estados globales (como la sesión de usuario y roles).
* **Herramienta de Construcción (Build Tool):** [Vite 8.0.0](https://vitejs.dev/)
  * Utilizado por su extremada rapidez en desarrollo (HMR ultra rápido) y construcción optimizada.
  * Configurado con el plugin de React estándar (usando compilación veloz vía Oxc o SWC de acuerdo a la plantilla inicial).

## 2. Enrutamiento y Navegación

* **Librería de Routing:** [React Router v7.13.1](https://reactrouter.com/)
  * Gestión de rutas del lado del cliente (SPA).
  * Soporte crítico para **Rutas Protegidas (`ProtectedRoute`)**, interceptando a nivel de componente la navegación según el estado de autenticación y el *rol* (Role-Based Access Control - RBAC).

## 3. Estilos y Sistema de Diseño

* **Framework de CSS:** [Tailwind CSS v4.2.1](https://tailwindcss.com/)
  * Enfoque *Utility-first* que permite desarrollo ágil sin abandonar el archivo JSX.
  * Estructurado con un sistema de tokens de diseño semánticos (ej. colores `bg-primary`, `bg-surface-container-lowest`) alineados a las normativas de Material Design 3.
  * Soporte nativo para grid layouts complejos (como la vista de tarjetas de alumnos) y modales responsivos.

## 4. Backend as a Service (BaaS) & Datos

* **Plataforma Integral:** [Firebase 12.10.0](https://firebase.google.com/)
  * Se descarta un backend tradicional en favor de una arquitectura serverless administrada por Google.
* **Módulos Activos de Firebase:**
  * **Firebase Authentication:** Gestión de cuentas mediante Correo Institucional/Contraseña (`signInWithEmailAndPassword`) y observadores persistentes (`onAuthStateChanged`).
  * **Cloud Firestore:** Base de datos NoSQL documental. Diseñada para almacenar la vasta cantidad de información anidada (8 categorías, reportes de conducta, historial académico) en colecciones como `usuarios` e `informacion_alumnos`.
  * **Firebase Storage:** (Proyectado/Inicializado) Para gestionar documentos habilitantes de formato pesado y fotografías de alumnos.

## 5. Patrones Arquitectónicos y Mejores Prácticas

1. **Component-Driven Architecture (CDA):** 
   * Aislamiento de piezas de UI en componentes altamente reutilizables como `<DashboardHeader />`, `<StudentCard />` e `<Input />`.
2. **Control de Acceso basado en Roles (RBAC):**
   * Redirección dinámica y bloqueo total de vistas basado en un *"claim"* o campo `rol` dictado desde la colección en Firestore (`direccion`, `subdireccion`, etc.).
3. **Manejo Resiliente de Errores (Defensive UI):**
   * Estructuras de validación rigurosas en los inputs (ej. minimización de super-peticiones de login).
   * Uso sistemático de encadenamiento opcional (`student?.fia?.numero`) y bloques `try-catch` al consultar la base de datos o leer el Local/State memory, previniendo caídas totales de la UI ("White Screens of Death").

## 6. Herramientas de Calidad de Código (DevTools)

* **Code Linter:** `ESLint` configurado para atrapar errores de desarrollo y forzar formato en el JSX y los hooks.
* **Testing / Debugging Setup:** Se implementa un modelo de *"Test-Driven Debugging"* con extensos Logs contextualizados en consola con indicadores visuales (`✅`, `⚠️`, `❌`) para rastrear cruces de datos entre la sesión local y la base de datos distribuida en tiempo real de Firebase.