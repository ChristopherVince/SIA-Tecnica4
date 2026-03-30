# Documento de Diseño UI/UX y Arquitectura Frontend - SIA Técnica 4

## 1. Filosofía Visual
El Sistema de Información Administrativa (SIA) Técnica 4 utiliza un diseño **"Limpio e Institucional"** inspirado en las guías de *Material Design 3*. 
Prioriza la legibilidad, la jerarquía visual de los datos del alumno y la rapidez de acceso mediante modales superpuestos, evitando recargas de página innecesarias.

## 2. Sistema Tipográfico
El proyecto utiliza dos familias tipográficas de Google Fonts para crear contraste y jerarquía:

* **Encabezados (`font-headline`)**: **Manrope** (Pesos: 700, 800).
  * *Uso:* Títulos principales, nombres de alumnos y números destacados. Transmite modernidad y solidez.
* **Cuerpo y Etiquetas (`font-body`)**: **Inter** (Pesos: 400, 500, 600).
  * *Uso:* Textos largos, datos tabulares y etiquetas pequeñas. Es la fuente más legible para interfaces densas en datos.

## 3. Paleta de Colores (Tailwind Tokens)
El sistema abandona los colores planos básicos por una paleta semántica avanzada:

| Categoría | Tailwind Class | Código Hex | Uso Principal |
| :--- | :--- | :--- | :--- |
| **Primario (Institucional)** | `bg-primary` | `#004ac6` | Botones principales, acentos de estado activo, iconos clave. |
| **Superficies (Fondos)** | `bg-surface` / `bg-slate-800` | Variado | Fondo general de la app (gris muy claro) y Sidebar oscuro (slate). |
| **Tarjetas (Cards)** | `bg-surface-container-lowest` | `#ffffff` | Fondo blanco puro para las tarjetas de alumnos y modales. |
| **Éxito (Regular)** | `bg-emerald-500` | Variado | Indicador de alumno regular o acción completada. |
| **Precaución (Tránsito)**| `bg-amber-500` | Variado | Alumnos en proceso de cambio o advertencias medias. |
| **Peligro / Error** | `bg-error` | `#ba1a1a` | Adeudos, reportes graves, botón de cerrar sesión o eliminar. |

## 4. Iconografía
* **Librería:** Google Material Symbols Outlined.
* **Configuración:** `FILL 0` (Contornos limpios), `wght 400` (Grosor estándar).

## 5. Arquitectura de Componentes (React Tree)
Para llevar este diseño HTML a React, dividiremos el código en los siguientes componentes reutilizables:

### Nivel 1: Layout Global (Plantilla)
* `<Layout />`: Contenedor principal.
* `<Sidebar />`: Menú lateral izquierdo (Oscuro, fijo).
* `<TopNavBar />`: Cabecera superior (Sticky, buscador, perfil).

### Nivel 2: Dashboard de Dirección (Vistas)
* `<DireccionDashboard />`: El contenedor principal de la vista.
* `<FilterBar />`: Barra de selects (Grado, Grupo) y botón "Inscribir".
* `<StudentGrid />`: Cuadrícula responsiva (`grid-cols-1 md:grid-cols-4`).
* `<StudentCard />`: Componente reutilizable para cada alumno (Foto, nombre, insignias, estado).

### Nivel 3: Expediente del Alumno (Modal)
* `<StudentModal />`: Modal superpuesto con fondo borroso (`backdrop-blur-sm`).
* `<ModalHeader />`: Foto grande, Matrícula, Grado y botones de impresión/cierre.
* `<TabNavigation />`: Las 8 pestañas horizontales.
* `<TabContent />`: Contenedor dinámico que renderiza la información dependiendo de la pestaña activa (Ej. `<DatosGenerales />`, `<Conducta />`).

## 6. Patrones CSS Clave (Estándares del Proyecto)
Para mantener la consistencia al agregar nuevas pantallas, se deben respetar estas reglas de Tailwind:

* **Bordes redondeados:** Usar `rounded-xl` para contenedores principales (tarjetas, modales) y `rounded-lg` para botones y selects.
* **Sombras:** Usar `shadow-sm` para tarjetas en reposo y `hover:shadow-md` con `transition-shadow` para interacción.
* **Píldoras (Badges):** Las etiquetas de grado/grupo deben usar texto ultra pequeño y mayúsculas (`text-[10px] uppercase tracking-wider rounded-full`).