import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AREAS = [
  { id: 'fitness', label: 'Fitness', color: 'var(--fit)' },
  { id: 'work', label: 'Work', color: 'var(--work)' },
  { id: 'reading', label: 'Reading', color: 'var(--read)' },
  { id: 'learning', label: 'Learning', color: 'var(--learn)' },
  { id: 'diet', label: 'Diet', color: 'var(--diet)' },
  { id: 'social', label: 'Social', color: 'var(--social)' },
]

const QUOTES = [
  "The first cities were built by people who decided tomorrow was worth planning for.",
  "A small daily task, if it be really daily, will beat the labours of a spasmodic Hercules.",
  "We are what we repeatedly do. Excellence is not an act, but a habit.",
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [newGoal, setNewGoal] = useState('')
  const [newArea, setNewArea] = useState('fitness')
  const [showAdd, setShowAdd] = useState(false)

  const quote = QUOTES[new Date().getDay() % QUOTES.length]

  useEffect(() => { fetchGoals() }, [])

  async function fetchGoals() {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('date', today())
      .order('created_at', { ascending: true })
    setGoals(data || [])
    setLoading(false)
  }

  async function toggleGoal(goal) {
    await supabase.from('goals').update({ done: !goal.done }).eq('id', goal.id)
    setGoals(goals.map(g => g.id === goal.id ? { ...g, done: !g.done } : g))
  }

  async function addGoal() {
  if (!newGoal.trim()) return
  const { data } = await supabase.from('goals').insert({
    text: newGoal.trim(),
    area: newArea,
    done: false,
    date: today()
  }).select().single()
  if (data) setGoals([...goals, data])
  setNewGoal('')
  setShowAdd(false)
}

  async function deleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(goals.filter(g => g.id !== id))
  }

  const done = goals.filter(g => g.done).length
  const total = goals.length
  const pct = total ? Math.round(done / total * 100) : 0
  const unlocked = total > 0 && done >= Math.ceil(total * 0.6)

  const goalsByArea = AREAS.map(area => ({
    ...area,
    goals: goals.filter(g => g.area === area.id)
  })).filter(a => a.goals.length > 0)

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      {/* Greeting */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '3px' }}>
          {getGreeting()} 👋
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted2)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Quote */}
      <div style={{
        borderLeft: '2px solid var(--acc)',
        padding: '10px 13px',
        marginBottom: '14px',
        background: 'var(--surf)',
        borderRadius: '0 8px 8px 0',
        border: '0.5px solid var(--border)',
        borderLeftWidth: '2px',
        borderLeftColor: 'var(--acc)'
      }}>
        <p style={{ fontSize: '12px', lineHeight: 1.65, marginBottom: '3px' }}>{quote}</p>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>— Sumerian wisdom</span>
      </div>

      {/* Earn It Banner */}
      <div style={{
        borderRadius: '10px',
        padding: '13px 15px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: unlocked ? '#071a0e' : '#1a0908',
        border: `0.5px solid ${unlocked ? '#1a3d28' : '#3d1a16'}`,
        transition: 'all .3s'
      }}>
        <div style={{ fontSize: '22px' }}>{unlocked ? '🔓' : '🔒'}</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '13px', fontWeight: 500, marginBottom: '2px',
            color: unlocked ? 'var(--fit)' : 'var(--danger)'
          }}>
            {unlocked ? 'Free time unlocked!' : 'Free time locked'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
            {unlocked
              ? 'You earned your screen time today'
              : `Complete ${Math.ceil(total * 0.6)} of ${total} goals to unlock`}
          </div>
        </div>
        <div style={{
          fontSize: '18px', fontWeight: 500,
          color: unlocked ? 'var(--fit)' : 'var(--danger)'
        }}>{pct}%</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
        {[
          { label: "Today's goals", value: `${done}/${total}`, sub: null, color: 'var(--acc)', pct },
          { label: 'Day of week', value: new Date().toLocaleDateString('en-US', { weekday: 'short' }), sub: 'Keep going', color: 'var(--text)', pct: null },
          { label: 'Completion', value: `${pct}%`, sub: null, color: pct >= 60 ? 'var(--fit)' : 'var(--xp)', pct },
        ].map((k, i) => (
          <div key={i} style={{
            background: 'var(--surf)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '11px 13px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px' }}>{k.sub}</div>}
            {k.pct !== null && (
              <div style={{ height: '3px', background: 'var(--surf3)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${k.pct}%`, height: '100%', background: k.color, borderRadius: '2px', transition: 'width .3s' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Goals by area */}
      <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
        Daily goals by area
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}

      {!loading && goalsByArea.length === 0 && (
        <div style={{
          background: 'var(--surf)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '20px', textAlign: 'center',
          color: 'var(--muted)', fontSize: '13px'
        }}>
          No goals yet — add your first one below
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {goalsByArea.map(area => (
          <div key={area.id} style={{
            background: 'var(--surf)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '11px 13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: area.color }} />
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px', color: area.color }}>
                {area.label}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--muted)' }}>
                {area.goals.filter(g => g.done).length}/{area.goals.length}
              </div>
            </div>
            {area.goals.map((goal, i) => (
              <div key={goal.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: i === 0 ? '0' : '6px 0 0',
                borderTop: i === 0 ? 'none' : '0.5px solid var(--border)'
              }}>
                <div
                  onClick={() => toggleGoal(goal)}
                  style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: goal.done ? 'none' : '1.5px solid var(--border)',
                    background: goal.done ? 'var(--acc)' : 'none',
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', color: '#fff'
                  }}
                >{goal.done ? '✓' : ''}</div>
                <div style={{
                  fontSize: '12px', flex: 1,
                  textDecoration: goal.done ? 'line-through' : 'none',
                  color: goal.done ? 'var(--muted)' : 'var(--text)'
                }}>{goal.text}</div>
                <div
                  onClick={() => deleteGoal(goal.id)}
                  style={{ fontSize: '14px', color: 'var(--muted)', cursor: 'pointer', opacity: .6 }}
                >×</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add goal */}
      {showAdd ? (
        <div style={{
          background: 'var(--surf)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '13px'
        }}>
          <input
            autoFocus
            placeholder="What do you want to accomplish?"
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            style={{
              width: '100%', background: 'var(--surf3)',
              border: '0.5px solid var(--border)', borderRadius: '7px',
              color: 'var(--text)', fontSize: '13px', padding: '9px 11px',
              outline: 'none', marginBottom: '9px'
            }}
          />
          <div style={{ display: 'flex', gap: '7px' }}>
            <select
              value={newArea}
              onChange={e => setNewArea(e.target.value)}
              style={{
                flex: 1, background: 'var(--surf3)',
                border: '0.5px solid var(--border)', borderRadius: '7px',
                color: 'var(--text)', fontSize: '12px', padding: '8px 10px',
                outline: 'none'
              }}
            >
              {AREAS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            <button onClick={addGoal} style={{
              background: 'var(--acc)', border: 'none', borderRadius: '7px',
              color: '#fff', fontSize: '12px', padding: '8px 16px', cursor: 'pointer'
            }}>Add</button>
            <button onClick={() => setShowAdd(false)} style={{
              background: 'var(--surf3)', border: '0.5px solid var(--border)',
              borderRadius: '7px', color: 'var(--muted)', fontSize: '12px',
              padding: '8px 12px', cursor: 'pointer'
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '5px', width: '100%', padding: '9px',
            background: 'none', border: '0.5px dashed var(--border)',
            borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px'
          }}
        >+ Add goal</button>
      )}
    </div>
  )
}