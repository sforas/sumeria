import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function CourseForm({ data, setData, onSave, onCancel, title }) {
  return (
    <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px', marginBottom: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>{title}</div>
      <input placeholder="Course title" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
      <input placeholder="Platform (Udemy, Coursera...)" value={data.platform} onChange={e => setData(p => ({ ...p, platform: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
      <input placeholder="Total modules" type="number" value={data.total_modules} onChange={e => setData(p => ({ ...p, total_modules: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }} />
      <div style={{ display: 'flex', gap: '7px' }}>
        <button onClick={onSave} style={{ flex: 1, background: 'var(--learn)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
        <button onClick={onCancel} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

function CourseCard({ course, editCourse, setEditCourse, onSaveEdit, onDelete, onUpdateStatus, onStartSession }) {
  const pct = course.total_modules > 0 ? Math.round((course.modules_done || 0) / course.total_modules * 100) : 0
  return (
    <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '12px 13px', marginBottom: '8px' }}>
      {editCourse?.id === course.id ? (
        <CourseForm data={editCourse} setData={setEditCourse} onSave={onSaveEdit} onCancel={() => setEditCourse(null)} title="Edit course" />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{course.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{course.platform} · Module {course.modules_done || 0}/{course.total_modules}</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setEditCourse({ ...course })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '10px' }}>Edit</button>
              <button onClick={() => onDelete(course.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '4px' }}>{pct}% complete</div>
          <div style={{ height: '3px', background: 'var(--surf3)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--learn)', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            {['active', 'paused', 'finished'].map(s => (
              <button key={s} onClick={() => onUpdateStatus(course.id, s)} style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer',
                border: '0.5px solid var(--border)',
                background: course.status === s ? 'var(--learn)' : 'var(--surf3)',
                color: course.status === s ? '#fff' : 'var(--muted)',
                fontWeight: course.status === s ? 500 : 400, textTransform: 'capitalize'
              }}>{s}</button>
            ))}
          </div>
          <button onClick={() => onStartSession(course)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '7px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '7px', color: 'var(--muted)', cursor: 'pointer', fontSize: '11px' }}>
            + Log study session
          </button>
        </>
      )}
    </div>
  )
}

export default function Learning() {
  const [view, setView] = useState('day')
  const [courses, setCourses] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [newCourse, setNewCourse] = useState({ title: '', platform: '', total_modules: '' })
  const [sessionCourse, setSessionCourse] = useState(null)
  const [sessionData, setSessionData] = useState({ minutes: '', module_number: '', notes: '' })
  const [scheduleCourse, setScheduleCourse] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('courses').select('*').order('created_at', { ascending: false }),
      supabase.from('study_sessions').select('*').order('created_at', { ascending: false }).limit(50)
    ])
    setCourses(c || [])
    setSessions(s || [])
    setLoading(false)
  }

  async function addCourse() {
    if (!newCourse.title.trim()) return
    const { data } = await supabase.from('courses').insert({
      ...newCourse, total_modules: parseInt(newCourse.total_modules) || 0, modules_done: 0, status: 'active'
    }).select().single()
    if (data) {
      setCourses(prev => [data, ...prev])
      setScheduleCourse(data)
    }
    setNewCourse({ title: '', platform: '', total_modules: '' })
    setShowAddCourse(false)
  }

  async function addToSchedule(frequency) {
    if (!scheduleCourse) return
    const daysOfWeek = {
      daily: '0,1,2,3,4,5,6',
      weekdays: '1,2,3,4,5',
      alternate: '0,2,4,6'
    }[frequency]
    await supabase.from('routines').insert({
      title: scheduleCourse.title, area: 'learning',
      days_of_week: daysOfWeek, quick_log_type: 'learning', active: true
    })
    setScheduleCourse(null)
  }

  async function saveCourse() {
    if (!editCourse) return
    await supabase.from('courses').update({
      title: editCourse.title, platform: editCourse.platform,
      total_modules: parseInt(editCourse.total_modules) || 0
    }).eq('id', editCourse.id)
    setCourses(prev => prev.map(c => c.id === editCourse.id ? { ...c, ...editCourse, total_modules: parseInt(editCourse.total_modules) } : c))
    setEditCourse(null)
  }

  async function logSession() {
    if (!sessionData.minutes || !sessionCourse) return
    const moduleNum = parseInt(sessionData.module_number) || 0
    const { data: newSession } = await supabase.from('study_sessions').insert({
      course_id: sessionCourse.id, minutes: parseInt(sessionData.minutes),
      module_number: moduleNum, notes: sessionData.notes, date: today()
    }).select().single()
    if (newSession) setSessions(prev => [newSession, ...prev])
    if (moduleNum > (sessionCourse.modules_done || 0)) {
      const { data: updatedCourse } = await supabase.from('courses').update({ modules_done: moduleNum }).eq('id', sessionCourse.id).select().single()
      if (updatedCourse) setCourses(prev => prev.map(c => c.id === sessionCourse.id ? updatedCourse : c))
    }
    await supabase.from('xp_log').insert({ amount: Math.round(parseInt(sessionData.minutes) / 10) * 10, reason: 'Study session logged', date: today() })
    setSessionCourse(null)
    setSessionData({ minutes: '', module_number: '', notes: '' })
  }

  async function deleteCourse(id) {
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  async function updateCourseStatus(id, status) {
    await supabase.from('courses').update({ status }).eq('id', id)
    setCourses(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  const active = courses.filter(c => c.status === 'active')
  const finished = courses.filter(c => c.status === 'finished')
  const paused = courses.filter(c => c.status === 'paused')
  const weekSessions = sessions.filter(s => { const d = new Date(s.date); const w = new Date(); w.setDate(w.getDate()-7); return d >= w })
  const weekMinutes = weekSessions.reduce((sum, s) => sum + (s.minutes || 0), 0)
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0)
  const views = ['day', 'week', 'month', 'ytd']

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--learn)' }}>Learning</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Courses · Modules · Progress</div>
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
          {active.length > 0 && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Active courses</div>
              {active.map(c => (
                <CourseCard key={c.id} course={c} editCourse={editCourse} setEditCourse={setEditCourse}
                  onSaveEdit={saveCourse} onDelete={deleteCourse} onUpdateStatus={updateCourseStatus}
                  onStartSession={c => { setSessionCourse(c); setSessionData({ minutes: '', module_number: '', notes: '' }) }} />
              ))}
            </>
          )}
          {paused.length > 0 && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '12px 0 8px' }}>Paused</div>
              {paused.map(c => (
                <CourseCard key={c.id} course={c} editCourse={editCourse} setEditCourse={setEditCourse}
                  onSaveEdit={saveCourse} onDelete={deleteCourse} onUpdateStatus={updateCourseStatus}
                  onStartSession={c => { setSessionCourse(c); setSessionData({ minutes: '', module_number: '', notes: '' }) }} />
              ))}
            </>
          )}
          {finished.length > 0 && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '12px 0 8px' }}>Finished</div>
              {finished.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', marginBottom: '6px', opacity: 0.7 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--fit)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{c.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{c.platform} · {c.total_modules} modules</div>
                  </div>
                  <button onClick={() => setEditCourse({ ...c })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '10px' }}>Edit</button>
                  <button onClick={() => deleteCourse(c.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                </div>
              ))}
            </>
          )}
          {!loading && courses.length === 0 && (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>No courses yet</div>
          )}
          {showAddCourse ? (
            <CourseForm data={newCourse} setData={setNewCourse} onSave={addCourse} onCancel={() => setShowAddCourse(false)} title="Add course" />
          ) : (
            <button onClick={() => setShowAddCourse(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>+ Add course</button>
          )}
        </>
      )}

      {view === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Sessions', value: weekSessions.length, color: 'var(--learn)' },
            { label: 'Hours studied', value: `${Math.floor(weekMinutes/60)}h ${weekMinutes%60}m`, color: 'var(--text)' },
            { label: 'Active courses', value: active.length, color: 'var(--learn)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {view === 'month' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Courses finished', value: finished.length, color: 'var(--fit)' },
            { label: 'Total hours', value: `${Math.floor(totalMinutes/60)}h`, color: 'var(--learn)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {view === 'ytd' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Courses finished', value: finished.length, color: 'var(--fit)' },
            { label: 'Total hours', value: `${Math.floor(totalMinutes/60)}h`, color: 'var(--learn)' },
            { label: 'Total sessions', value: sessions.length, color: 'var(--text)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {sessionCourse && (
        <div onClick={() => setSessionCourse(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surf)', borderRadius: '14px 14px 0 0', padding: '20px 18px 36px', width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Log session</div>
            <div style={{ fontSize: '12px', color: 'var(--muted2)', marginBottom: '14px' }}>{sessionCourse.title}</div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Minutes studied</div>
              <input type="number" inputMode="numeric" placeholder="e.g. 45" value={sessionData.minutes}
                onChange={e => setSessionData(prev => ({ ...prev, minutes: e.target.value }))}
                style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '10px 12px', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Current module #</div>
              <input type="number" inputMode="numeric" placeholder="e.g. 5" value={sessionData.module_number}
                onChange={e => setSessionData(prev => ({ ...prev, module_number: e.target.value }))}
                style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '10px 12px', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Notes (optional)</div>
              <input placeholder="What did you cover?" value={sessionData.notes}
                onChange={e => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '10px 12px', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={logSession} style={{ flex: 1, background: 'var(--learn)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '11px', cursor: 'pointer', fontWeight: 500 }}>Save session</button>
              <button onClick={() => setSessionCourse(null)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--muted)', fontSize: '13px', padding: '11px 16px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {scheduleCourse && (
        <div onClick={() => setScheduleCourse(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surf)', borderRadius: '14px 14px 0 0', padding: '20px 18px 36px', width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Add this course to your daily Home schedule?</div>
            <div style={{ fontSize: '12px', color: 'var(--muted2)', marginBottom: '16px' }}>"{scheduleCourse.title}" will show up as a routine on Home, with the timer built in.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              <button onClick={() => addToSchedule('daily')} style={{ width: '100%', textAlign: 'left', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', padding: '11px 13px', cursor: 'pointer' }}>Every day</button>
              <button onClick={() => addToSchedule('weekdays')} style={{ width: '100%', textAlign: 'left', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', padding: '11px 13px', cursor: 'pointer' }}>Weekdays only (Mon–Fri)</button>
              <button onClick={() => addToSchedule('alternate')} style={{ width: '100%', textAlign: 'left', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', padding: '11px 13px', cursor: 'pointer' }}>Every other day</button>
            </div>
            <button onClick={() => setScheduleCourse(null)} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '13px', padding: '8px', cursor: 'pointer' }}>Skip</button>
          </div>
        </div>
      )}
    </div>
  )
}