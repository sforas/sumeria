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

// ---- shared drawing helpers (return element arrays, used inside stage renderers) ----

function columns(n, x0, x1, yTop, yBot, keyPrefix) {
  const items = []
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * (i / (n - 1))
    items.push(<line key={`${keyPrefix}${i}`} x1={x} y1={yTop} x2={x} y2={yBot} />)
  }
  return items
}

function pediment(x0, x1, yBase, rise, keyPrefix) {
  const xMid = (x0 + x1) / 2
  return <path key={keyPrefix} d={`M ${x0} ${yBase} L ${xMid} ${yBase - rise} L ${x1} ${yBase} Z`} />
}

function windowsGrid(x0, x1, y0, y1, cols_, rows_, keyPrefix) {
  const items = []
  const cw = (x1 - x0) / cols_
  const rh = (y1 - y0) / rows_
  for (let r = 0; r < rows_; r++) {
    for (let c = 0; c < cols_; c++) {
      items.push(
        <rect key={`${keyPrefix}${r}-${c}`}
          x={x0 + c * cw + cw * 0.2} y={y0 + r * rh + rh * 0.2}
          width={cw * 0.6} height={rh * 0.6}
          fill="rgba(255,255,255,0.35)" stroke="none" />
      )
    }
  }
  return items
}

function seatingArc(cx, cy, rx, ry, keyPrefix) {
  return <path key={keyPrefix} d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`} fill="none" />
}

// Stage 0 is identical across every district: a bare foundation slab
function foundationStage(w) {
  return <rect x={w * 0.18} y={-4} width={w * 0.64} height="4" />
}

// ---- per-district stage renderers: fn(w, h) -> JSX, ground at y=h, top of current growth at y=0 ----
// (all shapes use h-relative offsets, per spec: y=0 is the top, y=h is the ground)

const FITNESS_STAGES = [
  (w, _h) => <>{foundationStage(w)}</>,
  (w, h) => (
    <>
      <rect x="2" y={h - 18} width="6" height="18" />
      <rect x="22" y={h - 12} width="6" height="12" />
      <line x1="8" y1={h - 18} x2="20" y2={h - 18} strokeWidth="2" />
    </>
  ),
  (w, h) => (
    <>
      <line x1="5" y1={h - 36} x2="5" y2={h} />
      <line x1="25" y1={h - 36} x2="25" y2={h} />
      <line x1="2" y1={h - 36} x2="28" y2={h - 36} strokeWidth="1.5" />
      <line x1="8" y1={h - 22} x2="8" y2={h} />
      <line x1="16" y1={h - 22} x2="16" y2={h} />
      <line x1="6" y1={h - 22} x2="18" y2={h - 22} />
    </>
  ),
  (w, h) => (
    <>
      <ellipse cx="21" cy={h - 14} rx="19" ry="10" fill="none" />
      <ellipse cx="21" cy={h - 8} rx="19" ry="6" fill="none" />
      <path d={`M 8 ${h} L 8 ${h - 14} A 8 8 0 0 1 34 ${h - 14} L 34 ${h}`} fill="none" />
    </>
  ),
  (w, h) => (
    <>
      <ellipse cx="23" cy={h - 20} rx="21" ry="13" fill="none" />
      <ellipse cx="23" cy={h - 13} rx="21" ry="9" fill="none" />
      <ellipse cx="23" cy={h - 6} rx="21" ry="5" fill="none" />
      <path d={`M 8 ${h} L 8 ${h - 20} A 15 15 0 0 1 38 ${h - 20} L 38 ${h}`} fill="none" />
    </>
  ),
  (w, h) => (
    <>
      <ellipse cx="25" cy={h - 26} rx="24" ry="16" fill="none" />
      <ellipse cx="25" cy={h - 18} rx="24" ry="12" fill="none" />
      <ellipse cx="25" cy={h - 10} rx="24" ry="7" fill="none" />
      <ellipse cx="25" cy={h - 4} rx="24" ry="3" fill="none" />
      <path d={`M 6 ${h} L 6 ${h - 26} A 19 19 0 0 1 44 ${h - 26} L 44 ${h}`} fill="none" />
      {[0, 1, 2, 3, 4].map(i => (
        <line key={`vel${i}`} x1={7 + i * 9} y1={h - 42} x2={7 + i * 9} y2={h - 34} strokeWidth="0.8" />
      ))}
    </>
  )
]

const WORK_STAGES = [
  (w, _h) => <>{foundationStage(w)}</>,
  (w, h) => (
    <>
      <path d={`M 3 ${h - 14} L 17 ${h - 18} L 31 ${h - 14} L 31 ${h - 10} L 3 ${h - 10} Z`} fill="none" />
      <line x1="6" y1={h - 10} x2="6" y2={h} />
      <line x1="28" y1={h - 10} x2="28" y2={h} />
      <rect x="10" y={h - 6} width="14" height="6" fill="none" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 22} width="30" height="22" />
      <path d={`M 2 ${h - 22} L 19 ${h - 32} L 36 ${h - 22} Z`} fill="none" />
      <rect x="15" y={h - 10} width="8" height="10" fill="rgba(255,255,255,0.35)" stroke="none" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="3" y={h - 42} width="36" height="42" fill="none" />
      <line x1="3" y1={h - 28} x2="39" y2={h - 28} strokeWidth="0.8" />
      <line x1="3" y1={h - 14} x2="39" y2={h - 14} strokeWidth="0.8" />
      {windowsGrid(6, 36, h - 40, h - 30, 4, 1, 'w3a')}
      {windowsGrid(6, 36, h - 26, h - 16, 4, 1, 'w3b')}
      <path d={`M 15 ${h} L 15 ${h - 8} A 6 6 0 0 1 27 ${h - 8} L 27 ${h}`} fill="none" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="10" y={h - 68} width="26" height="68" fill="none" />
      <rect x="2" y={h - 16} width="10" height="16" fill="none" />
      <rect x="34" y={h - 22} width="10" height="22" fill="none" />
      {[0, 1, 2, 3, 4].map(r => (
        <g key={`w4r${r}`}>{windowsGrid(13, 33, h - 62 + r * 12, h - 54 + r * 12, 3, 1, `w4-${r}-`)}</g>
      ))}
    </>
  ),
  (w, h) => (
    <>
      <rect x="10" y={h - 94} width="30" height="94" fill="none" />
      <rect x="14" y={h - 106} width="22" height="12" fill="none" />
      <rect x="18" y={h - 114} width="14" height="8" fill="none" />
      <line x1="25" y1={h - 114} x2="25" y2={h - 124} strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5].map(r => (
        <line key={`w5-${r}`} x1={13} y1={h - 90 + r * 14} x2={13} y2={h - 4} strokeWidth="0.5" />
      ))}
      {[0, 1, 2, 3, 4, 5].map(r => (
        <line key={`w5b-${r}`} x1={37} y1={h - 90 + r * 14} x2={37} y2={h - 4} strokeWidth="0.5" />
      ))}
    </>
  )
]

const READING_STAGES = [
  (w, _h) => <>{foundationStage(w)}</>,
  (w, h) => (
    <>
      <rect x="12" y={h - 18} width="10" height="18" fill="none" />
      {[0, 1, 2, 3].map(i => (
        <line key={`r1-${i}`} x1="13" y1={h - 15 + i * 4} x2="21" y2={h - 15 + i * 4} strokeWidth="0.8" />
      ))}
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 26} width="30" height="26" fill="none" />
      <ellipse cx="12" cy={h - 18} rx="5" ry="2.5" />
      <ellipse cx="19" cy={h - 12} rx="5" ry="2.5" />
      <ellipse cx="26" cy={h - 18} rx="5" ry="2.5" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 26} width="34" height="26" fill="none" />
      {pediment(2, 40, h - 26, 12, 'r3ped')}
      {columns(4, 8, 34, h - 26, h, 'r3c')}
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 40} width="38" height="40" fill="none" />
      {pediment(2, 44, h - 40, 14, 'r4ped')}
      {columns(6, 8, 38, h - 40, h, 'r4c')}
      <rect x="44" y={h - 30} width="4" height="30" />
      <path d={`M 44 ${h - 30} L 46 ${h - 36} L 48 ${h - 30} Z`} />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 56} width="42" height="56" fill="none" />
      {pediment(2, 48, h - 56, 16, 'r5ped')}
      {columns(8, 8, 42, h - 56, h, 'r5c')}
      <rect x="48" y={h - 48} width="5" height="48" />
      <path d={`M 48 ${h - 48} L 50.5 ${h - 58} L 53 ${h - 48} Z`} />
      <circle cx="50.5" cy={h - 61} r="1.4" fill="var(--xp)" stroke="none" />
    </>
  )
]

const LEARNING_STAGES = [
  (w, _h) => <>{foundationStage(w)}</>,
  (w, h) => (
    <>
      <rect x="3" y={h - 18} width="28" height="18" fill="none" />
      <rect x="7" y={h - 15} width="12" height="6" fill="none" strokeWidth="0.8" />
      <line x1="9" y1={h - 4} x2="9" y2={h} />
      <line x1="17" y1={h - 4} x2="17" y2={h} />
      <line x1="25" y1={h - 4} x2="25" y2={h} />
    </>
  ),
  (w, h) => (
    <>
      <rect x="3" y={h - 24} width="32" height="24" fill="none" />
      <rect x="7" y={h - 19} width="9" height="9" fill="rgba(255,255,255,0.3)" />
      <rect x="22" y={h - 19} width="9" height="9" fill="rgba(255,255,255,0.3)" />
      <circle cx="11.5" cy={h - 15} r="0.9" stroke="none" />
      <circle cx="26.5" cy={h - 15} r="0.9" stroke="none" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 26} width="34" height="26" fill="none" />
      {pediment(2, 40, h - 26, 12, 'l3ped')}
      {columns(4, 8, 34, h - 26, h, 'l3c')}
      <rect x="17" y={h - 33} width="8" height="3" />
      <line x1="17" y1={h - 31.5} x2="13" y2={h - 31.5} strokeWidth="1" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="16" y={h - 46} width="14" height="46" fill="none" />
      <rect x="3" y={h - 30} width="12" height="30" fill="none" />
      <rect x="31" y={h - 30} width="12" height="30" fill="none" />
      <circle cx="23" cy={h - 38} r="4" fill="none" strokeWidth="1" />
      <line x1="23" y1={h - 38} x2="23" y2={h - 41} strokeWidth="0.7" />
      <line x1="23" y1={h - 38} x2="25" y2={h - 38} strokeWidth="0.7" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="18" y={h - 60} width="14" height="60" fill="none" />
      <rect x="3" y={h - 38} width="14" height="38" fill="none" />
      <rect x="33" y={h - 38} width="14" height="38" fill="none" />
      <path d={`M 18 ${h - 60} A 7 9 0 0 1 32 ${h - 60}`} fill="none" />
      <circle cx="25" cy={h - 50} r="4" fill="none" strokeWidth="1" />
      <line x1="25" y1={h - 50} x2="25" y2={h - 53} strokeWidth="0.7" />
      <line x1="25" y1={h - 50} x2="27" y2={h - 50} strokeWidth="0.7" />
    </>
  )
]

const SOCIAL_STAGES = [
  (w, _h) => <>{foundationStage(w)}</>,
  (w, h) => (
    <>
      <line x1="6" y1={h - 16} x2="6" y2={h} />
      <line x1="22" y1={h - 16} x2="22" y2={h} />
      <line x1="4" y1={h - 16} x2="24" y2={h - 16} strokeWidth="1.5" />
      <circle cx="14" cy={h - 16} r="2" fill="none" />
      <rect x="11" y={h - 9} width="6" height="6" fill="none" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="2" y={h - 6} width="34" height="6" fill="none" />
      <ellipse cx="19" cy={h - 6} rx="8" ry="4" fill="none" />
      <circle cx="19" cy={h - 6} r="2" />
      <rect x="4" y={h - 12} width="7" height="6" fill="none" />
      <rect x="27" y={h - 12} width="7" height="6" fill="none" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="3" y={h - 24} width="34" height="6" fill="none" />
      {columns(6, 5, 35, h - 18, h, 's3c')}
      {[9, 15, 21, 27].map((x, i) => (
        <circle key={`s3p${i}`} cx={x} cy={h - 3} r="1.4" stroke="none" />
      ))}
    </>
  ),
  (w, h) => (
    <>
      <rect x="14" y={h - 20} width="18" height="20" fill="none" />
      {seatingArc(23, h, 21, 16, 's4a')}
      {seatingArc(23, h, 16, 12, 's4b')}
      {seatingArc(23, h, 11, 8, 's4c')}
    </>
  ),
  (w, h) => (
    <>
      <rect x="15" y={h - 26} width="20" height="26" fill="none" />
      {seatingArc(25, h, 24, 19, 's5a')}
      {seatingArc(25, h, 19, 15, 's5b')}
      {seatingArc(25, h, 14, 11, 's5c')}
      {seatingArc(25, h, 9, 7, 's5d')}
      <line x1="1" y1={h - 4} x2="6" y2={h - 12} strokeWidth="0.8" />
      <line x1="49" y1={h - 4} x2="44" y2={h - 12} strokeWidth="0.8" />
    </>
  )
]

const HEALTH_STAGES = [
  (w, _h) => <>{foundationStage(w)}</>,
  (w, h) => (
    <>
      <rect x="9" y={h - 14} width="16" height="14" fill="none" />
      <rect x="6" y={h - 16} width="22" height="3" />
      <line x1="17" y1={h - 24} x2="17" y2={h - 18} strokeWidth="1.6" />
      <line x1="14" y1={h - 21} x2="20" y2={h - 21} strokeWidth="1.6" />
    </>
  ),
  (w, h) => (
    <>
      <path d={`M 6 ${h - 12} L 19 ${h - 22} L 32 ${h - 12} L 32 ${h} L 6 ${h} Z`} fill="none" />
      <path d={`M 15 ${h} L 15 ${h - 8} A 4 4 0 0 1 23 ${h - 8} L 23 ${h}`} fill="none" />
      <line x1="19" y1={h - 30} x2="19" y2={h - 23} strokeWidth="1.6" />
      <line x1="15.5" y1={h - 26.5} x2="22.5" y2={h - 26.5} strokeWidth="1.6" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 26} width="34" height="26" fill="none" />
      {pediment(2, 40, h - 26, 12, 'h3ped')}
      {columns(4, 8, 34, h - 26, h, 'h3c')}
      <line x1="21" y1={h - 34} x2="21" y2={h - 27} strokeWidth="1.6" />
      <line x1="17.5" y1={h - 30.5} x2="24.5" y2={h - 30.5} strokeWidth="1.6" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 44} width="38" height="44" fill="none" />
      {pediment(2, 44, h - 44, 15, 'h4ped')}
      {columns(7, 8, 38, h - 44, h, 'h4c')}
      <line x1="23" y1={h - 55} x2="23" y2={h - 47} strokeWidth="2" />
      <line x1="19" y1={h - 51} x2="27" y2={h - 51} strokeWidth="2" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 60} width="42" height="60" fill="none" />
      {pediment(2, 48, h - 60, 17, 'h5ped')}
      {columns(9, 8, 42, h - 60, h - 6, 'h5c')}
      <rect x="2" y={h - 6} width="46" height="2" />
      <rect x="0" y={h - 3} width="50" height="3" />
      <line x1="25" y1={h - 73} x2="25" y2={h - 63} strokeWidth="2.2" />
      <line x1="20" y1={h - 68} x2="30" y2={h - 68} strokeWidth="2.2" />
    </>
  )
]

const SAVINGS_STAGES = [
  (w, _h) => <>{foundationStage(w)}</>,
  (w, h) => (
    <>
      <path d={`M 15 ${h} L 12 ${h - 10} A 6 5 0 0 1 22 ${h - 10} L 19 ${h} Z`} fill="none" />
      <path d={`M 12 ${h - 8} Q 8 ${h - 12} 11 ${h - 16}`} fill="none" strokeWidth="1" />
      <path d={`M 22 ${h - 8} Q 26 ${h - 12} 23 ${h - 16}`} fill="none" strokeWidth="1" />
      <ellipse cx="17" cy={h - 16} rx="3" ry="1.6" fill="none" />
    </>
  ),
  (w, h) => (
    <>
      {[
        { x: 3, hh: 20 }, { x: 15, hh: 28 }, { x: 27, hh: 16 }
      ].map((s, i) => (
        <g key={`sil${i}`}>
          <rect x={s.x} y={h - s.hh} width="9" height={s.hh} fill="none" />
          <ellipse cx={s.x + 4.5} cy={h - s.hh} rx="4.5" ry="2" fill="none" />
        </g>
      ))}
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 26} width="34" height="26" fill="none" />
      {pediment(2, 40, h - 26, 12, 'sv3ped')}
      <circle cx="21" cy={h - 12} r="6" fill="none" strokeWidth="1.4" />
      <circle cx="21" cy={h - 12} r="1.4" stroke="none" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 40} width="38" height="40" fill="none" />
      {pediment(2, 44, h - 40, 14, 'sv4ped')}
      {columns(6, 8, 38, h - 40, h, 'sv4c')}
      <circle cx="23" cy={h - 45} r="2" stroke="none" />
      <rect x="6" y={h - 6} width="8" height="4" stroke="none" opacity="0.8" />
      <rect x="32" y={h - 6} width="8" height="4" stroke="none" opacity="0.8" />
    </>
  ),
  (w, h) => {
    const tiers = [
      { y0: h, y1: h - 14, x0: 2, x1: 48 },
      { y0: h - 14, y1: h - 28, x0: 8, x1: 42 },
      { y0: h - 28, y1: h - 42, x0: 14, x1: 36 },
      { y0: h - 42, y1: h - 56, x0: 19, x1: 31 }
    ]
    return (
      <>
        {tiers.map((t, i) => (
          <path key={`svt${i}`} fill="none"
            d={`M ${t.x0} ${t.y0} L ${t.x0} ${t.y1} L ${t.x1} ${t.y1} L ${t.x1} ${t.y0}`} />
        ))}
        <circle cx="25" cy={h - 21} r="4" fill="none" strokeWidth="1.2" />
        <circle cx="25" cy={h - 62} r="2" stroke="none" />
        <line x1="25" y1={h - 56} x2="25" y2={h - 60} strokeWidth="1" />
      </>
    )
  }
]

const JOURNAL_STAGES = [
  (w, _h) => <>{foundationStage(w)}</>,
  (w, h) => (
    <>
      <rect x="9" y={h - 16} width="16" height="16" rx="1" fill="none" />
      {[0, 1, 2, 3].map(r => (
        <g key={`j1r${r}`}>
          {[0, 1, 2].map(c => (
            <line key={`j1-${r}-${c}`} x1={12 + c * 4} y1={h - 13 + r * 3.5} x2={13.5 + c * 4} y2={h - 13 + r * 3.5} strokeWidth="0.8" />
          ))}
        </g>
      ))}
    </>
  ),
  (w, h) => (
    <>
      <rect x="3" y={h - 10} width="30" height="10" fill="none" />
      <ellipse cx="11" cy={h - 12} rx="4.5" ry="2" fill="none" />
      <ellipse cx="21" cy={h - 12} rx="4.5" ry="2" fill="none" />
      <path d={`M 28 ${h - 18} L 33 ${h - 22}`} strokeWidth="1" />
      <rect x="4" y={h - 16} width="2" height="6" stroke="none" />
      <circle cx="5" cy={h - 17} r="1" fill="var(--xp)" stroke="none" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 26} width="34" height="26" fill="none" />
      {windowsGrid(7, 35, h - 22, h - 6, 3, 2, 'j3w')}
      {[0, 1, 2].map(c => (
        <g key={`j3s${c}`}>
          {[0, 1, 2].map(r => (
            <line key={`j3s${c}-${r}`} x1={9.5 + c * 9} y1={h - 20 + r * 6} x2={12.5 + c * 9} y2={h - 20 + r * 6} strokeWidth="0.6" />
          ))}
        </g>
      ))}
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 40} width="38" height="40" fill="none" />
      <path d={`M 4 ${h - 40} A 19 12 0 0 1 42 ${h - 40}`} fill="none" />
      <rect x="10" y={h - 12} width="9" height="8" fill="none" strokeWidth="0.8" />
      <rect x="27" y={h - 12} width="9" height="8" fill="none" strokeWidth="0.8" />
      <circle cx="14.5" cy={h - 16} r="1" stroke="none" />
      <circle cx="31.5" cy={h - 16} r="1" stroke="none" />
    </>
  ),
  (w, h) => (
    <>
      <rect x="4" y={h - 52} width="42" height="52" fill="none" />
      <path d={`M 4 ${h - 52} A 21 15 0 0 1 46 ${h - 52}`} fill="none" />
      {columns(6, 8, 42, h - 30, h - 20, 'j5c')}
      <rect x="10" y={h - 20} width="7" height="20" fill="none" />
      <rect x="21.5" y={h - 20} width="7" height="20" />
      <rect x="33" y={h - 20} width="7" height="20" fill="none" />
      <path d={`M 25 ${h - 62} L 29 ${h - 70}`} strokeWidth="1" />
    </>
  )
]

const BUILDINGS = {
  fitness: FITNESS_STAGES, work: WORK_STAGES, reading: READING_STAGES,
  learning: LEARNING_STAGES, social: SOCIAL_STAGES, health: HEALTH_STAGES,
  savings: SAVINGS_STAGES, journal: JOURNAL_STAGES
}

export function getBuildingRender(district, stage, h) {
  const fn = BUILDINGS[district]?.[stage]
  return fn ? fn(STAGE_DIMENSIONS[stage].width, h) : null
}
