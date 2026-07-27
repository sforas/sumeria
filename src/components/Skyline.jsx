import { getPeriod } from '../lib/useAtmosphere'
import { getStageAndProgress } from '../lib/districtPoints'
import { DISTRICT_ORDER, COLORS, getBuildingSize, getBuildingRender } from '../lib/buildingRenders'
import {
  FitnessSymbol, WorkSymbol, ReadingSymbol, LearningSymbol,
  SocialSymbol, HealthSymbol, SavingsSymbol, JournalSymbol
} from './icons/DistrictSymbols'

const DISTRICT_SYMBOLS = {
  fitness: FitnessSymbol, work: WorkSymbol, reading: ReadingSymbol, learning: LearningSymbol,
  social: SocialSymbol, health: HealthSymbol, savings: SavingsSymbol, journal: JournalSymbol
}

const BUILDING_X = [10, 50, 90, 130, 170, 210, 250, 290]

function sunMoonPosition() {
  const now = new Date()
  const hourFloat = now.getHours() + now.getMinutes() / 60
  const t = Math.max(0, Math.min(1, (hourFloat - 5) / 16))
  const x = 10 + t * (310 - 10)
  const y = 20 - 48 * t * (1 - t)
  return { x, y, hourFloat }
}

const GROUND_Y = 128

export default function Skyline({ points = {}, onBuildingClick }) {
  const period = getPeriod()
  const isNight = period === 'night'
  const { x: sunX, y: sunY, hourFloat } = sunMoonPosition()
  const isSunTime = hourFloat >= 5 && hourFloat < 19

  return (
    <svg width="100%" viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skylineSkyGradient2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sky1)" />
          <stop offset="100%" stopColor="var(--sky2)" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="320" height={GROUND_Y} fill="url(#skylineSkyGradient2)" />

      {/* Sun / Moon */}
      {isSunTime ? (
        <circle cx={sunX} cy={sunY} r="8" fill="var(--acc)" />
      ) : (
        <path
          d={`M ${sunX + 3} ${sunY - 6} A 7 7 0 1 0 ${sunX + 3} ${sunY + 6} A 5 5 0 1 1 ${sunX + 3} ${sunY - 6} Z`}
          fill="none" stroke="var(--muted)" strokeWidth="1"
        />
      )}
      {isNight && (
        <>
          <circle cx={sunX - 20} cy={sunY + 8} r="0.7" fill="var(--muted)" opacity="0.6" />
          <circle cx={sunX + 22} cy={sunY - 4} r="0.6" fill="var(--muted)" opacity="0.5" />
          <circle cx={sunX - 10} cy={sunY - 14} r="0.5" fill="var(--muted)" opacity="0.5" />
        </>
      )}

      {/* Ground */}
      <rect x="0" y={GROUND_Y} width="320" height={140 - GROUND_Y} fill="var(--surf)" />
      <line x1="0" y1={GROUND_Y} x2="320" y2={GROUND_Y} stroke="var(--sand)" strokeOpacity="0.4" strokeWidth="1" />

      {/* Buildings */}
      {DISTRICT_ORDER.map((district, i) => {
        const pts = points[district] || 0
        const { stage, progress } = getStageAndProgress(district, pts)
        const { width, height } = getBuildingSize(stage, progress)
        const color = COLORS[district]
        const content = getBuildingRender(district, stage, width, height, color)
        return (
          <g
            key={district}
            transform={`translate(${BUILDING_X[i] - width / 2}, ${GROUND_Y - height})`}
            fill="none" stroke={color} strokeWidth="1.3"
            onClick={onBuildingClick ? () => onBuildingClick(district) : undefined}
            style={onBuildingClick ? { cursor: 'pointer' } : undefined}
          >
            {content}
          </g>
        )
      })}

      {/* District symbols */}
      {DISTRICT_ORDER.map((district, i) => {
        const Symbol = DISTRICT_SYMBOLS[district]
        return (
          <g key={`label-${district}`} transform={`translate(${BUILDING_X[i] - 5}, 131)`} style={{ color: COLORS[district] }}>
            <Symbol size={10} />
          </g>
        )
      })}
    </svg>
  )
}
