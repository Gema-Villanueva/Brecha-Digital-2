import { TOTAL_ROUNDS } from '../game/constants'

interface RoundHeaderProps {
  round: number
  gameOver?: boolean
}

export function RoundHeader({ round, gameOver }: RoundHeaderProps) {
  if (gameOver) {
    return (
      <header className="round-header">
        <p className="round-header__badge round-header__badge--done">Partida terminada</p>
        <h2 className="round-header__title">Resultados</h2>
      </header>
    )
  }
  return (
    <header className="round-header">
      <p className="round-header__badge">
        Ronda {round} / {TOTAL_ROUNDS}
      </p>
      <h2 className="round-header__title">¿Dónde invertirás este año?</h2>
    </header>
  )
}
