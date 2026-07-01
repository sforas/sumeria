import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function Learning() {
  const [view, setView] = useState('day')
  const [courses, setCourses] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showLogSession, setShowLogSession] = useState(null)
  const [newCourse, setNewCourse] = useState({ title: '', platform: '', total_modules: '' })
  const [newSession, setNewSession] = useState({ minutes: '', module_number: '', notes: '' })

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
      ...newCourse,
      total_modules: parseInt(newCourse.total_modules) || 0,
      modules_done: 0,
      status: 'active'
    }).select().single()
    if (data) setCourses([data, ...courses])
    setNewCourse({ title: '', platform: '', total_modules: '' })
    setShowAddCourse(false)
  }

  async function logSession(course) {
    if (!newSession.minutes) return
    const moduleNum = parseInt(newSession.module_number) || 0
    const { data: sessionData } = await supabase.from('study_sessions').insert({
      course_id: course.id,
      minutes: parseInt(newSession.minutes),
      module_number: moduleNum,
      notes: newSession.notes,
      date: today()
    }).select().single()

    if (sessionData) setSessions([sessionData, ...sessions])

    if (moduleNum > (course.modules_done || 0)) {
      const { data: updatedCourse } = await supabase
        .from('courses')
        .update({ modules_done: moduleNum })
        .eq('id', course.id)
        .select().single()
      if (updatedCourse) setCourses(courses.map(c => c.id === course.id ? updatedCourse : c))
    }

    await supabase.from('xp_log').insert({
      amount: Math.round(parseInt(newSession.minutes) / 10) * 10,
      reason: 'Study session logged',
      date: today()
    })

    setNewSession({ minutes: '', module_number: '', notes: '' })
    setShowLogSession(null)
  }

  async function deleteCourse(id) {
    await supabase.from('courses').delete().eq('id', id)
    setCourses(courses.filter(c => c.id !== id))
  }

  async function updateCourseStatus(id, status) {
    await supabase.from('courses').update({ status }).eq('id', id)
    setCourses(courses.map(c => c.id === id ? { ...c, status } : c))
  }

  const active = courses.filter(c => c.status === 'active')
  const finished = courses.filter(c => c.status === 'finished')
  const paused = courses.filter(c => c.status === 'paused')

  const weekSessions = sessions.filter(s => {
    const d = new Date(s.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  })
  const weekMinutes = weekSessions.reduce((sum, s) => sum + (s.minutes || 0), 0)
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0)

  const views = ['day', 'week', 'month', 'ytd']

  function CourseCard({ course }) {
    const pct = course.total_modules > 0
      ? Math.round((course.modules_done || 0) / course.total_modules * 100)
      : 0

    return (
      <div style={{
        background: 'var(--surf)', border: '0.5px solid var(--border)',
        borderRadius: '10px', padding: '12px 13px', marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{course.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
              {course.platform} · Module {course.modules_done || 0}/{course.total_modules}
            </div>
          </div>
          <button onClick={() => deleteCourse(course.id)} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: '16px', padding: '0', marginLeft: '8px'
          }}>×</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted2)', marginBottom: '4px' }}>
          <span>{pct}% complete</span>
        </div>
        <div style={{ height: '3px', background: 'var(--surf3)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--learn)', borderRadius: '2px', transition: 'width .3s' }} />
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          {['active', 'paused', 'finished'].map(s => (
            <button key={s} onClick={() => updateCourseStatus(course.id, s)} style={{
              padding: '2px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer',
              border: '0.5px solid var(--border)',
              background: course.status === s ? 'var(--learn)' : 'var(--surf3)',
              color: course.status === s ? '#fff' : 'var(--muted)',
              fontWeight: course.status === s ? 500 : 400,
              textTransform: 'capitalize'
            }}>{s}</button>
          ))}
        </div>

        {showLogSession === course.id ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '7px' }}>
              <input
              placeholder="Minutes studied"
              type="number"
              value={newSession.minutes}
              onChange={e => setNewSession({ ...newSession, minutes: e.target.value })}
              style={{
                background: 'var(--surf3)', border: '0.5px solid var(--border)',
                borderRadius: '7px', color: 'var(--text)', fontSize: '12px',
                padding: '8px 10px', outline: 'none', width: '100%'
                }}
              />
              <input
              placeholder="Current module #"
              type="number"
              inputMode="numeric"
              value={newSession.module_number}
              onChange={e => setNewSession({ ...newSession, module_number: e.target.value })}
              style={{
                background: 'var(--surf3)', border: '0.5px solid var(--border)',
                borderRadius: '7px', color: 'var(--text)', fontSize: '12px',
                padding: '8px 10px', outline: 'none', width: '100%'
                }}
              />
            </div>
            <input
              placeholder="Notes (optional)"
              value={newSession.notes}
              onChange={e => setNewSession({ ...newSession, notes: e.target.value })}
              style={{
                width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                borderRadius: '7px', color: 'var(--text)', fontSize: '12px',
                padding: '8px 10px', outline: 'none', marginBottom: '7px'
              }}
            />
            <div style={{ display: 'flex', gap: '7px' }}>
              <button onClick={() => logSession(course)} style={{
                flex: 1, background: 'var(--learn)', border: 'none', borderRadius: '7px',
                color: '#fff', fontSize: '12px', padding: '8px', cursor: 'pointer', fontWeight: 500
              }}>Save</button>
              <button onClick={() => setShowLogSession(null)} style={{
                background: 'var(--surf3)', border: '0.5px solid var(--border)',
                borderRadius: '7px', color: 'var(--muted)', fontSize: '12px',
                padding: '8px 12px', cursor: 'pointer'
              }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowLogSession(course.id)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            width: '100%', padding: '7px', background: 'none',
            border: '0.5px dashed var(--border)', borderRadius: '7px',
            color: 'var(--muted)', cursor: 'pointer', fontSize: '11px'
          }}>+ Log study session</button>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--learn)' }}>Learning</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Courses · Modules · Progress</div>
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
          {active.length > 0 && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
                Active courses
              </div>
              {active.map(c => <CourseCard key={c.id} course={c} />)}
            </>
          )}

          {paused.length > 0 && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '12px 0 8px' }}>
                Paused
              </div>
              {paused.map(c => <CourseCard key={c.id} course={c} />)}
            </>
          )}

          {finished.length > 0 && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '12px 0 8px' }}>
                Finished
              </div>
              {finished.map(c => (
                <div key={c.id} style={{
                  display: 'flex', gap: '10px', padding: '10px 12px',
                  background: 'var(--surf)', border: '0.5px solid var(--border)',
                  borderRadius: '8px', marginBottom: '6px', opacity: 0.7
                }}>
                  <div style={{ fontSize: '18px' }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{c.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{c.platform} · {c.total_modules} modules</div>
                  </div>
                  <button onClick={() => deleteCourse(c.id)} style={{
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px'
                  }}>×</button>
                </div>
              ))}
            </>
          )}

          {!loading && courses.length === 0 && (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '16px', textAlign: 'center',
              color: 'var(--muted)', fontSize: '13px', marginBottom: '8px'
            }}>No courses yet</div>
          )}

          {showAddCourse ? (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '13px', marginTop: '6px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Add course</div>
              <input
                autoFocus
                placeholder="Course title"
                value={newCourse.title}
                onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              />
              <input
                placeholder="Platform (Udemy, Coursera...)"
                value={newCourse.platform}
                onChange={e => setNewCourse({ ...newCourse, platform: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              />
              <input
                placeholder="Total modules"
                type="number"
                value={newCourse.total_modules}
                onChange={e => setNewCourse({ ...newCourse, total_modules: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', gap: '7px' }}>
                <button onClick={addCourse} style={{
                  flex: 1, background: 'var(--learn)', border: 'none', borderRadius: '7px',
                  color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500
                }}>Save</button>
                <button onClick={() => setShowAddCourse(false)} style={{
                  background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--muted)', fontSize: '13px',
                  padding: '9px 14px', cursor: 'pointer'
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddCourse(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              width: '100%', padding: '9px', background: 'none',
              border: '0.5px dashed var(--border)', borderRadius: '8px',
              color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px'
            }}>+ Add course</button>
          )}
        </>
      )}

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Sessions', value: weekSessions.length, color: 'var(--learn)' },
            { label: 'Hours studied', value: `${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m`, color: 'var(--text)' },
            { label: 'Active courses', value: active.length, color: 'var(--learn)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* MONTH VIEW */}
      {view === 'month' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Courses finished', value: finished.length, color: 'var(--fit)' },
            { label: 'Total hours', value: `${Math.floor(totalMinutes / 60)}h`, color: 'var(--learn)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* YTD VIEW */}
      {view === 'ytd' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Courses finished', value: finished.length, color: 'var(--fit)' },
            { label: 'Total hours', value: `${Math.floor(totalMinutes / 60)}h`, color: 'var(--learn)' },
            { label: 'Total sessions', value: sessions.length, color: 'var(--text)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}