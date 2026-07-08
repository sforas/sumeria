import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function calcDuration(sleep, wake) {
  if (!sleep || !wake) return null
  const [sh, sm] = sleep.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  let mins = (wh * 60 + wm) - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return { total: mins, label: `${h}h ${m}m` }
}

function isAlternateDay(startDate) {
  if (!startDate) return true
  const start = new Date(startDate)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return diff % 2 === 0
}

export default function Healthcare() {
  const [view, setView] = useState('day')
  const [medicines, setMedicines] = useState([])
  const [medLog, setMedLog] = useState({})
  const [sleepLog, setSleepLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMed, setShowAddMed] = useState(false)
  const [showLogSleep, setShowLogSleep] = useState(false)
  const [editMed, setEditMed] = useState(null)
  const [editSleep, setEditSleep] = useState(null)
  const [newMed, setNewMed] = useState({ name: '', dose: '', time: '', with_food: false, frequency: 'daily', alternate_start: '', notify_before_min: 15 })
  const [newSleep, setNewSleep] = useState({ sleep_time: '', wake_time: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: meds }, { data: log }, { data: sleep }] = await Promise.all([
      supabase.from('medicines').select('*').order('time'),
      supabase.from('med_log').select('*').eq('date', today()),
      supabase.from('sleep_log').select('*').order('date', { ascending: false }).limit(14)
    ])
    setMedicines(meds || [])
    const logMap = {}
    ;(log || []).forEach(l => { logMap[l.medicine_id] = l.taken })
    setMedLog(logMap)
    setSleepLog(sleep || [])
    setLoading(false)
  }

  async function toggleMed(med) {
    const current = medLog[med.id]
    const existing = await supabase.from('med_log').select('*').eq('medicine_id', med.id).eq('date', today()).single()
    if (existing.data) {
      await supabase.from('med_log').update({ taken: !current }).eq('id', existing.data.id)
    } else {
      await supabase.from('med_log').insert({ medicine_id: med.id, date: today(), taken: true })
    }
    setMedLog({ ...medLog, [med.id]: !current })
    if (!current) await supabase.from('xp_log').insert({ amount: 10, reason: 'Medicine taken', date: today() })
  }

  async function addMedicine() {
    if (!newMed.name.trim()) return
    const payload = {
      name: newMed.name, dose: newMed.dose, time: newMed.time,
      with_food: newMed.with_food, frequency: newMed.frequency,
      notify_before_min: parseInt(newMed.notify_before_min) || 15,
      alternate_start: newMed.frequency === 'alternate' && newMed.alternate_start ? newMed.alternate_start : null
    }
    const { data } = await supabase.from('medicines').insert(payload).select().single()
    if (data) setMedicines(prev => [...prev, data].sort((a, b) => a.time?.localeCompare(b.time)))
    setNewMed({ name: '', dose: '', time: '', with_food: false, frequency: 'daily', alternate_start: '', notify_before_min: 15 })
    setShowAddMed(false)
  }

  async function saveMedicine() {
    if (!editMed?.name.trim()) return
    const payload = {
      name: editMed.name, dose: editMed.dose, time: editMed.time,
      with_food: editMed.with_food, frequency: editMed.frequency,
      notify_before_min: parseInt(editMed.notify_before_min) || 15,
      alternate_start: editMed.frequency === 'alternate' && editMed.alternate_start ? editMed.alternate_start : null
    }
    await supabase.from('medicines').update(payload).eq('id', editMed.id)
    setMedicines(prev => prev.map(m => m.id === editMed.id ? { ...m, ...payload } : m))
    setEditMed(null)
  }

  async function deleteMedicine(id) {
    await supabase.from('medicines').delete().eq('id', id)
    setMedicines(medicines.filter(m => m.id !== id))
  }

  async function logSleep() {
    if (!newSleep.sleep_time || !newSleep.wake_time) return
    const dur = calcDuration(newSleep.sleep_time, newSleep.wake_time)
    const hours = Math.floor(dur.total / 60)
    const mins = dur.total % 60
    const durationTime = `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`
    const { data } = await supabase.from('sleep_log').insert({
      sleep_time: newSleep.sleep_time, wake_time: newSleep.wake_time,
      duration: durationTime, date: today()
    }).select().single()
    if (data) setSleepLog([data, ...sleepLog])
    setNewSleep({ sleep_time: '', wake_time: '' })
    setShowLogSleep(false)
    if (dur && dur.total >= 420) await supabase.from('xp_log').insert({ amount: 30, reason: "Good night's sleep", date: today() })
  }

  async function saveSleep() {
    if (!editSleep) return
    const dur = calcDuration(editSleep.sleep_time, editSleep.wake_time)
    const hours = Math.floor(dur.total / 60)
    const mins = dur.total % 60
    const durationTime = `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`
    await supabase.from('sleep_log').update({
      sleep_time: editSleep.sleep_time, wake_time: editSleep.wake_time, duration: durationTime
    }).eq('id', editSleep.id)
    setSleepLog(prev => prev.map(s => s.id === editSleep.id ? { ...s, sleep_time: editSleep.sleep_time, wake_time: editSleep.wake_time, duration: durationTime } : s))
    setEditSleep(null)
  }

  async function deleteSleep(id) {
    await supabase.from('sleep_log').delete().eq('id', id)
    setSleepLog(sleepLog.filter(s => s.id !== id))
  }

  const todayMeds = medicines.filter(med => {
    if (med.frequency === 'daily') return true
    if (med.frequency === 'alternate') return isAlternateDay(med.alternate_start)
    return true
  })

  const takenCount = todayMeds.filter(m => medLog[m.id]).length
  const lastSleep = sleepLog[0]
  const views = ['day', 'week']

  const weekSleep = sleepLog.slice(0, 7)
  const avgSleepMins = weekSleep.length > 0
    ? weekSleep.reduce((sum, s) => {
        const dur = calcDuration(s.sleep_time, s.wake_time)
        return sum + (dur?.total || 0)
      }, 0) / weekSleep.length
    : 0

  function MedForm({ data, setData, onSave, onCancel, title }) {
    return (
      <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px', marginBottom: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>{title}</div>
        <input placeholder="Medicine name" value={data.name}
          onChange={e => setData(p => ({ ...p, name: e.target.value }))}
          style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
        <input placeholder="Dose (e.g. 1 tablet)" value={data.dose}
          onChange={e => setData(p => ({ ...p, dose: e.target.value }))}
          style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Time</div>
            <input type="time" value={data.time} onChange={e => setData(p => ({ ...p, time: e.target.value }))}
              style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Notify before (min)</div>
            <input type="number" value={data.notify_before_min} onChange={e => setData(p => ({ ...p, notify_before_min: e.target.value }))}
              style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Frequency</div>
          <select value={data.frequency} onChange={e => setData(p => ({ ...p, frequency: e.target.value }))}
            style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }}>
            <option value="daily">Every day</option>
            <option value="alternate">Every other day</option>
          </select>
        </div>
        {data.frequency === 'alternate' && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>First day taken</div>
            <input type="date" value={data.alternate_start || ''} onChange={e => setData(p => ({ ...p, alternate_start: e.target.value }))}
              style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <input type="checkbox" id="wf" checked={data.with_food} onChange={e => setData(p => ({ ...p, with_food: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
          <label htmlFor="wf" style={{ fontSize: '13px', cursor: 'pointer' }}>Take with food</label>
        </div>
        <div style={{ display: 'flex', gap: '7px' }}>
          <button onClick={onSave} style={{ flex: 1, background: 'var(--health)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
          <button onClick={onCancel} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    )
  }

  function SleepForm({ data, setData, onSave, onCancel, title }) {
    return (
      <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px', marginTop: '6px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>{title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Went to sleep</div>
            <input type="time" value={data.sleep_time} onChange={e => setData(p => ({ ...p, sleep_time: e.target.value }))}
              style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Woke up</div>
            <input type="time" value={data.wake_time} onChange={e => setData(p => ({ ...p, wake_time: e.target.value }))}
              style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
          </div>
        </div>
        {data.sleep_time && data.wake_time && (
          <div style={{ fontSize: '13px', color: 'var(--fit)', marginBottom: '10px', textAlign: 'center' }}>
            Duration: {calcDuration(data.sleep_time, data.wake_time)?.label}
          </div>
        )}
        <div style={{ display: 'flex', gap: '7px' }}>
          <button onClick={onSave} style={{ flex: 1, background: 'var(--health)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
          <button onClick={onCancel} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--health)' }}>Healthcare</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Medicines · Sleep · Wellbeing</div>
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {views.map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? 'var(--surf3)' : 'none', border: '0.5px solid var(--border)',
              borderColor: view === v ? 'var(--surf3)' : 'var(--border)', borderRadius: '5px',
              color: view === v ? 'var(--text)' : 'var(--muted)', padding: '4px 7px', fontSize: '10px', cursor: 'pointer'
            }}>{v.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {view === 'day' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>Medicines today</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: takenCount === todayMeds.length && todayMeds.length > 0 ? 'var(--fit)' : 'var(--health)' }}>{takenCount}/{todayMeds.length}</div>
              <div style={{ height: '3px', background: 'var(--surf3)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${todayMeds.length > 0 ? takenCount / todayMeds.length * 100 : 0}%`, height: '100%', background: 'var(--health)', borderRadius: '2px' }} />
              </div>
            </div>
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>Last night</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--fit)' }}>
                {lastSleep ? calcDuration(lastSleep.sleep_time, lastSleep.wake_time)?.label || '—' : '—'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px' }}>
                {lastSleep ? `${lastSleep.sleep_time} → ${lastSleep.wake_time}` : 'Not logged'}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
            Medicines
          </div>

          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && medicines.length === 0 && (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>No medicines added yet</div>
          )}

          {medicines.map(med => (
            <div key={med.id}>
              {editMed?.id === med.id ? (
                <MedForm data={editMed} setData={setEditMed} onSave={saveMedicine} onCancel={() => setEditMed(null)} title="Edit medicine" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', marginBottom: '6px', opacity: medLog[med.id] ? 0.6 : 1 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: '#160610', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>💊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>
                      {med.name}
                      {med.frequency === 'alternate' && <span style={{ fontSize: '10px', color: 'var(--acc)', marginLeft: '6px' }}>every other day</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{med.dose} · {med.time}{med.with_food ? ' · with food' : ''}</div>
                  </div>
                  <button onClick={() => setEditMed({ ...med })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px', padding: '4px' }}>✏️</button>
                  <div onClick={() => toggleMed(med)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: medLog[med.id] ? 'none' : '1.5px solid var(--border)', background: medLog[med.id] ? 'var(--health)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', color: '#fff', flexShrink: 0 }}>
                    {medLog[med.id] ? '✓' : ''}
                  </div>
                  <button onClick={() => deleteMedicine(med.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px', padding: '0' }}>×</button>
                </div>
              )}
            </div>
          ))}

          {showAddMed ? (
            <MedForm data={newMed} setData={setNewMed} onSave={addMedicine} onCancel={() => setShowAddMed(false)} title="Add medicine" />
          ) : (
            <button onClick={() => setShowAddMed(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginBottom: '14px' }}>
              + Add medicine
            </button>
          )}

          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Sleep log</div>

          {sleepLog.slice(0, 7).map(s => {
            const dur = calcDuration(s.sleep_time, s.wake_time)
            return (
              <div key={s.id}>
                {editSleep?.id === s.id ? (
                  <SleepForm data={editSleep} setData={setEditSleep} onSave={saveSleep} onCancel={() => setEditSleep(null)} title="Edit sleep" />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', minWidth: '70px' }}>{s.date}</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted2)' }}>{s.sleep_time} → {s.wake_time}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: dur && dur.total >= 420 ? 'var(--fit)' : 'var(--xp)' }}>{dur?.label || '—'}</span>
                    <button onClick={() => setEditSleep({ ...s })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                    <button onClick={() => deleteSleep(s.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  </div>
                )}
              </div>
            )
          })}

          {showLogSleep ? (
            <SleepForm data={newSleep} setData={setNewSleep} onSave={logSleep} onCancel={() => setShowLogSleep(false)} title="Log sleep" />
          ) : (
            <button onClick={() => setShowLogSleep(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>
              + Log sleep
            </button>
          )}
        </>
      )}

      {view === 'week' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Avg sleep', value: avgSleepMins > 0 ? `${Math.floor(avgSleepMins/60)}h ${Math.round(avgSleepMins%60)}m` : '—', color: avgSleepMins >= 420 ? 'var(--fit)' : 'var(--xp)' },
              { label: 'Nights logged', value: weekSleep.length, color: 'var(--text)' },
              { label: 'Medicines', value: medicines.length, color: 'var(--health)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 500, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Sleep this week</div>
          {weekSleep.map(s => {
            const dur = calcDuration(s.sleep_time, s.wake_time)
            return (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '7px', marginBottom: '5px' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)', minWidth: '70px' }}>{s.date}</span>
                <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>{s.sleep_time} → {s.wake_time}</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: dur && dur.total >= 420 ? 'var(--fit)' : 'var(--xp)' }}>{dur?.label || '—'}</span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}