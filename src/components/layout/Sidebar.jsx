import { useState } from 'react'
import { SIDEBAR_MENU_CONFIG } from '../../config/sidebarMenuConfig'

function Sidebar({ role, user, onMenuItemClick }) {
  const [expandedMenus, setExpandedMenus] = useState({})

  const toggleSubmenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }))
  }

  const handleMenuItemClick = (item) => {
    if (item.action) {
      onMenuItemClick?.(item.action)
    }
  }

  const renderMenuItem = (item, depth = 0) => {
    const hasChildren = Array.isArray(item.submenu) && item.submenu.length > 0
    const isExpanded = Boolean(expandedMenus[item.id])
    const leftPadding = depth === 0 ? 'px-3' : depth === 1 ? 'px-3' : 'px-2'

    return (
      <div key={item.id} className={depth > 0 ? 'mt-1' : ''}>
        {hasChildren ? (
          <button
            onClick={() => toggleSubmenu(item.id)}
            className={`w-full flex items-center gap-3 ${leftPadding} py-2.5 rounded-lg transition-colors text-left ${
              depth === 0
                ? 'hover:bg-slate-800 hover:text-white'
                : 'hover:bg-slate-800/70 hover:text-white'
            }`}
            style={{ paddingLeft: depth === 0 ? undefined : `${12 + depth * 12}px` }}
          >
            <span className={`material-symbols-outlined ${depth === 0 ? 'text-[20px]' : 'text-[18px]'}`}>{item.icon}</span>
            <span className={`text-sm flex-1 ${depth > 0 ? 'text-slate-300' : ''}`}>{item.name}</span>
            <span className={`material-symbols-outlined text-[18px] transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}>
              expand_more
            </span>
          </button>
        ) : (
          <button
            onClick={() => handleMenuItemClick(item)}
            className={`w-full flex items-center gap-3 ${leftPadding} py-2.5 rounded-lg transition-colors text-left ${
              item.action
                ? 'hover:bg-slate-800 hover:text-white'
                : 'hover:bg-slate-800/60 hover:text-white'
            }`}
            style={{ paddingLeft: depth === 0 ? undefined : `${12 + depth * 14}px` }}
          >
            <span className={`material-symbols-outlined ${depth === 0 ? 'text-[20px]' : 'text-[18px]'}`}>{item.icon}</span>
            <span className={`text-sm ${depth > 0 ? 'text-slate-300 text-xs' : ''}`}>{item.name}</span>
          </button>
        )}

        {hasChildren && isExpanded && (
          <div className="mt-1 ml-2 space-y-1 border-l border-slate-700/80 pl-2">
            {item.submenu.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // Obtener configuración de menú según el rol
  const formattedRole = role?.replace(/\//g, '_').split('/').pop() || 'direccion'
  const menuItems = SIDEBAR_MENU_CONFIG[formattedRole] || SIDEBAR_MENU_CONFIG.direccion

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-20 overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white text-lg">school</span>
          </div>
          <span className="font-headline font-bold text-white tracking-wide text-sm">SIA Técnica 4</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-6 px-4 pr-2 space-y-1 font-body overflow-y-auto sidebar-scroll">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
          Rol Actual
        </div>
        <div className="text-sm text-slate-300 capitalize flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {role?.replace('-', ' ') || 'Cargando...'}
        </div>
        {/* Mostrar turno si aplica */}
        {user?.turno && (
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Turno: {user.turno === 'matutino' ? 'Matutino' : 'Vespertino'}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar