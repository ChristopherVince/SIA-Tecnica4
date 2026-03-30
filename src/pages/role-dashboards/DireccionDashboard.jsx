import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import DashboardHeader from '../../components/DashboardHeader'
import { GRADOS, getStudentsByGradoAndGrupo } from '../../data/students-data'

const DIRECCION_CONFIG = {
  label: 'Dirección',
  badgeClasses: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300',
  headerGradient: 'bg-gradient-to-r from-blue-700 to-blue-950',
  color: 'blue',
}

const TABS = ['Datos Generales', 'Familia', 'Fichas', 'Documentos', 'FIA', 'Acuerdos', 'Calificaciones', 'Conducta']

function StudentDetailModal({ student, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState(0)

  if (!isOpen || !student) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-950 text-white p-6 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{student.nombreCompleto}</h2>
              <p className="text-white/70 mt-1">FIA: {student.fia.numero} | Grupo: {student.grado}°{student.grupo}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 sticky top-20 z-10 overflow-x-auto">
          <div className="flex gap-1 px-6 py-0">
            {TABS.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === idx
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* DATOS GENERALES */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Nombre Completo</p>
                  <p className="text-slate-900 mt-1">{student.datosGenerales.nombre}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">FIA</p>
                  <p className="text-slate-900 mt-1 font-mono">{student.datosGenerales.fia}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Matrícula</p>
                  <p className="text-slate-900 mt-1 font-mono">{student.datosGenerales.matricula}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Fecha de Nacimiento</p>
                  <p className="text-slate-900 mt-1">{student.datosGenerales.fechaNacimiento}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">CURP</p>
                  <p className="text-slate-900 mt-1 font-mono">{student.datosGenerales.curp}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Sexo</p>
                  <p className="text-slate-900 mt-1">{student.datosGenerales.sexo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Grado</p>
                  <p className="text-slate-900 mt-1">{student.datosGenerales.grado}°</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Grupo</p>
                  <p className="text-slate-900 mt-1">{student.datosGenerales.grupo} ({student.datosGenerales.turno})</p>
                </div>
              </div>
            </div>
          )}

          {/* INFORMACIÓN FAMILIAR */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Tutor Principal</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Nombre</p>
                    <p className="text-slate-900 mt-1">{student.informacionFamiliar.tutor.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Parentesco</p>
                    <p className="text-slate-900 mt-1">{student.informacionFamiliar.tutor.parentesco}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Teléfono</p>
                    <p className="text-slate-900 mt-1">{student.informacionFamiliar.tutor.telefono}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                    <p className="text-slate-900 mt-1 text-sm">{student.informacionFamiliar.tutor.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Tutor Secundario</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Nombre</p>
                    <p className="text-slate-900 mt-1">{student.informacionFamiliar.tutor2.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Parentesco</p>
                    <p className="text-slate-900 mt-1">{student.informacionFamiliar.tutor2.parentesco}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Teléfono</p>
                    <p className="text-slate-900 mt-1">{student.informacionFamiliar.tutor2.telefono}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                    <p className="text-slate-900 mt-1 text-sm">{student.informacionFamiliar.tutor2.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Domicilio</h3>
                <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                  <p>{student.informacionFamiliar.domicilio.calle} {student.informacionFamiliar.domicilio.numero}</p>
                  <p>{student.informacionFamiliar.domicilio.colonia}, {student.informacionFamiliar.domicilio.delegacion}</p>
                  <p>{student.informacionFamiliar.domicilio.estado} {student.informacionFamiliar.domicilio.codigoPostal}</p>
                </div>
              </div>
            </div>
          )}

          {/* FICHAS DE INSCRIPCIÓN */}
          {activeTab === 2 && (
            <div className="space-y-4">
              {student.fichasInscripcion.map((ficha) => (
                <div key={ficha.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">{ficha.ciclo}</h4>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                      {ficha.estatus}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Fecha: {ficha.fechaInscripcion}</p>
                    <p className="font-medium mt-3">Documentos adjuntos:</p>
                    <ul className="ml-4 space-y-1">
                      {ficha.documentosAdjuntos.map((doc, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-blue-600">✓</span> {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DOCUMENTOS HABILITANTES */}
          {activeTab === 3 && (
            <div className="space-y-3">
              {student.documentosHabilitantes.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{doc.nombre}</p>
                    <p className="text-sm text-slate-500">Fecha: {doc.fecha}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                    {doc.estado}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* FIA */}
          {activeTab === 4 && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Número FIA</p>
                <p className="text-4xl font-bold text-blue-700 font-mono mb-4">{student.fia.numero}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Fecha Asignación</p>
                    <p className="text-slate-900 mt-1">{student.fia.fechaAsignacion}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Estado</p>
                    <p className="text-slate-900 mt-1 font-medium text-emerald-600">{student.fia.estado}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                  <p className="text-xs text-slate-500 mb-1">Enlace SEP:</p>
                  <p className="text-xs text-blue-600 break-all font-mono">{student.fia.enlaceSEP}</p>
                </div>
              </div>
            </div>
          )}

          {/* ACUERDOS DE CONVIVENCIA */}
          {activeTab === 5 && (
            <div className="space-y-4">
              {student.acuerdosConvivencia.map((acuerdo) => (
                <div key={acuerdo.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">{acuerdo.tipo}</h4>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                      {acuerdo.estado}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Fecha: {acuerdo.fechaFirma}</p>
                    <p className="text-slate-700 mt-2">{acuerdo.notas}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CALIFICACIONES */}
          {activeTab === 6 && (
            <div className="space-y-6">
              {Object.entries(student.calificaciones).map(([key, periodo]) => (
                <div key={key} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">{periodo.nombre}</h4>
                    <span className="px-4 py-2 bg-blue-100 text-blue-900 font-bold rounded-lg">
                      {periodo.calificacionPromedio}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {periodo.materias.map((materia, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{materia.nombre}</p>
                          <p className="text-xs text-slate-500">Asistencia: {materia.asistencia}</p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">{materia.calificacion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ASPECTO CONDUCTUAL */}
          {activeTab === 7 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Comportamiento General</p>
                  <p className="text-slate-900 mt-2 font-bold text-lg">{student.conductual.comportamientoGeneral}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Reportes Disciplinarios</p>
                  <p className="text-slate-900 mt-2 font-bold text-lg">{student.conductual.reportesDisciplinarios}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Historial de Incidentes</h4>
                <div className="space-y-3">
                  {student.conductual.historialConductual.map((incidente, idx) => (
                    <div key={idx} className="border-l-4 border-orange-400 pl-4 py-2">
                      <p className="text-sm text-slate-500">{incidente.fecha}</p>
                      <p className="font-medium text-slate-900 mt-1">{incidente.motivo}</p>
                      <p className="text-sm text-slate-600 mt-1">Acción: {incidente.accion}</p>
                      <p className="text-xs text-slate-500 mt-1">Reportado por: {incidente.responsable}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-slate-900 mb-2">Observaciones:</p>
                <p className="text-sm text-slate-700">{student.conductual.observaciones}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DireccionDashboard() {
  const { currentUser, loading } = useAuth()
  const nombre = currentUser?.nombre ?? currentUser?.email

  const [selectedGrado, setSelectedGrado] = useState(1)
  const [selectedGrupo, setSelectedGrupo] = useState('A')
  const [students, setStudents] = useState(() => {
    try {
      return getStudentsByGradoAndGrupo(1, 'A')
    } catch (error) {
      console.error('Error loading students:', error)
      return []
    }
  })
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Si aún está cargando, muestra un loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-600">Cargando panel...</p>
        </div>
      </div>
    )
  }

  const handleGradoChange = (grado) => {
    try {
      setSelectedGrado(grado)
      const newStudents = getStudentsByGradoAndGrupo(grado, selectedGrupo)
      setStudents(newStudents || [])
    } catch (error) {
      console.error('Error changing grado:', error)
      setStudents([])
    }
  }

  const handleGrupoChange = (grupo) => {
    try {
      setSelectedGrupo(grupo)
      const newStudents = getStudentsByGradoAndGrupo(selectedGrado, grupo)
      setStudents(newStudents || [])
    } catch (error) {
      console.error('Error changing grupo:', error)
      setStudents([])
    }
  }

  const filteredStudents = (students || []).filter(student =>
    student?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student?.fia?.numero?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        nombreUsuario={nombre}
        rolLabel={DIRECCION_CONFIG.label}
        rolConfig={DIRECCION_CONFIG}
      />

      <header className={DIRECCION_CONFIG.headerGradient + ' text-white'}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">Padrón de Alumnos</h1>
          <p className="text-white/70">Consulta y gestión de expedientes estudiantiles</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Filtros de Búsqueda</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Grado */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Grado</label>
              <div className="flex gap-2">
                {GRADOS.map((grado) => (
                  <button
                    key={grado.id}
                    onClick={() => handleGradoChange(grado.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedGrado === grado.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {grado.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grupo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Grupo</label>
              <select
                value={selectedGrupo}
                onChange={(e) => handleGrupoChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Turno Matutino">
                  {['A', 'B', 'C', 'D', 'F'].map((grupo) => (
                    <option key={grupo} value={grupo}>
                      {grupo}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Turno Vespertino">
                  {['G', 'H', 'I', 'J', 'K', 'L'].map((grupo) => (
                    <option key={grupo} value={grupo}>
                      {grupo}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
              <input
                type="text"
                placeholder="Nombre o FIA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Mostrando <span className="font-semibold">{filteredStudents.length}</span> de <span className="font-semibold">{students.length}</span> alumnos en {selectedGrado}° {selectedGrupo}
          </p>
        </div>

        {/* Lista de Alumnos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition text-left cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm line-clamp-2">{student.nombreCompleto}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">{student.fia.numero}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  student.status === 'activo'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {student.status === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p>Grado: {student.grado}°</p>
                <p>Grupo: {student.grupo}</p>
              </div>
              <div className="mt-4 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-lg transition text-sm text-center">
                Ver Expediente
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No se encontraron alumnos con los criterios especificados.</p>
          </div>
        )}
      </main>

      {/* Modal de Detalles */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  )
}

export default DireccionDashboard
