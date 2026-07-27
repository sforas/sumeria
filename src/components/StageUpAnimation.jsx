import { useEffect } from 'react'
import { COLORS, STAGE_DIMENSIONS, getBuildingRender } from '../lib/buildingRenders'
import { STAGE_NAMES } from '../lib/districtPoints'

const DISTRICT_LABELS = {
  fitness: 'Fitness', work: 'Work', reading: 'Reading', learning: 'Learning',
  social: 'Social', health: 'Health', savings: 'Savings', journal: 'Journal'
}

export default function StageUpAnimation({ district, newStage, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  const color = COLORS[district]
  const { width, height } = STAGE_DIMENSIONS[newStage]
  const content = getBuildingRender(district, newStage, height, color)

  return (
    <div onClick={onComplete} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer'
    }}>
      <div style={{
        transformOrigin: 'bottom center',
        animation: 'stageUpGrow 1.5s ease-out'
      }}>
        <svg width="200" height="200" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
          <line x1="5" y1="120" x2="95" y2="120" stroke={color} strokeOpacity="0.3" />
          <g
            transform={`translate(${50 - width / 2}, ${120 - height})`}
            fill="none" stroke={color} strokeWidth="1.5"
          >
            {content}
          </g>
        </svg>
      </div>

      <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color, textAlign: 'center', marginTop: '12px' }}>
        {DISTRICT_LABELS[district]}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center', marginTop: '4px' }}>
        {STAGE_NAMES[district]?.[newStage]}
      </div>
    </div>
  )
}
