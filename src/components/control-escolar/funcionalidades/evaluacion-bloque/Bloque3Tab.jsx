import EvaluacionBloqueTab from './EvaluacionBloqueTab'
import { BLOQUES } from './evaluacionBloqueConfig'

function Bloque3Tab(props) {
  return <EvaluacionBloqueTab {...props} block={BLOQUES[2]} />
}

export default Bloque3Tab
