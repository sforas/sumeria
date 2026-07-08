import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function weekAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

function monthStart() {
  return today().slice(0, 7) + '-01'
}

function yearStart() {
  return today().slice(0, 4) + '-01-01'
}

export default function Overview() {
  const [period, setPeriod] = useState('week')
  const [scores, setScores] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')

  useEffect(() => { fetchScores() }, [period])

  async function fetchScores() {
    setLoading(true)
    const from = period === 'week' ? weekAgo() : period === 'month' ? monthStart() : yearStart()

    const [
      { data: workouts },
      { data: goals },
      { data: meals },
      { data: books },
      { data: sessions },
      { data: interactions },
      { data: sleep },
      { data: medLog }
    ] = await Promise.all([
      supabase.from('workouts').select('date').gte('date', from),
      supabase.from('goals').select('done, area').gte('date', from),
      supabase.from('meals').select('date').gte('date', from),
      supabase.from('books').select('pages_read, status'),
      supabase.from('study_sessions').select('minutes').gte('date', from),
      supabase.from('interactions').select('date').gte('date', from),
      supabase.from('sleep_log').select('sleep_time, wake_time').gte('date', from),
      supabase.from('med_log').select('taken').gte('date', from)
    ])

    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365

    // Fitness score
    const workoutCount = workouts?.length || 0
    const workoutTarget = period === 'week' ? 5 : period === 'month' ? 20 : 240
    const fitnessScore = Math.min(Math.round(workoutCount / workoutTarget * 100), 100)

    // Work score — based on work goals completed
    const workGoals = goals?.filter(g => g.area === 'work') || []
    const workDone = workGoals.filter(g => g.done).length
    const workScore = workGoals.length > 0 ? Math.min(Math.round(workDone / workGoals.length * 100), 100) : 0

    // Diet score
    const dietDays = [...new Set(meals?.map(m => m.date) || [])].length
    const dietScore = Math.min(Math.round(dietDays / days * 100), 100)

    // Reading score
    const readGoals = goals?.filter(g => g.area === 'reading') || []
    const readDone = readGoals.filter(g => g.done).length
    const readScore = readGoals.length > 0 ? Math.min(Math.round(readDone / readGoals.length * 100), 100) : 0

    // Learning score
    const studyMins = sessions?.reduce((sum, s) => sum + (s.minutes || 0), 0) || 0
    const studyTarget = period === 'week' ? 300 : period === 'month' ? 1200 : 14400
    const learnScore = Math.min(Math.round(studyMins / studyTarget * 100), 100)

    // Social score
    const socialCount = interactions?.length || 0
    const socialTarget = period === 'week' ? 3 : period === 'month' ? 12 : 144
    const socialScore = Math.min(Math.round(socialCount / socialTarget * 100), 100)

    // Health score
    const takenMeds = medLog?.filter(m => m.taken).length || 0
    const totalMeds = medLog?.length || 1
    const medScore = Math.round(takenMeds / totalMeds * 100)
    const goodSleep = sleep?.filter(s => {
      const [sh, sm] = (s.sleep_time || '00:00').split(':').map(Number)
      const [wh, wm] = (s.wake_time || '00:00').split(':').map(Number)
      let mins = (wh * 60 + wm) - (sh * 60 + sm)
      if (mins < 0) mins += 1440
      return mins >= 420
    }).length || 0
    const sleepScore = sleep?.length > 0 ? Math.round(goodSleep / sleep.length * 100) : 0
    const healthScore = Math.round((medScore + sleepScore) / 2)

    const data = [
      { area: 'Fitness', score: fitnessScore, color: '#2DCE9A' },
      { area: 'Work', score: workScore, color: '#9B8FFF' },
      { area: 'Diet', score: dietScore, color: '#E2784A' },
      { area: 'Reading', score: readScore, color: '#C8A83A' },
      { area: 'Learning', score: learnScore, color: '#4A9EE8' },
      { area: 'Social', score: socialScore, color: '#D46FA0' },
      { area: 'Health', score: healthScore, color: '#E24B7A' },
    ]

    setScores(data)

    // Generate insight
    const sorted = [...data].sort((a, b) => b.score - a.score)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    setInsight(`Your strongest area is ${best.area} (${best.score}%). Focus on ${worst.area} (${worst.score}%) — it's your biggest opportunity this ${period}.`)

    setLoading(false)
  }

  const periods = ['week', 'month', 'ytd']

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--acc)' }}>Life Overview</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Strengths and areas to grow</div>
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              background: period === p ? 'var(--surf3)' : 'none',
              border: '0.5px solid var(--border)',
              borderColor: period === p ? 'var(--surf3)' : 'var(--border)',
              borderRadius: '5px', color: period === p ? 'var(--text)' : 'var(--muted)',
              padding: '4px 7px', fontSize: '10px', cursor: 'pointer'
            }}>{p.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
          Calculating scores...
        </div>
      )}

      {!loading && scores && (
        <>
          {/* Radar chart */}
          <div style={{
            background: 'var(--surf)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '12px', marginBottom: '12px'
          }}>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={scores}>
                <PolarGrid stroke="#2c2c2c" />
                <PolarAngleAxis
                  dataKey="area"
                  tick={{ fill: '#888', fontSize: 11 }}
                />
                <Radar
                  dataKey="score"
                  stroke="#7F77DD"
                  fill="#7F77DD"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1f1f1f',
                    border: '0.5px solid #2c2c2c',
                    borderRadius: '8px',
                    color: '#ededed',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score breakdown */}
          <div style={{
            background: 'var(--surf)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '10px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>
              Score breakdown
            </div>
            {[...scores].sort((a, b) => b.score - a.score).map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 0',
                borderBottom: i < scores.length - 1 ? '0.5px solid var(--border)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  {item.area}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '80px', height: '3px', background: 'var(--surf3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.score}%`, height: '100%', background: item.color, borderRadius: '2px', transition: 'width .4s' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: item.color, minWidth: '30px', textAlign: 'right' }}>
                    {item.score}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Insight */}
          <div style={{
            background: 'var(--surf)', border: '0.5px solid var(--border)',
            borderLeft: '2px solid var(--acc)',
            borderRadius: '0 10px 10px 0',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>
              Insight
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--text)' }}>{insight}</div>
          </div>
        </>
      )}
    </div>
  )
}