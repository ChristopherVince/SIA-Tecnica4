import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

const ROLE_PATHS = {
  'direccion': '/dashboard/direccion',
  'subdireccion': '/dashboard/subdireccion',
  'control_escolar': '/dashboard/control-escolar',
  'coordinaciones': '/dashboard/coordinaciones',
  'trabajo_social': '/dashboard/trabajo-social',
  'prefectura': '/dashboard/prefectura',
}

// ─── Íconos SVG (stroke) ─────────────────────────────────────────────────────
const ICONS = {
  users:
    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  clipboard:
    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  chart:
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  cog:
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  book:
    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  folder:
    'M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  heart:
    'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  calendar:
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
}

// ─── Configuración por rol ────────────────────────────────────────────────────
// IMPORTANTE: usa strings de clases COMPLETOS para que Tailwind los detecte.
const ROLES_CONFIG = {
  direccion: {
    label: 'Dirección',
    descripcion: 'Acceso administrativo completo al sistema',
    headerGradient: 'bg-gradient-to-r from-blue-700 to-blue-950',
    badgeClasses: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300',
    modulos: [
      { nombre: 'Padrón de Alumnos',       desc: 'Consulta los expedientes de los 1,000 alumnos', icono: 'users',     disponible: true  },
      { nombre: 'Reportes Disciplinarios', desc: 'Levanta y revisa reportes de conducta',           icono: 'clipboard', disponible: true  },
      { nombre: 'Estadísticas',            desc: 'Indicadores generales del plantel',               icono: 'chart',     disponible: false },
      { nombre: 'Gestión de Usuarios',     desc: 'Alta y baja de cuentas del sistema',              icono: 'cog',       disponible: false },
    ],
  },
  subdireccion: {
    label: 'Subdirección',
    descripcion: 'Supervisión académica y disciplinaria',
    headerGradient: 'bg-gradient-to-r from-indigo-700 to-indigo-950',
    badgeClasses: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300',
    modulos: [
      { nombre: 'Padrón de Alumnos',       desc: 'Consulta del expediente escolar',                  icono: 'users',     disponible: true  },
      { nombre: 'Reportes Disciplinarios', desc: 'Revisión y seguimiento de reportes de conducta',   icono: 'clipboard', disponible: true  },
      { nombre: 'Estadísticas',            desc: 'Indicadores académicos y disciplinarios',           icono: 'chart',     disponible: false },
    ],
  },
  control_escolar: {
    label: 'Control Escolar',
    descripcion: 'Gestión del registro académico del alumnado',
    headerGradient: 'bg-gradient-to-r from-teal-600 to-teal-900',
    badgeClasses: 'bg-teal-100 text-teal-800 ring-1 ring-teal-300',
    modulos: [
      { nombre: 'Padrón de Alumnos',   desc: 'Alta, baja y edición de expedientes escolares', icono: 'users', disponible: true  },
      { nombre: 'Historial Académico', desc: 'Registro de calificaciones por periodo',         icono: 'book',  disponible: false },
    ],
  },
  coordinaciones: {
    label: 'Coordinaciones',
    descripcion: 'Seguimiento por grupo y área académica',
    headerGradient: 'bg-gradient-to-r from-violet-700 to-violet-950',
    badgeClasses: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300',
    modulos: [
      { nombre: 'Alumnos por Grupo',       desc: 'Consulta segmentada por grado y grupo',          icono: 'users',     disponible: true  },
      { nombre: 'Reportes Disciplinarios', desc: 'Reportes vinculados a tu área académica',         icono: 'clipboard', disponible: true  },
    ],
  },
  trabajo_social: {
    label: 'Trabajo Social',
    descripcion: 'Atención y seguimiento socioeconómico del alumnado',
    headerGradient: 'bg-gradient-to-r from-emerald-600 to-emerald-900',
    badgeClasses: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    modulos: [
      { nombre: 'Padrón de Alumnos',    desc: 'Consulta de expedientes para atención social', icono: 'users',  disponible: true  },
      { nombre: 'Expedientes Sociales', desc: 'Registro de casos y visitas domiciliarias',    icono: 'folder', disponible: false },
      { nombre: 'Seguimiento',          desc: 'Historial de atención por alumno',             icono: 'heart',  disponible: false },
    ],
  },
  prefectura: {
    label: 'Prefectura',
    descripcion: 'Control disciplinario y registro de asistencia',
    headerGradient: 'bg-gradient-to-r from-orange-500 to-orange-800',
    badgeClasses: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300',
    modulos: [
      { nombre: 'Reportes Disciplinarios', desc: 'Levanta y consulta reportes de conducta',   icono: 'clipboard', disponible: true  },
      { nombre: 'Padrón de Alumnos',       desc: 'Consulta rápida de datos del alumno',       icono: 'users',     disponible: true  },
      { nombre: 'Asistencias',             desc: 'Registro diario de entradas y salidas',      icono: 'calendar',  disponible: false },
    ],
  },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// ─── Tarjeta de módulo ────────────────────────────────────────────────────────
function ModuleCard({ modulo }) {
  return (
    <div className={`bg-white rounded-xl border p-5 flex flex-col gap-3 transition ${
      modulo.disponible
        ? 'border-slate-200 shadow-sm hover:shadow-md cursor-pointer'
        : 'border-slate-100 opacity-60'
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        modulo.disponible ? 'bg-slate-100' : 'bg-slate-50'
      }`}>
        <svg
          className={`w-5 h-5 ${modulo.disponible ? 'text-slate-700' : 'text-slate-400'}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={ICONS[modulo.icono]} />
        </svg>
      </div>

      <div>
        <p className="font-semibold text-slate-800 text-sm">{modulo.nombre}</p>
        <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{modulo.desc}</p>
      </div>

      <div className="mt-auto">
        {modulo.disponible ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Disponible
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 ring-1 ring-slate-200 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
            En desarrollo
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Sin rol asignado ─────────────────────────────────────────────────────────
function SinRolAsignado({ email, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-slate-800 font-bold text-lg mb-1">Sin área asignada</h2>
        <p className="text-slate-500 text-sm mb-2">
          Tu cuenta (<span className="font-mono text-xs">{email}</span>) no tiene un área asignada en el sistema.
        </p>
        <p className="text-slate-400 text-xs mb-7">
          Contacta al administrador del sistema para que configure tu perfil en Firestore.
        </p>
        <button
          onClick={onLogout}
          className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-2 rounded-lg text-sm transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
function Dashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // Redirige automáticamente al dashboard específico del rol
  useEffect(() => {
    if (currentUser?.rol && ROLE_PATHS[currentUser.rol]) {
      navigate(ROLE_PATHS[currentUser.rol], { replace: true })
    }
  }, [currentUser, navigate])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const config = ROLES_CONFIG[currentUser?.rol]

  if (!config) {
    return <SinRolAsignado email={currentUser?.email} onLogout={handleLogout} />
  }

  const nombre = currentUser?.nombre ?? currentUser?.email

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Barra de navegación ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 text-sm hidden sm:inline">SIA Técnica 4</span>
          </div>

          {/* Usuario + logout */}
          <div className="flex items-center gap-3">
            <span className="text-slate-600 text-sm hidden sm:inline truncate max-w-36">{nombre}</span>
            <span className={`text-xs font-medium rounded-full px-3 py-1 whitespace-nowrap ${config.badgeClasses}`}>
              {config.label}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Encabezado de bienvenida ── */}
      <header className={`${config.headerGradient} text-white`}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-white/60 text-sm mb-1">{getGreeting()}</p>
          <h1 className="text-2xl font-bold mb-1">
            {nombre?.split(' ')[0] ?? 'Usuario'}
          </h1>
          <p className="text-white/70 text-sm">{config.descripcion}</p>
        </div>
      </header>

      {/* ── Módulos ── */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-5">
          <h2 className="text-slate-800 font-semibold text-base">Tus módulos</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Módulos disponibles y próximas funcionalidades para tu área.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {config.modulos.map((modulo) => (
            <ModuleCard key={modulo.nombre} modulo={modulo} />
          ))}
        </div>
      </main>

    </div>
  )
}

export default Dashboard
