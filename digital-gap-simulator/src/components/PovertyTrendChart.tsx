import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface ChartRow {
  round: string
  player: number
  baseline: number
}

interface PovertyTrendChartProps {
  data: ChartRow[]
  highlightBaseline?: boolean
  id?: string
  /** Narrow chart under the map (same data, smaller canvas). */
  compact?: boolean
}

export function PovertyTrendChart({
  data,
  highlightBaseline,
  id = 'poverty-chart',
  compact,
}: PovertyTrendChartProps) {
  const h = compact ? 200 : 280
  const strokePlayer = compact ? 2.5 : 3
  const dotR = compact ? 3 : 4
  return (
    <div
      className={`poverty-chart-wrap ${compact ? 'poverty-chart-wrap--compact' : ''} ${highlightBaseline ? 'poverty-chart-wrap--pulse' : ''}`.trim()}
      id={id}
    >
      <h3 className="poverty-chart-wrap__title">Brecha digital media (índice compuesto)</h3>
      <p className="poverty-chart-wrap__sub">Menor es mejor. La línea punteada es el mundo sin tu intervención.</p>
      <div className="poverty-chart-wrap__canvas">
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: compact ? -8 : 0, bottom: compact ? 0 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="round" tick={{ fill: 'var(--text-muted)', fontSize: compact ? 10 : 12 }} />
            <YAxis domain={[0, 'auto']} tick={{ fill: 'var(--text-muted)', fontSize: compact ? 10 : 12 }} width={compact ? 30 : 36} />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontFamily: 'Open Sans, sans-serif',
                fontSize: compact ? 12 : 14,
              }}
            />
            <Legend wrapperStyle={{ fontSize: compact ? 11 : 13 }} />
            <Line
              type="monotone"
              dataKey="player"
              name="Con tus decisiones"
              stroke="var(--chart-player)"
              strokeWidth={strokePlayer}
              dot={{ r: dotR }}
              activeDot={{ r: dotR + 2 }}
              isAnimationActive
              animationDuration={600}
            />
            <Line
              type="monotone"
              dataKey="baseline"
              name="Sin intervención"
              stroke="var(--chart-baseline)"
              strokeWidth={compact ? 1.5 : 2}
              strokeDasharray="6 4"
              dot={{ r: compact ? 2 : 3 }}
              isAnimationActive
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
