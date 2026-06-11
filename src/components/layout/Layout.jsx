import { useState, Children, cloneElement } from 'react'
import Sidebar from './Sidebar'
import TopNavBar from './TopNavBar'
import ControlEscolarMenu from '../control-escolar/ControlEscolarMenu'

function Layout({ children, user, roleConfig, roleId }) {
  const [activeFunction, setActiveFunction] = useState(null)

  const handleMenuItemClick = (action) => {
    setActiveFunction(action)
  }

  // Pasar activeFunction a los children que lo necesiten
  const childrenWithActiveFunction = Children.map(children, (child) => {
    if (child && typeof child === 'object' && child.type === ControlEscolarMenu) {
      return cloneElement(child, { activeFunction })
    }
    return child
  })

  return (
    <div className="flex min-h-screen bg-surface font-body">
      <Sidebar role={roleId} user={user} onMenuItemClick={handleMenuItemClick} />
      <div className="ml-64 flex-1 flex flex-col min-w-0">
        <TopNavBar
            nombreUsuario={user?.nombre || 'Usuario'}
            rolLabel={roleConfig?.label || 'Rol'}
            rolConfig={roleConfig}
        />
        <main className="flex-1 p-8">
          {childrenWithActiveFunction}
        </main>
      </div>
    </div>
  )
}

export default Layout