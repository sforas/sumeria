import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function currentYear() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }).slice(0, 4)
}

function lastYear() {
  return String(parseInt(currentYear()) - 1)
}

const MOOD_EMOJIS = ['', '😞', '😕', '😐', '😊', '🤩']

export default function YearlyReview({ onClose }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [slide, setSlide] = useState(0)
  const [challenge, setChallenge] = useState('')
  const [saved, setSaved] = useState(false)
  const [existingReview, setExistingReview] = useState(null)
  const year = lastYear()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const from = `${year}-01-01`
    const to = `${year}-12-31`

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
      { data: routineLog },
      { data: existing }
    ] = await Promise.all([
      supabase.from('workouts').select('*').gte('date', from).lte('date', to),
      supabase.from('weight_log').select('*').gte('date', from).lte('date', to).order('date', { ascending: true }),
      supabase.from('personal_records').select('*').gte('date', from).lte('date', to),
      supabase.from('books').select('*'),
      supabase.from('study_sessions').select('*').gte('date', from).lte('date', to),
      supabase.from('applications').select('*').gte('date', from).lte('date', to),
      supabase.from('interactions').select('*').gte('date', from).lte('date', to),
      supabase.from('sleep_log').select('*').gte('date', from).lte('date', to),
      supabase.from('daily_journal').select('*').gte('date', from).lte('date', to).order('date'),
      supabase.from('transactions').select('*').gte('date', from).lte('date', to),
      supabase.from('goals').select('*').gte('date', from).lte('date', to),
      supabase.from('routine_log').select('*').gte('date', from).lte('date', to),
      supabase.from('yearly_reviews').select('*').eq('year', year).single()
    ])

    // Fitness
    const workoutCount = workouts?.length || 0
    const workoutTypes = workouts?.reduce((acc, w) => { acc[w.type] = (acc[w.type] || 0) + 1; return acc }, {}) || {}
    const mostFrequentWorkout = Object.entries(workoutTypes).sort((a, b) => b[1] - a[1])[0]
    const startWeight = weightLog?.[0]?.kg
    const endWeight = weightLog?.[weightLog.length - 1]?.kg
    const weightChange = startWeight && endWeight ? (endWeight - startWeight).toFixed(1) : null
    const maxPushups = prs?.filter(p => p.exercise === 'Push-ups').sort((a, b) => b.reps - a.reps)[0]?.reps
    const maxPullups = prs?.filter(p => p.exercise === 'Pull-ups').sort((a, b) => b.reps - a.reps)[0]?.reps

    // Reading
    const booksFinished = books?.filter(b => b.status === 'finished').length || 0
    const totalPages = books?.reduce((sum, b) => sum + (b.pages_read || 0), 0) || 0

    // Learning
    const studyMins = sessions?.reduce((sum, s) => sum + (s.minutes || 0), 0) || 0
    const coursesFinished = 0

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

    // Journal
    const journalEntries = journal || []
    const avgMood = journalEntries.filter(j => j.mood).length > 0
      ? journalEntries.filter(j => j.mood).reduce((sum, j) => sum + j.mood, 0) / journalEntries.filter(j => j.mood).length
      : 0
    const wins = journalEntries.filter(j => j.win).map(j => ({ win: j.win, date: j.date }))
    const gratitudes = journalEntries.filter(j => j.gratitude).map(j => j.gratitude)

    // Savings
    const yearSaved = transactions?.filter(t => t.type === 'saving').reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    // Goals
    const totalGoals = goals?.length || 0
    const doneGoals = goals?.filter(g => g.done).length || 0
    const goalPct = totalGoals > 0 ? Math.round(doneGoals / totalGoals * 100) : 0

    // Routines
    const routinesDone = routineLog?.filter(r => r.done).length || 0

    // Biggest stat
    const bigStats = [
      { label: 'workouts', value: workoutCount, emoji: '💪' },
      { label: 'pages read', value: totalPages, emoji: '📚' },
      { label: 'study hours', value: Math.floor(studyMins / 60), emoji: '🧠' },
      { label: 'job applications', value: appCount, emoji: '💼' },
      { label: 'social interactions', value: socialCount, emoji: '👥' },
    ].sort((a, b) => b.value - a.value)[0]

    // Best streak — count consecutive days with routine done
    let bestStreak = 0, currentStreak = 0
    const logDates = [...new Set(routineLog?.filter(r => r.done).map(r => r.date) || [])].sort()
    for (let i = 0; i < logDates.length; i++) {
      if (i === 0) { currentStreak = 1; continue }
      const prev = new Date(logDates[i - 1])
      const curr = new Date(logDates[i])
      const diff = (curr - prev) / 86400000
      if (diff === 1) { currentStreak++; if (currentStreak > bestStreak) bestStreak = currentStreak }
      else currentStreak = 1
    }

    setStats({
      year, workoutCount, workoutTypes, mostFrequentWorkout,
      weightChange, startWeight, endWeight, maxPushups, maxPullups,
      booksFinished, totalPages, studyMins, coursesFinished,
      appCount, interviews, offers, socialCount, uniquePeople,
      avgSleepMins, avgMood, wins, gratitudes, yearSaved,
      totalGoals, doneGoals, goalPct, routinesDone, bestStreak,
      bigStats, journalCount: journalEntries.length
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
      await supabase.from('yearly_reviews').update({ challenge }).eq('id', existingReview.id)
    } else {
      await supabase.from('yearly_reviews').insert({
        year, challenge, stats, viewed_at: new Date().toISOString()
      })
    }
    setSaved(true)
  }

  const totalSlides = 8

  function nextSlide() { if (slide < totalSlides - 1) setSlide(s => s + 1) }
  function prevSlide() { if (slide > 0) setSlide(s => s - 1) }

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>✨</div>
        <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)' }}>Building your year...</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Collecting all your memories</div>
      </div>
    )
  }

  const slides = [
    // SLIDE 0 — Intro
    <div key={0} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>✨</div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Your year in</div>
      <div style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '4px', marginBottom: '8px' }}>SUME<span style={{ color: 'var(--xp)' }}>RIA</span></div>
      <div style={{ fontSize: '28px', fontWeight: 300, color: 'var(--muted2)', marginBottom: '32px' }}>{stats.year}</div>
      <div style={{ fontSize: '14px', color: 'var(--muted2)', lineHeight: 1.7, maxWidth: '300px' }}>
        Another year of showing up, building habits, and becoming a better version of yourself.
      </div>
    </div>,

    // SLIDE 1 — Biggest stat
    <div key={1} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '24px' }}>Your biggest achievement</div>
      <div style={{ fontSize: '80px', marginBottom: '16px' }}>{stats.bigStats?.emoji}</div>
      <div style={{ fontSize: '72px', fontWeight: 800, color: 'var(--xp)', lineHeight: 1, marginBottom: '8px' }}>{stats.bigStats?.value}</div>
      <div style={{ fontSize: '20px', color: 'var(--muted2)', marginBottom: '32px' }}>{stats.bigStats?.label}</div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '280px', lineHeight: 1.7 }}>
        That's {stats.workoutCount} workouts, {stats.totalPages} pages read, and {Math.floor(stats.studyMins / 60)} hours of learning this year.
      </div>
    </div>,

    // SLIDE 2 — Fitness
    <div key={2} style={{ padding: '40px 24px', minHeight: '80vh' }}>
      <div style={{ fontSize: '11px', color: 'var(--fit)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Fitness</div>
      <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>You showed up 💪</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total workouts', value: stats.workoutCount, color: 'var(--fit)', big: true },
          { label: 'Best streak', value: `${stats.bestStreak} days`, color: 'var(--xp)', big: true },
          { label: 'Weight change', value: stats.weightChange ? `${stats.weightChange > 0 ? '+' : ''}${stats.weightChange} kg` : '—', color: stats.weightChange < 0 ? 'var(--fit)' : 'var(--diet)' },
          { label: 'Max push-ups', value: stats.maxPushups ? `${stats.maxPushups}` : '—', color: 'var(--fit)' },
          { label: 'Max pull-ups', value: stats.maxPullups ? `${stats.maxPullups}` : '—', color: 'var(--fit)' },
          { label: 'Favorite workout', value: stats.mostFrequentWorkout?.[0]?.split(' ')[0] || '—', color: 'var(--text)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(45,206,154,0.06)', border: '0.5px solid rgba(45,206,154,0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
            <div style={{ fontSize: s.big ? '28px' : '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>,

    // SLIDE 3 — Mind & Learning
    <div key={3} style={{ padding: '40px 24px', minHeight: '80vh' }}>
      <div style={{ fontSize: '11px', color: 'var(--learn)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Mind</div>
      <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>You kept learning 🧠</div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '64px', fontWeight: 800, color: 'var(--read)', lineHeight: 1 }}>{stats.booksFinished}</div>
        <div style={{ fontSize: '16px', color: 'var(--muted2)', marginTop: '4px' }}>books finished</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '64px', fontWeight: 800, color: 'var(--learn)', lineHeight: 1 }}>{stats.totalPages}</div>
        <div style={{ fontSize: '16px', color: 'var(--muted2)', marginTop: '4px' }}>pages read</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '64px', fontWeight: 800, color: 'var(--acc)', lineHeight: 1 }}>{Math.floor(stats.studyMins / 60)}h</div>
        <div style={{ fontSize: '16px', color: 'var(--muted2)', marginTop: '4px' }}>of focused study</div>
      </div>
    </div>,

    // SLIDE 4 — Work & Social
    <div key={4} style={{ padding: '40px 24px', minHeight: '80vh' }}>
      <div style={{ fontSize: '11px', color: 'var(--work)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Work & Social</div>
      <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>You put yourself out there 💼</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Applications', value: stats.appCount, color: 'var(--work)', bg: 'rgba(155,143,255,0.06)', border: 'rgba(155,143,255,0.2)' },
          { label: 'Interviews', value: stats.interviews, color: 'var(--xp)', bg: 'rgba(239,159,39,0.06)', border: 'rgba(239,159,39,0.2)' },
          { label: 'People met', value: stats.uniquePeople, color: 'var(--social)', bg: 'rgba(212,111,160,0.06)', border: 'rgba(212,111,160,0.2)' },
          { label: 'Interactions', value: stats.socialCount, color: 'var(--social)', bg: 'rgba(212,111,160,0.06)', border: 'rgba(212,111,160,0.2)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>,

    // SLIDE 5 — Wellbeing
    <div key={5} style={{ padding: '40px 24px', minHeight: '80vh' }}>
      <div style={{ fontSize: '11px', color: 'var(--health)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Wellbeing</div>
      <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>You took care of yourself 💊</div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Average sleep</div>
        <div style={{ fontSize: '52px', fontWeight: 800, color: 'var(--acc)' }}>
          {stats.avgSleepMins > 0 ? `${Math.floor(stats.avgSleepMins / 60)}h ${Math.round(stats.avgSleepMins % 60)}m` : '—'}
        </div>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Average mood</div>
        <div style={{ fontSize: '52px' }}>{stats.avgMood > 0 ? MOOD_EMOJIS[Math.round(stats.avgMood)] : '—'}</div>
        <div style={{ fontSize: '20px', color: 'var(--muted2)', marginTop: '4px' }}>{stats.avgMood > 0 ? `${stats.avgMood.toFixed(1)} / 5` : ''}</div>
      </div>
      <div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Journal entries</div>
        <div style={{ fontSize: '52px', fontWeight: 800, color: '#A78BFA' }}>{stats.journalCount}</div>
        <div style={{ fontSize: '16px', color: 'var(--muted2)', marginTop: '4px' }}>days reflected on</div>
      </div>
    </div>,

    // SLIDE 6 — Wins
    <div key={6} style={{ padding: '40px 24px', minHeight: '80vh' }}>
      <div style={{ fontSize: '11px', color: 'var(--xp)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Your wins</div>
      <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>Moments that mattered 🏆</div>
      {stats.wins.length > 0 ? (
        stats.wins.slice(0, 6).map((w, i) => (
          <div key={i} style={{
            background: 'rgba(239,159,39,0.06)', border: '0.5px solid rgba(239,159,39,0.2)',
            borderRadius: '12px', padding: '14px 16px', marginBottom: '10px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--xp)', marginBottom: '4px' }}>{w.date}</div>
            <div style={{ fontSize: '13px', lineHeight: 1.6 }}>"{w.win}"</div>
          </div>
        ))
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Start logging your evening reflection to capture your wins!</div>
      )}
    </div>,

    // SLIDE 7 — Challenge + close
    <div key={7} style={{ padding: '40px 24px', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '11px', color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Looking ahead</div>
      <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px' }}>What's next? 🎯</div>
      <div style={{ fontSize: '14px', color: 'var(--muted2)', marginBottom: '32px', lineHeight: 1.7 }}>
        You've had an incredible year. What's the one big thing you want to achieve in {parseInt(stats.year) + 1}?
      </div>

      <div style={{ flex: 1 }}>
        {saved ? (
          <div>
            <div style={{ background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--acc)', marginBottom: '8px' }}>My goal for {parseInt(stats.year) + 1}</div>
              <div style={{ fontSize: '16px', fontWeight: 500, lineHeight: 1.6 }}>"{challenge}"</div>
            </div>
            <button onClick={() => setSaved(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
          </div>
        ) : (
          <>
            <textarea
              placeholder={`In ${parseInt(stats.year) + 1}, I will...`}
              value={challenge}
              onChange={e => setChallenge(e.target.value)}
              rows={4}
              style={{
                width: '100%', background: 'var(--surf)', border: '0.5px solid var(--border)',
                borderRadius: '12px', color: 'var(--text)', fontSize: '14px',
                padding: '14px', outline: 'none', resize: 'none', marginBottom: '12px',
                fontFamily: 'inherit', lineHeight: 1.6
              }}
            />
            <button onClick={saveReview} style={{
              width: '100%', background: 'linear-gradient(135deg, #7F77DD, #EF9F27)',
              border: 'none', borderRadius: '12px', color: '#fff',
              fontSize: '15px', padding: '14px', cursor: 'pointer', fontWeight: 600, marginBottom: '12px'
            }}>
              Save my goal ✨
            </button>
          </>
        )}
      </div>

      <button onClick={onClose} style={{
        width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
        borderRadius: '12px', color: 'var(--muted)', fontSize: '13px',
        padding: '13px', cursor: 'pointer', marginTop: '12px'
      }}>
        Close — See you next year 👋
      </button>
    </div>
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 500, display: 'flex', flexDirection: 'column' }}>

      {/* Progress bar */}
      <div style={{ height: '2px', background: 'var(--surf3)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #7F77DD, #EF9F27)', width: `${((slide + 1) / totalSlides) * 100}%`, transition: 'width .3s' }} />
      </div>

      {/* Close button */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'var(--muted)', fontSize: '18px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>

      {/* Slide counter */}
      <div style={{ position: 'absolute', top: '20px', left: '16px', fontSize: '11px', color: 'var(--muted)', zIndex: 10 }}>
        {slide + 1} / {totalSlides}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', maxWidth: '430px', margin: '0 auto', width: '100%' }}>
        {slides[slide]}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '10px', padding: '16px 20px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', background: 'rgba(10,10,10,0.9)', flexShrink: 0 }}>
        {slide > 0 && (
          <button onClick={prevSlide} style={{ flex: 1, background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '13px', padding: '12px', cursor: 'pointer' }}>
            ← Back
          </button>
        )}
        {slide < totalSlides - 1 && (
          <button onClick={nextSlide} style={{ flex: 1, background: 'linear-gradient(135deg, #7F77DD, #EF9F27)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', padding: '12px', cursor: 'pointer', fontWeight: 600 }}>
            Next →
          </button>
        )}
      </div>
    </div>
  )
}