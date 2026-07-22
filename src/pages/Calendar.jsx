import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

const DISTRICT_COLORS = {
  fitness: '#C17F3A',
  work: '#4A7C8E',
  reading: '#8B6F47',
  learning: '#6B8E6B',
  social: '#B5724A',
  health: '#7A9E7E',
  savings: '#D4A843',
  journal: '#8B7355',
  general: '#D8C9A3',
  other: '#D8C9A3',
}

const DISTRICT_LABELS = {
  fitness: 'Fitness', work: 'Work', reading: 'Reading',
  learning: 'Learning', social: 'Social', health: 'Healthcare',
  savings: 'Savings', journal: 'Journal', other: 'Other'
}

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function getCalendarDays(month) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const firstDay = new Date(year, m, 1)
  const lastDay = new Date(year, m + 1, 0)
  // Start from Monday
  let startPad = firstDay.getDay() - 1
  if (startPad < 0) startPad = 6
  const days = []
  // padding days from previous month
  for (let i = startPad; i > 0; i--) {
    const d = new Date(year, m, 1 - i)
    days.push({ date: d, currentMonth: false })
  }
  // days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, m, i), currentMonth: true })
  }
  // padding days to complete last row
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, m + 1, i), currentMonth: false })
    }
  }
  return days
}

function EventForm({ data, setData, onSave, onCancel }) {
  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '14px', color: 'var(--text)' }}>
        {data.id ? 'Edit event' : 'Add event'}
      </div>
      <input placeholder="Title" value={data.title}
        onChange={e => setData(p => ({ ...p, title: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <input type="date" value={data.date}
          onChange={e => setData(p => ({ ...p, date: e.target.value }))}
          style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
        <input type="time" value={data.time || ''}
          onChange={e => setData(p => ({ ...p, time: e.target.value }))}
          style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
      </div>
      <select value={data.area}
        onChange={e => setData(p => ({ ...p, area: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }}>
        <option value="fitness">Fitness</option>
        <option value="work">Work</option>
        <option value="reading">Reading</option>
        <option value="learning">Learning</option>
        <option value="social">Social</option>
        <option value="health">Healthcare</option>
        <option value="savings">Savings</option>
        <option value="journal">Journal</option>
        <option value="other">Other</option>
      </select>
      <input placeholder="Notes (optional)" value={data.notes || ''}
        onChange={e => setData(p => ({ ...p, notes: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '12px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave}
          style={{ flex: 1, background: 'var(--acc)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '11px', cursor: 'pointer', fontWeight: 500 }}>
          Save
        </button>
        <button onClick={onCancel}
          style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--muted)', fontSize: '13px', padding: '11px 16px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [routines, setRoutines] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', area: 'fitness', notes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: eventsData }, { data: routinesData }] = await Promise.all([
      supabase.from('calendar_events').select('*').order('date'),
      supabase.from('routines').select('*').eq('active', true)
    ])
    setEvents(eventsData || [])
    setRoutines(routinesData || [])
    setLoading(false)
  }

  function getDotsForDate(dateStr) {
    const dots = []
    // Events on this date
    events.filter(e => e.date === dateStr).forEach(e => {
      dots.push({ color: DISTRICT_COLORS[e.area] || DISTRICT_COLORS.general, id: e.id })
    })
    // Routines scheduled on this day of week
    const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()
    routines.filter(r => {
      const days = r.days_of_week.split(',').map(Number)
      return days.includes(dayOfWeek)
    }).forEach(r => {
      dots.push({ color: DISTRICT_COLORS[r.area] || DISTRICT_COLORS.general, id: r.id })
    })
    return dots.slice(0, 4) // max 4 dots per day
  }

  function getDaySchedule(dateStr) {
    const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()
    const dayRoutines = routines.filter(r => {
      const days = r.days_of_week.split(',').map(Number)
      return days.includes(dayOfWeek)
    })
    const dayEvents = events.filter(e => e.date === dateStr)
    return { routines: dayRoutines, events: dayEvents }
  }

  function prevMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  async function addEvent() {
    if (!newEvent.title.trim() || !newEvent.date) return
    const payload = {
      title: newEvent.title.trim(),
      date: newEvent.date,
      time: newEvent.time || null,
      area: newEvent.area || 'other',
      notes: newEvent.notes || null
    }
    const { data } = await supabase.from('calendar_events')
      .insert(payload).select().single()
    if (data) setEvents(prev => [...prev, data])
    setNewEvent({ title: '', date: selectedDay || '', time: '', area: 'fitness', notes: '' })
    setShowAddEvent(false)
  }

  async function saveEvent() {
    if (!editEvent) return
    const payload = {
      title: editEvent.title,
      date: editEvent.date,
      time: editEvent.time || null,
      area: editEvent.area || 'other',
      notes: editEvent.notes || null
    }
    await supabase.from('calendar_events').update(payload).eq('id', editEvent.id)
    setEvents(prev => prev.map(e => e.id === editEvent.id ? { ...e, ...payload } : e))
    setEditEvent(null)
  }

  async function deleteEvent(id) {
    await supabase.from('calendar_events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div style={{ paddingBottom: '24px' }}>
      <div style={{ padding: '16px', paddingBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '16px', cursor: 'pointer', padding: '4px 8px' }}>←</button>
          <div style={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Georgia', color: 'var(--text)' }}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '16px', cursor: 'pointer', padding: '4px 8px' }}>→</button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--muted)', padding: '4px 0', fontFamily: '-apple-system, sans-serif' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
          {getCalendarDays(currentMonth).map((day, i) => {
            const dateStr = day.date.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
            const isToday = dateStr === today()
            const isSelected = dateStr === selectedDay
            const dots = getDotsForDate(dateStr)
            return (
              <div key={i} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                style={{
                  minHeight: '44px', padding: '4px 2px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', cursor: 'pointer',
                  background: isSelected ? 'var(--surf2)' : 'transparent',
                  borderRadius: '4px',
                  opacity: day.currentMonth ? 1 : 0.25,
                }}>
                {/* Day number */}
                <div style={{
                  width: '24px', height: '24px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? 'var(--acc)' : 'transparent',
                  fontSize: '12px',
                  fontWeight: isToday ? 600 : 400,
                  color: isToday ? '#fff' : 'var(--text)',
                  marginBottom: '3px'
                }}>
                  {day.date.getDate()}
                </div>
                {/* Dots */}
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', minHeight: '8px' }}>
                  {dots.map((dot, di) => (
                    <div key={di} style={{
                      width: '5px', height: '5px',
                      borderRadius: '50%',
                      background: dot.color,
                      flexShrink: 0
                    }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {loading && (
        <div style={{ padding: '16px', color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>Loading...</div>
      )}

      {selectedDay && (
        <div style={{
          margin: '12px 16px 0', padding: '14px',
          background: 'var(--surf)', border: '0.5px solid var(--border)',
          borderRadius: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', fontFamily: 'Georgia' }}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <button onClick={() => { setShowAddEvent(true); setNewEvent(p => ({ ...p, date: selectedDay })) }}
              style={{ background: 'var(--acc)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '5px 10px', cursor: 'pointer' }}>
              + Add
            </button>
          </div>

          {/* Routines that day */}
          {getDaySchedule(selectedDay).routines.length > 0 && (
            <>
              <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '6px' }}>
                Scheduled
              </div>
              {getDaySchedule(selectedDay).routines.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 0', borderBottom: '0.5px solid var(--border)',
                  opacity: 0.8
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DISTRICT_COLORS[r.area] || DISTRICT_COLORS.general, flexShrink: 0 }} />
                  <div style={{ fontSize: '12px', color: 'var(--text)' }}>{r.title}</div>
                  <div style={{ fontSize: '10px', color: DISTRICT_COLORS[r.area], marginLeft: 'auto', textTransform: 'capitalize' }}>{r.area}</div>
                </div>
              ))}
            </>
          )}

          {/* Manual events that day */}
          {getDaySchedule(selectedDay).events.length > 0 && (
            <>
              <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '10px 0 6px' }}>
                Events
              </div>
              {getDaySchedule(selectedDay).events.map(ev => (
                <div key={ev.id}>
                  {editEvent?.id === ev.id ? (
                    <EventForm data={editEvent} setData={setEditEvent}
                      onSave={saveEvent} onCancel={() => setEditEvent(null)} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DISTRICT_COLORS[ev.area] || DISTRICT_COLORS.general, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>
                          {ev.title}
                        </div>
                        {ev.time && <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                          {ev.time}
                        </div>}
                        {ev.notes && <div style={{ fontSize: '10px', color: 'var(--muted2)', fontStyle: 'italic' }}>{ev.notes}</div>}
                      </div>
                      <div style={{ fontSize: '10px', color: DISTRICT_COLORS[ev.area] }}>
                        {DISTRICT_LABELS[ev.area]}
                      </div>
                      <button onClick={() => setEditEvent({ ...ev })}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '10px' }}>
                        Edit
                      </button>
                      <button onClick={() => deleteEvent(ev.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}>
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {getDaySchedule(selectedDay).routines.length === 0 &&
           getDaySchedule(selectedDay).events.length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
              Nothing scheduled
            </div>
          )}
        </div>
      )}

      {showAddEvent && (
        <div onClick={() => setShowAddEvent(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surf)', borderRadius: '14px 14px 0 0', padding: '20px 18px 40px', width: '100%' }}>
            <EventForm data={newEvent} setData={setNewEvent}
              onSave={addEvent} onCancel={() => setShowAddEvent(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
