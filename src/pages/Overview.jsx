import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { DISTRICT_ORDER, COLORS } from '../lib/buildingRenders'
import { STAGE_THRESHOLDS, STAGE_NAMES, getStageAndProgress } from '../lib/districtPoints'
import WeeklyReview from './WeeklyReview'
import MonthlyReview from './MonthlyReview'
import YearlyReview from './YearlyReview'

const DISTRICT_LABELS = {
  fitness: 'Fitness', work: 'Work', reading: 'Reading', learning: 'Learning',
  social: 'Social', health: 'Health', savings: 'Savings', journal: 'Journal'
}

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function shiftDateString(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function weekAgo() {
  return shiftDateString(today(), -7)
}

function monthAgo() {
  return shiftDateString(today(), -30)
}

function yearStart() {
  return today().slice(0, 4) + '-01-01'
}

export default function Overview() {
  const [period, setPeriod] = useState('week')
  const [scores, setScores] = useState(null)
  const [districtPoints, setDistrictPoints] = useState({})
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [showWeekly, setShowWeekly] = useState(false)
  const [showMonthly, setShowMonthly] = useState(false)
  const [showYearly, setShowYearly] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchScores() }, [period])

  async function fetchScores() {
    setLoading(true)
    const from = period === 'week' ? weekAgo() : period === 'month' ? monthAgo() : yearStart()
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365

    const [
      { data: workouts },
      { data: applications },
      { data: books },
      { data: sessions },
      { data: remindersDone },
      { data: medicines },
      { data: medLogPeriod },
      { data: sleepPeriod },
      { data: allSavings },
      { data: districtPointsData }
    ] = await Promise.all([
      supabase.from('workouts').select('date').gte('date', from),
      supabase.from('applications').select('date').gte('date', from),
      supabase.from('books').select('pages_read'),
      supabase.from('study_sessions').select('minutes').gte('date', from),
      supabase.from('contact_reminders').select('id').eq('done', true).gte('remind_on', from),
      supabase.from('medicines').select('id'),
      supabase.from('med_log').select('taken').gte('date', from),
      supabase.from('sleep_log').select('id').gte('date', from),
      supabase.from('transactions').select('amount').eq('type', 'saving'),
      supabase.from('district_points').select('*')
    ])

    // Fitness — workouts in the period
    const workoutCount = workouts?.length || 0
    const fitnessTarget = period === 'week' ? 4 : period === 'month' ? 16 : 150
    const fitnessScore = Math.min(Math.round(workoutCount / fitnessTarget * 100), 100)

    // Work — applications in the period
    const appCount = applications?.length || 0
    const workTarget = period === 'week' ? 5 : period === 'month' ? 20 : 200
    const workScore = Math.min(Math.round(appCount / workTarget * 100), 100)

    // Reading — total progress (books has no updated_at, so pages_read is
    // necessarily an all-time total, not a true per-period count)
    const totalPagesRead = books?.reduce((sum, b) => sum + (b.pages_read || 0), 0) || 0
    const readTarget = period === 'week' ? 300 : period === 'month' ? 1200 : 10000
    const readScore = Math.min(Math.round(totalPagesRead / readTarget * 100), 100)

    // Learning — study minutes in the period
    const studyMins = sessions?.reduce((sum, s) => sum + (s.minutes || 0), 0) || 0
    const learnTarget = period === 'week' ? 120 : period === 'month' ? 480 : 3000
    const learnScore = Math.min(Math.round(studyMins / learnTarget * 100), 100)

    // Social — contact reminders completed in the period
    const remindersDoneCount = remindersDone?.length || 0
    const socialTarget = period === 'week' ? 3 : period === 'month' ? 12 : 100
    const socialScore = Math.min(Math.round(remindersDoneCount / socialTarget * 100), 100)

    // Health — (meds taken + sleep logs) / (expected meds + 1 per day),
    // falls back to sleep-only if no medicines are configured
    const expectedMedsPerDay = medicines?.length || 0
    const medsTakenCount = medLogPeriod?.filter(m => m.taken).length || 0
    const sleepCount = sleepPeriod?.length || 0
    const healthScore = expectedMedsPerDay > 0
      ? Math.min(Math.round((medsTakenCount + sleepCount) / (expectedMedsPerDay * days + days) * 100), 100)
      : Math.min(Math.round(sleepCount / days * 100), 100)

    // Savings — all-time total saved vs. the fixed emergency fund goal, never period-based
    const emergencyGoal = 100000
    const totalSaved = allSavings?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const savingsScore = Math.min(Math.round(totalSaved / emergencyGoal * 100), 100)

    const data = [
      { area: 'Fitness', score: fitnessScore, color: 'var(--fit)' },
      { area: 'Trabajo', score: workScore, color: 'var(--work)' },
      { area: 'Lectura', score: readScore, color: 'var(--read)' },
      { area: 'Aprendizaje', score: learnScore, color: 'var(--learn)' },
      { area: 'Social', score: socialScore, color: 'var(--social)' },
      { area: 'Salud', score: healthScore, color: 'var(--health)' },
      { area: 'Ahorros', score: savingsScore, color: 'var(--savings)' },
    ]

    setScores(data)

    const pts = {}
    districtPointsData?.forEach(d => { pts[d.district] = d.points })
    setDistrictPoints(pts)

    // Insight (Spanish)
    const sorted = [...data].sort((a, b) => b.score - a.score)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    setInsight(`Tu área más fuerte es ${best.area} (${best.score}%). ${worst.area} necesita más atención (${worst.score}%).`)

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
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="area"
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                />
                <Radar
                  dataKey="score"
                  stroke="var(--acc)"
                  fill="var(--acc)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surf2)',
                    border: '0.5px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value}%`, 'Puntaje']}
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
            padding: '12px 14px', marginBottom: '12px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>
              Insight
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--text)' }}>{insight}</div>
          </div>

          {/* District points */}
          <div style={{
            background: 'var(--surf)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '12px 14px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>
              Ciudad de Sumeria
            </div>
            {DISTRICT_ORDER.map((d, i) => {
              const pts = districtPoints[d] || 0
              const { stage, progress } = getStageAndProgress(d, pts)
              const stageName = STAGE_NAMES[d]?.[stage]
              const thresholds = STAGE_THRESHOLDS[d]
              const nextGoal = stage < 5 ? thresholds[stage + 1] : thresholds[5]
              return (
                <div key={d} style={{
                  padding: '7px 0',
                  borderBottom: i < DISTRICT_ORDER.length - 1 ? '0.5px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: COLORS[d] }}>{DISTRICT_LABELS[d]}</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{stageName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '3px', background: 'var(--surf3)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress * 100}%`, height: '100%', background: COLORS[d], borderRadius: '2px' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted2)', minWidth: '52px', textAlign: 'right' }}>
                      {pts} / {nextGoal} pts
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ marginTop: '20px' }}>
        <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '10px' }}>
          Annals of Sumeria
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          <button onClick={() => setShowWeekly(true)} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '12px 8px', color: 'var(--acc)', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Weekly</button>
          <button onClick={() => setShowMonthly(true)} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '12px 8px', color: 'var(--acc)', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Monthly</button>
          <button onClick={() => setShowYearly(true)} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '12px 8px', color: 'var(--acc)', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Yearly</button>
        </div>
      </div>

      {showWeekly && <WeeklyReview onClose={() => setShowWeekly(false)} />}
      {showMonthly && <MonthlyReview onClose={() => setShowMonthly(false)} />}
      {showYearly && <YearlyReview onClose={() => setShowYearly(false)} />}
    </div>
  )
}
