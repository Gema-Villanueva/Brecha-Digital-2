/**
 * Pure game simulation: no React.
 *
 * How it works:
 * - Regions are initialized from real CSV metrics (see loadRegions).
 * - Each round the player spends budget on four action types; units accumulate on each region.
 * - We recompute internet, income, education, and device scores from anchors + stacked units + small drift.
 * - Digital poverty is recomputed as a weighted mix of AROPE/paro (eased by social spend) and gaps in the four metrics.
 * - A parallel “baseline” run uses the same recalc but zero spend and slightly worse drift so the chart shows inequality without policy.
 */

import type { RegionRuntime, RoundAllocation } from '../data/types'
import { ACTION_COST, GAME_SEED, TOTAL_ROUNDS } from './constants'

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** Deterministic 0–1 hash from strings + ints (portable PRNG tap). */
export function hash01(seed: number, ...parts: (string | number)[]): number {
  let h = seed >>> 0
  for (const p of parts) {
    const s = String(p)
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(31, h) + s.charCodeAt(i)
      h >>>= 0
    }
  }
  return (h % 100000) / 100000
}

function drift(seed: number, regionId: string, roundIndex: number, salt: string, magnitude: number): number {
  const t = hash01(seed, regionId, roundIndex, salt)
  return (t - 0.5) * 2 * magnitude
}

function deriveDigitalPovertyLive(r: RegionRuntime): number {
  const socialEase = Math.min(0.42, r.socialUnits * 0.035)
  const aropeEff = r.csv.arope_pct * (1 - socialEase)
  const paroEff = r.csv.paro_pct * (1 - socialEase * 0.85)
  return clamp(
    0.24 * aropeEff +
      0.2 * paroEff +
      0.2 * (100 - r.internetAccess) +
      0.14 * (100 - r.incomeLevel) +
      0.12 * (100 - r.educationLevel) +
      0.1 * (100 - r.deviceAccess),
    0,
    100,
  )
}

/**
 * Recalculate displayed metrics after investments (units) and round noise.
 * `branch === 'baseline'` adds structural worsening so “no intervention” trends upward on the chart.
 */
export function recalculateRegion(
  r: RegionRuntime,
  roundIndex: number,
  branch: 'player' | 'baseline',
  seed: number,
): void {
  const baseWorsen = branch === 'baseline' ? 0.18 * roundIndex : 0

  r.internetAccess = clamp(
    r.initialInternet +
      r.infraUnits * 0.32 +
      r.educationUnits * 0.1 +
      drift(seed, r.id, roundIndex, 'inet', 0.45) -
      baseWorsen * 0.35,
    0,
    100,
  )

  r.educationLevel = clamp(
    r.initialEducationLevel + r.educationUnits * 0.28 + r.socialUnits * 0.06 + drift(seed, r.id, roundIndex, 'edu', 0.4),
    0,
    100,
  )

  r.deviceAccess = clamp(
    r.initialDeviceAccess +
      r.deviceUnits * 0.26 +
      r.infraUnits * 0.07 +
      drift(seed, r.id, roundIndex, 'dev', 0.42),
    0,
    100,
  )

  r.incomeLevel = clamp(
    r.initialIncomeLevel + r.socialUnits * 0.24 + drift(seed, r.id, roundIndex, 'inc', 0.38),
    0,
    100,
  )

  let poverty = deriveDigitalPovertyLive(r)
  poverty += drift(seed, r.id, roundIndex, 'pov', 0.35)
  poverty += baseWorsen
  r.digitalPoverty = clamp(poverty, 0, 100)
}

export function recalculateAll(regions: RegionRuntime[], roundIndex: number, branch: 'player' | 'baseline', seed: number): void {
  for (const r of regions) recalculateRegion(r, roundIndex, branch, seed)
}

export function cloneRegions(regions: RegionRuntime[]): RegionRuntime[] {
  return regions.map((r) => ({
    ...r,
    csv: { ...r.csv },
  }))
}

export function meanDigitalPoverty(regions: RegionRuntime[]): number {
  if (regions.length === 0) return 0
  const s = regions.reduce((a, r) => a + r.digitalPoverty, 0)
  return s / regions.length
}

/** Baseline: same rounds, zero spend, baseline branch drift (inequality creeps). Index 0 = same initial mean as the real dataset snapshot. */
export function computeBaselineHistory(initial: RegionRuntime[], seed: number = GAME_SEED): number[] {
  const regions = cloneRegions(initial)
  const history = [meanDigitalPoverty(regions)]
  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    recalculateAll(regions, round, 'baseline', seed)
    history.push(meanDigitalPoverty(regions))
  }
  return history
}

export function createEmptyPending(regionIds: string[]): Record<string, RoundAllocation> {
  const out: Record<string, RoundAllocation> = {}
  for (const id of regionIds) {
    out[id] = { internet: 0, devices: 0, education: 0, social: 0 }
  }
  return out
}

export function totalPendingCost(pending: Record<string, RoundAllocation>): number {
  let t = 0
  for (const id of Object.keys(pending)) {
    const a = pending[id]
    if (!a) continue
    t += a.internet * ACTION_COST.internet
    t += a.devices * ACTION_COST.devices
    t += a.education * ACTION_COST.education
    t += a.social * ACTION_COST.social
  }
  return t
}

const EMPTY_ALLOCATION: RoundAllocation = { internet: 0, devices: 0, education: 0, social: 0 }

/**
 * Approximate metrics if the current round’s draft were applied now (no random drift).
 * Used so bars react when the player taps +/- before confirming the round.
 */
export function estimateRegionAfterDraft(region: RegionRuntime, draft: RoundAllocation) {
  const infra = region.infraUnits + draft.internet
  const deviceU = region.deviceUnits + draft.devices
  const educationU = region.educationUnits + draft.education
  const socialU = region.socialUnits + draft.social

  const internetAccess = clamp(region.initialInternet + infra * 0.32 + educationU * 0.1, 0, 100)
  const educationLevel = clamp(region.initialEducationLevel + educationU * 0.28 + socialU * 0.06, 0, 100)
  const deviceAccess = clamp(region.initialDeviceAccess + deviceU * 0.26 + infra * 0.07, 0, 100)
  const incomeLevel = clamp(region.initialIncomeLevel + socialU * 0.24, 0, 100)

  const socialEase = Math.min(0.42, socialU * 0.035)
  const aropeEff = region.csv.arope_pct * (1 - socialEase)
  const paroEff = region.csv.paro_pct * (1 - socialEase * 0.85)
  const digitalPoverty = clamp(
    0.24 * aropeEff +
      0.2 * paroEff +
      0.2 * (100 - internetAccess) +
      0.14 * (100 - incomeLevel) +
      0.12 * (100 - educationLevel) +
      0.1 * (100 - deviceAccess),
    0,
    100,
  )

  return { internetAccess, incomeLevel, educationLevel, deviceAccess, digitalPoverty }
}

export function applyPendingToRegions(regions: RegionRuntime[], pending: Record<string, RoundAllocation>): void {
  for (const r of regions) {
    const a = pending[r.id] ?? EMPTY_ALLOCATION
    r.infraUnits += a.internet
    r.deviceUnits += a.devices
    r.educationUnits += a.education
    r.socialUnits += a.social
  }
}

export function snapshotPoverty(regions: RegionRuntime[]): { id: string; name: string; digitalPoverty: number }[] {
  return regions.map((r) => ({ id: r.id, name: r.name, digitalPoverty: r.digitalPoverty }))
}

/** Largest poverty decrease this round (after confirm), for feedback copy. */
export function bestImprover(
  before: { id: string; name: string; digitalPoverty: number }[],
  after: RegionRuntime[],
): { name: string; delta: number } | null {
  let best: { name: string; delta: number } | null = null
  const map = new Map(before.map((r) => [r.id, r.digitalPoverty]))
  for (const r of after) {
    const prev = map.get(r.id)
    if (prev === undefined) continue
    const delta = prev - r.digitalPoverty
    if (delta > 0 && (!best || delta > best.delta)) best = { name: r.name, delta }
  }
  return best
}

export function worstPerformer(regions: RegionRuntime[]): { name: string; poverty: number } | null {
  if (!regions.length) return null
  return regions.reduce(
    (w, r) => (r.digitalPoverty > w.poverty ? { name: r.name, poverty: r.digitalPoverty } : w),
    { name: regions[0].name, poverty: regions[0].digitalPoverty },
  )
}
