import { useMemo, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  documentId,
} from 'firebase/firestore'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../context/AuthContext'
import { GRADOS_VALIDOS, GRUPOS_POR_TURNO } from './evaluacion-bloque/evaluacionBloqueConfig'
import { fechaNacimientoDesdeCurp, sexoDesdeCurp } from '../../../utils/curpUtils'

// ── Helpers de parsing reutilizados para NIEV ────────────────────────────────
const parseNievCsv = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data ?? []),
      error: (e) => reject(e),
    })
  })

const parseNievExcel = async (file) => {
  const buf = await file.arrayBuffer()
  const wb  = XLSX.read(buf, { type: 'array' })
  const ws  = wb.Sheets[wb.SheetNames[0]]
  return ws ? XLSX.utils.sheet_to_json(ws, { defval: '' }) : []
}

const normalizeNievHeader = (v) =>
  String(v ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')

const NIEV_HEADER_MAP = { curp: 'curp', niev: 'niev' }

const SECTIONS = [
  {
    id: 'altas',
    label: 'Altas',
    description: 'Registro de nuevo alumno con datos basicos.',
    icon: 'person_add',
  },
  {
    id: 'bajas',
    label: 'Bajas',
    description: 'Busqueda por CURP y eliminacion controlada.',
    icon: 'person_remove',
  },
  {
    id: 'modificaciones',
    label: 'Modificaciones',
    description: 'Actualizacion de datos basicos del alumno.',
    icon: 'edit_note',
  },
  {
    id: 'niev',
    label: 'Importación de NIEV',
    description: 'Genera hoja base por grupo y carga el NIEV desde Excel.',
    icon: 'badge',
  },
  {
    id: 'exportaciones',
    label: 'Exportaciones',
    description: 'Pendiente de configuracion.',
    icon: 'file_download',
  },
]

const EMPTY_FORM = {
  curp: '',
  grado: '',
  grupo: '',
  primerApellido: '',
  segundoApellido: '',
  nombre: '',
}

const normalizeText = (value) => String(value ?? '').trim()

const normalizeUpper = (value) => normalizeText(value).toUpperCase()

const isValidCurp = (curp) => /^[A-Z0-9]{18}$/.test(curp)

function ProcesosVariosView() {
  const { currentUser } = useAuth()
  const turno = (currentUser?.turno ?? '').toLowerCase()
  const gruposDisponibles = GRUPOS_POR_TURNO[turno] ?? []

  const [activeSection, setActiveSection] = useState('altas')

  const [altaForm, setAltaForm] = useState(EMPTY_FORM)
  const [altaError, setAltaError] = useState('')
  const [altaSuccess, setAltaSuccess] = useState('')
  const [altaSaving, setAltaSaving] = useState(false)

  const [bajaCurp, setBajaCurp] = useState('')
  const [bajaAlumno, setBajaAlumno] = useState(null)
  const [bajaError, setBajaError] = useState('')
  const [bajaSuccess, setBajaSuccess] = useState('')
  const [bajaLoading, setBajaLoading] = useState(false)
  const [bajaConfirmCurp, setBajaConfirmCurp] = useState('')
  const [bajaConfirmAck, setBajaConfirmAck] = useState(false)
  const [bajaDeleting, setBajaDeleting] = useState(false)

  const [modSearchMode, setModSearchMode] = useState('curp')
  const [modSearch, setModSearch] = useState({
    curp: '',
    nombre: '',
    primerApellido: '',
    segundoApellido: '',
  })
  const [modResults, setModResults] = useState([])
  const [modSelected, setModSelected] = useState(null)
  const [modForm, setModForm] = useState(EMPTY_FORM)
  const [modError, setModError] = useState('')
  const [modSuccess, setModSuccess] = useState('')
  const [modLoading, setModLoading] = useState(false)
  const [modSaving, setModSaving] = useState(false)

  // ── Estado NIEV ──────────────────────────────────────────────────────────────
  const [nievGrado, setNievGrado]           = useState('')
  const [nievGrupo, setNievGrupo]           = useState('')
  const [nievLoadingBase, setNievLoadingBase] = useState(false)
  const [nievFile, setNievFile]             = useState(null)
  const [nievParsing, setNievParsing]       = useState(false)
  const [nievImporting, setNievImporting]   = useState(false)
  const [nievValidRows, setNievValidRows]   = useState([])    // [{ curp, niev, nombre }]
  const [nievErrors, setNievErrors]         = useState([])
  const [nievParseError, setNievParseError] = useState('')
  const [nievError, setNievError]           = useState('')
  const [nievSuccess, setNievSuccess]       = useState('')

  const nombreCompleto = (alumno) =>
    [alumno.primerApellido, alumno.segundoApellido, alumno.nombre].filter(Boolean).join(' ')

  const isGrupoPermitido = (grupo) => gruposDisponibles.includes(String(grupo ?? '').toUpperCase())

  const resetMessages = () => {
    setAltaError('')
    setAltaSuccess('')
    setBajaError('')
    setBajaSuccess('')
    setModError('')
    setModSuccess('')
    setNievError('')
    setNievSuccess('')
  }

  const resetNievImport = (incluyeArchivo = false) => {
    if (incluyeArchivo) setNievFile(null)
    setNievParsing(false)
    setNievImporting(false)
    setNievValidRows([])
    setNievErrors([])
    setNievParseError('')
  }

  // ── Generar hoja base NIEV ────────────────────────────────────────────────
  const handleGenerarHojaBaseNiev = async () => {
    setNievError('')
    if (!nievGrado || !nievGrupo) {
      setNievError('Selecciona grado y grupo para generar la hoja base.')
      return
    }

    setNievLoadingBase(true)
    try {
      const snap = await getDocs(
        query(collection(db, 'alumnos'), where('grado', '==', nievGrado), where('grupo', '==', nievGrupo)),
      )

      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))

      if (lista.length === 0) {
        setNievError(`No hay alumnos en ${nievGrado}° Grupo ${nievGrupo}.`)
        setNievLoadingBase(false)
        return
      }

      const wsData = [
        ['CURP', 'Primer Apellido', 'Segundo Apellido', 'Nombre', 'NIEV'],
        ...lista.map((a) => [
          a.curp ?? a.id,
          a.primerApellido ?? '',
          a.segundoApellido ?? '',
          a.nombre ?? '',
          a.niev ?? '',
        ]),
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Ancho de columnas automático
      ws['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 14 }]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'NIEV')
      XLSX.writeFile(wb, `niev_${nievGrado}${nievGrupo}_base.xlsx`)
    } catch {
      setNievError('No se pudo generar la hoja base. Intenta de nuevo.')
    } finally {
      setNievLoadingBase(false)
    }
  }

  // ── Analizar archivo NIEV ─────────────────────────────────────────────────
  const handleAnalizarNiev = async () => {
    setNievParseError('')
    setNievErrors([])
    setNievValidRows([])

    if (!nievFile) {
      setNievParseError('Selecciona un archivo para continuar.')
      return
    }

    setNievParsing(true)
    try {
      const ext = nievFile.name.split('.').pop()?.toLowerCase()
      const rawRows = ext === 'csv'
        ? await parseNievCsv(nievFile)
        : await parseNievExcel(nievFile)

      if (!rawRows?.length) {
        setNievParseError('El archivo no contiene filas.')
        setNievParsing(false)
        return
      }

      const seenCurps = new Set()
      const valid     = []
      const errors    = []

      rawRows.forEach((row, idx) => {
        const mapped = {}
        Object.entries(row).forEach(([key, value]) => {
          const field = NIEV_HEADER_MAP[normalizeNievHeader(key)]
          if (field) mapped[field] = String(value ?? '').trim()
        })

        const fila  = idx + 2
        const curp  = (mapped.curp ?? '').toUpperCase()
        const niev  = mapped.niev ?? ''

        if (!curp) { errors.push(`Fila ${fila}: CURP vacía.`); return }
        if (!/^[A-Z0-9]{18}$/.test(curp)) { errors.push(`Fila ${fila}: CURP inválida (${curp}).`); return }
        if (!niev) return  // sin NIEV = saltar silenciosamente (usuario dejó en blanco)
        if (seenCurps.has(curp)) { errors.push(`Fila ${fila}: CURP duplicada (${curp}).`); return }

        seenCurps.add(curp)
        valid.push({ curp, niev })
      })

      if (valid.length === 0 && errors.length === 0) {
        setNievParseError('No se encontraron filas con NIEV para importar.')
        setNievParsing(false)
        return
      }

      // Verificar que los CURPs existen en Firestore (chunks de 10)
      const curpList  = valid.map((r) => r.curp)
      const existing  = new Set()
      for (let i = 0; i < curpList.length; i += 10) {
        const chunk = curpList.slice(i, i + 10)
        const q     = query(collection(db, 'alumnos'), where(documentId(), 'in', chunk))
        const snap  = await getDocs(q)
        snap.forEach((d) => existing.add(d.id))
      }

      const confirmedRows = []
      valid.forEach((row) => {
        if (!existing.has(row.curp)) {
          errors.push(`CURP ${row.curp}: no existe en Firestore.`)
        } else {
          confirmedRows.push(row)
        }
      })

      setNievValidRows(confirmedRows)
      setNievErrors(errors)

      if (!confirmedRows.length) {
        setNievParseError('Ninguna fila válida pudo confirmarse en Firestore.')
      }
    } catch (err) {
      setNievParseError(err?.message ?? 'Error al procesar el archivo.')
    } finally {
      setNievParsing(false)
    }
  }

  // ── Confirmar importación NIEV ────────────────────────────────────────────
  const handleConfirmImportNiev = async () => {
    if (!nievValidRows.length) return
    setNievImporting(true)
    setNievParseError('')

    try {
      const CHUNK = 300
      for (let i = 0; i < nievValidRows.length; i += CHUNK) {
        const chunk = nievValidRows.slice(i, i + CHUNK)
        const batch = writeBatch(db)
        chunk.forEach((row) => {
          batch.set(
            doc(db, 'alumnos', row.curp),
            { niev: row.niev, updatedAt: serverTimestamp() },
            { merge: true },
          )
        })
        await batch.commit()
      }

      setNievSuccess(`NIEV guardado en ${nievValidRows.length} alumno(s) correctamente.`)
      resetNievImport(true)
    } catch {
      setNievParseError('Error al guardar en Firestore. Intenta de nuevo.')
    } finally {
      setNievImporting(false)
    }
  }

  const handleSelectSection = (sectionId) => {
    setActiveSection(sectionId)
    resetMessages()
  }

  const handleAltaChange = (field) => (event) => {
    const value = event.target.value
    setAltaForm((prev) => ({
      ...prev,
      [field]: field === 'curp' ? value.toUpperCase() : value,
    }))
  }

  const validateAlta = () => {
    if (!turno) {
      setAltaError('Tu usuario no tiene turno asignado. No es posible registrar altas.')
      return false
    }

    const { curp, grado, grupo, primerApellido, segundoApellido, nombre } = altaForm

    if (!curp || !grado || !grupo || !primerApellido || !segundoApellido || !nombre) {
      setAltaError('Todos los campos son obligatorios para registrar el alumno.')
      return false
    }

    if (!isValidCurp(curp)) {
      setAltaError('La CURP debe tener 18 caracteres alfanumericos en mayusculas.')
      return false
    }

    if (!GRADOS_VALIDOS.includes(String(grado))) {
      setAltaError('El grado seleccionado es invalido.')
      return false
    }

    if (!isGrupoPermitido(grupo)) {
      setAltaError('El grupo seleccionado no corresponde a tu turno.')
      return false
    }

    return true
  }

  const handleAltaSubmit = async (event) => {
    event.preventDefault()
    setAltaError('')
    setAltaSuccess('')

    if (!validateAlta()) return

    setAltaSaving(true)
    try {
      const curpId = normalizeUpper(altaForm.curp)
      const alumnoRef = doc(db, 'alumnos', curpId)
      const existing = await getDoc(alumnoRef)

      if (existing.exists()) {
        setAltaError('Ya existe un alumno registrado con esa CURP.')
        setAltaSaving(false)
        return
      }

      const fechaNac = fechaNacimientoDesdeCurp(curpId)
      const sexo = sexoDesdeCurp(curpId)
      await setDoc(alumnoRef, {
        curp: curpId,
        grado: String(altaForm.grado),
        grupo: normalizeUpper(altaForm.grupo),
        turno,
        primerApellido: normalizeText(altaForm.primerApellido),
        segundoApellido: normalizeText(altaForm.segundoApellido),
        nombre: normalizeText(altaForm.nombre),
        ...(fechaNac && { fechaNacimiento: fechaNac }),
        ...(sexo && { sexo }),
        fechaAlta: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      setAltaSuccess('Alumno registrado correctamente.')
      setAltaForm(EMPTY_FORM)
    } catch {
      setAltaError('No se pudo registrar el alumno. Verifica permisos e intenta de nuevo.')
    } finally {
      setAltaSaving(false)
    }
  }

  const resetBajaState = () => {
    setBajaAlumno(null)
    setBajaConfirmCurp('')
    setBajaConfirmAck(false)
  }

  const handleBuscarBaja = async () => {
    setBajaError('')
    setBajaSuccess('')
    resetBajaState()

    const curp = normalizeUpper(bajaCurp)

    if (!curp) {
      setBajaError('Ingresa la CURP del alumno para continuar.')
      return
    }

    if (!isValidCurp(curp)) {
      setBajaError('La CURP debe tener 18 caracteres alfanumericos en mayusculas.')
      return
    }

    if (!turno) {
      setBajaError('Tu usuario no tiene turno asignado. No se puede continuar.')
      return
    }

    setBajaLoading(true)
    try {
      const alumnoRef = doc(db, 'alumnos', curp)
      const snap = await getDoc(alumnoRef)

      if (!snap.exists()) {
        setBajaError('No se encontro un alumno con esa CURP.')
        setBajaLoading(false)
        return
      }

      const data = { id: snap.id, ...snap.data() }

      if (!isGrupoPermitido(data.grupo)) {
        setBajaError('No tienes permisos para realizar bajas de ese turno.')
        setBajaLoading(false)
        return
      }

      setBajaAlumno(data)
    } catch {
      setBajaError('No se pudo cargar el alumno. Intenta de nuevo.')
    } finally {
      setBajaLoading(false)
    }
  }

  const handleConfirmBaja = async () => {
    if (!bajaAlumno) return

    setBajaError('')
    setBajaSuccess('')

    const curpConfirm = normalizeUpper(bajaConfirmCurp)
    if (!bajaConfirmAck || curpConfirm !== normalizeUpper(bajaAlumno.curp)) {
      setBajaError('Debes confirmar la CURP y aceptar las advertencias.')
      return
    }

    setBajaDeleting(true)
    try {
      await deleteDoc(doc(db, 'alumnos', bajaAlumno.curp))
      setBajaSuccess('Alumno eliminado correctamente.')
      setBajaCurp('')
      resetBajaState()
    } catch {
      setBajaError('No se pudo eliminar el alumno. Verifica permisos e intenta de nuevo.')
    } finally {
      setBajaDeleting(false)
    }
  }

  const handleModSearchChange = (field) => (event) => {
    const value = event.target.value
    setModSearch((prev) => ({
      ...prev,
      [field]: field === 'curp' ? value.toUpperCase() : value,
    }))
  }

  const resetModState = () => {
    setModResults([])
    setModSelected(null)
    setModForm(EMPTY_FORM)
  }

  const handleBuscarModificacion = async () => {
    setModError('')
    setModSuccess('')
    resetModState()

    if (!turno) {
      setModError('Tu usuario no tiene turno asignado. No se puede continuar.')
      return
    }

    setModLoading(true)

    try {
      if (modSearchMode === 'curp') {
        const curp = normalizeUpper(modSearch.curp)

        if (!curp) {
          setModError('Ingresa la CURP del alumno.')
          setModLoading(false)
          return
        }

        if (!isValidCurp(curp)) {
          setModError('La CURP debe tener 18 caracteres alfanumericos en mayusculas.')
          setModLoading(false)
          return
        }

        const alumnoRef = doc(db, 'alumnos', curp)
        const snap = await getDoc(alumnoRef)

        if (!snap.exists()) {
          setModError('No se encontro un alumno con esa CURP.')
          setModLoading(false)
          return
        }

        const data = { id: snap.id, ...snap.data() }
        if (!isGrupoPermitido(data.grupo)) {
          setModError('No tienes permisos para modificar alumnos de ese turno.')
          setModLoading(false)
          return
        }

        setModSelected(data)
        setModForm({
          curp: data.curp ?? data.id,
          grado: String(data.grado ?? ''),
          grupo: data.grupo ?? '',
          primerApellido: data.primerApellido ?? '',
          segundoApellido: data.segundoApellido ?? '',
          nombre: data.nombre ?? '',
        })
      } else {
        const nombre = normalizeText(modSearch.nombre)
        const primerApellido = normalizeText(modSearch.primerApellido)
        const segundoApellido = normalizeText(modSearch.segundoApellido)

        if (!nombre || !primerApellido) {
          setModError('Ingresa al menos nombre y primer apellido para buscar.')
          setModLoading(false)
          return
        }

        const filters = [
          where('turno', '==', turno),
          where('nombre', '==', nombre),
          where('primerApellido', '==', primerApellido),
        ]

        if (segundoApellido) {
          filters.push(where('segundoApellido', '==', segundoApellido))
        }

        const q = query(collection(db, 'alumnos'), ...filters)
        const snap = await getDocs(q)

        if (snap.empty) {
          setModError('No se encontraron alumnos con esos datos.')
          setModLoading(false)
          return
        }

        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((row) => isGrupoPermitido(row.grupo))

        if (rows.length === 0) {
          setModError('No tienes permisos para modificar alumnos de ese turno.')
          setModLoading(false)
          return
        }

        rows.sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))
        setModResults(rows)
      }
    } catch {
      setModError('No se pudo completar la busqueda. Intenta de nuevo.')
    } finally {
      setModLoading(false)
    }
  }

  const handleSeleccionarModAlumno = (alumno) => {
    setModSelected(alumno)
    setModForm({
      curp: alumno.curp ?? alumno.id,
      grado: String(alumno.grado ?? ''),
      grupo: alumno.grupo ?? '',
      primerApellido: alumno.primerApellido ?? '',
      segundoApellido: alumno.segundoApellido ?? '',
      nombre: alumno.nombre ?? '',
    })
  }

  const handleModFormChange = (field) => (event) => {
    const value = event.target.value
    setModForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateModForm = () => {
    const { curp, grado, grupo, primerApellido, segundoApellido, nombre } = modForm

    if (!curp || !grado || !grupo || !primerApellido || !segundoApellido || !nombre) {
      setModError('Todos los campos son obligatorios para modificar el alumno.')
      return false
    }

    if (!GRADOS_VALIDOS.includes(String(grado))) {
      setModError('El grado seleccionado es invalido.')
      return false
    }

    if (!isGrupoPermitido(grupo)) {
      setModError('El grupo seleccionado no corresponde a tu turno.')
      return false
    }

    return true
  }

  const handleGuardarModificacion = async () => {
    if (!modSelected) return

    setModError('')
    setModSuccess('')

    if (!validateModForm()) return

    setModSaving(true)
    try {
      const alumnoRef = doc(db, 'alumnos', modSelected.curp ?? modSelected.id)

      await updateDoc(alumnoRef, {
        grado: String(modForm.grado),
        grupo: normalizeUpper(modForm.grupo),
        turno,
        primerApellido: normalizeText(modForm.primerApellido),
        segundoApellido: normalizeText(modForm.segundoApellido),
        nombre: normalizeText(modForm.nombre),
        updatedAt: serverTimestamp(),
      })

      setModSuccess('Informacion actualizada correctamente.')
    } catch {
      setModError('No se pudieron guardar los cambios. Intenta de nuevo.')
    } finally {
      setModSaving(false)
    }
  }

  const modSummary = useMemo(() => {
    if (!modSelected) return null
    return [
      { label: 'Alumno', value: nombreCompleto(modSelected) },
      { label: 'CURP', value: modSelected.curp ?? modSelected.id },
      { label: 'Grado', value: `${modSelected.grado ?? '-'}°` },
      { label: 'Grupo', value: modSelected.grupo ?? '-' },
    ]
  }, [modSelected])

  return (
    <div className="flex-1 bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-amber-300">category</span>
                <h1 className="text-3xl font-headline font-bold">Procesos Varios</h1>
              </div>
              <p className="text-sm text-slate-200 mt-2 max-w-2xl">
                Centraliza altas, bajas y modificaciones desde una sola vista. Las acciones respetan el turno asignado.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 min-w-[240px]">
              <p className="text-xs uppercase tracking-wider text-slate-200 font-semibold">Turno activo</p>
              <p className="text-lg font-semibold text-white mt-1">
                {turno ? (turno === 'matutino' ? 'Matutino' : 'Vespertino') : 'Sin asignar'}
              </p>
              <p className="text-xs text-slate-300 mt-1">Solo se trabaja con grupos de tu turno.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">
                Selecciona un proceso
              </h2>
              <div className="mt-4 space-y-3">
                {SECTIONS.map((section) => {
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleSelectSection(section.id)}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                        isActive ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${
                          isActive ? 'text-amber-600' : 'text-slate-500'
                        }`}
                        >
                          {section.icon}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{section.label}</p>
                          <p className="text-xs text-slate-500 mt-1">{section.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              <p className="font-semibold text-slate-700">Regla de turno</p>
              <p className="mt-2">
                No se permiten altas, bajas ni modificaciones en grupos fuera del turno asignado.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {activeSection === 'altas' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">Alta de alumno</h3>
                    <p className="text-xs text-slate-500 mt-1">Registra un nuevo alumno con los datos basicos.</p>
                  </div>
                </div>

                {altaError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {altaError}
                  </div>
                )}
                {altaSuccess && (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {altaSuccess}
                  </div>
                )}

                <form onSubmit={handleAltaSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-600 mb-2">CURP</span>
                    <input
                      type="text"
                      value={altaForm.curp}
                      onChange={handleAltaChange('curp')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="CURP del alumno"
                    />
                    {altaForm.curp.length === 18 && (() => {
                      const fn = fechaNacimientoDesdeCurp(altaForm.curp)
                      const sx = sexoDesdeCurp(altaForm.curp)
                      return fn
                        ? <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">cake</span>
                            Nacimiento: <span className="font-semibold ml-0.5">{fn}</span>
                            {sx && <span className="ml-2">· Sexo: <span className="font-semibold">{sx === 'H' ? 'Hombre' : 'Mujer'}</span></span>}
                          </p>
                        : <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            No se detectó fecha ni sexo en el CURP. Esos campos no se guardarán.
                          </p>
                    })()}
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-600 mb-2">Grado</span>
                    <select
                      value={altaForm.grado}
                      onChange={handleAltaChange('grado')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="" disabled>Selecciona un grado</option>
                      {GRADOS_VALIDOS.map((grado) => (
                        <option key={grado} value={grado}>
                          {grado}°
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-600 mb-2">Grupo</span>
                    <select
                      value={altaForm.grupo}
                      onChange={handleAltaChange('grupo')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="" disabled>Selecciona un grupo</option>
                      {gruposDisponibles.map((grupo) => (
                        <option key={grupo} value={grupo}>
                          {grupo}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-600 mb-2">Nombre</span>
                    <input
                      type="text"
                      value={altaForm.nombre}
                      onChange={handleAltaChange('nombre')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Nombre(s)"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-600 mb-2">Primer apellido</span>
                    <input
                      type="text"
                      value={altaForm.primerApellido}
                      onChange={handleAltaChange('primerApellido')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Apellido paterno"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-600 mb-2">Segundo apellido</span>
                    <input
                      type="text"
                      value={altaForm.segundoApellido}
                      onChange={handleAltaChange('segundoApellido')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Apellido materno"
                    />
                  </label>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={altaSaving}
                      className="w-full rounded-xl bg-amber-500 text-white font-semibold py-3 shadow-sm hover:bg-amber-600 transition disabled:opacity-60"
                    >
                      {altaSaving ? 'Guardando...' : 'Registrar alumno'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === 'bajas' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">Baja de alumno</h3>
                <p className="text-xs text-slate-500 mt-1">Busca por CURP y confirma antes de eliminar.</p>

                {bajaError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {bajaError}
                  </div>
                )}
                {bajaSuccess && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {bajaSuccess}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <input
                    type="text"
                    value={bajaCurp}
                    onChange={(event) => setBajaCurp(event.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="CURP del alumno"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarBaja}
                    disabled={bajaLoading}
                    className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
                  >
                    {bajaLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                {bajaAlumno && (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{nombreCompleto(bajaAlumno)}</p>
                      <p className="text-xs text-slate-500 mt-1">CURP: {bajaAlumno.curp}</p>
                      <p className="text-xs text-slate-500">Grado: {bajaAlumno.grado}° {bajaAlumno.grupo}</p>
                    </div>

                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <p className="font-semibold">Advertencias</p>
                      <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                        <li>Esta accion elimina el registro principal del alumno.</li>
                        <li>Verifica que la CURP sea correcta antes de confirmar.</li>
                        <li>Esta operacion no se puede deshacer.</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="block text-xs font-semibold text-slate-600 mb-2">Confirmar CURP</span>
                        <input
                          type="text"
                          value={bajaConfirmCurp}
                          onChange={(event) => setBajaConfirmCurp(event.target.value.toUpperCase())}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                          placeholder="Escribe la CURP para confirmar"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 mt-6">
                        <input
                          type="checkbox"
                          checked={bajaConfirmAck}
                          onChange={(event) => setBajaConfirmAck(event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                        />
                        Confirmo que deseo eliminar este alumno.
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmBaja}
                      disabled={bajaDeleting}
                      className="w-full rounded-xl bg-red-600 text-white font-semibold py-3 shadow-sm hover:bg-red-700 transition disabled:opacity-60"
                    >
                      {bajaDeleting ? 'Eliminando...' : 'Eliminar alumno'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'modificaciones' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">Modificaciones</h3>
                  <p className="text-xs text-slate-500 mt-1">Busca por CURP o por nombre y apellido.</p>
                </div>

                {modError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {modError}
                  </div>
                )}
                {modSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {modSuccess}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setModSearchMode('curp')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      modSearchMode === 'curp'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Buscar por CURP
                  </button>
                  <button
                    type="button"
                    onClick={() => setModSearchMode('nombre')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      modSearchMode === 'nombre'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Buscar por nombre
                  </button>
                </div>

                {modSearchMode === 'curp' ? (
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <input
                      type="text"
                      value={modSearch.curp}
                      onChange={handleModSearchChange('curp')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="CURP del alumno"
                    />
                    <button
                      type="button"
                      onClick={handleBuscarModificacion}
                      disabled={modLoading}
                      className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
                    >
                      {modLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={modSearch.nombre}
                      onChange={handleModSearchChange('nombre')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="Nombre"
                    />
                    <input
                      type="text"
                      value={modSearch.primerApellido}
                      onChange={handleModSearchChange('primerApellido')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="Primer apellido"
                    />
                    <input
                      type="text"
                      value={modSearch.segundoApellido}
                      onChange={handleModSearchChange('segundoApellido')}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="Segundo apellido (opcional)"
                    />
                    <button
                      type="button"
                      onClick={handleBuscarModificacion}
                      disabled={modLoading}
                      className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
                    >
                      {modLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                )}

                {modResults.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Resultados</p>
                    <div className="mt-3 space-y-2">
                      {modResults.map((alumno) => (
                        <button
                          key={alumno.id}
                          type="button"
                          onClick={() => handleSeleccionarModAlumno(alumno)}
                          className="w-full text-left rounded-lg border border-slate-200 bg-white px-4 py-2 hover:border-slate-300"
                        >
                          <p className="text-sm font-semibold text-slate-800">{nombreCompleto(alumno)}</p>
                          <p className="text-xs text-slate-500">CURP: {alumno.curp ?? alumno.id} · {alumno.grado}° {alumno.grupo}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {modSelected && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {modSummary?.map((item) => (
                        <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{item.label}</p>
                          <p className="text-sm text-slate-900 mt-1">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="block text-xs font-semibold text-slate-600 mb-2">CURP</span>
                        <input
                          type="text"
                          value={modForm.curp}
                          disabled
                          className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-600"
                        />
                      </label>

                      <label className="block">
                        <span className="block text-xs font-semibold text-slate-600 mb-2">Grado</span>
                        <select
                          value={modForm.grado}
                          onChange={handleModFormChange('grado')}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          <option value="" disabled>Selecciona un grado</option>
                          {GRADOS_VALIDOS.map((grado) => (
                            <option key={grado} value={grado}>
                              {grado}°
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="block text-xs font-semibold text-slate-600 mb-2">Grupo</span>
                        <select
                          value={modForm.grupo}
                          onChange={handleModFormChange('grupo')}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          <option value="" disabled>Selecciona un grupo</option>
                          {gruposDisponibles.map((grupo) => (
                            <option key={grupo} value={grupo}>
                              {grupo}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="block text-xs font-semibold text-slate-600 mb-2">Nombre</span>
                        <input
                          type="text"
                          value={modForm.nombre}
                          onChange={handleModFormChange('nombre')}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </label>

                      <label className="block">
                        <span className="block text-xs font-semibold text-slate-600 mb-2">Primer apellido</span>
                        <input
                          type="text"
                          value={modForm.primerApellido}
                          onChange={handleModFormChange('primerApellido')}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </label>

                      <label className="block">
                        <span className="block text-xs font-semibold text-slate-600 mb-2">Segundo apellido</span>
                        <input
                          type="text"
                          value={modForm.segundoApellido}
                          onChange={handleModFormChange('segundoApellido')}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleGuardarModificacion}
                      disabled={modSaving}
                      className="w-full rounded-xl bg-slate-900 text-white font-semibold py-3 shadow-sm hover:bg-slate-800 transition disabled:opacity-60"
                    >
                      {modSaving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'niev' && (
              <div className="space-y-6">

                {/* Mensajes globales */}
                {nievError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{nievError}</div>
                )}
                {nievSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{nievSuccess}</div>
                )}

                {/* ── Paso 1: Generar hoja base ── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">
                      Paso 1 — Generar hoja base
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Selecciona el grado y grupo para descargar un archivo Excel con los alumnos listos para que captures el NIEV.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-1.5">Grado</span>
                      <select
                        value={nievGrado}
                        onChange={(e) => setNievGrado(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Selecciona</option>
                        {GRADOS_VALIDOS.map((g) => (
                          <option key={g} value={g}>{g}°</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-600 mb-1.5">Grupo</span>
                      <select
                        value={nievGrupo}
                        onChange={(e) => setNievGrupo(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Selecciona</option>
                        {gruposDisponibles.map((g) => (
                          <option key={g} value={g}>Grupo {g}</option>
                        ))}
                      </select>
                    </label>

                    <div className="md:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleGenerarHojaBaseNiev}
                        disabled={nievLoadingBase || !nievGrado || !nievGrupo}
                        className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                          !nievLoadingBase && nievGrado && nievGrupo
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        {nievLoadingBase ? 'Generando...' : 'Descargar hoja base'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    El archivo descargado contiene: <span className="font-semibold">CURP, Primer Apellido, Segundo Apellido, Nombre, NIEV</span>.
                    Si el alumno ya tiene NIEV registrado, aparecerá pre-llenado. Solo llena o corrige el campo NIEV y sube el archivo en el Paso 2.
                  </div>
                </div>

                {/* ── Paso 2: Subir archivo llenado ── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">
                      Paso 2 — Subir archivo con NIEV
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Sube el archivo Excel o CSV con la columna NIEV llenada. Las filas con NIEV vacío se ignoran.
                      El sistema actualiza cada alumno identificado por su CURP, sin importar el grado o grupo seleccionado arriba
                      (el filtro de grado/grupo solo aplica para generar la hoja base del Paso 1).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Archivo (.xlsx, .xls, .csv)</label>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => {
                          setNievFile(e.target.files?.[0] ?? null)
                          resetNievImport()   // solo limpia resultados, no el archivo
                        }}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-700 hover:file:bg-amber-200"
                      />
                      {nievFile && (
                        <p className="mt-1 text-xs text-slate-500">Archivo seleccionado: <span className="font-semibold">{nievFile.name}</span></p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAnalizarNiev}
                      disabled={nievParsing || !nievFile}
                      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        !nievParsing && nievFile
                          ? 'bg-slate-800 text-white hover:bg-slate-900'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {nievParsing ? 'Analizando...' : 'Analizar archivo'}
                    </button>
                  </div>

                  {nievParseError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{nievParseError}</div>
                  )}

                  {/* Contadores */}
                  {(nievValidRows.length > 0 || nievErrors.length > 0) && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs text-emerald-700 uppercase font-semibold tracking-wide">Filas válidas</p>
                        <p className="text-2xl font-bold text-emerald-800">{nievValidRows.length}</p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs text-amber-700 uppercase font-semibold tracking-wide">Con error / ignoradas</p>
                        <p className="text-2xl font-bold text-amber-800">{nievErrors.length}</p>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {nievValidRows.length > 0 && (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <p className="text-sm font-semibold text-slate-700">
                          Previsualización ({Math.min(nievValidRows.length, 8)} de {nievValidRows.length} filas)
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white border-b border-slate-200">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">CURP</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">NIEV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nievValidRows.slice(0, 8).map((row) => (
                              <tr key={row.curp} className="border-b border-slate-100">
                                <td className="px-3 py-2 text-xs font-mono text-slate-700">{row.curp}</td>
                                <td className="px-3 py-2 text-sm font-semibold text-slate-800">{row.niev}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Errores de validación */}
                  {nievErrors.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-800 mb-2">Detalle de errores / filas omitidas</p>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {nievErrors.slice(0, 30).map((err, idx) => (
                          <p key={idx} className="text-xs text-amber-800">• {err}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirmar */}
                  {nievValidRows.length > 0 && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => resetNievImport(true)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                      >
                        Limpiar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmImportNiev}
                        disabled={nievImporting}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-60"
                      >
                        {nievImporting ? 'Guardando...' : `Confirmar NIEV (${nievValidRows.length} alumnos)`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'exportaciones' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-slate-500 text-3xl">file_download</span>
                </div>
                <h3 className="text-lg font-headline font-bold text-slate-800">Exportaciones</h3>
                <p className="text-sm text-slate-500 mt-2">Este modulo se configurara en una siguiente fase.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcesosVariosView
