import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getWorkoutIcon } from '../components/icons/getWorkoutIcon'

const WORKOUT_TYPES = ['Calisthenics', 'Fútbol', 'Pádel', 'Golf', 'Other']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function WorkoutForm({ data, setData, onSave, onCancel, title }) {
  return (
    <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px', marginBottom: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>{title}</div>
      <select value={data.type} onChange={e => setData(p => ({ ...p, type: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }}>
        {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <input placeholder="Duration (minutes)" type="number" value={data.duration_min}
        onChange={e => setData(p => ({ ...p, duration_min: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
      <input placeholder="Notes (optional)" value={data.notes}
        onChange={e => setData(p => ({ ...p, notes: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }} />
      <div style={{ display: 'flex', gap: '7px' }}>
        <button onClick={onSave} style={{ flex: 1, background: 'var(--fit)', border: 'none', borderRadius: '7px', color: '#000', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
        <button onClick={onCancel} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function Fitness() {
  const [view, setView] = useState('day')
  const [workouts, setWorkouts] = useState([])
  const [weightLog, setWeightLog] = useState([])
  const [photos, setPhotos] = useState([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [compareA, setCompareA] = useState(null)
  const [compareB, setCompareB] = useState(null)
  const [pickerSlot, setPickerSlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddWorkout, setShowAddWorkout] = useState(false)
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [editWorkout, setEditWorkout] = useState(null)
  const [editWeight, setEditWeight] = useState(null)
  const [newWorkout, setNewWorkout] = useState({ type: 'Calisthenics', duration_min: '', notes: '' })
  const [newWeight, setNewWeight] = useState('')
  const [routines, setRoutines] = useState([])
  const [prMap, setPrMap] = useState({})
  const [exerciseHistory, setExerciseHistory] = useState(null)
  const photoInputRef = useRef(null)

  useEffect(() => { fetchData(); fetchPhotos(); fetchRoutines(); fetchPRs() }, [])

  async function fetchRoutines() {
    const { data } = await supabase.from('routines')
      .select('*, routine_exercises(*)')
      .eq('area', 'fitness')
      .eq('active', true)
      .order('title')
    setRoutines(data || [])
  }

  async function fetchPRs() {
    const { data } = await supabase
      .from('workout_sets')
      .select('exercise_name, reps')
      .not('reps', 'is', null)
    const map = {}
    ;(data || []).forEach(row => {
      if (!map[row.exercise_name] || row.reps > map[row.exercise_name]) {
        map[row.exercise_name] = row.reps
      }
    })
    setPrMap(map)
  }

  async function fetchExerciseHistory(exerciseName) {
    const { data } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('exercise_name', exerciseName)
      .order('created_at', { ascending: true })

    setExerciseHistory({ exerciseName, data: data || [] })
  }

  async function fetchData() {
    const [{ data: w }, { data: wl }] = await Promise.all([
      supabase.from('workouts').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('weight_log').select('*').order('date', { ascending: false }).limit(10)
    ])
    setWorkouts(w || [])
    setWeightLog(wl || [])
    setLoading(false)
  }

  async function fetchPhotos() {
    const { data } = await supabase.storage
      .from('progress-photos')
      .list('', { sortBy: { column: 'created_at', order: 'desc' } })
    if (data) {
      const urls = data.map(file => ({
        name: file.name,
        date: file.name.split('_')[0],
        url: supabase.storage.from('progress-photos').getPublicUrl(file.name).data.publicUrl
      }))
      setPhotos(urls)
    }
  }

  async function uploadPhoto(file) {
    if (!file) return
    setUploadingPhoto(true)
    try {
      const dateStr = today()
      const fileName = `${dateStr}_${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file, { contentType: 'image/jpeg', upsert: false })
      if (!error) await fetchPhotos()
    } finally {
      setUploadingPhoto(false)
    }
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

  async function saveWorkout() {
    if (!editWorkout) return
    await supabase.from('workouts').update({
      type: editWorkout.type,
      duration_min: parseInt(editWorkout.duration_min) || 0,
      notes: editWorkout.notes
    }).eq('id', editWorkout.id)
    setWorkouts(prev => prev.map(w => w.id === editWorkout.id ? { ...w, ...editWorkout } : w))
    setEditWorkout(null)
  }

  async function deleteWorkout(id) {
    await supabase.from('workouts').delete().eq('id', id)
    setWorkouts(prev => prev.filter(w => w.id !== id))
  }

  async function addWeight() {
    if (!newWeight) return
    const { data } = await supabase.from('weight_log').insert({
      kg: parseFloat(newWeight), date: today()
    }).select().single()
    if (data) setWeightLog([data, ...weightLog])
    setNewWeight('')
    setShowAddWeight(false)
  }

  async function saveWeight() {
    if (!editWeight) return
    await supabase.from('weight_log').update({ kg: parseFloat(editWeight.kg) }).eq('id', editWeight.id)
    setWeightLog(prev => prev.map(w => w.id === editWeight.id ? { ...w, kg: parseFloat(editWeight.kg) } : w))
    setEditWeight(null)
  }

  async function deleteWeight(id) {
    await supabase.from('weight_log').delete().eq('id', id)
    setWeightLog(prev => prev.filter(w => w.id !== id))
  }

  async function deletePhoto(name) {
    await supabase.storage.from('progress-photos').remove([name])
    setPhotos(prev => prev.filter(p => p.name !== name))
  }

  function toggleCompare() {
    setShowCompare(v => !v)
    setCompareA(null)
    setCompareB(null)
    setPickerSlot(null)
  }

  function selectForSlot(photo) {
    if (pickerSlot === 'A') setCompareA(photo)
    if (pickerSlot === 'B') setCompareB(photo)
    setPickerSlot(null)
  }

  const thisWeekWorkouts = workouts.filter(w => {
    const d = new Date(w.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  })

  const latestWeight = weightLog[0]?.kg
  const prevWeight = weightLog[1]?.kg
  const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null

  const sortedPRs = Object.entries(prMap).sort(([a], [b]) => a.localeCompare(b))

  const views = ['day', 'week', 'month', 'ytd', 'routine']

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
          <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '12px 13px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Same spot, same distance each week.
            </div>

            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => uploadPhoto(e.target.files[0])} />

            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <button onClick={() => { photoInputRef.current.removeAttribute('capture'); photoInputRef.current.click() }}
                disabled={uploadingPhoto}
                style={{ flex: 1, padding: '8px', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '6px', color: uploadingPhoto ? 'var(--muted)' : 'var(--text)', fontSize: '11px', cursor: 'pointer' }}>
                {uploadingPhoto ? 'Uploading...' : 'Upload'}
              </button>
              <button onClick={() => { photoInputRef.current.setAttribute('capture', 'environment'); photoInputRef.current.click() }}
                disabled={uploadingPhoto}
                style={{ flex: 1, padding: '8px', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '6px', color: uploadingPhoto ? 'var(--muted)' : 'var(--text)', fontSize: '11px', cursor: 'pointer' }}>
                {uploadingPhoto ? 'Uploading...' : 'Take photo'}
              </button>
            </div>

            {photos.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Previous weeks</div>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ flexShrink: 0, textAlign: 'center', position: 'relative' }}>
                      <img src={p.url} alt={p.date} style={{ width: '64px', height: '86px', objectFit: 'cover', borderRadius: '6px', border: '0.5px solid var(--border)', display: 'block' }} />
                      <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '3px' }}>{p.date}</div>
                      <button onClick={() => deletePhoto(p.name)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: '50%', color: '#fff', fontSize: '10px', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Photo comparison */}
          {photos.length >= 2 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px' }}>Compare progress</div>
                <button onClick={toggleCompare} style={{
                  background: showCompare ? 'var(--fit)' : 'var(--surf3)',
                  border: '0.5px solid var(--border)', borderRadius: '6px',
                  color: showCompare ? '#000' : 'var(--text)', fontSize: '11px',
                  padding: '5px 10px', cursor: 'pointer', fontWeight: 500
                }}>{showCompare ? 'Close' : 'Compare'}</button>
              </div>

              {showCompare && (
                <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '12px 13px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    {[{ slot: 'A', label: 'Before', photo: compareA }, { slot: 'B', label: 'After', photo: compareB }].map(s => (
                      <div key={s.slot} onClick={() => setPickerSlot(s.slot)} style={{
                        flex: 1, aspectRatio: '3/4', maxHeight: '140px', borderRadius: '8px',
                        background: 'var(--surf3)', cursor: 'pointer', overflow: 'hidden',
                        border: pickerSlot === s.slot ? '1.5px solid var(--fit)' : '0.5px dashed var(--border)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative'
                      }}>
                        {s.photo ? (
                          <>
                            <img src={s.photo.url} alt={s.photo.date} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: '10px', padding: '3px', textAlign: 'center' }}>{s.photo.date}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: '20px', marginBottom: '4px', color: 'var(--muted)' }}>+</div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{s.label}</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {pickerSlot && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '6px' }}>Select a photo for {pickerSlot === 'A' ? 'Before' : 'After'}</div>
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {photos.map((p, i) => {
                          const otherPhoto = pickerSlot === 'A' ? compareB : compareA
                          const disabled = otherPhoto?.name === p.name
                          return (
                            <img key={i} src={p.url} alt={p.date} onClick={() => !disabled && selectForSlot(p)}
                              style={{
                                width: '48px', height: '64px', objectFit: 'cover', borderRadius: '5px', flexShrink: 0,
                                border: '0.5px solid var(--border)', cursor: disabled ? 'not-allowed' : 'pointer',
                                opacity: disabled ? .35 : 1
                              }} />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {compareA && compareB && (
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px' }}>Comparison</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[compareA, compareB].map((p, i) => (
                          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                            <img src={p.url} alt={p.date} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '8px', border: '0.5px solid var(--fit)', display: 'block' }} />
                            <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '5px' }}>{p.date}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Recent sessions */}
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Recent sessions</div>
          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && workouts.length === 0 && (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>No sessions logged yet</div>
          )}
          {workouts.slice(0, 5).map(w => (
            <div key={w.id}>
              {editWorkout?.id === w.id ? (
                <WorkoutForm data={editWorkout} setData={setEditWorkout} onSave={saveWorkout} onCancel={() => setEditWorkout(null)} title="Edit session" />
              ) : (
                <div style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', marginBottom: '7px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#061410', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{getWorkoutIcon(w.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{w.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{w.date} · {w.duration_min} min{w.notes ? ` · ${w.notes}` : ''}</div>
                  </div>
                  <button onClick={() => setEditWorkout({ ...w })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '10px' }}>Edit</button>
                  <button onClick={() => deleteWorkout(w.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                </div>
              )}
            </div>
          ))}

          {showAddWorkout ? (
            <WorkoutForm data={newWorkout} setData={setNewWorkout} onSave={addWorkout} onCancel={() => setShowAddWorkout(false)} title="Log session" />
          ) : (
            <button onClick={() => setShowAddWorkout(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginBottom: '8px' }}>+ Log session</button>
          )}
        </>
      )}

      {/* WEEK VIEW */}
      {view === 'week' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Sessions', value: thisWeekWorkouts.length, sub: 'This week', color: 'var(--fit)' },
              { label: 'Current weight', value: latestWeight ? `${latestWeight} kg` : '—', sub: weightDiff ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` : 'No data', subColor: weightDiff < 0 ? 'var(--fit)' : 'var(--diet)' },
              { label: 'Types', value: [...new Set(thisWeekWorkouts.map(w => w.type))].length, sub: 'Different', color: 'var(--fit)' }
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: k.color || 'var(--fit)' }}>{k.value}</div>
                <div style={{ fontSize: '11px', color: k.subColor || 'var(--muted2)', marginTop: '2px' }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Automatic PRs */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '4px' }}>
              Records personales
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted2)', marginBottom: '10px' }}>
              Calculado automáticamente de tus workouts
            </div>
            {sortedPRs.map(([name, pr]) => (
              <div key={name} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '0.5px solid var(--border)'
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text)' }}>{name}</div>
                <div style={{ fontSize: '13px', color: 'var(--fit)', fontWeight: 600 }}>
                  {pr} reps
                </div>
              </div>
            ))}
            {sortedPRs.length === 0 && (
              <div style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
                Completa un workout para ver tus records.
              </div>
            )}
          </div>

          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Weight log</div>
          {weightLog.slice(0, 5).map(w => (
            <div key={w.id}>
              {editWeight?.id === w.id ? (
                <div style={{ display: 'flex', gap: '7px', marginBottom: '5px' }}>
                  <input type="number" step="0.1" value={editWeight.kg} onChange={e => setEditWeight(p => ({ ...p, kg: e.target.value }))}
                    style={{ flex: 1, background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '8px 10px', outline: 'none' }} />
                  <button onClick={saveWeight} style={{ background: 'var(--fit)', border: 'none', borderRadius: '7px', color: '#000', fontSize: '12px', padding: '8px 14px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
                  <button onClick={() => setEditWeight(null)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '12px', padding: '8px 10px', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '7px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{w.date}</span>
                  <span style={{ fontWeight: 500 }}>{w.kg} kg</span>
                  <button onClick={() => setEditWeight({ ...w })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '10px' }}>Edit</button>
                  <button onClick={() => deleteWeight(w.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </div>
              )}
            </div>
          ))}
          {showAddWeight ? (
            <div style={{ display: 'flex', gap: '7px', marginTop: '8px' }}>
              <input autoFocus placeholder="Weight in kg" type="number" step="0.1" value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                style={{ flex: 1, background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
              <button onClick={addWeight} style={{ background: 'var(--fit)', border: 'none', borderRadius: '7px', color: '#000', fontSize: '13px', padding: '9px 16px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
              <button onClick={() => setShowAddWeight(false)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 12px', cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setShowAddWeight(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>+ Log weight</button>
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
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Total sessions', value: workouts.length, color: 'var(--fit)' },
              { label: 'Weight change', value: weightDiff ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` : '—', color: weightDiff < 0 ? 'var(--fit)' : 'var(--diet)' },
              { label: 'Types trained', value: [...new Set(workouts.map(w => w.type))].length, color: 'var(--fit)' }
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ROUTINE VIEW */}
      {view === 'routine' && (
        <>
          {routines.length === 0 && (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No fitness routines yet
            </div>
          )}
          {routines.map(routine => (
            <div key={routine.id} style={{
              background: 'var(--surf)', borderRadius: '12px',
              padding: '14px', marginBottom: '10px',
              border: '0.5px solid var(--border)'
            }}>
              <div style={{
                fontFamily: 'Georgia, serif', fontSize: '15px',
                color: 'var(--fit)', marginBottom: '4px', fontWeight: 500
              }}>
                {routine.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                {routine.days_of_week?.split(',').map(Number).map(d => DAY_LABELS[d]).join(' · ')}
              </div>
              {routine.routine_exercises
                ?.sort((a, b) => a.order_index - b.order_index)
                .map(ex => (
                  <div key={ex.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '6px 0',
                    borderBottom: '0.5px solid var(--border)'
                  }}>
                    <div
                      onClick={() => fetchExerciseHistory(ex.name)}
                      style={{
                        fontSize: '13px', color: 'var(--text)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: 'var(--border)',
                        textDecorationStyle: 'dotted'
                      }}
                    >
                      {ex.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                      {ex.sets} × {ex.reps}
                    </div>
                  </div>
                ))
              }
            </div>
          ))}
        </>
      )}

      {exerciseHistory && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end'
        }} onClick={() => setExerciseHistory(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surf)', borderRadius: '20px 20px 0 0',
            padding: '20px 16px', width: '100%',
            maxHeight: '70vh', overflowY: 'auto'
          }}>
            <div style={{
              fontFamily: 'Georgia, serif', fontSize: '18px',
              color: 'var(--fit)', marginBottom: '4px', fontWeight: 500
            }}>
              {exerciseHistory.exerciseName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
              Historial de rendimiento
            </div>

            {exerciseHistory.data.length === 0 ? (
              <div style={{
                fontSize: '13px', color: 'var(--muted)',
                textAlign: 'center', padding: '24px 0'
              }}>
                No hay datos aún. Completa un workout para ver tu progresión.
              </div>
            ) : (() => {
              const byDate = {}
              exerciseHistory.data.forEach(row => {
                const date = row.workout_date
                if (!byDate[date]) byDate[date] = []
                byDate[date].push(row)
              })
              const dates = Object.keys(byDate).sort().reverse()

              const allReps = exerciseHistory.data
                .filter(r => r.reps != null)
                .map(r => r.reps)
              const pr = allReps.length > 0 ? Math.max(...allReps) : null

              const sessionAvgs = dates.map(date => {
                const reps = byDate[date].filter(r => r.reps != null).map(r => r.reps)
                return reps.length > 0 ? reps.reduce((a, b) => a + b, 0) / reps.length : 0
              })

              return (
                <>
                  <div style={{
                    display: 'flex', gap: '12px', marginBottom: '20px'
                  }}>
                    {pr && (
                      <div style={{
                        flex: 1, background: 'var(--surf2)',
                        borderRadius: '10px', padding: '12px',
                        border: '0.5px solid var(--fit)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--fit)' }}>
                          {pr}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                          mejor set (reps)
                        </div>
                      </div>
                    )}
                    <div style={{
                      flex: 1, background: 'var(--surf2)',
                      borderRadius: '10px', padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                        {dates.length}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                        sesiones
                      </div>
                    </div>
                    <div style={{
                      flex: 1, background: 'var(--surf2)',
                      borderRadius: '10px', padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                        {exerciseHistory.data.length}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                        sets totales
                      </div>
                    </div>
                  </div>

                  {sessionAvgs.length > 1 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{
                        fontSize: '10px', color: 'var(--muted)',
                        textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px'
                      }}>
                        Tendencia (reps promedio por sesión)
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'flex-end', gap: '4px',
                        height: '48px'
                      }}>
                        {[...sessionAvgs].reverse().map((avg, i) => {
                          const maxAvg = Math.max(...sessionAvgs)
                          const barH = maxAvg > 0 ? (avg / maxAvg) * 44 : 4
                          const isLatest = i === sessionAvgs.length - 1
                          return (
                            <div key={i} style={{
                              flex: 1, display: 'flex',
                              flexDirection: 'column', alignItems: 'center', gap: '2px'
                            }}>
                              <div style={{
                                width: '100%', height: `${barH}px`,
                                background: isLatest ? 'var(--fit)' : 'var(--surf3)',
                                borderRadius: '3px 3px 0 0',
                                minHeight: '4px'
                              }} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{
                    fontSize: '10px', color: 'var(--muted)',
                    textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px'
                  }}>
                    Por sesión
                  </div>
                  {dates.map(date => {
                    const sets = byDate[date]
                    const reps = sets.filter(r => r.reps != null).map(r => r.reps)
                    const total = reps.reduce((a, b) => a + b, 0)
                    const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short'
                    })
                    return (
                      <div key={date} style={{
                        padding: '10px 0',
                        borderBottom: '0.5px solid var(--border)'
                      }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>
                            {displayDate}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            {total > 0 ? `${total} reps totales` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {sets.map((s, i) => (
                            <div key={i} style={{
                              background: 'var(--surf3)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              color: s.reps != null ? 'var(--fit)' : 'var(--muted)',
                              fontWeight: 500
                            }}>
                              {s.reps != null ? `${s.reps} reps` : 'hecho'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
              )
            })()}

            <button onClick={() => setExerciseHistory(null)} style={{
              width: '100%', background: 'none',
              border: '0.5px solid var(--border)',
              borderRadius: '10px', color: 'var(--muted)',
              fontSize: '13px', padding: '12px',
              cursor: 'pointer', marginTop: '16px'
            }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
