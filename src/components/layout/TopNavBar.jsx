import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { useNavigate } from 'react-router-dom'

function LogoutModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-body">
      <div className="bg-surface-lowest rounded-xl shadow-lg max-w-sm w-full p-6">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-error">logout</span>
        </div>

        <h3 className="text-slate-900 font-headline font-bold text-lg mb-2">Cerrar sesión</h3>
        <p className="text-slate-600 text-sm mb-6">¿Estás seguro de que deseas cerrar tu sesión actual?</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-error hover:bg-red-800 text-white font-medium transition-colors shadow-sm"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  )
}

function TopNavBar({ nombreUsuario, rolLabel, rolConfig }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <>
      <nav className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-10 font-body shadow-sm">
        <div className="px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800">{nombreUsuario}</div>
              <div className="text-xs text-slate-500">{rolLabel}</div>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline font-bold">
              {nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-error text-sm font-medium transition-colors"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </nav>

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  )
}

export default TopNavBar