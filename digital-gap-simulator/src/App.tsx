import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ActionKind, RegionRuntime, RoundAllocation } from './data/types'
import { loadRegions } from './data/loadRegions'
import { ACTION_COST, BUDGET_PER_ROUND, GAME_SEED, MAX_UNITS_PER_ACTION_PER_REGION, TOTAL_ROUNDS } from './game/constants'
import {
  applyPendingToRegions,
  bestImprover,
  cloneRegions,
  computeBaselineHistory,
  createEmptyPending,
  meanDigitalPoverty,
  recalculateAll,
  snapshotPoverty,
  totalPendingCost,
  worstPerformer,
} from './game/simulation'
import { BudgetMeter } from './components/BudgetMeter'
import { GameOverPanel } from './components/GameOverPanel'
import type { ChartRow } from './components/PovertyTrendChart'
import { PovertyTrendChart } from './components/PovertyTrendChart'
import { RegionCard } from './components/RegionCard'
import { SpainMap } from './components/SpainMap'
import { RoundHeader } from './components/RoundHeader'

function createFreshState(rows: RegionRuntime[]) {
  const fresh = cloneRegions(rows)
  return {
    regions: fresh,
    round: 1,
    pending: createEmptyPending(fresh.map((r) => r.id)),
    playerHistory: [meanDigitalPoverty(fresh)] as number[],
    baselineHistory: computeBaselineHistory(fresh, GAME_SEED),
    gameOver: false,
    feedback: null as string | null,
  }
}

type GameState = ReturnType<typeof createFreshState>

function GameApp({ template }: { template: RegionRuntime[] }) {
  const templateSnapshot = useMemo(() => cloneRegions(template), [template])
  const [state, setState] = useState<GameState>(() => createFreshState(templateSnapshot))

  const { regions, round, pending, playerHistory, baselineHistory, gameOver, feedback } = state

  const replay = useCallback(() => {
    setState(createFreshState(templateSnapshot))
  }, [templateSnapshot])

  const adjustPending = useCallback(
    (regionId: string, action: ActionKind, delta: number) => {
      if (gameOver) return
      setState((s) => {
        if (s.gameOver) return s
        const empty: RoundAllocation = { internet: 0, devices: 0, education: 0, social: 0 }
        const row = s.pending[regionId] ?? empty
        const nextUnits = row[action] + delta
        if (nextUnits < 0 || nextUnits > MAX_UNITS_PER_ACTION_PER_REGION) return s
        if (delta > 0) {
          const newCost = totalPendingCost(s.pending) + ACTION_COST[action]
          if (newCost > BUDGET_PER_ROUND) return s
        }
        return {
          ...s,
          pending: {
            ...s.pending,
            [regionId]: { ...row, [action]: nextUnits },
          },
        }
      })
    },
    [gameOver],
  )

  const confirmRound = useCallback(() => {
    setState((s) => {
      if (!s.regions.length || s.gameOver) return s
      const cost = totalPendingCost(s.pending)
      if (cost > BUDGET_PER_ROUND) return s

      const snap = snapshotPoverty(s.regions)
      const next = cloneRegions(s.regions)
      applyPendingToRegions(next, s.pending)
      recalculateAll(next, s.round, 'player', GAME_SEED)

      const bi = bestImprover(snap, next)
      const worst = worstPerformer(next)
      let msg = bi
        ? `Esta ronda, ${bi.name} mejoró su índice unos ${bi.delta.toFixed(1)} puntos.`
        : 'Cambios modestos en el índice esta ronda: reprioriza el siguiente año.'
      if (worst) msg += ` Sigue en tensión: ${worst.name}.`

      const nextRound = s.round >= TOTAL_ROUNDS ? s.round : s.round + 1
      const nextGameOver = s.round >= TOTAL_ROUNDS

      return {
        ...s,
        regions: next,
        round: nextRound,
        pending: createEmptyPending(next.map((r) => r.id)),
        playerHistory: [...s.playerHistory, meanDigitalPoverty(next)],
        gameOver: nextGameOver,
        feedback: msg,
      }
    })
  }, [])

  const pendingCost = totalPendingCost(pending)
  const budgetRemaining = BUDGET_PER_ROUND - pendingCost
  const overspend = pendingCost > BUDGET_PER_ROUND

  const chartData: ChartRow[] = useMemo(() => {
    return playerHistory.map((p, i) => ({
      round: i === 0 ? 'Inicio' : `R${i}`,
      player: Number(p.toFixed(2)),
      baseline: Number((baselineHistory[i] ?? 0).toFixed(2)),
    }))
  }, [playerHistory, baselineHistory])

  const currentMean = meanDigitalPoverty(regions)
  const finalPlayer = playerHistory[playerHistory.length - 1] ?? 0
  const finalBaseline = baselineHistory[baselineHistory.length - 1] ?? 0

  const [highlightBaseline, setHighlightBaseline] = useState(false)

  const scrollToMap = () => {
    document.getElementById('spain-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightBaseline(true)
    window.setTimeout(() => setHighlightBaseline(false), 2800)
  }

  return (
    <div className="app">
      <header className="app__hero">
        <p className="app__eyebrow">Simulación · 5 ejercicios presupuestarios</p>
        <h1 className="app__title">Digital Gap Simulator</h1>
        <p className="app__lede">
          Eres quien decide cómo repartir recursos públicos entre las comunidades autónomas. Los datos de partida son reales (acceso a banda ancha,
          renta, AROPE, paro y equipamiento escolar). Cada ronda, invierte un presupuesto limitado para bajar la <strong>pobreza digital</strong>{' '}
          compuesta del juego — no es el modelo del notebook, pero sí está anclado a tus CSV.
        </p>
      </header>

      <section className="app__hud" aria-live="polite">
        <RoundHeader round={round} gameOver={gameOver} />
        <div className="app__hud-row">
          <BudgetMeter remaining={budgetRemaining} pendingSpend={pendingCost} />
          <div className="app__score-card">
            <span className="app__score-label">Índice medio actual</span>
            <strong className="app__score-value">{currentMean.toFixed(1)}</strong>
            <span className="app__score-hint">Objetivo: reducirlo frente a la línea «sin intervención».</span>
          </div>
        </div>
        {!gameOver && (
          <div className="app__actions-row">
            <button type="button" className="btn btn--primary" disabled={overspend} onClick={confirmRound}>
              Confirmar ronda {round}
            </button>
            <button type="button" className="btn btn--ghost" onClick={scrollToMap}>
              Simular sin intervención
            </button>
          </div>
        )}
        {overspend && !gameOver && (
          <p className="app__warn" role="status">
            Te pasas del presupuesto: reduce asignaciones antes de confirmar.
          </p>
        )}
        {feedback && !gameOver && (
          <p className="app__feedback" role="status">
            {feedback}
          </p>
        )}
      </section>

      <div className="app__playfield">
        <section className="app__sidebar" aria-label="Comunidades autónomas">
          {regions.map((r) => (
            <div key={r.id} id={`region-card-${r.id}`} className="app__card-anchor">
              <RegionCard
                region={r}
                readOnly={gameOver}
                allocation={pending[r.id] ?? { internet: 0, devices: 0, education: 0, social: 0 }}
                budgetRemaining={budgetRemaining}
                onChange={adjustPending}
              />
            </div>
          ))}
        </section>

        <aside className="app__map-stack">
          <SpainMap regions={regions} pending={pending} highlight={highlightBaseline} />
          <section className="app__chart-section">
            <PovertyTrendChart data={chartData} compact />
          </section>
        </aside>
      </div>

      {gameOver && (
        <section className="app__gameover-section">
          <GameOverPanel finalPlayerPoverty={finalPlayer} finalBaselinePoverty={finalBaseline} onReplay={replay} />
        </section>
      )}

      <footer className="app__footer">
        <small>Fuente: dataset_maestro_limpio.csv · Simulación con fines educativos.</small>
      </footer>
    </div>
  )
}

export default function App() {
  const [loadError, setLoadError] = useState<string | null>(null)
  const [template, setTemplate] = useState<RegionRuntime[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadRegions()
      .then((rows) => {
        if (!cancelled) setTemplate(rows)
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Error al cargar datos')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="app app--center">
        <p className="app__loading">Cargando comunidades desde el dataset…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="app app--center">
        <p className="app__error" role="alert">
          {loadError}
        </p>
      </div>
    )
  }

  if (!template?.length) {
    return (
      <div className="app app--center">
        <p className="app__error">No hay regiones para simular.</p>
      </div>
    )
  }

  return <GameApp template={template} />
}
