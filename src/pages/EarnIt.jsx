import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const DEFAULT_APPS = [
  { app_name: 'Instagram', limit_min: 45 },
  { app_name: 'Netflix / Series', limit_min: 90 },
  { app_name: 'Gaming', limit_min: 60 },
]

function appIcon(name) {
  if (!name) return '📱'
  const n = name.toLowerCase()
  if (n.includes('instagram')) return '📸'
  if (n.includes('netflix') || n.includes('series')) return '🎬'
  if (n.includes('gaming') || n.includes('game')) return '🎮'
  if (n.includes('youtube')) return '▶️'
  if (n.includes('twitter') || n.includes('x')) return '🐦'
  if (n.includes('tiktok')) return '🎵'
  return '📱'
}

export default function EarnIt() {
  const [goals, setGoals] = useState([])
  const [earnIt, setEarnIt] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newApp, setNewApp] = useState({ app_name: '', limit_min: '' })
  const [editUsed, setEditUsed] = useState(null)
  const [usedInput, setUsedInput] = useState('')
  const [wakeTarget, setWakeTarget] = useState('07:00')
  const [sleepTarget, setSleepTarget] = useState('23:00')
  const [editingTargets, setEditingTargets] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: g }, { data: e }] = await Promise.all([
      supabase.from('goals').select('*').eq('date', today()),
      supabase.from('earn_it').select('*').eq('date', today())
    ])
    setGoals(g || [])

    if (e && e.length > 0) {
      setEarnIt(e)
    } else {
      const defaults = DEFAULT_APPS.map(a => ({
        app_name: a.app_name,
        limit_min: a.limit_min,
        used_min: 0,
        locked: false,
        date: today()
      }))
      const { data: inserted } = await supabase.from('earn_it').insert(defaults).select()
      setEarnIt(inserted || [])
    }

    const saved = localStorage.getItem('sumeria_targets')
    if (saved) {
      try {
        const { wake, sleep } = JSON.parse(saved)
        setWakeTarget(wake || '07:00')
        setSleepTarget(sleep || '23:00')
      } catch {}
    }

    setLoading(false)
  }

  async function updateUsed(app) {
  const mins = parseInt(usedInput)
  if (isNaN(mins) || mins <= 0) return
  const newTotal = (app.used_min || 0) + mins
  const { error } = await supabase
    .from('earn_it')
    .update({ used_min: newTotal })
    .eq('id', app.id)
  if (!error) {
    setEarnIt(prev => prev.map(a => a.id === app.id ? { ...a, used_min: newTotal } : a))
  }
  setEditUsed(null)
  setUsedInput('')
}

  async function addApp() {
    if (!newApp.app_name.trim() || !newApp.limit_min) return
    const { data } = await supabase.from('earn_it').insert({
      app_name: newApp.app_name,
      limit_min: parseInt(newApp.limit_min),
      used_min: 0,
      locked: false,
      date: today()
    }).select().single()
    if (data) setEarnIt(prev => [...prev, data])
    setNewApp({ app_name: '', limit_min: '' })
    setShowAdd(false)
  }

  async function deleteApp(id) {
    await supabase.from('earn_it').delete().eq('id', id)
    setEarnIt(prev => prev.filter(a => a.id !== id))
  }

  function saveTargets() {
    localStorage.setItem('sumeria_targets', JSON.stringify({ wake: wakeTarget, sleep: sleepTarget }))
    setEditingTargets(false)
  }

  const done = goals.filter(g => g.done).length
  const total = goals.length
  const minToUnlock = total > 0 ? Math.ceil(total * 0.6) : 5
  const unlocked = done >= minToUnlock && total > 0
  const pct = total > 0 ? Math.round(done / total * 100) : 0

  function usedColor(app) {
    if (!app.limit_min) return 'var(--muted)'
    const ratio = app.used_min / app.limit_min
    if (ratio >= 1) return 'var(--danger)'
    if (ratio >= 0.75) return 'var(--xp)'
    return 'var(--fit)'
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--earn)' }}>Earn It</div>
        <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Earn your free time — don't just take it</div>
      </div>

      {/* Status banner */}
      <div style={{
        borderRadius: '10px', padding: '14px 15px', marginBottom: '14px',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: unlocked ? '#071a0e' : '#1a0908',
        border: `0.5px solid ${unlocked ? '#1a3d28' : '#3d1a16'}`,
        transition: 'all .3s'
      }}>
        <div style={{ fontSize: '24px' }}>{unlocked ? '🔓' : '🔒'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: unlocked ? 'var(--fit)' : 'var(--danger)', marginBottom: '3px' }}>
            {unlocked ? 'Free time unlocked!' : 'Free time locked'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
            {unlocked
              ? 'You earned your screen time today 🎉'
              : `Complete ${minToUnlock} of ${total} goals to unlock · currently ${done}/${total}`}
          </div>
          <div style={{ height: '3px', background: 'var(--surf3)', borderRadius: '2px', marginTop: '7px', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: unlocked ? 'var(--fit)' : 'var(--danger)',
              borderRadius: '2px', transition: 'width .3s'
            }} />
          </div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 500, color: unlocked ? 'var(--fit)' : 'var(--danger)' }}>{pct}%</div>
      </div>

      {/* Sleep targets */}
      <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
        Sleep schedule
      </div>
      <div style={{
        background: 'var(--surf)', border: '0.5px solid var(--border)',
        borderRadius: '10px', padding: '13px 15px', marginBottom: '14px'
      }}>
        {editingTargets ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Target bedtime</div>
                <input type="time" value={sleepTarget}
                  onChange={e => setSleepTarget(e.target.value)}
                  style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Target wake-up</div>
                <input type="time" value={wakeTarget}
                  onChange={e => setWakeTarget(e.target.value)}
                  style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <button onClick={saveTargets} style={{
                flex: 1, background: 'var(--acc)', border: 'none', borderRadius: '7px',
                color: '#fff', fontSize: '13px', padding: '8px', cursor: 'pointer', fontWeight: 500
              }}>Save</button>
              <button onClick={() => setEditingTargets(false)} style={{
                background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px',
                color: 'var(--muted)', fontSize: '13px', padding: '8px 14px', cursor: 'pointer'
              }}>Cancel</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 500 }}>{sleepTarget}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>Bedtime</div>
            </div>
            <div style={{ fontSize: '20px', color: 'var(--muted)' }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 500 }}>{wakeTarget}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>Wake up</div>
            </div>
            <button onClick={() => setEditingTargets(true)} style={{
              background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '6px',
              color: 'var(--muted)', fontSize: '11px', padding: '5px 10px', cursor: 'pointer'
            }}>Edit</button>
          </div>
        )}
      </div>

      {/* Screen time */}
      <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
        Screen time budget
      </div>
      <div style={{ fontSize: '12px', color: 'var(--muted2)', marginBottom: '10px' }}>
        Update how many minutes you've used today for each app.
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}

      {earnIt.map(app => {
        const ratio = app.limit_min > 0 ? Math.min(app.used_min / app.limit_min, 1) : 0
        const isOver = app.used_min >= app.limit_min
        return (
          <div key={app.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
            background: 'var(--surf)', border: `0.5px solid ${isOver ? '#3d1a16' : 'var(--border)'}`,
            borderRadius: '8px', marginBottom: '6px'
          }}>
            <div style={{ fontSize: '20px', flexShrink: 0 }}>{appIcon(app.app_name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                {app.app_name}
                {isOver && <span style={{ fontSize: '10px', color: 'var(--danger)', marginLeft: '6px' }}>over limit</span>}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '4px' }}>
                {app.used_min} / {app.limit_min} min
              </div>
              <div style={{ height: '3px', background: 'var(--surf3)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: `${ratio * 100}%`, height: '100%',
                  background: usedColor(app), borderRadius: '2px', transition: 'width .3s'
                }} />
              </div>
            </div>
            {editUsed === app.id ? (
              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                <input
                  autoFocus
                  type="number"
                  inputMode="numeric"
                  placeholder="mins to add"
                  value={usedInput}
                  onChange={e => setUsedInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && updateUsed(app)}
                  style={{
                    width: '60px', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                    borderRadius: '6px', color: 'var(--text)', fontSize: '12px',
                    padding: '5px 8px', outline: 'none'
                  }}
                />
                <button onClick={() => updateUsed(app)} style={{
                  background: 'var(--acc)', border: 'none', borderRadius: '6px',
                  color: '#fff', fontSize: '11px', padding: '5px 8px', cursor: 'pointer'
                }}>✓</button>
                <button onClick={() => { setEditUsed(null); setUsedInput('') }} style={{
                  background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '6px',
                  color: 'var(--muted)', fontSize: '11px', padding: '5px 8px', cursor: 'pointer'
                }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                <button onClick={() => { setEditUsed(app.id); setUsedInput('') }} style={{
                  background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '6px',
                  color: 'var(--muted)', fontSize: '11px', padding: '5px 10px', cursor: 'pointer'
                }}>Log</button>
                <button onClick={() => deleteApp(app.id)} style={{
                  background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px'
                }}>×</button>
              </div>
            )}
          </div>
        )
      })}

      {/* Rules */}
      <div style={{
        background: 'var(--surf)', border: '0.5px solid var(--border)',
        borderRadius: '10px', padding: '12px 14px', marginTop: '10px', marginBottom: '10px'
      }}>
        <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>Rules</div>
        {[
          { icon: '✓', color: 'var(--fit)', text: `Complete ${minToUnlock}/${total || '?'} daily goals → free time unlocked` },
          { icon: '✓', color: 'var(--fit)', text: 'Staying within all limits earns +100 XP at end of day' },
          { icon: '⚡', color: 'var(--xp)', text: 'Be honest with yourself — this only works if you log accurately' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: i < 2 ? '6px' : 0 }}>
            <span style={{ color: r.color, flexShrink: 0 }}>{r.icon}</span>
            <span style={{ fontSize: '12px', color: 'var(--muted2)', lineHeight: 1.6 }}>{r.text}</span>
          </div>
        ))}
      </div>

      {/* Add app */}
      {showAdd ? (
        <div style={{
          background: 'var(--surf)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '13px', marginTop: '6px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Add app</div>
          <input
            autoFocus
            placeholder="App name"
            value={newApp.app_name}
            onChange={e => setNewApp(prev => ({ ...prev, app_name: e.target.value }))}
            style={{
              width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
              borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
              padding: '9px 11px', outline: 'none', marginBottom: '8px'
            }}
          />
          <input
            placeholder="Daily limit (minutes)"
            type="number"
            value={newApp.limit_min}
            onChange={e => setNewApp(prev => ({ ...prev, limit_min: e.target.value }))}
            style={{
              width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
              borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
              padding: '9px 11px', outline: 'none', marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: '7px' }}>
            <button onClick={addApp} style={{
              flex: 1, background: 'var(--earn)', border: 'none', borderRadius: '7px',
              color: '#000', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500
            }}>Save</button>
            <button onClick={() => setShowAdd(false)} style={{
              background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px',
              color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer'
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          width: '100%', padding: '9px', background: 'none',
          border: '0.5px dashed var(--border)', borderRadius: '8px',
          color: 'var(--muted)', cursor: 'pointer', fontSize: '12px'
        }}>+ Add app</button>
      )}
    </div>
  )
}