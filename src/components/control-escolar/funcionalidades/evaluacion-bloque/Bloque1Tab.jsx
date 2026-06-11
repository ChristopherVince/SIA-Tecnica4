import EvaluacionBloqueTab from './EvaluacionBloqueTab'
import { BLOQUES } from './evaluacionBloqueConfig'

function Bloque1Tab(props) {
  return <EvaluacionBloqueTab {...props} block={BLOQUES[0]} />
}

export default Bloque1Tab
