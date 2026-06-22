import { useState, Children, cloneElement } from 'react'
import Sidebar from './Sidebar'
import TopNavBar from './TopNavBar'

function Layout({ children, user, roleConfig, roleId }) {
  const [activeFunction, setActiveFunction] = useState(null)

  const handleMenuItemClick = (action) => {
    setActiveFunction(action)
  }

  // Pasar activeFunction a cualquier componente React hijo (no a nodos DOM)
  const childrenWithActiveFunction = Children.map(children, (child) => {
    if (child && typeof child === 'object' && typeof child.type === 'function') {
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