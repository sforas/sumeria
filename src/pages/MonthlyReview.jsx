import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

function lastMonth() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }).slice(0, 7)
}

function monthName(ym) {
  const [y, m] = ym.split('-')
  return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const MOOD_EMOJIS = ['', '😞', '😕', '😐', '😊', '🤩']

export default function MonthlyReview({ onClose }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [challenge, setChallenge] = useState('')
  const [saved, setSaved] = useState(false)
  const [existingReview, setExistingReview] = useState(null)
  const month = lastMonth()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const from = month + '-01'
    const to = month + '-31'

    const [
      { data: workouts },
      { data: weightLog },
      { data: prs },
      { data: books },
      { data: sessions },
      { data: applications },
      { data: interactions },
      { data: sleep },
      { data: journal },
      { data: transactions },
      { data: goals },
      { data: existing }
    ] = await Promise.all([
      supabase.from('workouts').select('*').gte('date', from).lte('date', to),
      supabase.from('weight_log').select('*').gte('date', from).lte('date', to).order('date', { ascending: false }),
      supabase.from('personal_records').select('*').gte('date', from).lte('date', to),
      supabase.from('books').select('*'),
      supabase.from('study_sessions').select('*').gte('date', from).lte('date', to),
      supabase.from('applications').select('*').gte('date', from).lte('date', to),
      supabase.from('interactions').select('*').gte('date', from).lte('date', to),
      supabase.from('sleep_log').select('*').gte('date', from).lte('date', to),
      supabase.from('daily_journal').select('*').gte('date', from).lte('date', to),
      supabase.from('transactions').select('*').gte('date', from).lte('date', to),
      supabase.from('goals').select('*').gte('date', from).lte('date', to),
      supabase.from('monthly_reviews').select('*').eq('month', month).single()
    ])

    // Fitness
    const workoutCount = workouts?.length || 0
    const workoutTypes = workouts?.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1
      return acc
    }, {}) || {}
    const startWeight = weightLog?.[weightLog.length - 1]?.kg
    const endWeight = weightLog?.[0]?.kg
    const weightChange = startWeight && endWeight ? (endWeight - startWeight).toFixed(1) : null
    const maxPushups = prs?.filter(p => p.exercise === 'Push-ups').sort((a, b) => b.reps - a.reps)[0]?.reps
    const maxPullups = prs?.filter(p => p.exercise === 'Pull-ups').sort((a, b) => b.reps - a.reps)[0]?.reps

    // Reading
    const booksFinished = books?.filter(b => b.status === 'finished').length || 0
    const currentBooks = books?.filter(b => b.status === 'reading') || []

    // Learning
    const studyMins = sessions?.reduce((sum, s) => sum + (s.minutes || 0), 0) || 0
    const sessionCount = sessions?.length || 0

    // Work
    const appCount = applications?.length || 0
    const interviews = applications?.filter(a => a.status === 'interview').length || 0
    const offers = applications?.filter(a => a.status === 'offer').length || 0

    // Social
    const socialCount = interactions?.length || 0
    const uniquePeople = [...new Set(interactions?.map(i => i.person) || [])].length

    // Sleep
    const sleepEntries = sleep || []
    const avgSleepMins = sleepEntries.length > 0
      ? sleepEntries.reduce((sum, s) => {
          const [sh, sm] = (s.sleep_time || '00:00').split(':').map(Number)
          const [wh, wm] = (s.wake_time || '00:00').split(':').map(Number)
          let mins = (wh * 60 + wm) - (sh * 60 + sm)
          if (mins < 0) mins += 1440
          return sum + mins
        }, 0) / sleepEntries.length
      : 0
    const goodSleepNights = sleepEntries.filter(s => {
      const [sh, sm] = (s.sleep_time || '00:00').split(':').map(Number)
      const [wh, wm] = (s.wake_time || '00:00').split(':').map(Number)
      let mins = (wh * 60 + wm) - (sh * 60 + sm)
      if (mins < 0) mins += 1440
      return mins >= 420
    }).length

    // Journal
    const journalEntries = journal || []
    const avgMood = journalEntries.filter(j => j.mood).length > 0
      ? journalEntries.filter(j => j.mood).reduce((sum, j) => sum + j.mood, 0) / journalEntries.filter(j => j.mood).length
      : 0
    const avgEnergy = journalEntries.filter(j => j.energy).length > 0
      ? journalEntries.filter(j => j.energy).reduce((sum, j) => sum + j.energy, 0) / journalEntries.filter(j => j.energy).length
      : 0
    const wins = journalEntries.filter(j => j.win).map(j => ({ win: j.win, date: j.date }))

    // Savings
    const monthSaved = transactions?.filter(t => t.type === 'saving').reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const monthExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) || 0

    // Goals
    const totalGoals = goals?.length || 0
    const doneGoals = goals?.filter(g => g.done).length || 0
    const goalPct = totalGoals > 0 ? Math.round(doneGoals / totalGoals * 100) : 0

    // Radar scores
    const radarData = [
      { area: 'Fitness', score: Math.min(Math.round(workoutCount / 20 * 100), 100) },
      { area: 'Work', score: Math.min(Math.round(appCount / 30 * 100), 100) },
      { area: 'Reading', score: Math.min(Math.round(booksFinished / 2 * 100), 100) },
      { area: 'Learning', score: Math.min(Math.round(studyMins / 1200 * 100), 100) },
      { area: 'Social', score: Math.min(Math.round(socialCount / 12 * 100), 100) },
      { area: 'Health', score: sleepEntries.length > 0 ? Math.round(goodSleepNights / sleepEntries.length * 100) : 0 },
    ]

    setStats({
      month, workoutCount, workoutTypes, weightChange, endWeight,
      maxPushups, maxPullups, booksFinished, currentBooks,
      studyMins, sessionCount, appCount, interviews, offers,
      socialCount, uniquePeople, avgSleepMins, goodSleepNights,
      sleepNights: sleepEntries.length, avgMood, avgEnergy,
      wins, monthSaved, monthExpenses, totalGoals, doneGoals,
      goalPct, radarData
    })

    if (existing) {
      setExistingReview(existing)
      setChallenge(existing.challenge || '')
      setSaved(true)
    }

    setLoading(false)
  }

  async function saveReview() {
    if (!challenge.trim()) return
    if (existingReview) {
      await supabase.from('monthly_reviews').update({ challenge }).eq('id', existingReview.id)
    } else {
      await supabase.from('monthly_reviews').insert({
        month, challenge, stats, viewed_at: new Date().toISOString()
      })
    }
    setSaved(true)
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '32px' }}>📊</div>
        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Building your monthly report...</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 400, overflowY: 'auto' }}>
      <div style={{ maxWidth: '430px', margin: '0 auto', padding: '20px 18px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Monthly Review</div>
          <button onClick={onClose} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--muted)', fontSize: '18px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{monthName(month)}</div>
        <div style={{ fontSize: '13px', color: 'var(--muted2)', marginBottom: '24px' }}>Your complete month in review</div>

        {/* Big stat — goals */}
        <div style={{
          background: 'linear-gradient(135deg, #0e0d1c 0%, #061410 100%)',
          border: '0.5px solid var(--border)', borderRadius: '16px',
          padding: '20px', marginBottom: '14px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Overall completion</div>
          <div style={{ fontSize: '52px', fontWeight: 700, color: stats.goalPct >= 70 ? 'var(--fit)' : stats.goalPct >= 50 ? 'var(--xp)' : 'var(--danger)' }}>
            {stats.goalPct}%
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted2)', marginTop: '4px' }}>{stats.doneGoals} of {stats.totalGoals} daily goals completed</div>
          <div style={{ height: '4px', background: 'var(--surf3)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ width: `${stats.goalPct}%`, height: '100%', background: stats.goalPct >= 70 ? 'var(--fit)' : stats.goalPct >= 50 ? 'var(--xp)' : 'var(--danger)', borderRadius: '2px' }} />
          </div>
        </div>

        {/* Radar */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Life balance</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={stats.radarData}>
              <PolarGrid stroke="#2c2c2c" />
              <PolarAngleAxis dataKey="area" tick={{ fill: '#777', fontSize: 11 }} />
              <Radar dataKey="score" stroke="#7F77DD" fill="#7F77DD" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Fitness */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid #2DCE9A22', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '20px' }}>💪</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fit)' }}>Fitness</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: 'Workouts', value: stats.workoutCount, color: 'var(--fit)' },
              { label: 'Weight', value: stats.endWeight ? `${stats.endWeight} kg` : '—', color: 'var(--text)' },
              { label: 'Weight change', value: stats.weightChange ? `${stats.weightChange > 0 ? '+' : ''}${stats.weightChange} kg` : '—', color: stats.weightChange < 0 ? 'var(--fit)' : 'var(--diet)' },
              { label: 'Best push-ups', value: stats.maxPushups ? `${stats.maxPushups} reps` : '—', color: 'var(--fit)' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          {Object.keys(stats.workoutTypes).length > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {Object.entries(stats.workoutTypes).map(([type, count]) => (
                <div key={type} style={{ background: '#061410', border: '0.5px solid #2DCE9A33', borderRadius: '6px', padding: '3px 9px', fontSize: '11px', color: 'var(--fit)' }}>
                  {type} × {count}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Work */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid #9B8FFF22', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '20px' }}>💼</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--work)' }}>Work</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
            {[
              { label: 'Applications', value: stats.appCount, color: 'var(--work)' },
              { label: 'Interviews', value: stats.interviews, color: 'var(--xp)' },
              { label: 'Offers', value: stats.offers, color: 'var(--fit)' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reading + Learning */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div style={{ background: 'var(--surf)', border: '0.5px solid #C8A83A22', borderRadius: '14px', padding: '14px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>📚</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--read)' }}>{stats.booksFinished}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Books finished</div>
            {stats.currentBooks.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '6px' }}>{stats.currentBooks.length} in progress</div>
            )}
          </div>
          <div style={{ background: 'var(--surf)', border: '0.5px solid #4A9EE822', borderRadius: '14px', padding: '14px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🧠</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--learn)' }}>{Math.floor(stats.studyMins / 60)}h</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Study time</div>
            <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '6px' }}>{stats.sessionCount} sessions</div>
          </div>
        </div>

        {/* Social */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid #D46FA022', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>👥</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--social)' }}>Social</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--social)' }}>{stats.socialCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Interactions</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--social)' }}>{stats.uniquePeople}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Unique people</div>
            </div>
          </div>
        </div>

        {/* Sleep + mood */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>😴</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--acc)' }}>Wellbeing</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--acc)' }}>
                {stats.avgSleepMins > 0 ? `${Math.floor(stats.avgSleepMins/60)}h${Math.round(stats.avgSleepMins%60)}m` : '—'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>Avg sleep</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--fit)' }}>{stats.goodSleepNights}/{stats.sleepNights}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>Good nights</div>
            </div>
            <div>
              <div style={{ fontSize: '20px' }}>{stats.avgMood > 0 ? MOOD_EMOJIS[Math.round(stats.avgMood)] : '—'}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>Avg mood {stats.avgMood > 0 ? stats.avgMood.toFixed(1) : ''}</div>
            </div>
          </div>
        </div>

        {/* Savings */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid #27AE6022', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>💰</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--savings)' }}>Savings</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--savings)' }}>${Math.round(stats.monthSaved).toLocaleString('es-MX')} MXN</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>Saved</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--diet)' }}>${Math.round(stats.monthExpenses).toLocaleString('es-MX')} MXN</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>Expenses</div>
            </div>
          </div>
        </div>

        {/* Wins */}
        {stats.wins.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #1a1208, #0d0d0d)', border: '0.5px solid #EF9F2744', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--xp)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>🏆 Monthly wins</div>
            {stats.wins.slice(0, 5).map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < stats.wins.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', flexShrink: 0, minWidth: '45px' }}>{w.date?.slice(5)}</div>
                <div style={{ fontSize: '13px' }}>{w.win}</div>
              </div>
            ))}
          </div>
        )}

        {/* Next month challenge */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid var(--acc)44', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>🎯 Challenge for next month</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginBottom: '12px' }}>What's the one thing you want to achieve next month?</div>
          {saved ? (
            <>
              <div style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.6 }}>"{challenge}"</div>
              <button onClick={() => setSaved(false)} style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
            </>
          ) : (
            <>
              <input placeholder="Next month I will..." value={challenge} onChange={e => setChallenge(e.target.value)}
                style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', padding: '10px 12px', outline: 'none', marginBottom: '10px' }} />
              <button onClick={saveReview} style={{ width: '100%', background: 'var(--acc)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '11px', cursor: 'pointer', fontWeight: 500 }}>
                Save & close month ✓
              </button>
            </>
          )}
        </div>

        <button onClick={onClose} style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '10px', color: 'var(--muted)', fontSize: '13px', padding: '12px', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  )
}