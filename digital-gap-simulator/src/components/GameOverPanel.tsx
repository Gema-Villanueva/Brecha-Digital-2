interface GameOverPanelProps {
  finalPlayerPoverty: number
  finalBaselinePoverty: number
  onReplay: () => void
}

export function GameOverPanel({ finalPlayerPoverty, finalBaselinePoverty, onReplay }: GameOverPanelProps) {
  const delta = finalBaselinePoverty - finalPlayerPoverty
  const beat = delta > 0.05
  return (
    <div className="game-over">
      <div className="game-over__scores">
        <div className="game-over__score">
          <span className="game-over__label">Tu índice medio final</span>
          <strong className="game-over__num">{finalPlayerPoverty.toFixed(1)}</strong>
        </div>
        <div className="game-over__score game-over__score--muted">
          <span className="game-over__label">Sin intervención (referencia)</span>
          <strong className="game-over__num">{finalBaselinePoverty.toFixed(1)}</strong>
        </div>
      </div>
      <p className="game-over__verdict">
        {beat
          ? `Has reducido la brecha digital media frente al escenario sin políticas (≈ ${delta.toFixed(1)} puntos).`
          : delta < -0.05
            ? 'El escenario sin inversión habría sido similar o mejor en este modelo: prueba otra estrategia.'
            : 'Resultado muy parejo al escenario sin inversión: ajusta prioridades en una nueva partida.'}
      </p>
      <button type="button" className="game-over__replay" onClick={onReplay}>
        Jugar de nuevo
      </button>
    </div>
  )
}
