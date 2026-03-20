import { BUDGET_PER_ROUND } from '../game/constants'

interface BudgetMeterProps {
  remaining: number
  pendingSpend: number
}

export function BudgetMeter({ remaining, pendingSpend }: BudgetMeterProps) {
  const used = pendingSpend
  const pct = BUDGET_PER_ROUND > 0 ? (used / BUDGET_PER_ROUND) * 100 : 0
  return (
    <div className="budget-meter">
      <div className="budget-meter__top">
        <span className="budget-meter__title">Presupuesto del turno</span>
        <span className="budget-meter__nums">
          <strong>{remaining}</strong>
          <span className="budget-meter__sep">/</span>
          {BUDGET_PER_ROUND} pts
        </span>
      </div>
      <div className="budget-meter__track" aria-hidden>
        <div className="budget-meter__fill budget-meter__fill--committed" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <p className="budget-meter__hint">Asigna inversión en cada tarjeta; confirma cuando sume ≤ {BUDGET_PER_ROUND}.</p>
    </div>
  )
}
