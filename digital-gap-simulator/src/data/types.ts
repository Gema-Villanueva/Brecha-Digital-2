/**
 * Data layer types. Raw CSV columns map into game metrics; see loadRegions.ts for normalization.
 */

export interface CsvRow {
  comunidad: string
  anio: number
  banda_ancha_pct: number
  renta_media: number
  arope_pct: number
  paro_pct: number
  ordenadores_unidad: number
}

/** One row of policy spend drafted for the current round (integer units per action). */
export interface RoundAllocation {
  internet: number
  devices: number
  education: number
  social: number
}

export type ActionKind = keyof RoundAllocation

/**
 * Full per-region simulation state. `csv*` are immutable anchors from the dataset;
 * live metrics update each round from investments + drift (simulation.ts).
 */
export interface RegionRuntime {
  id: string
  name: string
  year: number
  /** Original CSV values (for transparency and poverty risk terms). */
  csv: {
    banda_ancha_pct: number
    renta_media: number
    arope_pct: number
    paro_pct: number
    ordenadores_unidad: number
  }
  /** Anchors from year 0 (after load); used so improvements stack from real baselines. */
  initialInternet: number
  initialIncomeLevel: number
  initialEducationLevel: number
  initialDeviceAccess: number
  /** Cumulative policy units applied across all past rounds. */
  infraUnits: number
  deviceUnits: number
  educationUnits: number
  socialUnits: number
  /** Current displayed metrics (0–100). */
  internetAccess: number
  incomeLevel: number
  educationLevel: number
  deviceAccess: number
  /** Game composite index: higher = worse digital exclusion (not the notebook ML model). */
  digitalPoverty: number
}
