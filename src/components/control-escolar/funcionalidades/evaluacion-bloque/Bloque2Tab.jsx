import EvaluacionBloqueTab from './EvaluacionBloqueTab'
import { BLOQUES } from './evaluacionBloqueConfig'

function Bloque2Tab(props) {
  return <EvaluacionBloqueTab {...props} block={BLOQUES[1]} />
}

export default Bloque2Tab
