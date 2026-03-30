import { useNavigate } from 'react-router-dom'

function SinAcceso() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <h2 className="text-slate-800 font-bold text-lg mb-1">Acceso restringido</h2>
        <p className="text-slate-500 text-sm mb-7">
          No tienes permiso para ver esta sección. Contacta al administrador si crees que es un error.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}

export default SinAcceso
