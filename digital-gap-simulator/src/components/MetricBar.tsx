interface MetricBarProps {
  label: string
  value: number
  /** Higher values use “good” tint when invert is false. */
  invert?: boolean
  className?: string
}

export function MetricBar({ label, value, invert = false, className = '' }: MetricBarProps) {
  const v = Math.min(100, Math.max(0, value))
  const fillClass = invert ? 'metric-bar__fill metric-bar__fill--invert' : 'metric-bar__fill'
  return (
    <div className={`metric-bar ${className}`.trim()}>
      <div className="metric-bar__row">
        <span className="metric-bar__label">{label}</span>
        <span className="metric-bar__value">{v.toFixed(0)}</span>
      </div>
      <div className="metric-bar__track" role="presentation">
        <div className={fillClass} style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}
