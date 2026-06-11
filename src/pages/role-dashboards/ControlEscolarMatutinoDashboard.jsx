import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/layout/Layout'
import ControlEscolarMenu from '../../components/control-escolar/ControlEscolarMenu'

const CONFIG = {
  label: 'Control Escolar (Matutino)',
  badgeClasses: 'bg-rose-100 text-rose-800 border border-rose-200',
  color: 'rose',
}

function ControlEscolarMatutinoDashboard() {
  const { currentUser } = useAuth()

  return (
    <Layout user={currentUser} roleConfig={CONFIG} roleId="control_escolar">
      <ControlEscolarMenu />
    </Layout>
  )
}

export default ControlEscolarMatutinoDashboard
