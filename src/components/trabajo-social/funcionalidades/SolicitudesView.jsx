function SolicitudesView() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-600 text-2xl">cloud_download</span>
          </div>
          <div>
            <h2 className="text-xl font-headline font-bold text-slate-900">Solicitudes Digitales</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Revisión y aprobación de datos enviados por tutores a través del formulario en línea.
            </p>
          </div>
        </div>
      </div>

      {/* Flujo del proceso */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-headline font-bold text-slate-700 uppercase tracking-wide mb-5">
          Flujo del proceso digital
        </h3>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {[
            { step: '1', icon: 'qr_code_2',      color: 'slate',   title: 'El tutor escanea el QR',        desc: 'Desde el enlace o código QR proporcionado por la escuela accede al formulario en línea.' },
            { step: '2', icon: 'edit_note',       color: 'sky',     title: 'Llena sus datos',               desc: 'Ingresa el CURP del alumno y completa la hoja de inscripción digital desde su celular o computadora.' },
            { step: '3', icon: 'pending_actions', color: 'amber',   title: 'Queda pendiente de revisión',   desc: 'Los datos llegan a este panel como solicitud pendiente. No se aplican automáticamente.' },
            { step: '4', icon: 'task_alt',        color: 'emerald', title: 'Trabajo Social aprueba',        desc: 'Verificas la información, corriges si es necesario, y confirmas para guardarla en el expediente oficial.' },
          ].map((s) => (
            <div key={s.step} className="flex-1 flex flex-col items-center text-center gap-2">
              <div className={`w-10 h-10 rounded-full bg-${s.color}-100 flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-${s.color}-600 text-xl`}>{s.icon}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest text-${s.color}-600`}>Paso {s.step}</span>
              <p className="text-xs font-semibold text-slate-800">{s.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-400 text-3xl">construction</span>
        </div>
        <p className="text-sm font-semibold text-slate-700">Vista en desarrollo</p>
        <p className="text-xs text-slate-400 max-w-sm">
          Aquí verás la lista de solicitudes pendientes enviadas por tutores, con la opción de
          revisar, editar y aprobar cada una para integrarla al expediente oficial del alumno.
        </p>
        <span className="inline-block mt-1 text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">
          Próximamente
        </span>
      </div>
    </div>
  )
}

export default SolicitudesView
