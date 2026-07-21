import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FitnessSymbol, WorkSymbol, ReadingSymbol, LearningSymbol, SocialSymbol, SavingsSymbol } from '../components/icons/DistrictSymbols'
import SleepIcon from '../components/icons/SleepIcon'
import ZigguratPicker from '../components/ZigguratPicker'

function lastWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -13 : -6)
  const monday = new Date(d.setDate(diff))
  return monday.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function lastWeekEnd() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -7 : 0)
  const sunday = new Date(d.setDate(diff))
  return sunday.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

export default function WeeklyReview({ onClose }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [challenge, setChallenge] = useState('')
  const [saved, setSaved] = useState(false)
  const [existingReview, setExistingReview] = useState(null)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const ws = lastWeekStart()
    const we = lastWeekEnd()

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
      { data: existing }
    ] = await Promise.all([
      supabase.from('workouts').select('*').gte('date', ws).lte('date', we),
      supabase.from('weight_log').select('*').gte('date', ws).lte('date', we).order('date', { ascending: false }),
      supabase.from('personal_records').select('*').gte('date', ws).lte('date', we),
      supabase.from('books').select('*'),
      supabase.from('study_sessions').select('*').gte('date', ws).lte('date', we),
      supabase.from('applications').select('*').gte('date', ws).lte('date', we),
      supabase.from('interactions').select('*').gte('date', ws).lte('date', we),
      supabase.from('sleep_log').select('*').gte('date', ws).lte('date', we),
      supabase.from('daily_journal').select('*').gte('date', ws).lte('date', we),
      supabase.from('transactions').select('*').gte('date', ws).lte('date', we),
      supabase.from('weekly_reviews').select('*').eq('week_start', ws).single()
    ])

    // Fitness
    const workoutCount = workouts?.length || 0
    const workoutTypes = [...new Set(workouts?.map(w => w.type) || [])]
    const latestWeight = weightLog?.[0]?.kg
    const maxPushups = prs?.filter(p => p.exercise === 'Push-ups').sort((a, b) => b.reps - a.reps)[0]?.reps
    const maxPullups = prs?.filter(p => p.exercise === 'Pull-ups').sort((a, b) => b.reps - a.reps)[0]?.reps

    // Reading
    const totalPagesRead = books?.reduce((sum, b) => sum + (b.pages_read || 0), 0) || 0
    const booksFinished = books?.filter(b => b.status === 'finished').length || 0

    // Learning
    const studyMins = sessions?.reduce((sum, s) => sum + (s.minutes || 0), 0) || 0

    // Work
    const appCount = applications?.length || 0
    const interviews = applications?.filter(a => a.status === 'interview').length || 0

    // Social
    const socialCount = interactions?.length || 0

    // Sleep
    const avgSleepMins = sleep?.length > 0
      ? sleep.reduce((sum, s) => {
          const [sh, sm] = (s.sleep_time || '00:00').split(':').map(Number)
          const [wh, wm] = (s.wake_time || '00:00').split(':').map(Number)
          let mins = (wh * 60 + wm) - (sh * 60 + sm)
          if (mins < 0) mins += 1440
          return sum + mins
        }, 0) / sleep.length
      : 0

    // Journal
    const avgMood = journal?.filter(j => j.mood).length > 0
      ? journal.filter(j => j.mood).reduce((sum, j) => sum + j.mood, 0) / journal.filter(j => j.mood).length
      : 0
    const wins = journal?.filter(j => j.win).map(j => j.win) || []
    const bestWin = wins[0] || null

    // Savings
    const weekSaved = transactions?.filter(t => t.type === 'saving').reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    setStats({
      ws, we, workoutCount, workoutTypes, latestWeight,
      maxPushups, maxPullups, totalPagesRead, booksFinished,
      studyMins, appCount, interviews, socialCount,
      avgSleepMins, avgMood, bestWin, weekSaved
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
    const ws = lastWeekStart()
    const we = lastWeekEnd()

    if (existingReview) {
      await supabase.from('weekly_reviews').update({ challenge, stats }).eq('id', existingReview.id)
    } else {
      await supabase.from('weekly_reviews').insert({
        week_start: ws, week_end: we, challenge, stats, viewed_at: new Date().toISOString()
      })
    }
    setSaved(true)
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading your week...</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 400, overflowY: 'auto' }}>
      <div style={{ maxWidth: '430px', margin: '0 auto', padding: '20px 18px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>Weekly Review</div>
            <div style={{ fontSize: '22px', fontWeight: 600 }}>{stats.ws} → {stats.we}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--muted)', fontSize: '18px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Highlights */}
        <div style={{ background: 'linear-gradient(135deg, #0e0d1c, #061410)', border: '0.5px solid var(--border)', borderRadius: '14px', padding: '18px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>Week highlights</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { Icon: FitnessSymbol, color: 'var(--fit)', value: stats.workoutCount, label: 'Workouts' },
              { Icon: ReadingSymbol, color: 'var(--read)', value: stats.totalPagesRead, label: 'Pages read' },
              { Icon: LearningSymbol, color: 'var(--learn)', value: `${Math.floor(stats.studyMins / 60)}h`, label: 'Study time' },
            ].map((h, i) => (
              <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 8px' }}>
                <div style={{ color: h.color, display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><h.Icon size={18} /></div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>{h.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{h.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fitness */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid var(--fit)22', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ color: 'var(--fit)', display: 'flex' }}><FitnessSymbol size={18} /></div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--fit)' }}>Fitness</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
            {[
              { label: 'Sessions', value: stats.workoutCount },
              { label: 'Weight', value: stats.latestWeight ? `${stats.latestWeight} kg` : '—' },
              { label: 'Max push-ups', value: stats.maxPushups ? `${stats.maxPushups} reps` : '—' },
              { label: 'Max pull-ups', value: stats.maxPullups ? `${stats.maxPullups} reps` : '—' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--fit)' }}>{s.value}</div>
              </div>
            ))}
          </div>
          {stats.workoutTypes.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
              {stats.workoutTypes.map(t => (
                <div key={t} style={{ background: 'var(--fit-bg)', border: '0.5px solid var(--fit)33', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', color: 'var(--fit)' }}>{t}</div>
              ))}
            </div>
          )}
        </div>

        {/* Work */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid var(--work)22', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ color: 'var(--work)', display: 'flex' }}><WorkSymbol size={18} /></div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--work)' }}>Work</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
            {[
              { label: 'Applications', value: stats.appCount },
              { label: 'Interviews', value: stats.interviews },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--work)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reading + Learning */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div style={{ background: 'var(--surf)', border: '0.5px solid var(--read)22', borderRadius: '12px', padding: '14px' }}>
            <div style={{ color: 'var(--read)', display: 'flex', marginBottom: '6px' }}><ReadingSymbol size={18} /></div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>Pages read</div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--read)' }}>{stats.totalPagesRead}</div>
            {stats.booksFinished > 0 && <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '3px' }}>{stats.booksFinished} book{stats.booksFinished > 1 ? 's' : ''} finished</div>}
          </div>
          <div style={{ background: 'var(--surf)', border: '0.5px solid var(--learn)22', borderRadius: '12px', padding: '14px' }}>
            <div style={{ color: 'var(--learn)', display: 'flex', marginBottom: '6px' }}><LearningSymbol size={18} /></div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>Study time</div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--learn)' }}>{Math.floor(stats.studyMins / 60)}h {stats.studyMins % 60}m</div>
          </div>
        </div>

        {/* Social + Sleep + Savings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '10px' }}>
          {[
            { Icon: SocialSymbol, label: 'Interactions', value: stats.socialCount, color: 'var(--social)' },
            { Icon: SleepIcon, label: 'Avg sleep', value: stats.avgSleepMins > 0 ? `${Math.floor(stats.avgSleepMins/60)}h${Math.round(stats.avgSleepMins%60)}m` : '—', color: 'var(--acc)' },
            { Icon: SavingsSymbol, label: 'Saved', value: stats.weekSaved > 0 ? `$${Math.round(stats.weekSaved/1000)}k` : '—', color: 'var(--savings)' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><s.Icon size={18} color={s.color} /></div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mood */}
        {stats.avgMood > 0 && (
          <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Avg mood</div>
            <div style={{ maxWidth: '160px', margin: '0 auto' }}>
              <ZigguratPicker value={Math.round(stats.avgMood)} onChange={() => {}} color="var(--social)" readOnly={true} />
            </div>
          </div>
        )}

        {/* Best win */}
        {stats.bestWin && (
          <div style={{ background: 'linear-gradient(135deg, var(--surf2), var(--bg))', border: '0.5px solid var(--xp)44', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--xp)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}><span style={{ fontWeight: 500 }}>Win</span> · Highlight of the week</div>
            <div style={{ fontSize: '14px', lineHeight: 1.6 }}>"{stats.bestWin}"</div>
          </div>
        )}

        {/* Next week challenge */}
        <div style={{ background: 'var(--surf)', border: '0.5px solid var(--acc)44', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Priority · Challenge for next week</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginBottom: '10px' }}>One thing you want to improve or accomplish next week</div>
          {saved ? (
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.6 }}>"{challenge}"</div>
          ) : (
            <>
              <input
                placeholder="Next week I will..."
                value={challenge}
                onChange={e => setChallenge(e.target.value)}
                style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', padding: '10px 12px', outline: 'none', marginBottom: '10px' }}
              />
              <button onClick={saveReview} style={{ width: '100%', background: 'var(--acc)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '11px', cursor: 'pointer', fontWeight: 500 }}>
                Save & close week
              </button>
            </>
          )}
          {saved && (
            <button onClick={() => setSaved(false)} style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
          )}
        </div>

        <button onClick={onClose} style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '10px', color: 'var(--muted)', fontSize: '13px', padding: '12px', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  )
}