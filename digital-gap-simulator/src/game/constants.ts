import type { ActionKind } from '../data/types'

/** Reproducible noise for drift (same seed → same “world events”). */
export const GAME_SEED = 42

export const TOTAL_ROUNDS = 5

/** Points available each round to allocate across regions (design: every turn stays meaningful). */
export const BUDGET_PER_ROUND = 100

/** Cost per +1 unit of each action in the current round’s draft. */
export const ACTION_COST: Record<ActionKind, number> = {
  internet: 8,
  devices: 8,
  education: 7,
  social: 6,
}

/** Max units a player can draft per region per action per round (keeps UI sane). */
export const MAX_UNITS_PER_ACTION_PER_REGION = 12
