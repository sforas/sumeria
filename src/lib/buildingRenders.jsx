export const DISTRICT_ORDER = ['fitness', 'work', 'reading', 'learning', 'social', 'health', 'savings', 'journal']

export const COLORS = {
  fitness: '#C17F3A', work: '#4A7C8E', reading: '#8B6F47',
  learning: '#6B8E6B', social: '#B5724A', health: '#7A9E7E',
  savings: '#D4A843', journal: '#8B7355'
}

// width/height per stage — height is the stage's nominal/minimum height,
// interpolated up toward the next stage's height as progress advances
export const STAGE_DIMENSIONS = [
  { width: 30, height: 4 },
  { width: 34, height: 18 },
  { width: 38, height: 36 },
  { width: 42, height: 56 },
  { width: 46, height: 80 },
  { width: 50, height: 110 }
]

export function getBuildingSize(stage, progress) {
  const cur = STAGE_DIMENSIONS[stage]
  const next = STAGE_DIMENSIONS[Math.min(stage + 1, 5)]
  const height = stage === 5 ? cur.height : cur.height + (next.height - cur.height) * progress
  return { width: cur.width, height }
}

// ---- shared drawing helpers ----

function columns(n, x0, x1, yTop, yBot, keyPrefix) {
  const items = []
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * (i / (n - 1))
    items.push(<line key={`${keyPrefix}${i}`} x1={x} y1={yTop} x2={x} y2={yBot} />)
  }
  return items
}

// Equal-arm "hospital" cross (not a church cross) — the only filled element in the whole set
function hospitalCross(cx, topY, armLen, thick, color) {
  return (
    <g key="cross">
      <rect x={cx - thick / 2} y={topY} width={thick} height={armLen} fill={color} stroke="none" />
      <rect x={cx - armLen / 2} y={topY + armLen / 2 - thick / 2} width={armLen} height={thick} fill={color} stroke="none" />
    </g>
  )
}

function steps(w, h, count) {
  const items = []
  for (let i = 0; i < count; i++) {
    items.push(<line key={`step${i}`} x1={-2 - i * 2} y1={h + 1 + i * 2} x2={w + 2 + i * 2} y2={h + 1 + i * 2} />)
  }
  return items
}

// Stage 0 is identical across every district: scattered foundation stones
function foundationStage(w, h) {
  return (
    <>
      <rect x={w * 0.1} y={h - 4} width={w * 0.8} height={4} />
      <rect x={w * 0.2} y={h - 7} width={w * 0.2} height={3} transform="rotate(-5)" />
      <rect x={w * 0.55} y={h - 6} width={w * 0.25} height={3} transform="rotate(4)" />
    </>
  )
}

// ---- per-district stage renderers: fn(w, h, color) -> JSX ----
// y=0 is the TOP of the building, y=h is the GROUND

const FITNESS_STAGES = [
  (w, h) => <>{foundationStage(w, h)}</>,
  (w, h, color) => (
    <>
      <rect x={2} y={0} width={6} height={h} />
      <rect x={0} y={0} width={10} height={3} fill={color} opacity={0.5} stroke="none" />
      <rect x={14} y={h * 0.3} width={6} height={h * 0.7} />
      <polyline points={`${14},${h * 0.3} ${16},${h * 0.2} ${18},${h * 0.28} ${20},${h * 0.15} ${20},${h * 0.3}`} fill="none" />
      <rect x={26} y={h * 0.55} width={6} height={h * 0.45} />
      <rect x={10} y={h - 5} width={16} height={4} transform={`rotate(-3, 18, ${h - 3})`} />
      <line x1={0} y1={h} x2={w} y2={h} />
    </>
  ),
  (w, h, color) => (
    <>
      <line x1={w * 0.12} y1={h * 0.02} x2={w * 0.12} y2={h} strokeWidth={2} />
      <line x1={w * 0.88} y1={h * 0.02} x2={w * 0.88} y2={h} strokeWidth={2} />
      <line x1={w * 0.04} y1={h * 0.06} x2={w * 0.96} y2={h * 0.06} strokeWidth={2.5} />
      <rect x={w * 0.06} y={0} width={w * 0.14} height={h * 0.08} fill={color} stroke="none" />
      <rect x={w * 0.8} y={0} width={w * 0.14} height={h * 0.08} fill={color} stroke="none" />
      <line x1={w * 0.22} y1={h * 0.44} x2={w * 0.22} y2={h} strokeWidth={1.5} />
      <line x1={w * 0.44} y1={h * 0.44} x2={w * 0.44} y2={h} strokeWidth={1.5} />
      <line x1={w * 0.18} y1={h * 0.44} x2={w * 0.48} y2={h * 0.44} strokeWidth={2} />
      <line x1={w * 0.56} y1={h * 0.44} x2={w * 0.56} y2={h} strokeWidth={1.5} />
      <line x1={w * 0.78} y1={h * 0.44} x2={w * 0.78} y2={h} strokeWidth={1.5} />
      <line x1={w * 0.52} y1={h * 0.44} x2={w * 0.82} y2={h * 0.44} strokeWidth={2} />
      <rect x={w * 0.04} y={h * 0.88} width={w * 0.16} height={h * 0.12} strokeWidth={1.1} />
      <rect x={w * 0.8} y={h * 0.88} width={w * 0.16} height={h * 0.12} strokeWidth={1.1} />
      <line x1={0} y1={h} x2={w} y2={h} strokeWidth={1.3} />
    </>
  ),
  (w, h) => (
    <>
      <ellipse cx={w / 2} cy={h - 12} rx={w / 2 - 1} ry={12} />
      <ellipse cx={w / 2} cy={h - 8} rx={w / 2 - 5} ry={8} />
      {[0.15, 0.38, 0.62, 0.85].map((p, i) => (
        <path key={`fa3-${i}`} d={`M ${w * p - 4} ${h} L ${w * p - 4} ${h - 10} A 4 4 0 0 1 ${w * p + 4} ${h - 10} L ${w * p + 4} ${h}`} />
      ))}
      <path d={`M ${w / 2 - 6} ${h} L ${w / 2 - 6} ${h - 14} A 6 6 0 0 1 ${w / 2 + 6} ${h - 14} L ${w / 2 + 6} ${h}`} strokeWidth={1.5} />
      <line x1={0} y1={h} x2={w} y2={h} />
    </>
  ),
  (w, h) => (
    <>
      <ellipse cx={w / 2} cy={h - 16} rx={w / 2 - 1} ry={16} />
      <ellipse cx={w / 2} cy={h - 10} rx={w / 2 - 5} ry={10} />
      <ellipse cx={w / 2} cy={h - 5} rx={w / 2 - 10} ry={5} />
      {[0.1, 0.3, 0.7, 0.9].map((p, i) => (
        <path key={`fa4-${i}`} d={`M ${w * p - 4.5} ${h} L ${w * p - 4.5} ${h - 11} A 4.5 4.5 0 0 1 ${w * p + 4.5} ${h - 11} L ${w * p + 4.5} ${h}`} />
      ))}
      <path d={`M ${w / 2 - 7} ${h} L ${w / 2 - 7} ${h - 16} A 7 7 0 0 1 ${w / 2 + 7} ${h - 16} L ${w / 2 + 7} ${h}`} strokeWidth={1.5} />
      <line x1={0} y1={h} x2={w} y2={h} />
    </>
  ),
  (w, h) => (
    <>
      {[{ cy: h - 30, ry: 30 }, { cy: h - 21, ry: 21 }, { cy: h - 12, ry: 12 }, { cy: h - 5, ry: 5 }].map((t, i) => (
        <ellipse key={`col-t${i}`} cx={w / 2} cy={t.cy} rx={w / 2 - 1 - i * 3} ry={t.ry} />
      ))}
      {[0.06, 0.22, 0.38, 0.62, 0.78, 0.94].map((p, i) => (
        <path key={`col-a${i}`} d={`M ${w * p - 4} ${h} L ${w * p - 4} ${h - 9} A 4 4 0 0 1 ${w * p + 4} ${h - 9} L ${w * p + 4} ${h}`} />
      ))}
      <path d={`M ${w / 2 - 8} ${h} L ${w / 2 - 8} ${h - 18} A 8 8 0 0 1 ${w / 2 + 8} ${h - 18} L ${w / 2 + 8} ${h}`} strokeWidth={1.5} />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line key={`vel${i}`} x1={5 + i * 8} y1={h - 64} x2={w / 2} y2={h - 70} strokeWidth={0.5} opacity={0.6} />
      ))}
      {steps(w, h, 3)}
    </>
  )
]

const WORK_STAGES = [
  (w, h) => <>{foundationStage(w, h)}</>,
  (w, h) => (
    <>
      <line x1={w * 0.2} y1={0} x2={w * 0.2} y2={h} strokeWidth={2} />
      <line x1={w * 0.2} y1={h * 0.12} x2={w * 0.85} y2={h * 0.12} strokeWidth={1.6} />
      <path d={`M ${w * 0.2} ${h * 0.12} Q ${w * 0.28} ${h * 0.26} ${w * 0.38} ${h * 0.26}`} strokeWidth={1} opacity={0.6} fill="none" />
      <line x1={w * 0.42} y1={h * 0.12} x2={w * 0.4} y2={h * 0.3} strokeWidth={0.9} opacity={0.7} />
      <line x1={w * 0.8} y1={h * 0.12} x2={w * 0.82} y2={h * 0.3} strokeWidth={0.9} opacity={0.7} />
      <rect x={w * 0.36} y={h * 0.3} width={w * 0.5} height={h * 0.32} strokeWidth={1.5} />
      <line x1={w * 0.42} y1={h * 0.4} x2={w * 0.8} y2={h * 0.4} strokeWidth={1.1} opacity={0.7} />
      <line x1={w * 0.42} y1={h * 0.47} x2={w * 0.76} y2={h * 0.47} strokeWidth={1.1} opacity={0.7} />
      <line x1={w * 0.42} y1={h * 0.54} x2={w * 0.72} y2={h * 0.54} strokeWidth={1.1} opacity={0.7} />
      <rect x={w * 0.1} y={h * 0.88} width={w * 0.2} height={h * 0.08} strokeWidth={1.2} />
      <rect x={w * 0.05} y={h * 0.92} width={w * 0.3} height={h * 0.08} strokeWidth={1.1} />
      <line x1={0} y1={h} x2={w} y2={h} strokeWidth={1.2} />
    </>
  ),
  (w, h, color) => (
    <>
      <rect x={0} y={h * 0.15} width={w} height={h * 0.85} />
      <rect x={0} y={h * 0.15} width={w} height={h * 0.12} fill={color} opacity={0.15} stroke="none" />
      <rect x={3} y={h * 0.32} width={w * 0.3} height={h * 0.22} />
      <path d={`M 3 ${h * 0.32} A ${w * 0.15} ${h * 0.08} 0 0 1 ${3 + w * 0.3} ${h * 0.32}`} />
      <rect x={w - 3 - w * 0.3} y={h * 0.32} width={w * 0.3} height={h * 0.22} />
      <path d={`M ${w - 3 - w * 0.3} ${h * 0.32} A ${w * 0.15} ${h * 0.08} 0 0 1 ${w - 3} ${h * 0.32}`} />
      <rect x={w * 0.35} y={h * 0.6} width={w * 0.3} height={h * 0.4} />
      <path d={`M ${w * 0.35} ${h * 0.6} A ${w * 0.15} ${h * 0.1} 0 0 1 ${w * 0.65} ${h * 0.6}`} />
      {steps(w, h, 2)}
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h} />
      <line x1={0} y1={h * 0.25} x2={w} y2={h * 0.25} strokeWidth={0.7} />
      <line x1={0} y1={h * 0.5} x2={w} y2={h * 0.5} strokeWidth={0.7} />
      <line x1={0} y1={h * 0.75} x2={w} y2={h * 0.75} strokeWidth={0.7} />
      {[0, 1, 2].map(floor => (
        <g key={`wf${floor}`}>
          {[0.2, 0.5, 0.8].map((p, i) => (
            <rect key={`wfw${floor}-${i}`} x={w * p - 3} y={floor * h * 0.25 + h * 0.08} width={6} height={h * 0.1} />
          ))}
        </g>
      ))}
      <path d={`M ${w * 0.38} ${h} L ${w * 0.38} ${h - h * 0.14} A ${w * 0.12} ${w * 0.12} 0 0 1 ${w * 0.62} ${h - h * 0.14} L ${w * 0.62} ${h}`} strokeWidth={1.3} />
      <line x1={-1} y1={0} x2={w + 1} y2={0} strokeWidth={1.3} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={w * 0.2} y={0} width={w * 0.6} height={h} />
      <rect x={0} y={h * 0.7} width={w * 0.22} height={h * 0.3} />
      <rect x={w * 0.78} y={h * 0.7} width={w * 0.22} height={h * 0.3} />
      {[0, 1, 2, 3, 4, 5, 6].map(floor => (
        <g key={`wt${floor}`}>
          <rect x={w * 0.32} y={floor * (h * 0.85 / 7) + h * 0.05} width={5} height={h * 0.07} />
          <rect x={w * 0.62} y={floor * (h * 0.85 / 7) + h * 0.05} width={5} height={h * 0.07} />
        </g>
      ))}
      <path d={`M ${w * 0.36} ${h} L ${w * 0.36} ${h - h * 0.15} A ${w * 0.14} ${w * 0.14} 0 0 1 ${w * 0.64} ${h - h * 0.15} L ${w * 0.64} ${h}`} strokeWidth={1.3} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={h * 0.7} width={w} height={h * 0.3} />
      <rect x={w * 0.12} y={h * 0.4} width={w * 0.76} height={h * 0.3} />
      <rect x={w * 0.24} y={h * 0.15} width={w * 0.52} height={h * 0.25} />
      <rect x={w * 0.34} y={0} width={w * 0.32} height={h * 0.15} />
      {[0.4, 0.5, 0.6].map((p, i) => (
        <line key={`ws${i}`} x1={w * p} y1={h * 0.15} x2={w * p} y2={h} strokeWidth={0.6} opacity={0.7} />
      ))}
      <line x1={w / 2} y1={0} x2={w / 2} y2={-h * 0.12} strokeWidth={1.5} />
      <line x1={w * 0.42} y1={-h * 0.05} x2={w * 0.58} y2={-h * 0.05} strokeWidth={0.8} />
    </>
  )
]

const READING_STAGES = [
  (w, h) => <>{foundationStage(w, h)}</>,
  (w, h) => (
    <>
      <path d={`M ${w * 0.04} ${h} L ${w * 0.04} ${h * 0.18} Q ${w * 0.04} ${h * 0.04} ${w * 0.16} ${h * 0.04} L ${w * 0.42} ${h * 0.04} Q ${w * 0.46} ${h * 0.04} ${w * 0.46} ${h * 0.18} L ${w * 0.46} ${h} Z`} fill="none" strokeWidth={1.4} />
      <path d={`M ${w * 0.54} ${h} L ${w * 0.54} ${h * 0.18} Q ${w * 0.54} ${h * 0.04} ${w * 0.66} ${h * 0.04} L ${w * 0.9} ${h * 0.04} Q ${w * 0.96} ${h * 0.04} ${w * 0.96} ${h * 0.18} L ${w * 0.96} ${h} Z`} fill="none" strokeWidth={1.4} />
      {[0.22, 0.34, 0.46, 0.58, 0.7, 0.82].map((p, i) => (
        <g key={`rl${i}`}>
          <line x1={w * 0.1} y1={h * p} x2={w * 0.4} y2={h * p} strokeWidth={0.9} />
          <line x1={w * 0.12} y1={h * p - 2} x2={w * 0.14} y2={h * p + 2} strokeWidth={0.6} />
          <line x1={w * 0.2} y1={h * p - 2} x2={w * 0.22} y2={h * p + 2} strokeWidth={0.6} />
          <line x1={w * 0.3} y1={h * p - 2} x2={w * 0.32} y2={h * p + 2} strokeWidth={0.6} />
        </g>
      ))}
      {[0.22, 0.34, 0.46, 0.58, 0.7, 0.82].map((p, i) => (
        <g key={`rr${i}`}>
          <line x1={w * 0.6} y1={h * p} x2={w * 0.9} y2={h * p} strokeWidth={0.9} />
          <line x1={w * 0.62} y1={h * p - 2} x2={w * 0.64} y2={h * p + 2} strokeWidth={0.6} />
          <line x1={w * 0.72} y1={h * p - 2} x2={w * 0.74} y2={h * p + 2} strokeWidth={0.6} />
          <line x1={w * 0.82} y1={h * p - 2} x2={w * 0.84} y2={h * p + 2} strokeWidth={0.6} />
        </g>
      ))}
      <line x1={0} y1={h} x2={w} y2={h} strokeWidth={1.2} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h} />
      <line x1={0} y1={h * 0.33} x2={w} y2={h * 0.33} strokeWidth={0.7} />
      <line x1={0} y1={h * 0.66} x2={w} y2={h * 0.66} strokeWidth={0.7} />
      {[0, 1, 2].map(shelf => (
        <g key={`sh${shelf}`}>
          {[0.2, 0.5, 0.8].map((p, i) => (
            <g key={`sc${shelf}-${i}`}>
              <ellipse cx={w * p} cy={shelf * h * 0.33 + h * 0.165} rx={4} ry={7} />
              <line x1={w * p - 4} y1={shelf * h * 0.33 + h * 0.165 - 6} x2={w * p + 4} y2={shelf * h * 0.33 + h * 0.165 - 6} strokeWidth={0.5} />
              <line x1={w * p - 4} y1={shelf * h * 0.33 + h * 0.165 + 6} x2={w * p + 4} y2={shelf * h * 0.33 + h * 0.165 + 6} strokeWidth={0.5} />
            </g>
          ))}
        </g>
      ))}
    </>
  ),
  (w, h) => (
    <>
      <rect x={2} y={h * 0.35} width={w - 4} height={h * 0.65} />
      {[0.2, 0.37, 0.63, 0.8].map((p, i) => (
        <line key={`r3c${i}`} x1={w * p} y1={h * 0.35} x2={w * p} y2={h} />
      ))}
      <rect x={0} y={h * 0.33} width={w} height={h * 0.04} />
      <polygon points={`0,${h * 0.33} ${w / 2},0 ${w},${h * 0.33}`} />
      <ellipse cx={w / 2} cy={h * 0.2} rx={4} ry={6} />
      <path d={`M ${w * 0.42} ${h} L ${w * 0.42} ${h * 0.85} A ${w * 0.08} ${w * 0.08} 0 0 1 ${w * 0.58} ${h * 0.85} L ${w * 0.58} ${h}`} strokeWidth={1.3} />
      {steps(w, h, 2)}
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={h * 0.5} width={w * 0.82} height={h * 0.5} />
      {columns(6, 3, w * 0.82 - 3, h * 0.5, h, 'rd4c')}
      <rect x={w * 0.1} y={h * 0.2} width={w * 0.62} height={h * 0.3} />
      {columns(4, w * 0.13, w * 0.69, h * 0.2, h * 0.5, 'rd4uc')}
      <polygon points={`${w * 0.1},${h * 0.2} ${w * 0.41},0 ${w * 0.72},${h * 0.2}`} />
      <ellipse cx={w * 0.41} cy={h * 0.1} rx={3.5} ry={5} />
      <rect x={w * 0.86} y={h * 0.55} width={4} height={h * 0.45} />
      <path d={`M ${w * 0.86} ${h * 0.55} A 5 4 0 0 1 ${w * 0.86 + 4} ${h * 0.55}`} strokeWidth={0.7} />
      <path d={`M ${w * 0.85} ${h * 0.42} L ${w * 0.88} ${h * 0.32} L ${w * 0.91} ${h * 0.42} Z`} />
      <path d={`M ${w * 0.35} ${h} L ${w * 0.35} ${h * 0.85} A ${w * 0.09} ${w * 0.09} 0 0 1 ${w * 0.53} ${h * 0.85} L ${w * 0.53} ${h}`} strokeWidth={1.3} />
      {steps(w, h, 2)}
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={h * 0.3} width={w * 0.8} height={h * 0.7} />
      {columns(8, 2, w * 0.8 - 2, h * 0.3, h * 0.94, 'rd5c')}
      <rect x={0} y={h * 0.24} width={w * 0.8} height={h * 0.04} />
      <polygon points={`0,${h * 0.24} ${w * 0.4},0 ${w * 0.8},${h * 0.24}`} />
      {[0.05, 0.2, 0.6, 0.75].map((p, i) => (
        <path key={`rd5win${i}`} d={`M ${w * p - 3.5} ${h * 0.2} L ${w * p - 3.5} ${h * 0.1} A 3.5 3.5 0 0 1 ${w * p + 3.5} ${h * 0.1} L ${w * p + 3.5} ${h * 0.2}`} strokeWidth={0.5} />
      ))}
      <rect x={w * 0.86} y={h * 0.35} width={5} height={h * 0.65} />
      <path d={`M ${w * 0.86} ${h * 0.35} A 6 5 0 0 1 ${w * 0.86 + 5} ${h * 0.35}`} strokeWidth={0.8} />
      <rect x={w * 0.855} y={h * 0.22} width={6} height={h * 0.13} />
      <path d={`M ${w * 0.855} ${h * 0.1} L ${w * 0.888} 0 L ${w * 0.92} ${h * 0.1} Z`} />
      {[0.32, 0.44, 0.56, 0.68].map((p, i) => (
        <path key={`rd5door${i}`} d={`M ${w * p - 3} ${h * 0.94} L ${w * p - 3} ${h * 0.82} A 3 3 0 0 1 ${w * p + 3} ${h * 0.82} L ${w * p + 3} ${h * 0.94}`} strokeWidth={0.7} />
      ))}
      {steps(w, h, 4)}
    </>
  )
]

const LEARNING_STAGES = [
  (w, h) => <>{foundationStage(w, h)}</>,
  (w, h, color) => (
    <>
      <rect x={0} y={0} width={w} height={h} />
      <rect x={w * 0.15} y={h * 0.1} width={w * 0.7} height={h * 0.35} fill={color} opacity={0.12} stroke="none" />
      <rect x={w * 0.15} y={h * 0.1} width={w * 0.7} height={h * 0.35} />
      <line x1={w * 0.22} y1={h * 0.22} x2={w * 0.55} y2={h * 0.22} strokeWidth={0.5} />
      <line x1={w * 0.22} y1={h * 0.3} x2={w * 0.7} y2={h * 0.3} strokeWidth={0.5} />
      <path d={`M ${w * 0.3} ${h} L ${w * 0.2} ${h * 0.75} L ${w * 0.8} ${h * 0.75} L ${w * 0.7} ${h} Z`} />
      <line x1={w * 0.15} y1={h * 0.85} x2={w * 0.15} y2={h} />
      <ellipse cx={w * 0.15} cy={h * 0.78} rx={3} ry={3.5} />
      <line x1={w * 0.85} y1={h * 0.85} x2={w * 0.85} y2={h} />
      <ellipse cx={w * 0.85} cy={h * 0.78} rx={3} ry={3.5} />
      <rect x={2} y={h * 0.55} width={5} height={7} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h} />
      <rect x={-1} y={-3} width={w + 2} height={3} />
      <rect x={w * 0.08} y={h * 0.15} width={w * 0.32} height={h * 0.4} />
      <line x1={w * 0.15} y1={h * 0.4} x2={w * 0.32} y2={h * 0.4} strokeWidth={0.5} opacity={0.6} />
      <rect x={w * 0.6} y={h * 0.15} width={w * 0.32} height={h * 0.4} />
      <rect x={w * 0.4} y={h * 0.6} width={w * 0.2} height={h * 0.4} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={4} y={h * 0.35} width={w - 8} height={h * 0.65} />
      {columns(5, 8, w - 8, h * 0.35, h, 'l3c')}
      <polygon points={`0,${h * 0.33} ${w / 2},0 ${w},${h * 0.33}`} />
      <path d={`M ${w * 0.42} ${h * 0.14} L ${w * 0.58} ${h * 0.14} L ${w * 0.5} ${h * 0.22} Z`} />
      <line x1={w * 0.5} y1={h * 0.1} x2={w * 0.5} y2={h * 0.14} strokeWidth={0.6} />
      <path d={`M ${w * 0.42} ${h} L ${w * 0.42} ${h * 0.85} A ${w * 0.08} ${w * 0.08} 0 0 1 ${w * 0.58} ${h * 0.85} L ${w * 0.58} ${h}`} strokeWidth={1.3} />
      {steps(w, h, 3)}
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={h * 0.55} width={w * 0.28} height={h * 0.45} />
      <rect x={w * 0.72} y={h * 0.55} width={w * 0.28} height={h * 0.45} />
      <rect x={w * 0.32} y={0} width={w * 0.36} height={h} />
      <polygon points={`${w * 0.32},${h * 0.12} ${w * 0.5},0 ${w * 0.68},${h * 0.12}`} />
      <circle cx={w * 0.5} cy={h * 0.07} r={3} strokeWidth={0.8} />
      <line x1={0} y1={h * 0.55} x2={w} y2={h * 0.55} strokeWidth={0.8} />
      {[0.06, 0.16, 0.84, 0.94].map((p, i) => (
        <rect key={`l4w${i}`} x={w * p} y={h * 0.68} width={4} height={6} />
      ))}
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={h * 0.6} width={w * 0.24} height={h * 0.4} />
      <rect x={w * 0.76} y={h * 0.6} width={w * 0.24} height={h * 0.4} />
      <rect x={w * 0.3} y={h * 0.15} width={w * 0.4} height={h * 0.85} />
      <path d={`M ${w * 0.3} ${h * 0.15} A ${w * 0.2} ${h * 0.12} 0 0 1 ${w * 0.7} ${h * 0.15}`} />
      {[1, 2, 3].map(i => (
        <line key={`domerib${i}`} x1={w * 0.5} y1={h * 0.03} x2={w * (0.3 + i * 0.1)} y2={h * 0.15} strokeWidth={0.5} />
      ))}
      <line x1={0} y1={h * 0.6} x2={w} y2={h * 0.6} strokeWidth={0.8} />
      {[0.04, 0.12, 0.2, 0.8, 0.88, 0.96].map((p, i) => (
        <rect key={`l5w${i}`} x={w * p} y={h * 0.72} width={4} height={6} />
      ))}
      {steps(w, h, 2)}
    </>
  )
]

const SOCIAL_STAGES = [
  (w, h) => <>{foundationStage(w, h)}</>,
  (w, h) => (
    <>
      <line x1={w * 0.2} y1={h * 0.1} x2={w * 0.2} y2={h * 0.55} />
      <line x1={w * 0.8} y1={h * 0.1} x2={w * 0.8} y2={h * 0.55} />
      <line x1={w * 0.15} y1={h * 0.1} x2={w * 0.85} y2={h * 0.1} strokeWidth={1.5} />
      <circle cx={w / 2} cy={h * 0.1} r={3} />
      <line x1={w / 2} y1={h * 0.13} x2={w / 2} y2={h * 0.4} strokeWidth={0.7} />
      <path d={`M ${w / 2 - 4} ${h * 0.4} L ${w / 2 + 4} ${h * 0.4} L ${w / 2 + 3} ${h * 0.5} L ${w / 2 - 3} ${h * 0.5} Z`} />
      <ellipse cx={w / 2} cy={h * 0.55} rx={w * 0.32} ry={h * 0.1} />
      <ellipse cx={w / 2} cy={h} rx={w * 0.32} ry={h * 0.12} />
      <line x1={w * 0.18} y1={h * 0.58} x2={w * 0.18} y2={h * 0.97} strokeWidth={0.5} />
      <line x1={w * 0.82} y1={h * 0.58} x2={w * 0.82} y2={h * 0.97} strokeWidth={0.5} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h} />
      <line x1={0} y1={h * 0.33} x2={w} y2={h * 0.33} strokeWidth={0.5} />
      <line x1={0} y1={h * 0.66} x2={w} y2={h * 0.66} strokeWidth={0.5} />
      <line x1={w * 0.33} y1={0} x2={w * 0.33} y2={h} strokeWidth={0.5} />
      <line x1={w * 0.66} y1={0} x2={w * 0.66} y2={h} strokeWidth={0.5} />
      <ellipse cx={w / 2} cy={h * 0.55} rx={w * 0.22} ry={h * 0.16} />
      <ellipse cx={w / 2} cy={h * 0.55} rx={w * 0.1} ry={h * 0.07} />
      <line x1={w / 2} y1={h * 0.3} x2={w / 2} y2={h * 0.48} strokeWidth={0.6} />
      <path d={`M ${w / 2 - 3} ${h * 0.42} Q ${w / 2 - 6} ${h * 0.36} ${w / 2 - 2} ${h * 0.32}`} strokeWidth={0.5} />
      <path d={`M ${w / 2 + 3} ${h * 0.42} Q ${w / 2 + 6} ${h * 0.36} ${w / 2 + 2} ${h * 0.32}`} strokeWidth={0.5} />
      <rect x={w * 0.06} y={h * 0.75} width={w * 0.16} height={5} />
      <rect x={w * 0.78} y={h * 0.75} width={w * 0.16} height={5} />
      <circle cx={w * 0.15} cy={h * 0.9} r={2} />
      <circle cx={w * 0.85} cy={h * 0.25} r={2} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={2} y={h * 0.15} width={w - 4} height={h * 0.2} />
      {[0.2, 0.5, 0.8].map((p, i) => (
        <path key={`ag-arch${i}`} d={`M ${w * p - 4} ${h * 0.35} L ${w * p - 4} ${h * 0.22} A 4 4 0 0 1 ${w * p + 4} ${h * 0.22} L ${w * p + 4} ${h * 0.35}`} strokeWidth={0.7} />
      ))}
      {columns(6, 5, w - 5, h * 0.35, h, 'ag3c')}
      <line x1={4} y1={h * 0.36} x2={w - 4} y2={h * 0.36} strokeWidth={0.6} />
      {[[0.15, 0.7], [0.28, 0.85], [0.45, 0.75], [0.62, 0.9], [0.78, 0.8]].map(([x, y], i) => (
        <circle key={`agp${i}`} cx={w * x} cy={h * y} r={1.3} />
      ))}
      <line x1={0} y1={h} x2={w} y2={h} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={w * 0.28} y={h * 0.35} width={w * 0.44} height={h * 0.2} />
      {[0.38, 0.5, 0.62].map((p, i) => (
        <path key={`th4-door${i}`} d={`M ${w * p - 3} ${h * 0.55} L ${w * p - 3} ${h * 0.42} A 3 3 0 0 1 ${w * p + 3} ${h * 0.42} L ${w * p + 3} ${h * 0.55}`} strokeWidth={0.6} />
      ))}
      <circle cx={w / 2} cy={h * 0.62} r={w * 0.08} strokeWidth={0.6} />
      {[0.9, 0.75, 0.6, 0.45, 0.3, 0.16].map((ry, i) => (
        <path key={`th4arc${i}`} d={`M ${w / 2 - w * 0.46} ${h} A ${w * 0.46} ${h * ry * 0.6} 0 0 1 ${w / 2 + w * 0.46} ${h}`} />
      ))}
      <line x1={w / 2} y1={h * 0.65} x2={w * 0.1} y2={h} strokeWidth={0.5} opacity={0.7} />
      <line x1={w / 2} y1={h * 0.65} x2={w * 0.9} y2={h} strokeWidth={0.5} opacity={0.7} />
      <line x1={w / 2} y1={h * 0.65} x2={w / 2} y2={h} strokeWidth={0.5} opacity={0.7} />
      <line x1={0} y1={h * 0.85} x2={w * 0.06} y2={h * 0.7} strokeWidth={0.6} />
      <line x1={w} y1={h * 0.85} x2={w * 0.94} y2={h * 0.7} strokeWidth={0.6} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={w * 0.22} y={h * 0.28} width={w * 0.56} height={h * 0.24} />
      {columns(4, w * 0.24, w * 0.76, h * 0.28, h * 0.52, 'th5c')}
      {[0.32, 0.44, 0.56, 0.68].map((p, i) => (
        <path key={`th5-door${i}`} d={`M ${w * p - 3} ${h * 0.5} L ${w * p - 3} ${h * 0.36} A 3 3 0 0 1 ${w * p + 3} ${h * 0.36} L ${w * p + 3} ${h * 0.5}`} strokeWidth={0.6} />
      ))}
      <circle cx={w / 2} cy={h * 0.58} r={w * 0.1} strokeWidth={0.6} />
      {[0.95, 0.82, 0.69, 0.56, 0.43, 0.3, 0.18, 0.08].map((ry, i) => (
        <path key={`th5arc${i}`} d={`M ${w / 2 - w * 0.48} ${h} A ${w * 0.48} ${h * ry * 0.55} 0 0 1 ${w / 2 + w * 0.48} ${h}`} />
      ))}
      <line x1={w / 2} y1={h * 0.6} x2={w * 0.06} y2={h} strokeWidth={0.5} opacity={0.7} />
      <line x1={w / 2} y1={h * 0.6} x2={w * 0.94} y2={h} strokeWidth={0.5} opacity={0.7} />
      <line x1={w / 2} y1={h * 0.6} x2={w / 2} y2={h} strokeWidth={0.5} opacity={0.7} />
      <line x1={-2} y1={h * 0.9} x2={w * 0.04} y2={h * 0.68} strokeWidth={0.7} />
      <line x1={w + 2} y1={h * 0.9} x2={w * 0.96} y2={h * 0.68} strokeWidth={0.7} />
    </>
  )
]

const HEALTH_STAGES = [
  (w, h) => <>{foundationStage(w, h)}</>,
  (w, h, color) => (
    <>
      <rect x={w * 0.1} y={h * 0.25} width={w * 0.8} height={h * 0.12} />
      <rect x={w * 0.2} y={h * 0.37} width={w * 0.6} height={h * 0.45} />
      <rect x={w * 0.12} y={h * 0.82} width={w * 0.76} height={h * 0.09} />
      <rect x={w * 0.05} y={h * 0.91} width={w * 0.9} height={h * 0.09} />
      <rect x={w / 2 - 3} y={0} width={6} height={h * 0.22} fill={color} stroke="none" />
      <rect x={w / 2 - 9} y={h * 0.07} width={18} height={6} fill={color} stroke="none" />
    </>
  ),
  (w, h, color) => (
    <>
      <polygon points={`0,${h * 0.35} ${w / 2},0 ${w},${h * 0.35}`} />
      <rect x={0} y={h * 0.35} width={w} height={h * 0.65} />
      <path d={`M ${w * 0.15} ${h * 0.65} L ${w * 0.15} ${h * 0.5} A 3.5 3.5 0 0 1 ${w * 0.15 + 7} ${h * 0.5} L ${w * 0.15 + 7} ${h * 0.65}`} strokeWidth={0.7} />
      <path d={`M ${w * 0.85 - 7} ${h * 0.65} L ${w * 0.85 - 7} ${h * 0.5} A 3.5 3.5 0 0 1 ${w * 0.85} ${h * 0.5} L ${w * 0.85} ${h * 0.65}`} strokeWidth={0.7} />
      <path d={`M ${w * 0.4} ${h} L ${w * 0.4} ${h * 0.78} A ${w * 0.1} ${w * 0.1} 0 0 1 ${w * 0.6} ${h * 0.78} L ${w * 0.6} ${h}`} strokeWidth={1.3} />
      {steps(w, h, 1)}
      {hospitalCross(w / 2, 0, 10, 3.5, color)}
    </>
  ),
  (w, h, color) => (
    <>
      <rect x={4} y={h * 0.35} width={w - 8} height={h * 0.65} />
      {columns(4, 8, w - 8, h * 0.35, h, 'ht3c')}
      <rect x={0} y={h * 0.32} width={w} height={h * 0.04} />
      <polygon points={`0,${h * 0.32} ${w / 2},0 ${w},${h * 0.32}`} />
      <path d={`M ${w * 0.42} ${h} L ${w * 0.42} ${h * 0.85} A ${w * 0.08} ${w * 0.08} 0 0 1 ${w * 0.58} ${h * 0.85} L ${w * 0.58} ${h}`} strokeWidth={1.3} />
      {steps(w, h, 2)}
      {hospitalCross(w / 2, h * 0.1, 12, 4, color)}
    </>
  ),
  (w, h, color) => (
    <>
      <rect x={4} y={h * 0.32} width={w - 8} height={h * 0.68} />
      {columns(7, 8, w - 8, h * 0.32, h, 'ht4c')}
      <rect x={0} y={h * 0.28} width={w} height={h * 0.04} />
      <polygon points={`0,${h * 0.28} ${w / 2},0 ${w},${h * 0.28}`} />
      <path d={`M ${w * 0.1} ${h * 0.6} L ${w * 0.1} ${h * 0.48} A 4 4 0 0 1 ${w * 0.1 + 8} ${h * 0.48} L ${w * 0.1 + 8} ${h * 0.6}`} strokeWidth={0.7} />
      <path d={`M ${w * 0.9 - 8} ${h * 0.6} L ${w * 0.9 - 8} ${h * 0.48} A 4 4 0 0 1 ${w * 0.9} ${h * 0.48} L ${w * 0.9} ${h * 0.6}`} strokeWidth={0.7} />
      <path d={`M ${w * 0.4} ${h} L ${w * 0.4} ${h * 0.82} A ${w * 0.1} ${w * 0.1} 0 0 1 ${w * 0.6} ${h * 0.82} L ${w * 0.6} ${h}`} strokeWidth={1.3} />
      {steps(w, h, 3)}
      {hospitalCross(w / 2, h * 0.08, 15, 5, color)}
    </>
  ),
  (w, h, color) => (
    <>
      <rect x={2} y={h * 0.28} width={w - 4} height={h * 0.68} />
      {columns(9, 6, w - 6, h * 0.28, h * 0.94, 'ht5c')}
      <rect x={0} y={h * 0.24} width={w} height={h * 0.04} />
      <line x1={0} y1={h * 0.22} x2={w} y2={h * 0.22} strokeWidth={0.6} opacity={0.7} />
      <polygon points={`0,${h * 0.24} ${w / 2},0 ${w},${h * 0.24}`} />
      {[0.06, 0.94].map((p, i) => (
        <path key={`ht5w${i}`} d={`M ${w * p - 6} ${h * 0.55} L ${w * p - 6} ${h * 0.42} A 6 6 0 0 1 ${w * p + 6} ${h * 0.42} L ${w * p + 6} ${h * 0.55}`} strokeWidth={0.7} />
      ))}
      <path d={`M ${w * 0.38} ${h * 0.94} L ${w * 0.38} ${h * 0.75} A ${w * 0.12} ${w * 0.12} 0 0 1 ${w * 0.62} ${h * 0.75} L ${w * 0.62} ${h * 0.94}`} strokeWidth={1.4} />
      {steps(w, h, 4)}
      {hospitalCross(w / 2, h * 0.06, 18, 6, color)}
    </>
  )
]

const SAVINGS_STAGES = [
  (w, h) => <>{foundationStage(w, h)}</>,
  (w, h) => (
    <>
      <path d={`M ${w * 0.35} ${h} L ${w * 0.3} ${h * 0.35} L ${w * 0.7} ${h * 0.35} L ${w * 0.65} ${h}`} />
      <line x1={w * 0.25} y1={h * 0.35} x2={w * 0.75} y2={h * 0.35} strokeWidth={2} />
      <path d={`M ${w * 0.3} ${h * 0.4} Q ${w * 0.05} ${h * 0.5} ${w * 0.15} ${h * 0.7}`} />
      <path d={`M ${w * 0.7} ${h * 0.4} Q ${w * 0.95} ${h * 0.5} ${w * 0.85} ${h * 0.7}`} />
      <path d={`M ${w * 0.3} ${h * 0.35} Q ${w * 0.02} ${h * 0.55} ${w * 0.05} ${h * 0.8} Q ${w * 0.05} ${h} ${w / 2} ${h} Q ${w * 0.95} ${h} ${w * 0.95} ${h * 0.8} Q ${w * 0.98} ${h * 0.55} ${w * 0.7} ${h * 0.35}`} />
      <line x1={w * 0.1} y1={h * 0.55} x2={w * 0.9} y2={h * 0.55} strokeWidth={0.6} opacity={0.7} />
      <line x1={w * 0.08} y1={h * 0.65} x2={w * 0.92} y2={h * 0.65} strokeWidth={0.6} opacity={0.7} />
      <path d={`M ${w * 0.4} ${h * 0.9} L ${w / 2} ${h} L ${w * 0.6} ${h * 0.9}`} />
      <line x1={w * 0.2} y1={h} x2={w * 0.8} y2={h} />
    </>
  ),
  (w, h) => (
    <>
      {[
        { x: w * 0.05, hh: h * 0.55, wd: w * 0.24 },
        { x: w * 0.38, hh: h * 0.8, wd: w * 0.24 },
        { x: w * 0.71, hh: h * 0.42, wd: w * 0.24 }
      ].map((s, i) => (
        <g key={`silo${i}`}>
          <rect x={s.x} y={h - s.hh} width={s.wd} height={s.hh} />
          <ellipse cx={s.x + s.wd / 2} cy={h - s.hh} rx={s.wd / 2} ry={s.wd * 0.25} />
          <path d={`M ${s.x} ${h - s.hh} A ${s.wd / 2} ${s.wd / 2} 0 0 1 ${s.x + s.wd} ${h - s.hh}`} strokeWidth={0.6} />
          <line x1={s.x} y1={h - s.hh * 0.6} x2={s.x + s.wd} y2={h - s.hh * 0.6} strokeWidth={0.5} opacity={0.7} />
          <line x1={s.x} y1={h - s.hh * 0.3} x2={s.x + s.wd} y2={h - s.hh * 0.3} strokeWidth={0.5} opacity={0.7} />
          <rect x={s.x + s.wd * 0.3} y={h - 6} width={s.wd * 0.4} height={5} />
        </g>
      ))}
    </>
  ),
  (w, h, color) => (
    <>
      <rect x={0} y={0} width={w} height={h} />
      {columns(4, 4, w - 4, h * 0.06, h * 0.32, 'sv3c')}
      <line x1={0} y1={h * 0.32} x2={w} y2={h * 0.32} strokeWidth={0.6} />
      <polygon points={`0,${h * 0.06} ${w / 2},0 ${w},${h * 0.06}`} />
      <circle cx={w / 2} cy={h * 0.03} r={2.5} strokeWidth={0.6} />
      <circle cx={w / 2} cy={h * 0.68} r={w * 0.28} />
      <circle cx={w / 2} cy={h * 0.68} r={w * 0.18} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const ang = (i / 8) * Math.PI * 2
        const r1 = w * 0.18, r2 = w * 0.27
        return <line key={`spoke${i}`} x1={w / 2 + Math.cos(ang) * r1} y1={h * 0.68 + Math.sin(ang) * r1} x2={w / 2 + Math.cos(ang) * r2} y2={h * 0.68 + Math.sin(ang) * r2} strokeWidth={0.5} />
      })}
      <circle cx={w / 2} cy={h * 0.68} r={4} fill={color} stroke="none" />
      {[[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy], i) => (
        <rect key={`bolt${i}`} x={w / 2 + dx * w * 0.28 - 2} y={h * 0.68 + dy * w * 0.28 - 2} width={4} height={4} />
      ))}
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h} />
      {columns(7, 3, w - 3, h * 0.08, h * 0.3, 'sv4c')}
      <line x1={0} y1={h * 0.3} x2={w} y2={h * 0.3} strokeWidth={0.6} />
      <polygon points={`0,${h * 0.08} ${w / 2},0 ${w},${h * 0.08}`} />
      <circle cx={w / 2} cy={h * 0.04} r={3.5} strokeWidth={0.7} />
      <path d={`M ${w * 0.36} ${h} L ${w * 0.36} ${h * 0.72} A ${w * 0.14} ${w * 0.1} 0 0 1 ${w * 0.64} ${h * 0.72} L ${w * 0.64} ${h}`} strokeWidth={1.3} />
      <line x1={w / 2} y1={h} x2={w / 2} y2={h * 0.72} strokeWidth={0.6} />
      <rect x={w * 0.15} y={h * 0.55} width={w * 0.14} height={h * 0.15} />
      <rect x={w * 0.15} y={h * 0.42} width={w * 0.14} height={h * 0.13} />
      <rect x={w * 0.15} y={h * 0.31} width={w * 0.14} height={h * 0.11} />
      <circle cx={w / 2} cy={h * 0.18} r={w * 0.12} strokeWidth={0.7} />
      {steps(w, h, 4)}
    </>
  ),
  (w, h, color) => {
    const tiers = [
      { y0: h, y1: h - h * 0.28, x0: 0, x1: w },
      { y0: h - h * 0.28, y1: h - h * 0.5, x0: w * 0.1, x1: w * 0.9 },
      { y0: h - h * 0.5, y1: h - h * 0.7, x0: w * 0.2, x1: w * 0.8 },
      { y0: h - h * 0.7, y1: h - h * 0.86, x0: w * 0.3, x1: w * 0.7 }
    ]
    return (
      <>
        {tiers.map((t, i) => (
          <g key={`svt${i}`}>
            <path d={`M ${t.x0} ${t.y0} L ${t.x0} ${t.y1} L ${t.x1} ${t.y1} L ${t.x1} ${t.y0}`} />
            {columns(Math.max(3, 6 - i), t.x0 + 2, t.x1 - 2, t.y1, t.y0, `svtc${i}`)}
          </g>
        ))}
        <path d={`M ${w * 0.06} ${h} L ${w * 0.06} ${h - h * 0.14} A 3.5 3.5 0 0 1 ${w * 0.06 + 7} ${h - h * 0.14} L ${w * 0.06 + 7} ${h}`} strokeWidth={0.7} />
        <path d={`M ${w * 0.94 - 7} ${h} L ${w * 0.94 - 7} ${h - h * 0.14} A 3.5 3.5 0 0 1 ${w * 0.94} ${h - h * 0.14} L ${w * 0.94} ${h}`} strokeWidth={0.7} />
        <circle cx={w / 2} cy={h - h * 0.14} r={w * 0.14} />
        <rect x={w * 0.35} y={h - h * 0.58} width={w * 0.12} height={h * 0.1} />
        <rect x={w * 0.53} y={h - h * 0.58} width={w * 0.12} height={h * 0.1} />
        <circle cx={w / 2} cy={h - h * 0.9} r={2.5} fill={color} stroke="none" />
        <line x1={w / 2} y1={h - h * 0.86} x2={w / 2} y2={h - h * 0.9} strokeWidth={0.8} />
        {steps(w, h, 5)}
      </>
    )
  }
]

const JOURNAL_STAGES = [
  (w, h) => <>{foundationStage(w, h)}</>,
  (w, h) => (
    <>
      <rect x={w * 0.1} y={0} width={w * 0.8} height={h} rx={2} />
      {[0.15, 0.32, 0.49, 0.66, 0.83].map((p, i) => (
        <g key={`jt${i}`}>
          <line x1={w * 0.2} y1={h * p} x2={w * 0.8} y2={h * p} strokeWidth={0.5} />
          {[0, 1, 2, 3].map(t => (
            <line key={`jtt${i}-${t}`} x1={w * 0.25 + t * w * 0.13} y1={h * p - 2} x2={w * 0.28 + t * w * 0.13} y2={h * p + 2} strokeWidth={0.4} />
          ))}
        </g>
      ))}
      <rect x={0} y={h - 4} width={w} height={4} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={h * 0.55} width={w} height={h * 0.08} />
      <line x1={w * 0.15} y1={h * 0.63} x2={w * 0.15} y2={h} />
      <line x1={w * 0.85} y1={h * 0.63} x2={w * 0.85} y2={h} />
      <ellipse cx={w * 0.15} cy={h * 0.51} rx={5} ry={8} />
      <ellipse cx={w * 0.85} cy={h * 0.51} rx={5} ry={8} />
      <rect x={w * 0.15} y={h * 0.43} width={w * 0.7} height={h * 0.16} />
      <line x1={w * 0.25} y1={h * 0.48} x2={w * 0.75} y2={h * 0.48} strokeWidth={0.4} />
      <line x1={w * 0.25} y1={h * 0.51} x2={w * 0.75} y2={h * 0.51} strokeWidth={0.4} />
      <line x1={w * 0.25} y1={h * 0.54} x2={w * 0.75} y2={h * 0.54} strokeWidth={0.4} />
      <line x1={w * 0.7} y1={h * 0.35} x2={w * 0.5} y2={h * 0.55} />
      <path d={`M ${w * 0.7} ${h * 0.35} Q ${w * 0.78} ${h * 0.3} ${w * 0.75} ${h * 0.22}`} opacity={0.6} strokeWidth={0.6} />
      <rect x={2} y={h * 0.2} width={5} height={h * 0.35} />
      <path d={`M 2 ${h * 0.2} Q 4.5 ${h * 0.14} 7 ${h * 0.2}`} strokeWidth={0.6} />
      <rect x={w - 7} y={h * 0.2} width={5} height={h * 0.35} />
      <path d={`M ${w - 7} ${h * 0.2} Q ${w - 4.5} ${h * 0.14} ${w - 2} ${h * 0.2}`} strokeWidth={0.6} />
      <line x1={0} y1={h} x2={w} y2={h} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h} />
      {[0.2, 0.4, 0.6, 0.8].map((p, i) => (
        <line key={`jsh${i}`} x1={0} y1={h * p} x2={w} y2={h * p} strokeWidth={0.5} />
      ))}
      {[0, 1, 2, 3, 4].map(shelf => (
        <g key={`jbooks${shelf}`}>
          {Array.from({ length: 9 }).map((_, b) => (
            <rect key={`jb${shelf}-${b}`} x={(w / 9) * b + 0.5} y={shelf * h * 0.2 + h * 0.03} width={(w / 9) - 1} height={h * 0.14} />
          ))}
        </g>
      ))}
      <line x1={0} y1={h} x2={w} y2={h} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={h * 0.1} width={w} height={h * 0.9} />
      <path d={`M ${w * 0.2} ${h * 0.1} A ${w * 0.3} ${h * 0.1} 0 0 1 ${w * 0.8} ${h * 0.1}`} />
      {[1, 2, 3].map(i => (
        <line key={`domr${i}`} x1={w * 0.5} y1={0} x2={w * (0.2 + i * 0.2)} y2={h * 0.1} strokeWidth={0.4} />
      ))}
      <line x1={w * 0.1} y1={h * 0.25} x2={w * 0.9} y2={h * 0.25} strokeWidth={0.4} />
      {[0, 1, 2, 3, 4, 5].map(b => (
        <rect key={`jrb${b}`} x={w * 0.1 + (w * 0.8 / 6) * b} y={h * 0.15} width={(w * 0.8 / 6) - 0.5} height={h * 0.09} />
      ))}
      {[0.06, 0.94].map((p, i) => (
        <path key={`jrw${i}`} d={`M ${w * p - 4} ${h * 0.5} L ${w * p - 4} ${h * 0.38} A 4 4 0 0 1 ${w * p + 4} ${h * 0.38} L ${w * p + 4} ${h * 0.5}`} strokeWidth={0.6} />
      ))}
      <path d={`M ${w * 0.1} ${h} L ${w * 0.2} ${h * 0.7} L ${w * 0.45} ${h * 0.7} L ${w * 0.4} ${h} Z`} />
      <path d={`M ${w * 0.6} ${h} L ${w * 0.55} ${h * 0.7} L ${w * 0.8} ${h * 0.7} L ${w * 0.9} ${h} Z`} />
      <line x1={w * 0.3} y1={h * 0.5} x2={w * 0.3} y2={h * 0.65} strokeWidth={0.5} />
      <circle cx={w * 0.3} cy={h * 0.48} r={1.5} />
      <line x1={w * 0.68} y1={h * 0.5} x2={w * 0.68} y2={h * 0.65} strokeWidth={0.5} />
      <circle cx={w * 0.68} cy={h * 0.48} r={1.5} />
      <circle cx={w * 0.25} cy={h * 0.66} r={2} />
      <circle cx={w * 0.7} cy={h * 0.66} r={2} />
    </>
  ),
  (w, h) => (
    <>
      <rect x={0} y={h * 0.12} width={w} height={h * 0.88} />
      {columns(12, 2, w - 2, h * 0.12, h * 0.85, 'ja5c')}
      <path d={`M ${w * 0.22} ${h * 0.12} A ${w * 0.28} ${h * 0.12} 0 0 1 ${w * 0.78} ${h * 0.12}`} strokeWidth={1.2} />
      {[1, 2, 3, 4].map(i => (
        <line key={`ja5rib${i}`} x1={w * 0.5} y1={0} x2={w * (0.22 + i * 0.14)} y2={h * 0.12} strokeWidth={0.4} />
      ))}
      <path d={`M ${w * 0.42} ${h * 0.85} L ${w * 0.42} ${h * 0.6} A ${w * 0.08} ${w * 0.1} 0 0 1 ${w * 0.58} ${h * 0.6} L ${w * 0.58} ${h * 0.85}`} strokeWidth={1.3} />
      <path d={`M ${w * 0.24} ${h * 0.85} L ${w * 0.24} ${h * 0.68} A ${w * 0.06} ${w * 0.08} 0 0 1 ${w * 0.36} ${h * 0.68} L ${w * 0.36} ${h * 0.85}`} strokeWidth={0.8} />
      <path d={`M ${w * 0.64} ${h * 0.85} L ${w * 0.64} ${h * 0.68} A ${w * 0.06} ${w * 0.08} 0 0 1 ${w * 0.76} ${h * 0.68} L ${w * 0.76} ${h * 0.85}`} strokeWidth={0.8} />
      <line x1={w * 0.5} y1={h * 0.5} x2={w * 0.56} y2={h * 0.4} strokeWidth={0.8} />
      <path d={`M ${w * 0.56} ${h * 0.4} Q ${w * 0.62} ${h * 0.36} ${w * 0.6} ${h * 0.3}`} opacity={0.6} strokeWidth={0.5} />
      {[0.1, 0.24, 0.76, 0.9].map((p, i) => (
        <path key={`ja5w${i}`} d={`M ${w * p - 4} ${h * 0.4} L ${w * p - 4} ${h * 0.28} A 4 4 0 0 1 ${w * p + 4} ${h * 0.28} L ${w * p + 4} ${h * 0.4}`} strokeWidth={0.6} />
      ))}
      {steps(w, h, 5)}
    </>
  )
]

const BUILDINGS = {
  fitness: FITNESS_STAGES, work: WORK_STAGES, reading: READING_STAGES,
  learning: LEARNING_STAGES, social: SOCIAL_STAGES, health: HEALTH_STAGES,
  savings: SAVINGS_STAGES, journal: JOURNAL_STAGES
}

export function getBuildingRender(district, stage, w, h, color) {
  const fn = BUILDINGS[district]?.[stage]
  return fn ? fn(w, h, color) : null
}
