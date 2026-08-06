import { useEffect, useState } from 'react'
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

const SECTION_WIDTH = 320 / 8 // 40px per section
const GROUND_Y = 128

const SUN_START_HOUR = 5
const SUN_END_HOUR = 21
const SUN_DURATION = SUN_END_HOUR - SUN_START_HOUR // 16 hours

function getSunPosition(hourFloat) {
  const t = Math.max(0, Math.min(1, (hourFloat - SUN_START_HOUR) / SUN_DURATION))
  const x = 10 + t * 300
  // Arc: lowest at edges (y=25), highest at center (y=8)
  const y = 25 - 17 * Math.sin(Math.PI * t)
  return { x, y }
}

const MOON_START_HOUR = 21
const MOON_DURATION = 8 // 21:00 to 5:00

function getMoonPosition(hourFloat) {
  const h = hourFloat >= 21 ? hourFloat : hourFloat + 24
  const t = Math.max(0, Math.min(1, (h - MOON_START_HOUR) / MOON_DURATION))
  const x = 10 + t * 300
  const y = 25 - 17 * Math.sin(Math.PI * t)
  return { x, y }
}

const SUN_OPACITY = { amanecer: 0.7, manana: 1, dia: 1, tarde: 0.9, atardecer: 0.7 }
const MOON_OPACITY = { amanecer: 0.4, atardecer: 0.5, noche: 1 }

export default function Skyline({ points = {}, onBuildingClick }) {
  const [hourFloat, setHourFloat] = useState(() => {
    const now = new Date()
    return now.getHours() + now.getMinutes() / 60
  })

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setHourFloat(now.getHours() + now.getMinutes() / 60)
    }, 60000)
    return () => clearInterval(id)
  }, [])

  const period = getPeriod(Math.floor(hourFloat))
  const sunOpacity = SUN_OPACITY[period]
  const moonOpacity = MOON_OPACITY[period]
  const showSun = sunOpacity != null
  const showMoon = moonOpacity != null
  const sunPos = getSunPosition(hourFloat)
  const moonPos = getMoonPosition(hourFloat)

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

      {/* Sun */}
      {showSun && (
        <g opacity={sunOpacity}>
          <circle cx={sunPos.x} cy={sunPos.y} r={16}
            fill={period === 'amanecer' || period === 'atardecer' ? '#F0802010' : '#D4A84315'} />
          <circle cx={sunPos.x} cy={sunPos.y} r={9}
            fill={period === 'amanecer' ? '#F08020' :
                  period === 'atardecer' ? '#E06030' : '#D4A843'} />
        </g>
      )}

      {/* Moon */}
      {showMoon && (
        <g opacity={moonOpacity}>
          {/* Crescent — full ring minus an offset circle cut using the current sky bg */}
          <circle cx={moonPos.x} cy={moonPos.y} r={8}
            fill="none" stroke="#C8D8F0" strokeWidth={1.2} />
          <circle cx={moonPos.x + 4} cy={moonPos.y} r={7} fill="var(--bg)" />
          {period === 'noche' && (
            <>
              <circle cx={moonPos.x + 20} cy={moonPos.y - 8} r={1} fill="#C8D8F0" opacity={0.6} />
              <circle cx={moonPos.x - 18} cy={moonPos.y + 6} r={0.8} fill="#C8D8F0" opacity={0.5} />
              <circle cx={moonPos.x + 12} cy={moonPos.y + 12} r={0.8} fill="#C8D8F0" opacity={0.4} />
            </>
          )}
        </g>
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
        const sectionCenter = SECTION_WIDTH * i + SECTION_WIDTH / 2
        const buildingLeft = sectionCenter - width / 2
        return (
          <g
            key={district}
            transform={`translate(${buildingLeft}, ${GROUND_Y - height})`}
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
          <g key={`label-${district}`} transform={`translate(${SECTION_WIDTH * i + SECTION_WIDTH / 2 - 5}, 131)`} style={{ color: COLORS[district] }}>
            <Symbol size={10} />
          </g>
        )
      })}
    </svg>
  )
}
