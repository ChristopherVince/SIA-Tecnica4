import { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../context/AuthContext'
import { fechaNacimientoDesdeCurp, sexoDesdeCurp } from '../../../utils/curpUtils'

const GRUPOS_POR_TURNO = {
  matutino: ['A', 'B', 'C', 'D', 'E', 'F'],
  vespertino: ['G', 'H', 'I', 'J', 'K', 'L'],
}

const TODOS_LOS_GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const GRADOS_VALIDOS = ['1', '2', '3']
const MAX_PREVIEW = 8

const HEADER_FIELD_MAP = {
  curp: 'curp',
  grado: 'grado',
  grupo: 'grupo',
  nombre: 'nombre',
  primerapellido: 'primerApellido',
  apellido1: 'primerApellido',
  apellidopaterno: 'primerApellido',
  segundoapellido: 'segundoApellido',
  apellido2: 'segundoApellido',
  apellidomaterno: 'segundoApellido',
}

const PLANTILLA_HEADERS = ['CURP', 'Grado', 'Grupo', 'Primer apellido', 'Segundo apellido', 'Nombre']

const normalizeHeader = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')

const cleanValue = (value) => String(value ?? '').trim()

const parseCsvFile = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data ?? []),
      error: (error) => reject(error),
    })
  })

const parseExcelFile = async (file) => {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []

  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    defval: '',
  })
}

const normalizeGrade = (value) => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw.startsWith('1')) return '1'
  if (raw.startsWith('2')) return '2'
  if (raw.startsWith('3')) return '3'
  return ''
}

const getCurrentCycle = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

const getNextCycle = (cycle) => {
  const [start] = String(cycle).split('-').map((v) => Number(v))
  if (!Number.isFinite(start)) return ''
  return `${start + 1}-${start + 2}`
}

function InscripcionesView() {
  const { currentUser } = useAuth()
  const [grado, setGrado] = useState('')
  const [grupo, setGrupo] = useState('')
  const [isNuevaModalOpen, setIsNuevaModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingListado, setLoadingListado] = useState(false)
  const [hasBuscado, setHasBuscado] = useState(false)
  const [pageError, setPageError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')
  const [registros, setRegistros] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [isAlumnoInfoModalOpen, setIsAlumnoInfoModalOpen] = useState(false)
  const [selectedAlumnoData, setSelectedAlumnoData] = useState(null)
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('')
  const [formData, setFormData] = useState({
    curp: '',
    grado: '',
    grupo: '',
    primerApellido: '',
    segundoApellido: '',
    nombre: '',
  })

  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [isParsingImport, setIsParsingImport] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importParseError, setImportParseError] = useState('')
  const [importValidationErrors, setImportValidationErrors] = useState([])
  const [importValidRows, setImportValidRows] = useState([])
  const [importPreviewRows, setImportPreviewRows] = useState([])

  const [isReinscripcionModalOpen, setIsReinscripcionModalOpen] = useState(false)
  const [reinscripcionRows, setReinscripcionRows] = useState([])
  const [loadingReinscripcion, setLoadingReinscripcion] = useState(false)
  const [reinscripcionError, setReinscripcionError] = useState('')
  const [isApplyingReinscripcion, setIsApplyingReinscripcion] = useState(false)
  const [cicloAplicado, setCicloAplicado] = useState(getCurrentCycle())
  const [reinscripcionSearch, setReinscripcionSearch] = useState('')
  const [reinscripcionGradoFilter, setReinscripcionGradoFilter] = useState('')
  const [reinscripcionGrupoFilter, setReinscripcionGrupoFilter] = useState('')
  const [isConfirmReinscripcionOpen, setIsConfirmReinscripcionOpen] = useState(false)

  const turno = (currentUser?.turno ?? '').toLowerCase()
  const gruposDisponibles = GRUPOS_POR_TURNO[turno] ?? []

  const nombreCompleto = (alumno) =>
    [alumno.primerApellido, alumno.segundoApellido, alumno.nombre].filter(Boolean).join(' ')

  const loadRegistros = async () => {
    if (!grado || !grupo) return
    setLoadingListado(true)
    setPageError('')
    try {
      const q = query(
        collection(db, 'alumnos'),
        where('grado', '==', grado),
        where('grupo', '==', grupo),
      )
      const snap = await getDocs(q)
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))
      setRegistros(rows)
    } catch {
      setPageError('No se pudo cargar el listado de inscripciones.')
    } finally {
      setLoadingListado(false)
    }
  }

  const handleBuscarRegistros = async () => {
    if (!grado || !grupo) {
      setPageError('Selecciona grado y grupo para buscar.')
      return
    }
    setHasBuscado(true)
    await loadRegistros()
  }

  // Al cambiar filtros se limpia el resultado anterior
  useEffect(() => {
    setRegistros([])
    setHasBuscado(false)
    setCurrentPage(1)
    setPageError('')
  }, [grado, grupo])

  useEffect(() => {
    if (formData.grupo && !gruposDisponibles.includes(formData.grupo)) {
      setFormData((prev) => ({ ...prev, grupo: '' }))
    }
  }, [formData.grupo, gruposDisponibles])

  const totalRegistros = useMemo(() => registros.length, [registros])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalRegistros / pageSize)), [totalRegistros, pageSize])

  const paginatedRegistros = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return registros.slice(start, start + pageSize)
  }, [registros, currentPage, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const formatDateValue = (value) => {
    if (!value) return '-'
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      return value.toDate().toLocaleString('es-MX')
    }
    return String(value)
  }

  const handleOpenAlumnoInfo = (alumno) => {
    setIsAlumnoInfoModalOpen(true)
    setSelectedAlumnoData(alumno)
    setSelectedAlumnoId(alumno.id)
  }

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'curp' ? value.toUpperCase() : value,
    }))
  }

  const resetForm = () => {
    setFormData({
      curp: '',
      grado: '',
      grupo: '',
      primerApellido: '',
      segundoApellido: '',
      nombre: '',
    })
  }

  const validateForm = () => {
    const { curp, grado: gradoForm, grupo: grupoForm, primerApellido, segundoApellido, nombre } = formData

    if (!turno) {
      setModalError('Tu usuario no tiene turno asignado. No es posible registrar inscripciones.')
      return false
    }

    if (!curp || !gradoForm || !grupoForm || !primerApellido || !segundoApellido || !nombre) {
      setModalError('Todos los campos son obligatorios para registrar una nueva inscripción.')
      return false
    }

    if (!gruposDisponibles.includes(grupoForm)) {
      setModalError('El grupo seleccionado no corresponde a tu turno.')
      return false
    }

    if (!/^[A-Z0-9]{18}$/.test(curp)) {
      setModalError('La CURP debe tener 18 caracteres alfanuméricos en mayúsculas.')
      return false
    }

    return true
  }

  const handleNuevaInscripcion = async (e) => {
    e.preventDefault()
    setModalError('')
    setSuccess('')

    if (!validateForm()) return

    setIsSaving(true)
    try {
      const curpId = formData.curp.trim().toUpperCase()
      const alumnoRef = doc(db, 'alumnos', curpId)
      const existing = await getDoc(alumnoRef)

      if (existing.exists()) {
        setModalError('Ya existe un alumno registrado con esa CURP.')
        setIsSaving(false)
        return
      }

      const fechaNac = fechaNacimientoDesdeCurp(curpId)
      const sexo = sexoDesdeCurp(curpId)
      await setDoc(alumnoRef, {
        curp: curpId,
        grado: formData.grado,
        grupo: formData.grupo,
        turno,
        primerApellido: formData.primerApellido.trim(),
        segundoApellido: formData.segundoApellido.trim(),
        nombre: formData.nombre.trim(),
        ...(fechaNac && { fechaNacimiento: fechaNac }),
        ...(sexo && { sexo }),
        fechaAlta: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      setSuccess('Alumno inscrito correctamente.')
      setIsNuevaModalOpen(false)
      resetForm()
      await loadRegistros()
    } catch {
      setModalError('No se pudo guardar la inscripción. Verifica permisos de Firestore e intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const resetImportState = () => {
    setImportFile(null)
    setImportParseError('')
    setImportValidationErrors([])
    setImportValidRows([])
    setImportPreviewRows([])
    setIsParsingImport(false)
    setIsImporting(false)
  }

  const handleOpenImportModal = () => {
    resetImportState()
    setSuccess('')
    setIsImportModalOpen(true)
  }

  const mapIncomingRow = (rawRow) => {
    const mapped = {
      curp: '',
      grado: '',
      grupo: '',
      primerApellido: '',
      segundoApellido: '',
      nombre: '',
    }

    Object.entries(rawRow ?? {}).forEach(([key, value]) => {
      const normalized = normalizeHeader(key)
      const field = HEADER_FIELD_MAP[normalized]
      if (!field) return

      const clean = cleanValue(value)
      if (field === 'curp' || field === 'grupo') {
        mapped[field] = clean.toUpperCase()
      } else {
        mapped[field] = clean
      }
    })

    return mapped
  }

  const validateImportRow = (row, rowNumber, seenCurps) => {
    const curp = cleanValue(row.curp).toUpperCase()
    const gradoRow = cleanValue(row.grado)
    const grupoRow = cleanValue(row.grupo).toUpperCase()
    const primerApellido = cleanValue(row.primerApellido)
    const segundoApellido = cleanValue(row.segundoApellido)
    const nombre = cleanValue(row.nombre)

    if (!curp || !gradoRow || !grupoRow || !primerApellido || !segundoApellido || !nombre) {
      return { ok: false, error: `Fila ${rowNumber}: faltan campos obligatorios.` }
    }

    if (!/^[A-Z0-9]{18}$/.test(curp)) {
      return { ok: false, error: `Fila ${rowNumber}: CURP inválida (${curp}).` }
    }

    if (!GRADOS_VALIDOS.includes(gradoRow)) {
      return { ok: false, error: `Fila ${rowNumber}: grado inválido (${gradoRow}).` }
    }

    if (!gruposDisponibles.includes(grupoRow)) {
      return { ok: false, error: `Fila ${rowNumber}: grupo ${grupoRow} no corresponde al turno ${turno}.` }
    }

    if (seenCurps.has(curp)) {
      return { ok: false, error: `Fila ${rowNumber}: CURP duplicada en el archivo (${curp}).` }
    }

    seenCurps.add(curp)

    const fechaNac = fechaNacimientoDesdeCurp(curp)
    const sexo = sexoDesdeCurp(curp)
    return {
      ok: true,
      data: {
        curp,
        grado: gradoRow,
        grupo: grupoRow,
        turno,
        primerApellido,
        segundoApellido,
        nombre,
        ...(fechaNac && { fechaNacimiento: fechaNac }),
        ...(sexo && { sexo }),
      },
    }
  }

  const fetchExistingCurps = async (curps) => {
    const existing = new Set()

    for (let i = 0; i < curps.length; i += 10) {
      const chunk = curps.slice(i, i + 10)
      if (chunk.length === 0) continue
      const q = query(collection(db, 'alumnos'), where(documentId(), 'in', chunk))
      const snap = await getDocs(q)
      snap.forEach((d) => existing.add(d.id))
    }

    return existing
  }

  const parseImportFile = async (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'csv') {
      return parseCsvFile(file)
    }

    if (extension === 'xlsx' || extension === 'xls') {
      return parseExcelFile(file)
    }

    throw new Error('Formato no soportado. Usa .csv, .xlsx o .xls')
  }

  const handleAnalyzeImport = async () => {
    setImportParseError('')
    setImportValidationErrors([])
    setImportValidRows([])
    setImportPreviewRows([])

    if (!importFile) {
      setImportParseError('Selecciona un archivo CSV o Excel para continuar.')
      return
    }

    if (!turno) {
      setImportParseError('Tu usuario no tiene turno asignado. No se puede importar.')
      return
    }

    setIsParsingImport(true)

    try {
      const rawRows = await parseImportFile(importFile)

      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        setImportParseError('El archivo no contiene filas para importar.')
        setIsParsingImport(false)
        return
      }

      const seenCurps = new Set()
      const validRows = []
      const errors = []

      rawRows.forEach((rawRow, index) => {
        const mapped = mapIncomingRow(rawRow)
        const validation = validateImportRow(mapped, index + 2, seenCurps)

        if (!validation.ok) {
          errors.push(validation.error)
        } else {
          validRows.push(validation.data)
        }
      })

      if (validRows.length > 0) {
        const existingCurps = await fetchExistingCurps(validRows.map((r) => r.curp))

        const dedupedValidRows = []
        validRows.forEach((row) => {
          if (existingCurps.has(row.curp)) {
            errors.push(`CURP ${row.curp}: ya existe en Firestore.`)
          } else {
            dedupedValidRows.push(row)
          }
        })

        setImportValidRows(dedupedValidRows)
        setImportPreviewRows(dedupedValidRows.slice(0, MAX_PREVIEW))
      }

      setImportValidationErrors(errors)

      if (errors.length > 0 && validRows.length === 0) {
        setImportParseError('No se encontraron filas válidas para importar.')
      }
    } catch (err) {
      setImportParseError(err?.message || 'Error al procesar el archivo de importación.')
    } finally {
      setIsParsingImport(false)
    }
  }

  const handleConfirmImport = async () => {
    if (importValidRows.length === 0) {
      setImportParseError('No hay filas válidas para importar.')
      return
    }

    setIsImporting(true)
    setImportParseError('')

    try {
      const chunkSize = 300

      for (let i = 0; i < importValidRows.length; i += chunkSize) {
        const chunk = importValidRows.slice(i, i + chunkSize)
        const batch = writeBatch(db)

        chunk.forEach((row) => {
          const alumnoRef = doc(db, 'alumnos', row.curp)
          batch.set(alumnoRef, {
            ...row,
            fechaAlta: serverTimestamp(),
            createdAt: serverTimestamp(),
          })
        })

        await batch.commit()
      }

      setSuccess(`Importación completada: ${importValidRows.length} alumnos guardados.`)
      setIsImportModalOpen(false)
      resetImportState()
      await loadRegistros()
    } catch {
      setImportParseError('Ocurrió un error durante la importación a Firestore.')
    } finally {
      setIsImporting(false)
    }
  }

  const loadReinscripcionCandidates = async () => {
    if (!turno) {
      setReinscripcionError('Tu usuario no tiene turno asignado. No se puede ejecutar reinscripción.')
      setReinscripcionRows([])
      return
    }

    setLoadingReinscripcion(true)
    setReinscripcionError('')

    try {
      const q = query(collection(db, 'alumnos'), where('turno', '==', turno))
      const snap = await getDocs(q)

      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((row) => !row.egresado && row.estatus !== 'egresado')
        .map((row) => {
          const gradoNormalizado = normalizeGrade(row.grado)
          const elegible = gradoNormalizado === '1' || gradoNormalizado === '2' || gradoNormalizado === '3'
          return {
            ...row,
            gradoNormalizado,
            elegible,
            seleccionado: elegible,
          }
        })
        .filter((row) => row.elegible)

      rows.sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))
      setReinscripcionRows(rows)
    } catch {
      setReinscripcionError('No se pudieron cargar los alumnos para reinscripción.')
    } finally {
      setLoadingReinscripcion(false)
    }
  }

  const openReinscripcionModal = async () => {
    setSuccess('')
    setReinscripcionError('')
    setCicloAplicado(getCurrentCycle())
    setReinscripcionSearch('')
    setReinscripcionGradoFilter('')
    setReinscripcionGrupoFilter('')
    setIsConfirmReinscripcionOpen(false)
    setIsReinscripcionModalOpen(true)
    await loadReinscripcionCandidates()
  }

  const toggleReinscripcionSelection = (id) => {
    setReinscripcionRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, seleccionado: !row.seleccionado } : row)),
    )
  }

  const reinscripcionSummary = useMemo(() => {
    const selected = reinscripcionRows.filter((row) => row.seleccionado)
    const prom1a2 = selected.filter((row) => row.gradoNormalizado === '1').length
    const prom2a3 = selected.filter((row) => row.gradoNormalizado === '2').length
    const egresan = selected.filter((row) => row.gradoNormalizado === '3').length
    return {
      total: reinscripcionRows.length,
      selected: selected.length,
      prom1a2,
      prom2a3,
      egresan,
    }
  }, [reinscripcionRows])

  const filteredReinscripcionRows = useMemo(() => {
    const text = reinscripcionSearch.trim().toLowerCase()

    return reinscripcionRows.filter((row) => {
      const matchesText =
        text.length === 0 ||
        nombreCompleto(row).toLowerCase().includes(text) ||
        String(row.curp ?? row.id ?? '').toLowerCase().includes(text)

      const matchesGrado = reinscripcionGradoFilter ? normalizeGrade(row.grado) === reinscripcionGradoFilter : true
      const matchesGrupo = reinscripcionGrupoFilter ? String(row.grupo ?? '').toUpperCase() === reinscripcionGrupoFilter : true

      return matchesText && matchesGrado && matchesGrupo
    })
  }, [reinscripcionRows, reinscripcionSearch, reinscripcionGradoFilter, reinscripcionGrupoFilter])

  const executeApplyReinscripcion = async () => {
    setReinscripcionError('')

    const selectedRows = reinscripcionRows.filter((row) => row.seleccionado)
    if (selectedRows.length === 0) {
      setReinscripcionError('Selecciona al menos un alumno para aplicar reinscripción.')
      return
    }

    const siguienteCiclo = getNextCycle(cicloAplicado)
    if (!siguienteCiclo) {
      setReinscripcionError('El ciclo escolar es inválido. Usa el formato AAAA-AAAA.')
      return
    }

    setIsApplyingReinscripcion(true)
    try {
      const chunkSize = 300
      for (let i = 0; i < selectedRows.length; i += chunkSize) {
        const chunk = selectedRows.slice(i, i + chunkSize)
        const batch = writeBatch(db)

        chunk.forEach((row) => {
          const alumnoRef = doc(db, 'alumnos', row.id)

          if (row.gradoNormalizado === '1') {
            batch.set(
              alumnoRef,
              {
                grado: '2',
                reinscripcion: {
                  ultimaAccion: 'promocion',
                  cicloAplicado,
                  aplicadoAt: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            )
          } else if (row.gradoNormalizado === '2') {
            batch.set(
              alumnoRef,
              {
                grado: '3',
                reinscripcion: {
                  ultimaAccion: 'promocion',
                  cicloAplicado,
                  aplicadoAt: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            )
          } else if (row.gradoNormalizado === '3') {
            batch.set(
              alumnoRef,
              {
                estatus: 'egresado',
                egresado: true,
                egreso: {
                  cicloEgreso: cicloAplicado,
                  conservarHastaCiclo: siguienteCiclo,
                  aplicadoAt: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            )
          }
        })

        await batch.commit()
      }

      setSuccess(
        `Reinscripción aplicada. Promovidos 1→2: ${reinscripcionSummary.prom1a2}, 2→3: ${reinscripcionSummary.prom2a3}, egresados: ${reinscripcionSummary.egresan}.`,
      )
      setIsConfirmReinscripcionOpen(false)
      setIsReinscripcionModalOpen(false)
      setReinscripcionRows([])
      await loadRegistros()
    } catch {
      setReinscripcionError('Ocurrió un error al aplicar la reinscripción en Firestore.')
    } finally {
      setIsApplyingReinscripcion(false)
    }
  }

  const handleApplyReinscripcion = () => {
    setReinscripcionError('')

    const selectedRows = reinscripcionRows.filter((row) => row.seleccionado)
    if (selectedRows.length === 0) {
      setReinscripcionError('Selecciona al menos un alumno para aplicar reinscripción.')
      return
    }

    const siguienteCiclo = getNextCycle(cicloAplicado)
    if (!siguienteCiclo) {
      setReinscripcionError('El ciclo escolar es inválido. Usa el formato AAAA-AAAA.')
      return
    }

    setIsConfirmReinscripcionOpen(true)
  }

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([PLANTILLA_HEADERS])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscripciones')
    XLSX.writeFile(workbook, 'plantilla_inscripciones.xlsx')
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-headline font-bold text-slate-900">Inscripciones de Alumnos</h2>
        <p className="text-sm text-slate-500 mt-1">Registra nuevos alumnos y gestiona sus inscripciones para el ciclo escolar</p>
        <p className="text-xs text-slate-500 mt-1">
          Turno activo: <span className="font-semibold uppercase">{turno || 'sin turno'}</span>
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-headline font-bold text-slate-700 mb-4 uppercase tracking-wide">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Grado</label>
            <select
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">Selecciona un grado</option>
              <option value="1">1er Grado</option>
              <option value="2">2do Grado</option>
              <option value="3">3er Grado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Grupo</label>
            <select
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">Selecciona un grupo</option>
              {TODOS_LOS_GRUPOS.map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleBuscarRegistros}
            disabled={!grado || !grupo || loadingListado}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            {loadingListado ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">Selecciona grado y grupo, luego presiona Buscar para cargar el listado.</p>
      </div>

      {pageError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Sección de Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setModalError('')
            setSuccess('')
            setIsNuevaModalOpen(true)
          }}
          className="p-6 bg-rose-50 border-2 border-rose-200 rounded-xl hover:bg-rose-100 hover:border-rose-400 transition-all flex items-center gap-4 text-left"
        >
          <div className="p-3 bg-rose-200 rounded-lg">
            <span className="material-symbols-outlined text-rose-700">person_add</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Nueva Inscripción</p>
            <p className="text-xs text-slate-600">Agregar nuevo alumno al sistema</p>
          </div>
        </button>

        <button
          onClick={handleOpenImportModal}
          className="p-6 bg-rose-50 border-2 border-rose-200 rounded-xl hover:bg-rose-100 hover:border-rose-400 transition-all flex items-center gap-4 text-left"
        >
          <div className="p-3 bg-rose-200 rounded-lg">
            <span className="material-symbols-outlined text-rose-700">file_download</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Importar Inscripciones</p>
            <p className="text-xs text-slate-600">Cargar alumnos desde archivo CSV o Excel</p>
          </div>
        </button>

        <button
          onClick={openReinscripcionModal}
          className="p-6 bg-amber-50 border-2 border-amber-200 rounded-xl hover:bg-amber-100 hover:border-amber-400 transition-all flex items-center gap-4 text-left"
        >
          <div className="p-3 bg-amber-200 rounded-lg">
            <span className="material-symbols-outlined text-amber-700">autorenew</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Reinscripciones</p>
            <p className="text-xs text-slate-600">Reingreso de alumnos para un nuevo ciclo escolar</p>
          </div>
        </button>
      </div>

      {/* Tabla de inscripciones */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-headline font-bold text-slate-700 uppercase tracking-wide">Listado de Inscripciones</h3>
          <span className="text-xs bg-rose-100 text-rose-800 px-3 py-1 rounded-full">{totalRegistros} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">CURP</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">Nombre</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">Grado</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">Grupo</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-600">Estado</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingListado ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">
                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">hourglass_empty</span>
                    Cargando inscripciones...
                  </td>
                </tr>
              ) : !hasBuscado ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">filter_list</span>
                    Selecciona grado y grupo y presiona <span className="font-semibold">Buscar</span> para ver el listado.
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">person_off</span>
                    No hay alumnos en {grado}° Grupo {grupo}.
                  </td>
                </tr>
              ) : (
                paginatedRegistros.map((alumno) => (
                  <tr key={alumno.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 text-xs font-mono text-slate-700">{alumno.curp ?? alumno.id}</td>
                    <td className="py-3 px-2 text-sm text-slate-800">{nombreCompleto(alumno)}</td>
                    <td className="py-3 px-2 text-sm text-slate-700">{alumno.grado}</td>
                    <td className="py-3 px-2 text-sm text-slate-700">{alumno.grupo}</td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Activo
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleOpenAlumnoInfo(alumno)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        Información
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {registros.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalRegistros)} de {totalRegistros}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-xs text-slate-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {isNuevaModalOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-headline font-bold text-slate-900">Nueva Inscripción</h3>
              <button
                onClick={() => {
                  setIsNuevaModalOpen(false)
                  setModalError('')
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleNuevaInscripcion} className="p-6 space-y-4">
              {modalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">CURP</label>
                  <input
                    type="text"
                    value={formData.curp}
                    onChange={(e) => handleFormChange('curp', e.target.value.trim())}
                    maxLength={18}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Ejemplo: GODE561231HDFRRN09"
                  />
                  {formData.curp.length === 18 && (() => {
                    const fn = fechaNacimientoDesdeCurp(formData.curp)
                    const sx = sexoDesdeCurp(formData.curp)
                    return (
                      <>
                        {fn
                          ? <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">cake</span>
                              Nacimiento: <span className="font-semibold ml-0.5">{fn}</span>
                              {sx && <span className="ml-2">· Sexo: <span className="font-semibold">{sx === 'H' ? 'Hombre' : 'Mujer'}</span></span>}
                            </p>
                          : <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              No se detectó fecha ni sexo en el CURP. Esos campos no se guardarán.
                            </p>
                        }
                      </>
                    )
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Grado</label>
                  <select
                    value={formData.grado}
                    onChange={(e) => handleFormChange('grado', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Selecciona un grado</option>
                    <option value="1">1er Grado</option>
                    <option value="2">2do Grado</option>
                    <option value="3">3er Grado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Grupo</label>
                  <select
                    value={formData.grupo}
                    onChange={(e) => handleFormChange('grupo', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Selecciona un grupo</option>
                    {gruposDisponibles.map((g) => (
                      <option key={g} value={g}>Grupo {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primer apellido</label>
                  <input
                    type="text"
                    value={formData.primerApellido}
                    onChange={(e) => handleFormChange('primerApellido', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Segundo apellido</label>
                  <input
                    type="text"
                    value={formData.segundoApellido}
                    onChange={(e) => handleFormChange('segundoApellido', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleFormChange('nombre', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNuevaModalOpen(false)
                    setModalError('')
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {isSaving ? 'Guardando...' : 'Guardar inscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-headline font-bold text-slate-900">Importar Inscripciones</h3>
              <button
                onClick={() => {
                  setIsImportModalOpen(false)
                  resetImportState()
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-72px)]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  Archivo permitido: CSV, XLSX o XLS. Debe contener columnas: CURP, Grado, Grupo, Primer apellido, Segundo apellido y Nombre.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Solo se importarán grupos del turno activo: <span className="font-semibold uppercase">{turno || 'sin turno'}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Selecciona archivo</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setImportFile(file)
                      setImportParseError('')
                      setImportValidationErrors([])
                      setImportValidRows([])
                      setImportPreviewRows([])
                    }}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-rose-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-rose-700 hover:file:bg-rose-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Descargar hoja base
                  </button>
                  <button
                    type="button"
                    onClick={handleAnalyzeImport}
                    disabled={isParsingImport || !importFile}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-60"
                  >
                    {isParsingImport ? 'Analizando...' : 'Analizar archivo'}
                  </button>
                </div>
              </div>

              {importParseError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {importParseError}
                </div>
              )}

              {(importValidRows.length > 0 || importValidationErrors.length > 0) && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs text-emerald-700 uppercase font-semibold tracking-wide">Filas válidas</p>
                      <p className="text-2xl font-bold text-emerald-800">{importValidRows.length}</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs text-amber-700 uppercase font-semibold tracking-wide">Filas rechazadas</p>
                      <p className="text-2xl font-bold text-amber-800">{importValidationErrors.length}</p>
                    </div>
                  </div>
                  {importValidRows.filter((r) => !r.fechaNacimiento).length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5">warning</span>
                      <p className="text-sm text-amber-800">
                        <span className="font-semibold">{importValidRows.filter((r) => !r.fechaNacimiento).length} alumno(s)</span> no tienen fecha de nacimiento detectable en su CURP. Se importarán sin el campo <span className="font-semibold">fechaNacimiento</span>.
                      </p>
                    </div>
                  )}
                </>
              )}

              {importPreviewRows.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">Previsualización ({importPreviewRows.length} filas)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white border-b border-slate-200">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">CURP</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Nombre</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Grado</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Grupo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreviewRows.map((row) => (
                          <tr key={row.curp} className="border-b border-slate-100">
                            <td className="px-3 py-2 text-xs font-mono text-slate-700">{row.curp}</td>
                            <td className="px-3 py-2 text-sm text-slate-800">{nombreCompleto(row)}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">{row.grado}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">{row.grupo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importValidationErrors.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">Detalle de errores</p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {importValidationErrors.slice(0, 30).map((err, idx) => (
                      <p key={`${err}-${idx}`} className="text-xs text-amber-800">• {err}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false)
                    resetImportState()
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting || importValidRows.length === 0}
                  className="px-4 py-2.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {isImporting ? 'Importando...' : `Importar ${importValidRows.length} registros`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAlumnoInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-headline font-bold text-slate-900">Información del alumno</h3>
              <button
                onClick={() => {
                  setIsAlumnoInfoModalOpen(false)
                  setSelectedAlumnoData(null)
                  setSelectedAlumnoId('')
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-72px)]">
              {selectedAlumnoData ? (() => {
                const d = selectedAlumnoData
                const esEgresado = d.estatus === 'egresado' || d.egresado
                const sexoLabel = d.sexo === 'H' ? 'Masculino' : d.sexo === 'M' ? 'Femenino' : null
                const fechaAltaVal = formatDateValue(d.fechaAlta || d.createdAt)
                const InfoCell = ({ label, value, mono = false, full = false }) => (
                  <div className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${full ? 'md:col-span-2' : ''}`}>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</p>
                    <p className={`text-sm text-slate-800 ${mono ? 'font-mono' : ''}`}>{value || '-'}</p>
                  </div>
                )
                return (
                  <div className="space-y-5">

                    {/* Cabecera */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xl font-headline font-bold text-slate-900">{nombreCompleto(d) || 'Alumno'}</h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">{d.curp || selectedAlumnoId}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        esEgresado ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {esEgresado ? 'Egresado' : 'Activo'}
                      </span>
                    </div>

                    {/* Identificación personal */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Identificación personal</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <InfoCell label="CURP" value={d.curp || selectedAlumnoId} mono full />
                        {sexoLabel && <InfoCell label="Sexo" value={sexoLabel} />}
                        {d.fechaNacimiento && <InfoCell label="Fecha de nacimiento" value={d.fechaNacimiento} />}
                      </div>
                    </div>

                    {/* Datos escolares */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Datos escolares</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <InfoCell label="Grado" value={d.grado ? `${d.grado}°` : null} />
                        <InfoCell label="Grupo" value={d.grupo} />
                        <InfoCell label="Turno" value={d.turno ? (d.turno === 'matutino' ? 'Matutino' : 'Vespertino') : null} />
                        <InfoCell label="Taller" value={d.taller} />
                      </div>
                    </div>

                    {/* NIEV */}
                    {d.niev && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Número de identificación</p>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-indigo-500 font-semibold mb-1">NIEV</p>
                            <p className="text-base font-bold text-indigo-800">{d.niev}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fechas */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Registro</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <InfoCell label="Fecha de alta" value={fechaAltaVal} />
                        {d.updatedAt && <InfoCell label="Última actualización" value={formatDateValue(d.updatedAt)} />}
                      </div>
                    </div>

                    {/* Control de ciclo */}
                    {(d.reinscripcion || d.egreso) && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Control de ciclo</p>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                          {d.reinscripcion && (
                            <div className="grid grid-cols-2 gap-2">
                              <InfoCell label="Última acción" value={d.reinscripcion.ultimaAccion} />
                              <InfoCell label="Ciclo aplicado" value={d.reinscripcion.cicloAplicado} />
                            </div>
                          )}
                          {d.egreso && (
                            <div className="grid grid-cols-2 gap-2">
                              <InfoCell label="Ciclo de egreso" value={d.egreso.cicloEgreso} />
                              <InfoCell label="Conservar hasta ciclo" value={d.egreso.conservarHastaCiclo} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                )
              })() : null}
            </div>
          </div>
        </div>
      )}

      {isReinscripcionModalOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-headline font-bold text-slate-900">Reinscripciones de Fin de Ciclo</h3>
              <button
                onClick={() => {
                  setIsReinscripcionModalOpen(false)
                  setReinscripcionError('')
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-72px)]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  Revisa los alumnos de tu turno y selecciona a quiénes aplicar reinscripción. Los de 1° pasan a 2°, los de 2° a 3° y
                  los de 3° se marcan como egresados.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Los egresados se conservan un ciclo adicional mediante el campo <span className="font-semibold">egreso.conservarHastaCiclo</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Total candidatos</p>
                  <p className="text-2xl font-bold text-slate-800">{reinscripcionSummary.total}</p>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Seleccionados</p>
                  <p className="text-2xl font-bold text-indigo-800">{reinscripcionSummary.selected}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">1° → 2°</p>
                  <p className="text-2xl font-bold text-emerald-800">{reinscripcionSummary.prom1a2}</p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-sky-600 font-semibold">2° → 3°</p>
                  <p className="text-2xl font-bold text-sky-800">{reinscripcionSummary.prom2a3}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold">Egresan 3°</p>
                  <p className="text-2xl font-bold text-amber-800">{reinscripcionSummary.egresan}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 items-end">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ciclo escolar aplicado</label>
                  <input
                    value={cicloAplicado}
                    onChange={(e) => setCicloAplicado(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="2026-2027"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Recomendado formato AAAA-AAAA. Los egresados se conservarán hasta el ciclo {getNextCycle(cicloAplicado) || 'siguiente'}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Buscar alumno</label>
                  <input
                    value={reinscripcionSearch}
                    onChange={(e) => setReinscripcionSearch(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Nombre o CURP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Filtrar por grado</label>
                  <select
                    value={reinscripcionGradoFilter}
                    onChange={(e) => setReinscripcionGradoFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Todos los grados</option>
                    <option value="1">1°</option>
                    <option value="2">2°</option>
                    <option value="3">3°</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Filtrar por grupo</label>
                  <select
                    value={reinscripcionGrupoFilter}
                    onChange={(e) => setReinscripcionGrupoFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Todos los grupos</option>
                    {TODOS_LOS_GRUPOS.map((g) => (
                      <option key={g} value={g}>Grupo {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {reinscripcionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {reinscripcionError}
                </div>
              )}

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b border-slate-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Aplicar</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">CURP</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Nombre</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Grado actual</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Grupo</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingReinscripcion ? (
                        <tr>
                          <td colSpan="6" className="text-center py-6 text-slate-500">Cargando candidatos...</td>
                        </tr>
                      ) : filteredReinscripcionRows.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-6 text-slate-500">No hay alumnos que coincidan con los filtros.</td>
                        </tr>
                      ) : (
                        filteredReinscripcionRows.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={row.seleccionado}
                                onChange={() => toggleReinscripcionSelection(row.id)}
                                className="h-4 w-4 rounded border-slate-300"
                              />
                            </td>
                            <td className="px-3 py-2 text-xs font-mono text-slate-700">{row.curp ?? row.id}</td>
                            <td className="px-3 py-2 text-sm text-slate-800">{nombreCompleto(row)}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">{row.grado}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">{row.grupo}</td>
                            <td className="px-3 py-2 text-xs">
                              {row.seleccionado ? (
                                row.gradoNormalizado === '1' ? (
                                  <span className="text-emerald-700 font-semibold">Promover a 2°</span>
                                ) : row.gradoNormalizado === '2' ? (
                                  <span className="text-sky-700 font-semibold">Promover a 3°</span>
                                ) : (
                                  <span className="text-amber-700 font-semibold">Egresar (conservar 1 ciclo)</span>
                                )
                              ) : (
                                <span className="text-slate-500">Sin cambio</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmReinscripcionOpen(false)
                    setIsReinscripcionModalOpen(false)
                    setReinscripcionError('')
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyReinscripcion}
                  disabled={isApplyingReinscripcion || reinscripcionSummary.selected === 0}
                  className="px-4 py-2.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {isApplyingReinscripcion ? 'Aplicando...' : `Continuar (${reinscripcionSummary.selected})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isConfirmReinscripcionOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-headline font-bold text-slate-900">Confirmar aplicación de reinscripción</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                Se aplicarán cambios a <span className="font-semibold">{reinscripcionSummary.selected}</span> alumnos para el ciclo
                <span className="font-semibold"> {cicloAplicado}</span>.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700 font-semibold">1° → 2°</p>
                  <p className="text-xl font-bold text-emerald-800">{reinscripcionSummary.prom1a2}</p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                  <p className="text-xs text-sky-700 font-semibold">2° → 3°</p>
                  <p className="text-xl font-bold text-sky-800">{reinscripcionSummary.prom2a3}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700 font-semibold">Egresan</p>
                  <p className="text-xl font-bold text-amber-800">{reinscripcionSummary.egresan}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Esta acción actualizará grados y marcará egresados con conservación hasta el ciclo {getNextCycle(cicloAplicado) || 'siguiente'}.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmReinscripcionOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={executeApplyReinscripcion}
                  disabled={isApplyingReinscripcion}
                  className="px-4 py-2.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {isApplyingReinscripcion ? 'Aplicando...' : 'Confirmar y aplicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InscripcionesView
