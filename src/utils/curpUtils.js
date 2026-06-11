/**
 * Extrae el sexo de un CURP desde la posición 10 (H = Hombre, M = Mujer).
 * Retorna 'H', 'M', o null si el CURP es demasiado corto o el carácter no es válido.
 */
export function sexoDesdeCurp(curp) {
  if (!curp || curp.length < 11) return null
  const char = curp[10].toUpperCase()
  return char === 'H' || char === 'M' ? char : null
}

/**
 * Extrae la fecha de nacimiento de un CURP (posiciones 4-9: AAMMDD).
 * Retorna un string "YYYY-MM-DD" o null si las posiciones no contienen una fecha válida.
 *
 * Regla de siglo: YY <= últimos 2 dígitos del año actual → 2000s, YY > → 1900s.
 * Ejemplo: en 2026, YY 00-26 → 2000-2026, YY 27-99 → 1927-1999.
 */
export function fechaNacimientoDesdeCurp(curp) {
  if (!curp || curp.length < 10) return null

  const yy = parseInt(curp.substring(4, 6), 10)
  const mm = parseInt(curp.substring(6, 8), 10)
  const dd = parseInt(curp.substring(8, 10), 10)

  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null

  const currentYY = new Date().getFullYear() % 100
  const century = yy <= currentYY ? 2000 : 1900
  const anio = century + yy

  const mesStr = String(mm).padStart(2, '0')
  const diaStr = String(dd).padStart(2, '0')

  return `${anio}-${mesStr}-${diaStr}`
}
