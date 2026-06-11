import {
  AREAS_CURRICULARES,
  ASIGNATURAS_REGULARES,
  BLOQUES,
  normalizeInputValue,
} from './evaluacionBloqueConfig'

function EvaluacionBloqueTab({
  block,
  calificaciones,
  onChange,
  onSave,
  saving,
  blockAverage,
  generalAverage,
  updatedAt,
}) {
  const observacionValue = normalizeInputValue(calificaciones.observaciones?.[block.id])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bloque activo</p>
          <p className="mt-2 text-lg font-headline font-bold text-slate-900">{block.label}</p>
          <p className="text-sm text-slate-600 mt-1">Periodo a guardar: {block.shortLabel}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Promedio estimado</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{blockAverage === '' ? '--' : blockAverage}</p>
          <p className="text-sm text-emerald-700/80 mt-1">Con base en las calificaciones capturadas del bloque.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Promedio general</p>
          <p className="mt-2 text-2xl font-bold text-indigo-700">{generalAverage === '' ? '--' : generalAverage}</p>
          <p className="text-sm text-indigo-700/80 mt-1">Se actualiza con todas las asignaturas y áreas.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">Inasistencias</h3>
            <p className="text-xs text-slate-500 mt-1">Registra el número de faltas durante este bloque.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-semibold text-slate-700 mb-2">Inasistencias - {block.shortLabel}</span>
            <input
              type="number"
              min="0"
              value={normalizeInputValue(calificaciones.inasistencias?.[block.id])}
              onChange={(e) => onChange(`inasistencias.${block.id}`, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="0"
            />
          </label>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">Consejo</p>
            <p className="text-xs text-amber-800 mt-1">Registra las faltas totales del bloque. Esto ayuda a identificar patrones de inasistencia.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">Observaciones</h3>
            <p className="text-xs text-slate-500 mt-1">
              1 = información insuficiente, 2 = sin información, vacío = sin observaciones.
            </p>
          </div>
          <div className="text-xs text-slate-400">Última actualización: {updatedAt}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-sm font-semibold text-slate-700 mb-2">Observación {block.shortLabel}</span>
            <select
              value={observacionValue}
              onChange={(e) => onChange(`observaciones.${block.id}`, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Sin observaciones</option>
              <option value="1">1 - Información insuficiente</option>
              <option value="2">2 - Sin información</option>
            </select>
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-800">Bloques disponibles</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {BLOQUES.map((item) => (
                <span
                  key={item.id}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    item.id === block.id
                      ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                      : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  {item.shortLabel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">Asignaturas Regulares</h3>
            <p className="text-xs text-slate-500 mt-1">Captura calificación y recuperación cuando aplique.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Asignatura</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Calificación</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">R</th>
              </tr>
            </thead>
            <tbody>
              {ASIGNATURAS_REGULARES.map((subject) => {
                const calField = `${block.id}_cal`
                const recField = `${block.id}_r`
                const calValue = normalizeInputValue(
                  calificaciones.asignaturasRegulares?.[subject.key]?.[calField],
                )
                const recValue = normalizeInputValue(
                  calificaciones.asignaturasRegulares?.[subject.key]?.[recField],
                )
                const calNumber = Number(calValue)
                const disableRecuperacion = calValue.trim() !== '' && Number.isFinite(calNumber) && calNumber > 6
                return (
                  <tr key={subject.key} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-800">{subject.label}</td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={calValue}
                        onChange={(e) => {
                          const nextValue = e.target.value
                          onChange(`asignaturasRegulares.${subject.key}.${calField}`, nextValue)

                          const nextNumber = Number(nextValue)
                          const shouldDisableRec =
                            nextValue.trim() !== '' && Number.isFinite(nextNumber) && nextNumber > 6

                          if (shouldDisableRec) {
                            onChange(`asignaturasRegulares.${subject.key}.${recField}`, '')
                          }
                        }}
                        className="w-full max-w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="0.0"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={recValue}
                        onChange={(e) => onChange(`asignaturasRegulares.${subject.key}.${recField}`, e.target.value)}
                        disabled={disableRecuperacion}
                        className={`w-full max-w-32 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                          disableRecuperacion
                            ? 'border-slate-200 bg-slate-100 text-slate-400 focus:ring-slate-200'
                            : 'border-slate-300 text-slate-900 focus:ring-rose-500'
                        }`}
                        placeholder={disableRecuperacion ? 'N/A' : 'R'}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-headline font-bold text-slate-800 uppercase tracking-wide">Areas Curriculares</h3>
            <p className="text-xs text-slate-500 mt-1">Estas áreas no manejan recuperación.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Area</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Calificación</th>
              </tr>
            </thead>
            <tbody>
              {AREAS_CURRICULARES.map((area) => {
                const calField = `${block.id}_cal`
                return (
                  <tr key={area.key} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-800">{area.label}</td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={normalizeInputValue(calificaciones.areasCurriculares?.[area.key]?.[calField])}
                        onChange={(e) => onChange(`areasCurriculares.${area.key}.${calField}`, e.target.value)}
                        className="w-full max-w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="0.0"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
        >
          {saving ? 'Guardando...' : `Guardar ${block.label}`}
        </button>
      </div>
    </div>
  )
}

export default EvaluacionBloqueTab
