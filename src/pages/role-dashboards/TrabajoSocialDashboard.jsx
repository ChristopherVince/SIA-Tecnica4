import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/layout/Layout'
import TrabajoSocialMenu from '../../components/trabajo-social/TrabajoSocialMenu'

const CONFIG = {
  label: 'Trabajo Social',
  badgeClasses: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  color: 'emerald',
}

function TrabajoSocialDashboard() {
  const { currentUser } = useAuth()

  return (
    <Layout user={currentUser} roleConfig={CONFIG} roleId="trabajo_social">
      <TrabajoSocialMenu />
    </Layout>
  )
}

export default TrabajoSocialDashboard
