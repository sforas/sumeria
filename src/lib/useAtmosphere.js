import { useEffect, useState } from 'react'

const PALETTES = {
  amanecer: {
    bg: '#120806', surf: '#221008', surf2: '#301808', surf3: '#3A2010',
    border: 'rgba(240,160,80,0.1)', text: '#F8E0C8', muted: '#E8905A', muted2: '#A05030',
    acc: '#F0A030', acc2: '#C07020', sky1: '#1A0C06', sky2: '#3A1808'
  },
  manana: {
    bg: '#0A1E30', surf: '#122A40', surf2: '#1A3850', surf3: '#223060',
    border: 'rgba(144,200,240,0.1)', text: '#D8F0FF', muted: '#90C8F0', muted2: '#5090B8',
    acc: '#F8E868', acc2: '#C0B030', sky1: '#0A1828', sky2: '#183848'
  },
  dia: {
    bg: '#06101C', surf: '#0C1C2E', surf2: '#122438', surf3: '#183050',
    border: 'rgba(88,160,224,0.1)', text: '#C0E0FF', muted: '#58A0E0', muted2: '#306880',
    acc: '#F0B820', acc2: '#B88010', sky1: '#060E18', sky2: '#102030'
  },
  tarde: {
    bg: '#0C1018', surf: '#141820', surf2: '#1C2030', surf3: '#242840',
    border: 'rgba(112,136,168,0.1)', text: '#C8D8E8', muted: '#7088A8', muted2: '#405068',
    acc: '#C09840', acc2: '#907020', sky1: '#0A0E14', sky2: '#181E28'
  },
  atardecer: {
    bg: '#0E0818', surf: '#180E28', surf2: '#221638', surf3: '#2C1E48',
    border: 'rgba(152,104,200,0.1)', text: '#E0C8F8', muted: '#9868C8', muted2: '#604890',
    acc: '#C070A0', acc2: '#903060', sky1: '#0C0614', sky2: '#1A1030'
  },
  noche: {
    bg: '#060810', surf: '#0C1020', surf2: '#101828', surf3: '#161E30',
    border: 'rgba(88,120,160,0.08)', text: '#C0D0E8', muted: '#5878A0', muted2: '#304060',
    acc: '#3A6890', acc2: '#1A4870', sky1: '#04060C', sky2: '#0C1020'
  }
}

export function getPeriod(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 8) return 'amanecer'
  if (hour >= 8 && hour < 12) return 'manana'
  if (hour >= 12 && hour < 17) return 'dia'
  if (hour >= 17 && hour < 19) return 'tarde'
  if (hour >= 19 && hour < 21) return 'atardecer'
  return 'noche'
}

function applyAtmosphere() {
  const period = getPeriod()
  const palette = PALETTES[period]
  const root = document.documentElement.style
  root.setProperty('--bg', palette.bg)
  root.setProperty('--surf', palette.surf)
  root.setProperty('--surf2', palette.surf2)
  root.setProperty('--surf3', palette.surf3)
  root.setProperty('--border', palette.border)
  root.setProperty('--text', palette.text)
  root.setProperty('--muted', palette.muted)
  root.setProperty('--muted2', palette.muted2)
  root.setProperty('--acc', palette.acc)
  root.setProperty('--acc2', palette.acc2)
  root.setProperty('--sky1', palette.sky1)
  root.setProperty('--sky2', palette.sky2)
  return period
}

export function useAtmosphere() {
  const [period, setPeriod] = useState(() => getPeriod())

  useEffect(() => {
    setPeriod(applyAtmosphere())
    const raf = requestAnimationFrame(() =>
      document.body.classList.add('atmosphere-ready')
    )
    const id = setInterval(() => {
      setPeriod(prev => {
        const next = applyAtmosphere()
        return next === prev ? prev : next
      })
    }, 60000)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(id)
    }
  }, [])

  return period
}
