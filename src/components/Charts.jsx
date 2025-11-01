import React from 'react'

export function AreaChart({ values = [], width = 280, height = 80, color = '#60a5fa' }) {
    if (!values || values.length === 0) return null
    const pad = 6
    const w = width, h = height
    const max = Math.max(...values.map(v => Math.abs(v)), 1)
    const step = (w - pad * 2) / Math.max(1, values.length - 1)
    const points = values.map((v, i) => {
        const x = pad + i * step
        const y = h - pad - ((v + max) / (max * 2)) * (h - pad * 2)
        return `${x},${y}`
    }).join(' ')
    const areaPoints = `${points} ${w - pad},${h - pad} ${pad},${h - pad}`
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
            <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline fill="url(#g1)" stroke="none" points={areaPoints} />
            <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
            {/* render small points with title for native tooltip on hover */}
            {values.map((v, i) => {
                const x = pad + i * step
                const y = h - pad - ((v + max) / (max * 2)) * (h - pad * 2)
                return <circle key={i} cx={x} cy={y} r={3} fill={color} className="opacity-0 hover:opacity-100"><title>{String(v)}</title></circle>
            })}
        </svg>
    )
}

export function DonutChart({ items = [], size = 120, thickness = 18, colors = [] }) {
    const total = items.reduce((s, it) => s + Math.abs(it.value || 0), 0) || 1
    const r = (size - thickness) / 2
    const c = 2 * Math.PI * r
    let offset = 0
    // prepare a small color palette if none provided
    const palette = colors.length ? colors : ['#60a5fa', '#34d399', '#f97316', '#f87171', '#a78bfa', '#f59e0b']
    return (
        <div>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block mx-auto">
                <g transform={`translate(${size / 2}, ${size / 2})`}>
                    {items.map((it, i) => {
                        const frac = Math.abs(it.value || 0) / total
                        const len = frac * c
                        const stroke = palette[i % palette.length] || (it.value >= 0 ? '#34d399' : '#f87171')
                        const circle = (
                            <circle key={i}
                                r={r}
                                cx={0}
                                cy={0}
                                fill="transparent"
                                stroke={stroke}
                                strokeWidth={thickness}
                                strokeDasharray={`${len} ${c - len}`}
                                strokeDashoffset={-offset}
                                strokeLinecap="butt"
                                transform={`rotate(-90)`}
                                aria-label={`${it.label}: ${it.value}`}
                            >
                                <title>{`${it.label}: ${it.value} (${Math.round(frac * 100)}%)`}</title>
                            </circle>
                        )
                        offset += len
                        return circle
                    })}
                    <circle r={r - thickness - 2} fill="#0b1220" />
                </g>
            </svg>
            {/* legend */}
            <div className="mt-2 text-sm">
                {items.map((it, i) => {
                    const pct = Math.round((Math.abs(it.value || 0) / total) * 100)
                    const color = palette[i % palette.length]
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <span style={{ background: color }} className="inline-block w-3 h-3 rounded" />
                            <span className="truncate">{it.label}</span>
                            <span className="muted ml-auto">{pct}%</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function HorizontalBarChart({ items = [], maxWidth = 200, height = 40 }) {
    const max = Math.max(...items.map(i => Math.abs(i.value || 0)), 1)
    const palette = ['#60a5fa', '#34d399', '#f97316', '#f87171', '#a78bfa', '#f59e0b']
    return (
        <div className="space-y-2">
            {items.map((it, idx) => {
                const pct = Math.abs(it.value || 0) / max
                const w = Math.max(4, Math.round(pct * maxWidth))
                const color = palette[idx % palette.length]
                return (
                    <div key={idx} className="flex items-center gap-3 group" title={`${it.label}: $${Number(it.value || 0).toFixed(2)}`}>
                        <div className="text-sm w-28 truncate">{it.label}</div>
                        <div className="flex-1 bg-gray-100 h-3 rounded overflow-hidden">
                            <div style={{ width: `${w}px`, background: color }} className={`h-3 transition-all group-hover:opacity-90`} />
                        </div>
                        <div className="text-sm font-medium w-20 text-right">${Math.abs(it.value || 0).toFixed(0)}</div>
                    </div>
                )
            })}
        </div>
    )
}

export default {
    AreaChart,
    DonutChart,
    HorizontalBarChart
}
