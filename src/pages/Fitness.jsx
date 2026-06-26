import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const WORKOUT_TYPES = ['Calisthenics', 'Fútbol', 'Pádel', 'Golf', 'Other']

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function Fitness() {
  const [view, setView] = useState('day')
  const [workouts, setWorkouts] = useState([])
  const [weightLog, setWeightLog] = useState([])
  const [showAddWorkout, setShowAddWorkout] = useState(false)
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [newWorkout, setNewWorkout] = useState({ type: 'Calisthenics', duration_min: '', notes: '' })
  const [newWeight, setNewWeight] = useState('')
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState([])
  const photoInputRef = useRef(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: w }, { data: wl }] = await Promise.all([
      supabase.from('workouts').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('weight_log').select('*').order('date', { ascending: false }).limit(10)
    ])
    setWorkouts(w || [])
    setWeightLog(wl || [])
    setLoading(false)
  }

  async function addWorkout() {
    if (!newWorkout.type) return
    const { data } = await supabase.from('workouts').insert({
      ...newWorkout,
      duration_min: parseInt(newWorkout.duration_min) || 0,
      date: today()
    }).select().single()
    if (data) setWorkouts([data, ...workouts])
    setNewWorkout({ type: 'Calisthenics', duration_min: '', notes: '' })
    setShowAddWorkout(false)
    await supabase.from('xp_log').insert({ amount: 80, reason: 'Workout completed', date: today() })
  }

  async function addWeight() {
    if (!newWeight) return
    const { data } = await supabase.from('weight_log').insert({
      kg: parseFloat(newWeight),
      date: today()
    }).select().single()
    if (data) setWeightLog([data, ...weightLog])
    setNewWeight('')
    setShowAddWeight(false)
  }

  const thisWeekWorkouts = workouts.filter(w => {
    const d = new Date(w.date)
    const now = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(now.getDate() - 7)
    return d >= weekAgo
  })

  const latestWeight = weightLog[0]?.kg
  const prevWeight = weightLog[1]?.kg
  const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null

  const views = ['day', 'week', 'month', 'ytd']

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--fit)' }}>Fitness</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Calisthenics · Fútbol · Pádel · Golf</div>
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {views.map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? 'var(--surf3)' : 'none',
              border: '0.5px solid var(--border)',
              borderColor: view === v ? 'var(--surf3)' : 'var(--border)',
              borderRadius: '5px', color: view === v ? 'var(--text)' : 'var(--muted)',
              padding: '4px 7px', fontSize: '10px', cursor: 'pointer'
            }}>{v.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* DAY VIEW */}
      {view === 'day' && (
        <>
          {/* Photo Frame */}
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
            Weekly progress photo
          </div>
          <div style={{
            background: 'var(--surf)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '12px 13px', marginBottom: '12px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '8px' }}>
              Align with the guide — same spot, same distance every week.
            </div>
            <div style={{
              width: '100%', aspectRatio: '3/4', background: 'var(--surf3)',
              borderRadius: '8px', maxHeight: '200px', position: 'relative',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                backgroundSize: '33.33% 33.33%', opacity: .35
              }} />
              <div style={{
                position: 'absolute', width: '25%', aspectRatio: '1',
                border: '1.5px dashed #3a3a3a', borderRadius: '50%', top: '4%', left: '37.5%'
              }} />
              <div style={{
                position: 'absolute', width: '36%', height: '80%',
                border: '1.5px dashed #3a3a3a', borderRadius: '50% 50% 38% 38%', top: '9%', left: '32%'
              }} />
              <span style={{ position: 'absolute', bottom: '8px', fontSize: '10px', color: 'var(--muted)' }}>
                Stand here every week
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0]
                if (!file) return
                const url = URL.createObjectURL(file)
                setPhotos(prev => [{ url, date: today() }, ...prev])
              }}
            />

            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  photoInputRef.current.removeAttribute('capture')
                  photoInputRef.current.click()
                }}
                style={{
                  flex: 1, padding: '8px', background: 'var(--surf3)',
                  border: '0.5px solid var(--border)', borderRadius: '6px',
                  color: 'var(--text)', fontSize: '11px', cursor: 'pointer'
                }}>🖼 Upload</button>
              <button
                onClick={() => {
                  photoInputRef.current.setAttribute('capture', 'environment')
                  photoInputRef.current.click()
                }}
                style={{
                  flex: 1, padding: '8px', background: 'var(--surf3)',
                  border: '0.5px solid var(--border)', borderRadius: '6px',
                  color: 'var(--text)', fontSize: '11px', cursor: 'pointer'
                }}>📷 Take photo</button>
            </div>

            {/* Photo history */}
            {photos.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
                  Previous weeks
                </div>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ flexShrink: 0 }}>
                      <img src={p.url} style={{ width: '64px', height: '86px', objectFit: 'cover', borderRadius: '6px', border: '0.5px solid var(--border)' }} alt="progress" />
                      <div style={{ fontSize: '9px', color: 'var(--muted)', textAlign: 'center', marginTop: '3px' }}>{p.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent sessions */}
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
            Recent sessions
          </div>
          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && workouts.length === 0 && (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '16px', textAlign: 'center',
              color: 'var(--muted)', fontSize: '13px', marginBottom: '8px'
            }}>No sessions logged yet</div>
          )}
          {workouts.slice(0, 3).map(w => (
            <div key={w.id} style={{
              display: 'flex', gap: '10px', padding: '10px 12px',
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '8px', marginBottom: '7px'
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '7px',
                background: '#061410', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, fontSize: '14px'
              }}>💪</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{w.type}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                  {w.date} · {w.duration_min} min{w.notes ? ` · ${w.notes}` : ''}
                </div>
              </div>
            </div>
          ))}

          {/* Add workout form */}
          {showAddWorkout ? (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '13px', marginBottom: '8px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Log session</div>
              <select
                value={newWorkout.type}
                onChange={e => setNewWorkout({ ...newWorkout, type: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              >
                {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                placeholder="Duration (minutes)"
                type="number"
                value={newWorkout.duration_min}
                onChange={e => setNewWorkout({ ...newWorkout, duration_min: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              />
              <input
                placeholder="Notes (optional)"
                value={newWorkout.notes}
                onChange={e => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', gap: '7px' }}>
                <button onClick={addWorkout} style={{
                  flex: 1, background: 'var(--fit)', border: 'none', borderRadius: '7px',
                  color: '#000', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500
                }}>Save</button>
                <button onClick={() => setShowAddWorkout(false)} style={{
                  background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--muted)', fontSize: '13px',
                  padding: '9px 14px', cursor: 'pointer'
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddWorkout(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              width: '100%', padding: '9px', background: 'none',
              border: '0.5px dashed var(--border)', borderRadius: '8px',
              color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginBottom: '8px'
            }}>+ Log session</button>
          )}
        </>
      )}

      {/* WEEK VIEW */}
      {view === 'week' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Sessions', value: thisWeekWorkouts.length, sub: 'This week' },
              { label: 'Current weight', value: latestWeight ? `${latestWeight} kg` : '—', sub: weightDiff ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` : 'No data', subColor: weightDiff < 0 ? 'var(--fit)' : 'var(--diet)' },
              { label: 'Types', value: [...new Set(thisWeekWorkouts.map(w => w.type))].length, sub: 'Different' }
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--fit)' }}>{k.value}</div>
                <div style={{ fontSize: '11px', color: k.subColor || 'var(--muted2)', marginTop: '2px' }}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
            Weight log
          </div>
          {weightLog.slice(0, 5).map(w => (
            <div key={w.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '7px', marginBottom: '5px'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{w.date}</span>
              <span style={{ fontWeight: 500 }}>{w.kg} kg</span>
            </div>
          ))}
          {showAddWeight ? (
            <div style={{ display: 'flex', gap: '7px', marginTop: '8px' }}>
              <input
                autoFocus
                placeholder="Weight in kg"
                type="number"
                step="0.1"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                style={{
                  flex: 1, background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none'
                }}
              />
              <button onClick={addWeight} style={{
                background: 'var(--fit)', border: 'none', borderRadius: '7px',
                color: '#000', fontSize: '13px', padding: '9px 16px', cursor: 'pointer', fontWeight: 500
              }}>Save</button>
              <button onClick={() => setShowAddWeight(false)} style={{
                background: 'var(--surf3)', border: '0.5px solid var(--border)',
                borderRadius: '7px', color: 'var(--muted)', fontSize: '13px',
                padding: '9px 12px', cursor: 'pointer'
              }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setShowAddWeight(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              width: '100%', padding: '9px', background: 'none',
              border: '0.5px dashed var(--border)', borderRadius: '8px',
              color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px'
            }}>+ Log weight</button>
          )}
        </>
      )}

      {/* MONTH VIEW */}
      {view === 'month' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>Sessions this month</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--fit)' }}>
                {workouts.filter(w => w.date?.startsWith(today().slice(0, 7))).length}
              </div>
            </div>
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>Weight change</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: weightDiff < 0 ? 'var(--fit)' : 'var(--diet)' }}>
                {weightDiff ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` : '—'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {WORKOUT_TYPES.map(t => {
              const count = workouts.filter(w => w.type === t && w.date?.startsWith(today().slice(0, 7))).length
              if (!count) return null
              return (
                <div key={t} style={{ background: 'var(--surf3)', borderRadius: '5px', padding: '3px 8px', fontSize: '11px', color: 'var(--muted)' }}>
                  {t} <span style={{ color: 'var(--text)', fontWeight: 500 }}>{count}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* YTD VIEW */}
      {view === 'ytd' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Total sessions', value: workouts.length },
            { label: 'Weight change', value: weightDiff ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` : '—' },
            { label: 'Types trained', value: [...new Set(workouts.map(w => w.type))].length }
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--fit)' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}