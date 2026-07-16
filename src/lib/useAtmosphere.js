import { useEffect, useState } from 'react'

const PALETTES = {
  dawn: {
    bg: '#0D0818', surf: '#150F22', surf2: '#1C1530', surf3: '#231B38',
    border: 'rgba(200,160,216,0.08)', text: '#F0E8F8', muted: '#9A88B0', muted2: '#6A5880',
    acc: '#C17F3A', acc2: '#8B5A28', sky1: '#1A0F2E', sky2: '#4A2060'
  },
  day: {
    bg: '#080C18', surf: '#0E1422', surf2: '#141C2E', surf3: '#1A2438',
    border: 'rgba(180,200,240,0.08)', text: '#E8F0F8', muted: '#7A90A8', muted2: '#4A6078',
    acc: '#D4A843', acc2: '#A07828', sky1: '#081828', sky2: '#1A3858'
  },
  dusk: {
    bg: '#0E0808', surf: '#1A1010', surf2: '#221818', surf3: '#2A2020',
    border: 'rgba(220,140,100,0.08)', text: '#F8EDE8', muted: '#A88070', muted2: '#785848',
    acc: '#C46B3A', acc2: '#8B4A28', sky1: '#1A0808', sky2: '#3A1818'
  },
  night: {
    bg: '#06080E', surf: '#0C0E18', surf2: '#121420', surf3: '#181A28',
    border: 'rgba(100,120,160,0.08)', text: '#D8E0F0', muted: '#586878', muted2: '#384858',
    acc: '#4A6B8E', acc2: '#2A4A6E', sky1: '#060810', sky2: '#0E1428'
  }
}

export function getPeriod(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 10) return 'dawn'
  if (hour >= 10 && hour < 16) return 'day'
  if (hour >= 16 && hour < 20) return 'dusk'
  return 'night'
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
    const raf = requestAnimationFrame(() => document.body.classList.add('atmosphere-ready'))

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
