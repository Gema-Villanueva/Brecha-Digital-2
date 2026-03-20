import Papa from 'papaparse'
import type { CsvRow, RegionRuntime } from './types'

/**
 * Fixes common UTF-8 read as Latin-1 artifacts in comunidad names (dataset may show "AndalucÃ­a").
 */
function fixMojibake(name: string): string {
  const map: Record<string, string> = {
    'AndalucÃ­a': 'Andalucía',
    'AragÃ³n': 'Aragón',
    'Castilla y LeÃ³n': 'Castilla y León',
    'CataluÃ±a': 'Cataluña',
    'PaÃ­s Vasco': 'País Vasco',
  }
  return map[name] ?? name
}

function slugId(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** Min–max scale to 0–100 across the batch (used for renta and ordenadores). */
function minMaxTo100(values: number[], v: number): number {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max <= min) return 50
  return ((v - min) / (max - min)) * 100
}

/**
 * Composite digital poverty (0–100, higher = worse). Weighted mix of social risk (AROPE, paro)
 * and gaps in connectivity / income / education / devices — a game heuristic, not INE official.
 */
function deriveDigitalPoverty(params: {
  arope: number
  paro: number
  internet: number
  income: number
  education: number
  devices: number
}): number {
  const { arope, paro, internet, income, education, devices } = params
  return clamp(
    0.24 * arope +
      0.2 * paro +
      0.2 * (100 - internet) +
      0.14 * (100 - income) +
      0.12 * (100 - education) +
      0.1 * (100 - devices),
    0,
    100,
  )
}

function parseRow(r: Record<string, string>): CsvRow | null {
  const comunidad = (r.comunidad ?? '').trim()
  if (!comunidad) return null
  const num = (k: string) => {
    const x = Number(String(r[k] ?? '').replace(',', '.'))
    return Number.isFinite(x) ? x : NaN
  }
  const anio = num('anio')
  const banda_ancha_pct = num('banda_ancha_pct')
  const renta_media = num('renta_media')
  const arope_pct = num('arope_pct')
  const paro_pct = num('paro_pct')
  const ordenadores_unidad = num('ordenadores_unidad')
  if ([anio, banda_ancha_pct, renta_media, arope_pct, paro_pct, ordenadores_unidad].some((x) => Number.isNaN(x))) {
    return null
  }
  return {
    comunidad,
    anio,
    banda_ancha_pct,
    renta_media,
    arope_pct,
    paro_pct,
    ordenadores_unidad,
  }
}

/**
 * Fetches dataset_maestro_limpio.csv from /public and builds RegionRuntime[] with real baselines.
 */
export async function loadRegions(csvUrl = '/dataset_maestro_limpio.csv'): Promise<RegionRuntime[]> {
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error(`No se pudo cargar el CSV (${res.status})`)
  const text = await res.text()
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  if (parsed.errors.length) {
    const msg = parsed.errors.map((e) => e.message).join('; ')
    throw new Error(`CSV inválido: ${msg}`)
  }

  const rows: CsvRow[] = []
  for (const row of parsed.data) {
    const pr = parseRow(row)
    if (pr) rows.push(pr)
  }
  if (rows.length === 0) throw new Error('El CSV no contiene filas válidas.')

  const rentas = rows.map((r) => r.renta_media)
  const ordenadores = rows.map((r) => r.ordenadores_unidad)

  const result: RegionRuntime[] = rows.map((row) => {
    const name = fixMojibake(row.comunidad)
    const incomeLevel = minMaxTo100(rentas, row.renta_media)
    const educationLevel = minMaxTo100(ordenadores, row.ordenadores_unidad)
    const deviceAccess = clamp(0.65 * educationLevel + 0.35 * incomeLevel, 0, 100)
    const internetAccess = clamp(row.banda_ancha_pct, 0, 100)

    const digitalPoverty = deriveDigitalPoverty({
      arope: row.arope_pct,
      paro: row.paro_pct,
      internet: internetAccess,
      income: incomeLevel,
      education: educationLevel,
      devices: deviceAccess,
    })

    return {
      id: slugId(name),
      name,
      year: row.anio,
      csv: {
        banda_ancha_pct: row.banda_ancha_pct,
        renta_media: row.renta_media,
        arope_pct: row.arope_pct,
        paro_pct: row.paro_pct,
        ordenadores_unidad: row.ordenadores_unidad,
      },
      initialInternet: internetAccess,
      initialIncomeLevel: incomeLevel,
      initialEducationLevel: educationLevel,
      initialDeviceAccess: deviceAccess,
      infraUnits: 0,
      deviceUnits: 0,
      educationUnits: 0,
      socialUnits: 0,
      internetAccess,
      incomeLevel,
      educationLevel,
      deviceAccess,
      digitalPoverty,
    }
  })

  return result
}
