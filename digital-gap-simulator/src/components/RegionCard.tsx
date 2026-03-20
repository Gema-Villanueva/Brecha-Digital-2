import { useMemo } from 'react'
import type { RegionRuntime, RoundAllocation, ActionKind } from '../data/types'
import { ACTION_COST, MAX_UNITS_PER_ACTION_PER_REGION } from '../game/constants'
import { estimateRegionAfterDraft } from '../game/simulation'
import { MetricBar } from './MetricBar'

const ACTION_LABELS: Record<ActionKind, string> = {
  internet: 'Infra internet',
  devices: 'Dispositivos',
  education: 'Educación',
  social: 'Programas sociales',
}

interface RegionCardProps {
  region: RegionRuntime
  allocation: RoundAllocation
  budgetRemaining: number
  onChange: (regionId: string, action: ActionKind, delta: number) => void
  /** Final state: show metrics only (no investment controls). */
  readOnly?: boolean
}

export function RegionCard({ region, allocation, budgetRemaining, onChange, readOnly }: RegionCardProps) {
  const draftSum = allocation.internet + allocation.devices + allocation.education + allocation.social
  const metrics = useMemo(() => {
    if (readOnly || draftSum === 0) {
      return {
        internetAccess: region.internetAccess,
        incomeLevel: region.incomeLevel,
        educationLevel: region.educationLevel,
        deviceAccess: region.deviceAccess,
        digitalPoverty: region.digitalPoverty,
      }
    }
    return estimateRegionAfterDraft(region, allocation)
  }, [readOnly, draftSum, region, allocation])

  return (
    <article className="region-card">
      <header className="region-card__head">
        <h3 className="region-card__name">{region.name}</h3>
        <span className="region-card__year">{region.year}</span>
      </header>
      {draftSum > 0 && !readOnly && <p className="region-card__preview-hint">Vista previa (sin azar del turno)</p>}
      <div className="region-card__metrics">
        <MetricBar label="Acceso internet" value={metrics.internetAccess} />
        <MetricBar label="Nivel renta (norm.)" value={metrics.incomeLevel} />
        <MetricBar label="Educación digital" value={metrics.educationLevel} />
        <MetricBar label="Acceso dispositivos" value={metrics.deviceAccess} />
        <MetricBar label="Pobreza digital" value={metrics.digitalPoverty} invert />
      </div>
      {readOnly ? (
        <p className="region-card__done">Resultado final de la simulación</p>
      ) : (
      <div className="region-card__actions">
        {(Object.keys(ACTION_LABELS) as ActionKind[]).map((action) => {
          const units = allocation[action]
          const maxUp = Math.min(MAX_UNITS_PER_ACTION_PER_REGION - units, Math.floor(budgetRemaining / ACTION_COST[action]))
          const canInc = maxUp > 0
          const canDec = units > 0
          return (
            <div key={action} className="region-card__action-row">
              <span className="region-card__action-label">{ACTION_LABELS[action]}</span>
              <span className="region-card__action-cost">{ACTION_COST[action]} pts/nivel</span>
              <div className="region-card__stepper">
                <button
                  type="button"
                  className="region-card__btn"
                  disabled={!canDec}
                  onClick={() => onChange(region.id, action, -1)}
                  aria-label={`Menos ${ACTION_LABELS[action]}`}
                >
                  −
                </button>
                <span className="region-card__units">{units}</span>
                <button
                  type="button"
                  className="region-card__btn"
                  disabled={!canInc}
                  onClick={() => onChange(region.id, action, 1)}
                  aria-label={`Más ${ACTION_LABELS[action]}`}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
      )}
    </article>
  )
}
