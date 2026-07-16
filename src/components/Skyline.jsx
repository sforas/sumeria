import { getPeriod } from '../lib/useAtmosphere'

const DISTRICTS = [
  { key: 'fitness', label: 'Fitness', color: 'var(--fit)' },
  { key: 'work', label: 'Work', color: 'var(--work)' },
  { key: 'reading', label: 'Reading', color: 'var(--read)' },
  { key: 'learning', label: 'Learning', color: 'var(--learn)' },
  { key: 'social', label: 'Social', color: 'var(--social)' },
  { key: 'health', label: 'Health', color: 'var(--health)' },
  { key: 'savings', label: 'Savings', color: 'var(--savings)' },
  { key: 'journal', label: 'Journal', color: 'var(--journal)' }
]

const GROUND_Y = 140
const SLOT_WIDTH = 40
const BUILDING_WIDTH = 34

function buildingHeight(score) {
  const clamped = Math.max(0, Math.min(100, score || 0))
  return 30 + (clamped / 100) * 90
}

function windowCount(height) {
  if (height > 90) return 4
  if (height > 60) return 3
  return 2
}

function sunMoonPosition() {
  const now = new Date()
  const hourFloat = now.getHours() + now.getMinutes() / 60
  const t = Math.max(0, Math.min(1, (hourFloat - 5) / 14))
  const x = 20 + t * (300 - 20)
  const y = 60 - 40 * 4 * t * (1 - t)
  return { x, y }
}

export default function Skyline({ scores = {} }) {
  const period = getPeriod()
  const isNight = period === 'night'
  const { x: sunX, y: sunY } = sunMoonPosition()

  return (
    <svg width="100%" viewBox="0 0 320 165" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skylineSkyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sky1)" />
          <stop offset="100%" stopColor="var(--sky2)" />
        </linearGradient>
        <filter id="skylineSunGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="320" height="99" fill="url(#skylineSkyGradient)" />

      {/* Ground */}
      <rect x="0" y="142" width="320" height="23" fill="var(--surf)" />
      <line x1="0" y1="142" x2="320" y2="142" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

      {/* Sun / Moon */}
      {isNight ? (
        <>
          <circle cx={sunX - 10} cy={sunY - 14} r="0.8" fill="#D8E0F0" opacity="0.8" />
          <circle cx={sunX + 12} cy={sunY - 6} r="0.6" fill="#D8E0F0" opacity="0.7" />
          <circle cx={sunX - 6} cy={sunY + 10} r="0.7" fill="#D8E0F0" opacity="0.6" />
          <circle cx={sunX + 8} cy={sunY + 14} r="0.6" fill="#D8E0F0" opacity="0.5" />
          <circle cx={sunX} cy={sunY} r="9" fill="#D8E0F0" />
        </>
      ) : (
        <circle cx={sunX} cy={sunY} r="12" fill="#D4A843" filter="url(#skylineSunGlow)" />
      )}

      {/* Buildings */}
      {DISTRICTS.map((d, i) => {
        const x = i * SLOT_WIDTH + (SLOT_WIDTH - BUILDING_WIDTH) / 2
        const height = buildingHeight(scores[d.key])
        const y = GROUND_Y - height
        const winCount = windowCount(height)
        const winW = 5
        const winH = 5
        const winGapY = (height - 10) / (winCount + 1)
        return (
          <g key={d.key}>
            <rect x={x} y={y} width={BUILDING_WIDTH} height={height} fill={d.color} fillOpacity="0.8" stroke={d.color} strokeWidth="0.5" />
            {Array.from({ length: winCount }).map((_, wi) => (
              <rect
                key={wi}
                x={x + BUILDING_WIDTH / 2 - winW / 2}
                y={y + winGapY * (wi + 1)}
                width={winW}
                height={winH}
                fill="rgba(255,255,255,0.35)"
              />
            ))}
            <text x={x + BUILDING_WIDTH / 2} y="158" fontSize="7" fill="var(--muted2)" textAnchor="middle">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
