import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Notifs } from '../lib/notifications'
import { FitnessSymbol, WorkSymbol, ReadingSymbol, LearningSymbol, SocialSymbol, HealthSymbol, SavingsSymbol } from '../components/icons/DistrictSymbols'
import { getWorkoutIcon } from '../components/icons/getWorkoutIcon'
import { useAtmosphere } from '../lib/useAtmosphere'
import { useDistrictScores } from '../lib/useDistrictScores'
import Skyline from '../components/Skyline'
import ZigguratPicker from '../components/ZigguratPicker'

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const AREA_COLORS = {
  fitness: 'var(--fit)', work: 'var(--work)', diet: 'var(--diet)',
  reading: 'var(--read)', learning: 'var(--learn)', social: 'var(--social)',
  health: 'var(--health)', savings: 'var(--savings)',
  other: 'var(--sand)', general: 'var(--sand)',
}

const AREA_ICONS = {
  fitness: FitnessSymbol, work: WorkSymbol, reading: ReadingSymbol,
  learning: LearningSymbol, social: SocialSymbol, health: HealthSymbol, savings: SavingsSymbol
}

const AREAS = [
  { id: 'fitness', label: 'Fitness', color: 'var(--fit)' },
  { id: 'work', label: 'Work', color: 'var(--work)' },
  { id: 'reading', label: 'Reading', color: 'var(--read)' },
  { id: 'learning', label: 'Learning', color: 'var(--learn)' },
  { id: 'diet', label: 'Diet', color: 'var(--diet)' },
  { id: 'social', label: 'Social', color: 'var(--social)' },
]

function formatElapsed(ms) {
  const mins = Math.floor(ms / 60000)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs}h ${mins % 60}m`
  return `${mins}m`
}

export default function Home() {
  useAtmosphere()
  const { scores } = useDistrictScores()

  const [goals, setGoals] = useState([])
  const [routineItems, setRoutineItems] = useState([])
  const [routineLog, setRoutineLog] = useState({})
  const [medicines, setMedicines] = useState([])
  const [medLog, setMedLog] = useState({})
  const [reminders, setReminders] = useState([])
  const [contactReminders, setContactReminders] = useState([])
  const [todayCalendarEvents, setTodayCalendarEvents] = useState([])
  const [activeTimers, setActiveTimers] = useState({})
  const [elapsed, setElapsed] = useState({})
  const [books, setBooks] = useState([])
  const [courses, setCourses] = useState([])
  const [journal, setJournal] = useState(null)
  const [mantra, setMantra] = useState('')
  const [editingMantra, setEditingMantra] = useState(false)
  const [mantraInput, setMantraInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [newGoal, setNewGoal] = useState('')
  const [newArea, setNewArea] = useState('fitness')
  const [showAdd, setShowAdd] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [modal, setModal] = useState(null)
  const [quickLog, setQuickLog] = useState({})
  const [routineExercises, setRoutineExercises] = useState([])
  const [workoutExercises, setWorkoutExercises] = useState([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [setReps, setSetReps] = useState('')
  const [completedSets, setCompletedSets] = useState({})
  const [restTimer, setRestTimer] = useState(0)
  const [restInterval, setRestInterval] = useState(null)
  const [restType, setRestType] = useState(null)
  const [workoutPhase, setWorkoutPhase] = useState('tracking')
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied')

  // Morning check states
  const [showEnergyCheck, setShowEnergyCheck] = useState(false)
  const [showPriorityCheck, setShowPriorityCheck] = useState(false)
  const [energyInput, setEnergyInput] = useState(0)
  const [priorityInput, setPriorityInput] = useState('')

  const dayOfWeek = new Date().getDay()
  const timerRef = useRef(null)
  const repsInputRef = useRef(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const updated = { ...prev }
        Object.keys(activeTimers).forEach(id => {
          if (activeTimers[id]) {
            updated[id] = Date.now() - new Date(activeTimers[id]).getTime()
          }
        })
        return updated
      })
    }, 10000)
    return () => clearInterval(timerRef.current)
  }, [activeTimers])

  async function fetchAll() {
    const [
      { data: goalsData },
      { data: routinesData },
      { data: routineLogData },
      { data: medsData },
      { data: medLogData },
      { data: remindersData },
      { data: contactRemindersData },
      { data: timersData },
      { data: booksData },
      { data: coursesData },
      { data: journalData },
      { data: mantraData },
      { data: calendarEventsData }
    ] = await Promise.all([
      supabase.from('goals').select('*').eq('date', today()).order('created_at'),
      supabase.from('routines').select('*').eq('active', true),
      supabase.from('routine_log').select('*').eq('date', today()),
      supabase.from('medicines').select('*').order('time'),
      supabase.from('med_log').select('*').eq('date', today()),
      supabase.from('reminders').select('*, contacts(name)').eq('remind_on', today()).eq('done', false),
      supabase.from('contact_reminders').select('*, contacts(name)').eq('remind_on', today()).eq('done', false),
      supabase.from('activity_timers').select('*').eq('date', today()).is('ended_at', null),
      supabase.from('books').select('*').eq('status', 'reading'),
      supabase.from('courses').select('*').eq('status', 'active'),
      supabase.from('daily_journal').select('*').eq('date', today()).single(),
      supabase.from('settings').select('*').eq('key', 'mantra').single(),
      supabase.from('calendar_events').select('*').eq('date', today()).order('time', { ascending: true, nullsFirst: false })
    ])

    const currentHour = new Date().getHours()
    const todayRoutines = (routinesData || []).filter(r => {
      const days = r.days_of_week.split(',').map(Number)
      if (!days.includes(dayOfWeek)) return false
      if (r.quick_log_type === 'reflection' && currentHour < 20) return false
      return true
    })
    setRoutineItems(todayRoutines)

    const rlogMap = {}
    ;(routineLogData || []).forEach(l => { rlogMap[l.routine_id] = { done: l.done, id: l.id } })
    setRoutineLog(rlogMap)

    setGoals(goalsData || [])

    const todayMeds = (medsData || []).filter(med => {
      if (med.frequency === 'daily') return true
      if (med.frequency === 'alternate' && med.alternate_start) {
        const diff = Math.floor((new Date() - new Date(med.alternate_start)) / 86400000)
        return diff % 2 === 0
      }
      return true
    })
    setMedicines(todayMeds)

    const mlogMap = {}
    ;(medLogData || []).forEach(l => { mlogMap[l.medicine_id] = l.taken })
    setMedLog(mlogMap)

    setReminders(remindersData || [])
    setContactReminders(contactRemindersData || [])
    setTodayCalendarEvents(calendarEventsData || [])
    setBooks(booksData || [])
    setCourses(coursesData || [])

    const j = journalData || null
    setJournal(j)
    setMantra(mantraData?.value || 'Build your city. Build yourself.')

    // Show morning checks if not done yet
    const todayKey = today()
    const energyDoneToday = localStorage.getItem(`sumeria_energy_${todayKey}`)
    const priorityDoneToday = localStorage.getItem(`sumeria_priority_${todayKey}`)
    const h = new Date().getHours()
    if (!j?.energy && !energyDoneToday && h < 14) {
      setShowEnergyCheck(true)
    } else if (!j?.priority && !priorityDoneToday && h < 14) {
      setShowPriorityCheck(true)
    }

    const timers = {}
    const elapsedInit = {}
    ;(timersData || []).forEach(t => {
      timers[t.routine_id] = t.started_at
      elapsedInit[t.routine_id] = Date.now() - new Date(t.started_at).getTime()
    })
    setActiveTimers(timers)
    setElapsed(elapsedInit)

    setLoading(false)
  }

  async function saveEnergy() {
    if (!energyInput) return
    const existing = await supabase.from('daily_journal').select('*').eq('date', today()).single()
    if (existing.data) {
      await supabase.from('daily_journal').update({ energy: energyInput }).eq('date', today())
      setJournal(prev => ({ ...prev, energy: energyInput }))
    } else {
      const { data } = await supabase.from('daily_journal').insert({ date: today(), energy: energyInput }).select().single()
      setJournal(data)
    }
    localStorage.setItem(`sumeria_energy_${today()}`, 'true')
    setShowEnergyCheck(false)
    if (!journal?.priority) setShowPriorityCheck(true)
  }

  async function savePriority() {
    if (!priorityInput.trim()) return
    const existing = await supabase.from('daily_journal').select('*').eq('date', today()).single()
    if (existing.data) {
      await supabase.from('daily_journal').update({ priority: priorityInput }).eq('date', today())
      setJournal(prev => ({ ...prev, priority: priorityInput }))
    } else {
      const { data } = await supabase.from('daily_journal').insert({ date: today(), priority: priorityInput }).select().single()
      setJournal(data)
    }
    localStorage.setItem(`sumeria_priority_${today()}`, 'true')
    setShowPriorityCheck(false)
  }

  function openRoutineModal(routine) {
    const isDone = routineLog[routine.id]?.done
    const isActive = !!activeTimers[routine.id]
    setModal({ routine, isActive, isDone })
    setQuickLog({})
    setRoutineExercises([])
    if (routine.quick_log_type === 'workout') {
      supabase.from('routine_exercises')
        .select('*')
        .eq('routine_id', routine.id)
        .order('order_index')
        .then(({ data }) => {
          setRoutineExercises(data || [])
          setWorkoutExercises(data || [])
          setCurrentExerciseIndex(0)
          setCurrentSetIndex(0)
          setCompletedSets({})
          setWorkoutPhase('tracking')
          setRestTimer(0)
          setSetReps('')
        })
    }
  }

  async function startTimer(routine) {
    const now = new Date().toISOString()
    await supabase.from('activity_timers').insert({
      type: routine.quick_log_type, area: routine.area,
      routine_id: routine.id, started_at: now, date: today()
    })
    setActiveTimers(prev => ({ ...prev, [routine.id]: now }))
    setElapsed(prev => ({ ...prev, [routine.id]: 0 }))
    setModal(null)
    resetWorkoutState()
  }

  async function finishTimer(routine) {
    const startedAt = activeTimers[routine.id]
    const durationMin = Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)
    await supabase.from('activity_timers')
      .update({ ended_at: new Date().toISOString(), duration_min: durationMin, notes: quickLog.notes || '' })
      .eq('routine_id', routine.id).eq('date', today()).is('ended_at', null)
    await completeRoutine(routine, { ...quickLog, duration_min: durationMin })
    setActiveTimers(prev => { const n = { ...prev }; delete n[routine.id]; return n })
    setElapsed(prev => { const n = { ...prev }; delete n[routine.id]; return n })
    setModal(null)
    resetWorkoutState()
    clearInterval(restInterval)
    setRestTimer(0)
    setRestInterval(null)
  }

  async function completeRoutine(routine, data = {}) {
    const type = routine.quick_log_type

    if (type === 'workout' && data.duration_min) {
      await supabase.from('workouts').insert({ type: routine.title, duration_min: data.duration_min, notes: data.notes || '', date: today() })
      await supabase.from('xp_log').insert({ amount: 80, reason: 'Workout completed', date: today() })
    }

    if (type === 'reading' && data.current_page && data.book_id) {
      const book = books.find(b => b.id === data.book_id)
      if (book) {
        const status = parseInt(data.current_page) >= book.total_pages ? 'finished' : 'reading'
        await supabase.from('books').update({ pages_read: parseInt(data.current_page), status }).eq('id', data.book_id)
      }
      await supabase.from('xp_log').insert({ amount: 15, reason: 'Pages logged', date: today() })
    }

    if (type === 'learning' && data.course_id) {
      await supabase.from('study_sessions').insert({
        course_id: data.course_id, minutes: data.duration_min || 0,
        module_number: parseInt(data.module_number) || 0, notes: data.notes || '', date: today()
      })
      if (data.module_number) {
        await supabase.from('courses').update({ modules_done: parseInt(data.module_number) }).eq('id', data.course_id)
      }
      await supabase.from('xp_log').insert({ amount: Math.round((data.duration_min || 30) / 10) * 10, reason: 'Study session', date: today() })
    }

    if (type === 'pr') {
      if (data.max_pushups) await supabase.from('personal_records').insert({ exercise: 'Push-ups', reps: parseInt(data.max_pushups), date: today() })
      if (data.max_pullups) await supabase.from('personal_records').insert({ exercise: 'Pull-ups', reps: parseInt(data.max_pullups), date: today() })
    }

    if (type === 'weigh' && data.kg) {
      await supabase.from('weight_log').insert({ kg: parseFloat(data.kg), date: today() })
    }

    if (type === 'hydration' && data.liters) {
      await supabase.from('meals').insert({ name: 'Hydration', meal_type: 'hydration', calories: 0, protein_g: 0, notes: `${data.liters}L water`, date: today() })
    }

    if (type === 'reflection') {
      const existing = await supabase.from('daily_journal').select('*').eq('date', today()).single()
      const payload = { mood: parseInt(data.mood) || null, gratitude: data.gratitude || '', win: data.win || '' }
      if (existing.data) {
        await supabase.from('daily_journal').update(payload).eq('date', today())
      } else {
        await supabase.from('daily_journal').insert({ ...payload, date: today() })
      }
      await supabase.from('xp_log').insert({ amount: 30, reason: 'Evening reflection', date: today() })
    }

    // Mark routine done
    const existing = routineLog[routine.id]
    if (existing?.id) {
      await supabase.from('routine_log').update({ done: true }).eq('id', existing.id)
    } else {
      await supabase.from('routine_log').insert({ routine_id: routine.id, date: today(), done: true })
    }
    setRoutineLog(prev => ({ ...prev, [routine.id]: { ...prev[routine.id], done: true } }))
    await supabase.from('xp_log').insert({ amount: 50, reason: `Routine: ${routine.title}`, date: today() })
    setModal(null)
    resetWorkoutState()
  }

  function getCurrentExercise() {
    return workoutExercises[currentExerciseIndex] || null
  }

  function getCompletedRepsForExercise(exId) {
    return completedSets[exId] || []
  }

  function isSessionExercise(ex) {
    return ex?.reps?.toLowerCase().includes('session')
  }

  function resetWorkoutState() {
    setWorkoutPhase('tracking')
    setCurrentExerciseIndex(0)
    setCurrentSetIndex(0)
    setCompletedSets({})
    setSetReps('')
    clearInterval(restInterval)
    setRestTimer(0)
    setRestInterval(null)
  }

  async function sendRestEndNotification() {
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          title: 'Rest complete',
          body: 'Time for your next set!'
        }
      })
    } catch {}
  }

  function startRestTimer(seconds, type) {
    clearInterval(restInterval)
    setRestType(type)
    setRestTimer(seconds)
    setWorkoutPhase('resting')
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setWorkoutPhase('tracking')
          setRestType(null)
          if (navigator.vibrate) navigator.vibrate([300, 100, 300])
          sendRestEndNotification()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setRestInterval(interval)
  }

  function handleSetComplete() {
    const ex = getCurrentExercise()
    if (!ex) return

    const reps = isSessionExercise(ex) ? 'done' : parseInt(setReps)
    if (!isSessionExercise(ex) && (!reps || reps < 1)) return

    // Save completed set
    const current = completedSets[ex.id] || []
    const updated = [...current, reps]
    const newCompleted = { ...completedSets, [ex.id]: updated }
    setCompletedSets(newCompleted)
    setSetReps('')

    const totalSets = parseInt(ex.sets) || 1
    const setsLeft = totalSets - updated.length

    if (setsLeft > 0) {
      // More sets of same exercise — short rest
      setCurrentSetIndex(prev => prev + 1)
      setWorkoutPhase('choosing-rest-sets')
    } else {
      // Exercise complete — move to next
      const nextIndex = currentExerciseIndex + 1
      if (nextIndex < workoutExercises.length) {
        setCurrentExerciseIndex(nextIndex)
        setCurrentSetIndex(0)
        setWorkoutPhase('choosing-rest-exercises')
      } else {
        // All exercises done — build the workout summary into quickLog.notes
        // so it flows through finishTimer (which only reads quickLog.notes).
        const notesSummary = workoutExercises.map(wex => {
          const done = newCompleted[wex.id] || []
          return `${wex.name}: ${done.join('·')}`
        }).join(' | ')
        setQuickLog(prev => ({ ...prev, notes: notesSummary }))
        setWorkoutPhase('complete')
      }
    }
  }

  async function toggleGoal(goal) {
    await supabase.from('goals').update({ done: !goal.done }).eq('id', goal.id)
    setGoals(goals.map(g => g.id === goal.id ? { ...g, done: !g.done } : g))
  }

  async function addGoal() {
    if (!newGoal.trim()) return
    const { data } = await supabase.from('goals').insert({ text: newGoal.trim(), area: newArea, done: false, date: today() }).select().single()
    if (data) setGoals(prev => [...prev, data])
    setNewGoal('')
    setShowAdd(false)
  }

  async function deleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(goals.filter(g => g.id !== id))
  }

  async function saveGoal() {
    if (!editGoal?.text.trim()) return
    await supabase.from('goals').update({ text: editGoal.text, area: editGoal.area }).eq('id', editGoal.id)
    setGoals(prev => prev.map(g => g.id === editGoal.id ? { ...g, text: editGoal.text, area: editGoal.area } : g))
    setEditGoal(null)
  }

  async function toggleMed(med) {
    const current = medLog[med.id]
    const existing = await supabase.from('med_log').select('*').eq('medicine_id', med.id).eq('date', today()).single()
    if (existing.data) {
      await supabase.from('med_log').update({ taken: !current }).eq('id', existing.data.id)
    } else {
      await supabase.from('med_log').insert({ medicine_id: med.id, date: today(), taken: true })
    }
    setMedLog(prev => ({ ...prev, [med.id]: !current }))
    if (!current) await supabase.from('xp_log').insert({ amount: 10, reason: 'Medicine taken', date: today() })
  }

  async function dismissReminder(id) {
    await supabase.from('reminders').update({ done: true }).eq('id', id)
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  async function completeContactReminder(id) {
    await supabase.from('contact_reminders').update({ done: true }).eq('id', id)
    setContactReminders(prev => prev.filter(r => r.id !== id))
  }

  async function dismissCalendarEvent(id) {
    await supabase.from('calendar_events').update({ done: true }).eq('id', id)
    setTodayCalendarEvents(prev =>
      prev.map(e => e.id === id ? { ...e, done: true } : e)
    )
  }

  async function enableNotifs() {
    await Notifs.enable()
    setNotifPerm(Notification.permission)
  }

  const routineDone = routineItems.filter(r => routineLog[r.id]?.done).length
  const goalsDone = goals.filter(g => g.done).length
  const medsDone = medicines.filter(m => medLog[m.id]).length

  const goalsByArea = AREAS.map(area => ({
    ...area, goals: goals.filter(g => g.area === area.id)
  })).filter(a => a.goals.length > 0)

  function renderModal() {
    if (!modal) return null
    const { routine, isActive, isDone } = modal
    const type = routine.quick_log_type
    const elapsedMs = elapsed[routine.id] || 0

    return (
      <div onClick={() => { setModal(null); resetWorkoutState() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surf)', borderRadius: '14px 14px 0 0', padding: '20px 18px 40px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>

          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '3px' }}>{routine.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginBottom: '18px', textTransform: 'capitalize' }}>{routine.area}</div>

          {isDone && !isActive && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--acc)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', color: 'var(--fit)', fontWeight: 500 }}>Completed!</div>
            </div>
          )}

          {/* TIMER RUNNING — WORKOUT: full set-by-set tracker */}
          {isActive && type === 'workout' && (
            <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>

              {/* Timer header — always visible */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '16px',
                paddingBottom: '12px', borderBottom: '0.5px solid var(--border)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                  {routine.title}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--fit)' }}>
                  {formatElapsed(elapsedMs)}
                </div>
              </div>

              {/* PHASE: tracking — current set input */}
              {workoutPhase === 'tracking' && getCurrentExercise() && (
                <div>
                  {/* Current exercise name */}
                  <div style={{
                    fontSize: '18px', fontWeight: 600,
                    color: 'var(--text)', marginBottom: '4px',
                    fontFamily: 'Georgia, serif'
                  }}>
                    {getCurrentExercise().name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--fit)', marginBottom: '20px' }}>
                    Set {currentSetIndex + 1} / {getCurrentExercise().sets}
                  </div>

                  {/* Reps input or session button */}
                  {isSessionExercise(getCurrentExercise()) ? (
                    <button onClick={handleSetComplete} style={{
                      width: '100%', background: 'var(--fit)', border: 'none',
                      borderRadius: '10px', color: '#000', fontSize: '15px',
                      padding: '16px', cursor: 'pointer', fontWeight: 600,
                      marginBottom: '16px'
                    }}>
                      Mark as done
                    </button>
                  ) : (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
                        Reps completed
                      </div>
                      <input
                        ref={repsInputRef}
                        type="number"
                        inputMode="numeric"
                        value={setReps}
                        onChange={e => setSetReps(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSetComplete()}
                        autoFocus
                        placeholder="0"
                        style={{
                          width: '100%', background: 'var(--surf3)',
                          border: '0.5px solid var(--fit)',
                          borderRadius: '10px', color: 'var(--fit)',
                          fontSize: '40px', fontWeight: 700,
                          padding: '16px', outline: 'none',
                          textAlign: 'center', marginBottom: '10px'
                        }}
                      />
                      <button onClick={handleSetComplete} style={{
                        width: '100%', background: 'var(--fit)', border: 'none',
                        borderRadius: '10px', color: '#000', fontSize: '15px',
                        padding: '14px', cursor: 'pointer', fontWeight: 600
                      }}>
                        Listo
                      </button>
                    </div>
                  )}

                  {/* Exercise list below */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{
                      fontSize: '9px', color: 'var(--muted)',
                      textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px'
                    }}>
                      Workout
                    </div>
                    {workoutExercises.map((ex, i) => {
                      const done = getCompletedRepsForExercise(ex.id)
                      const total = parseInt(ex.sets) || 1
                      const isCurrent = i === currentExerciseIndex
                      const isComplete = done.length >= total
                      return (
                        <div key={ex.id} style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', padding: '6px 0',
                          borderBottom: '0.5px solid var(--border)',
                          opacity: isComplete ? 0.5 : isCurrent ? 1 : 0.6
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '6px', height: '6px', borderRadius: '50%',
                              background: isComplete ? 'var(--fit)' : isCurrent ? 'var(--fit)' : 'var(--border)',
                              flexShrink: 0
                            }} />
                            <div style={{
                              fontSize: '12px',
                              color: isCurrent ? 'var(--text)' : 'var(--muted)',
                              fontWeight: isCurrent ? 500 : 400,
                              textDecoration: isComplete ? 'line-through' : 'none'
                            }}>
                              {ex.name}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                            {isComplete
                              ? done.join(' · ') + ' reps'
                              : `${ex.sets} × ${ex.reps}`
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* PHASE: choosing rest between sets */}
              {workoutPhase === 'choosing-rest-sets' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px' }}>
                    Set complete
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '20px' }}>
                    {getCurrentExercise()?.name} — Set {currentSetIndex} done
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                    Rest between sets
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[[60, '1 min'], [90, '1:30'], [120, '2 min']].map(([secs, label]) => (
                      <button key={secs} onClick={() => startRestTimer(secs, 'sets')}
                        style={{
                          flex: 1, background: 'var(--surf3)',
                          border: '0.5px solid var(--border)',
                          borderRadius: '8px', color: 'var(--text)',
                          fontSize: '13px', padding: '12px 8px',
                          cursor: 'pointer', fontWeight: 500
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setWorkoutPhase('tracking')}
                    style={{
                      marginTop: '10px', background: 'none', border: 'none',
                      color: 'var(--muted)', fontSize: '12px', cursor: 'pointer'
                    }}>
                    Skip rest
                  </button>
                </div>
              )}

              {/* PHASE: choosing rest between exercises */}
              {workoutPhase === 'choosing-rest-exercises' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px' }}>
                    Exercise complete
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '20px' }}>
                    Next: {workoutExercises[currentExerciseIndex]?.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                    Rest before next exercise
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[[120, '2 min'], [150, '2:30'], [180, '3 min']].map(([secs, label]) => (
                      <button key={secs} onClick={() => startRestTimer(secs, 'exercises')}
                        style={{
                          flex: 1, background: 'var(--surf3)',
                          border: '0.5px solid var(--border)',
                          borderRadius: '8px', color: 'var(--text)',
                          fontSize: '13px', padding: '12px 8px',
                          cursor: 'pointer', fontWeight: 500
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setWorkoutPhase('tracking')}
                    style={{
                      marginTop: '10px', background: 'none', border: 'none',
                      color: 'var(--muted)', fontSize: '12px', cursor: 'pointer'
                    }}>
                    Skip rest
                  </button>
                </div>
              )}

              {/* PHASE: resting — countdown */}
              {workoutPhase === 'resting' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                    {restType === 'sets' ? 'Rest between sets' : 'Rest before next exercise'}
                  </div>
                  <div style={{
                    fontSize: '56px', fontWeight: 700,
                    color: restTimer <= 10 ? 'var(--danger)' : 'var(--fit)',
                    marginBottom: '8px', fontVariantNumeric: 'tabular-nums'
                  }}>
                    {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, '0')}
                  </div>
                  {restType === 'exercises' && workoutExercises[currentExerciseIndex] && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                      Next: {workoutExercises[currentExerciseIndex].name}
                    </div>
                  )}
                  <button onClick={() => {
                    clearInterval(restInterval)
                    setRestTimer(0)
                    setWorkoutPhase('tracking')
                  }} style={{
                    background: 'none', border: '0.5px solid var(--border)',
                    borderRadius: '8px', color: 'var(--muted)',
                    fontSize: '12px', padding: '8px 20px', cursor: 'pointer'
                  }}>
                    Skip rest
                  </button>
                </div>
              )}

              {/* PHASE: complete — all exercises done */}
              {workoutPhase === 'complete' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '16px', fontWeight: 600,
                      color: 'var(--fit)', marginBottom: '4px'
                    }}>
                      All exercises complete
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {formatElapsed(elapsedMs)} total
                    </div>
                  </div>

                  {/* Summary */}
                  {workoutExercises.map(ex => {
                    const done = getCompletedRepsForExercise(ex.id)
                    return (
                      <div key={ex.id} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '7px 0', borderBottom: '0.5px solid var(--border)'
                      }}>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{ex.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--fit)', fontWeight: 500 }}>
                          {done.map(r => r === 'done' ? '✓' : r).join(' · ')}
                        </div>
                      </div>
                    )
                  })}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button onClick={() => finishTimer(routine)} style={{
                      flex: 1, background: 'var(--fit)', border: 'none',
                      borderRadius: '10px', color: '#000', fontSize: '14px',
                      padding: '14px', cursor: 'pointer', fontWeight: 600
                    }}>
                      Finish workout
                    </button>
                    <button onClick={() => setWorkoutPhase('tracking')} style={{
                      background: 'var(--surf3)', border: '0.5px solid var(--border)',
                      borderRadius: '10px', color: 'var(--muted)',
                      fontSize: '13px', padding: '14px 16px', cursor: 'pointer'
                    }}>
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel timer — always at bottom */}
              {workoutPhase !== 'complete' && (
                <button onClick={() => {
                  setActiveTimers(prev => { const n = { ...prev }; delete n[routine.id]; return n })
                  setModal(null)
                  resetWorkoutState()
                }} style={{
                  width: '100%', background: 'none',
                  border: '0.5px solid var(--border)',
                  borderRadius: '8px', color: 'var(--danger)',
                  fontSize: '13px', padding: '10px',
                  cursor: 'pointer', marginTop: '16px'
                }}>
                  Cancel workout
                </button>
              )}
            </div>
          )}

          {/* TIMER RUNNING — reading / learning */}
          {isActive && type !== 'workout' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px', padding: '16px', background: 'var(--surf3)', borderRadius: '10px' }}>
                <div style={{ fontSize: '40px', fontWeight: 500, color: 'var(--fit)' }}>{formatElapsed(elapsedMs)}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '4px' }}>Timer running</div>
              </div>
              {type === 'reading' && (
                <>
                  <select value={quickLog.book_id || ''} onChange={e => setQuickLog(p => ({ ...p, book_id: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }}>
                    <option value=''>Select book...</option>
                    {books.map(b => <option key={b.id} value={b.id}>{b.title} (p.{b.pages_read})</option>)}
                  </select>
                  <input placeholder="Current page" type="number" value={quickLog.current_page || ''}
                    onChange={e => setQuickLog(p => ({ ...p, current_page: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }} />
                </>
              )}
              {type === 'learning' && (
                <>
                  <select value={quickLog.course_id || ''} onChange={e => setQuickLog(p => ({ ...p, course_id: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }}>
                    <option value=''>Select course...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <input placeholder="Current module #" type="number" inputMode="numeric" value={quickLog.module_number || ''}
                    onChange={e => setQuickLog(p => ({ ...p, module_number: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }} />
                </>
              )}
              <button onClick={() => finishTimer(routine)} style={{ width: '100%', background: 'var(--fit)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '14px', padding: '13px', cursor: 'pointer', fontWeight: 600, marginBottom: '8px' }}>
                ✓ Finish — {formatElapsed(elapsedMs)}
              </button>
              <button onClick={() => {
                setActiveTimers(prev => { const n = { ...prev }; delete n[routine.id]; return n })
                setModal(null)
                resetWorkoutState()
              }}
                style={{ width: '100%', background: 'none', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', padding: '10px', cursor: 'pointer' }}>
                Cancel timer
              </button>
            </>
          )}

          {/* NOT STARTED */}
          {!isActive && !isDone && (
            <>
              {/* WEIGH */}
              {type === 'weigh' && (
                <>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>Your weight today</div>
                  <input placeholder="kg (e.g. 74.2)" type="number" step="0.1" value={quickLog.kg || ''}
                    onChange={e => setQuickLog(p => ({ ...p, kg: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '16px', padding: '12px', outline: 'none', marginBottom: '12px', textAlign: 'center' }} />
                  <button onClick={() => completeRoutine(routine, quickLog)} style={{ width: '100%', background: 'var(--fit)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '14px', padding: '13px', cursor: 'pointer', fontWeight: 600 }}>
                    Save weigh-in
                  </button>
                </>
              )}

              {/* PR */}
              {type === 'pr' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', textAlign: 'center' }}>Max push-ups</div>
                      <input type="number" inputMode="numeric" placeholder="e.g. 25" value={quickLog.max_pushups || ''}
                        onChange={e => setQuickLog(p => ({ ...p, max_pushups: e.target.value }))}
                        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '20px', padding: '12px', outline: 'none', textAlign: 'center' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', textAlign: 'center' }}>Max pull-ups</div>
                      <input type="number" inputMode="numeric" placeholder="e.g. 10" value={quickLog.max_pullups || ''}
                        onChange={e => setQuickLog(p => ({ ...p, max_pullups: e.target.value }))}
                        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '20px', padding: '12px', outline: 'none', textAlign: 'center' }} />
                    </div>
                  </div>
                  <button onClick={() => completeRoutine(routine, quickLog)} style={{ width: '100%', background: 'var(--fit)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '14px', padding: '13px', cursor: 'pointer', fontWeight: 600 }}>
                    Save PRs
                  </button>
                </>
              )}

              {/* READING — no timer */}
              {type === 'reading' && (
                <>
                  <select value={quickLog.book_id || ''} onChange={e => setQuickLog(p => ({ ...p, book_id: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }}>
                    <option value=''>Select book...</option>
                    {books.map(b => <option key={b.id} value={b.id}>{b.title} (p.{b.pages_read})</option>)}
                  </select>
                  <input placeholder="Current page" type="number" inputMode="numeric" value={quickLog.current_page || ''}
                    onChange={e => setQuickLog(p => ({ ...p, current_page: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '16px', padding: '12px', outline: 'none', marginBottom: '12px', textAlign: 'center' }} />
                  <button onClick={() => completeRoutine(routine, quickLog)} style={{ width: '100%', background: 'var(--read)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '14px', padding: '13px', cursor: 'pointer', fontWeight: 600 }}>
                    Save progress
                  </button>
                </>
              )}

              {/* HYDRATION */}
              {type === 'hydration' && (
                <>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>How much water today?</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    {[1, 1.5, 2, 2.5, 3].map(l => (
                      <button key={l} onClick={() => setQuickLog(p => ({ ...p, liters: l }))}
                        style={{ flex: 1, padding: '10px 4px', borderRadius: '8px', border: '0.5px solid var(--border)', background: quickLog.liters === l ? 'var(--learn)' : 'var(--surf3)', color: quickLog.liters === l ? '#fff' : 'var(--muted)', fontSize: '13px', cursor: 'pointer', fontWeight: quickLog.liters === l ? 500 : 400 }}>
                        {l}L
                      </button>
                    ))}
                  </div>
                  <button onClick={() => completeRoutine(routine, quickLog)} style={{ width: '100%', background: 'var(--learn)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', padding: '13px', cursor: 'pointer', fontWeight: 600 }}>
                    Save
                  </button>
                </>
              )}

              {/* REFLECTION */}
              {type === 'reflection' && (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>How was your mood today?</div>
                    <div style={{ width: '100%', maxWidth: '220px', margin: '0 auto' }}>
                      <ZigguratPicker value={quickLog.mood} onChange={v => setQuickLog(p => ({ ...p, mood: v }))} color="var(--social)" label="Mood" />
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>One thing you're grateful for</div>
                    <input placeholder="Today I'm grateful for..." value={quickLog.gratitude || ''}
                      onChange={e => setQuickLog(p => ({ ...p, gratitude: e.target.value }))}
                      style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Today's win</div>
                    <input placeholder="My win today was..." value={quickLog.win || ''}
                      onChange={e => setQuickLog(p => ({ ...p, win: e.target.value }))}
                      style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
                  </div>
                  <button onClick={() => completeRoutine(routine, quickLog)} style={{ width: '100%', background: 'var(--social)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', padding: '13px', cursor: 'pointer', fontWeight: 600 }}>
                    Save reflection
                  </button>
                </>
              )}

              {/* WORKOUT & LEARNING — with timer */}
              {(type === 'workout' || type === 'learning') && (
                <>
                  {type === 'workout' && routineExercises.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
                        Today's exercises
                      </div>
                      {routineExercises.map(ex => (
                        <div key={ex.id} style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', padding: '7px 0',
                          borderBottom: '0.5px solid var(--border)'
                        }}>
                          <div style={{ fontSize: '13px', color: 'var(--text)' }}>{ex.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--fit)', fontWeight: 500 }}>
                            {ex.sets} × {ex.reps}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => startTimer(routine)} style={{ width: '100%', background: 'var(--fit)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '15px', padding: '14px', cursor: 'pointer', fontWeight: 700, marginBottom: '10px' }}>
                    Start
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>or already finished?</span>
                    <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                  </div>
                  {type === 'workout' && (
                    <>
                      <input placeholder="Duration (minutes)" type="number" value={quickLog.duration_min || ''}
                        onChange={e => setQuickLog(p => ({ ...p, duration_min: e.target.value }))}
                        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
                      <input placeholder="Notes (optional)" value={quickLog.notes || ''}
                        onChange={e => setQuickLog(p => ({ ...p, notes: e.target.value }))}
                        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }} />
                    </>
                  )}
                  {type === 'learning' && (
                    <>
                      <select value={quickLog.course_id || ''} onChange={e => setQuickLog(p => ({ ...p, course_id: e.target.value }))}
                        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }}>
                        <option value=''>Select course...</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      <input placeholder="Current module #" type="number" inputMode="numeric" value={quickLog.module_number || ''}
                        onChange={e => setQuickLog(p => ({ ...p, module_number: e.target.value }))}
                        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }} />
                    </>
                  )}
                  <button onClick={() => completeRoutine(routine, quickLog)} style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', padding: '11px', cursor: 'pointer' }}>
                    Already done ✓
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Energy check screen
  if (showEnergyCheck) {
    return (
      <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '6px', textAlign: 'center' }}>Good morning!</div>
        <div style={{ fontSize: '14px', color: 'var(--muted2)', marginBottom: '28px', textAlign: 'center' }}>How's your energy today?</div>
        <div style={{ width: '100%', maxWidth: '220px', marginBottom: '20px' }}>
          <ZigguratPicker value={energyInput} onChange={setEnergyInput} color="var(--acc)" label="Energy" />
        </div>
        <button onClick={saveEnergy} disabled={!energyInput}
          style={{ width: '100%', maxWidth: '300px', background: energyInput ? 'var(--xp)' : 'var(--surf3)', border: 'none', borderRadius: '10px', color: energyInput ? '#000' : 'var(--muted)', fontSize: '14px', padding: '14px', cursor: energyInput ? 'pointer' : 'default', fontWeight: 600 }}>
          Start my day →
        </button>
        <button onClick={() => { localStorage.setItem(`sumeria_energy_${today()}`, 'true'); setShowEnergyCheck(false); setShowPriorityCheck(true) }}
          style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer' }}>
          Skip
        </button>
      </div>
    )
  }

  // Daily priority screen
  if (showPriorityCheck) {
    return (
      <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '6px', textAlign: 'center' }}>What's your #1 priority today?</div>
        <div style={{ fontSize: '13px', color: 'var(--muted2)', marginBottom: '28px', textAlign: 'center' }}>One thing. If you only do one thing today, what would make it a success?</div>
        <input
          autoFocus
          placeholder="My #1 priority today is..."
          value={priorityInput}
          onChange={e => setPriorityInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && savePriority()}
          style={{ width: '100%', maxWidth: '340px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '14px', padding: '14px', outline: 'none', marginBottom: '16px', textAlign: 'center' }}
        />
        <button onClick={savePriority} disabled={!priorityInput.trim()}
          style={{ width: '100%', maxWidth: '340px', background: priorityInput.trim() ? 'var(--acc)' : 'var(--surf3)', border: 'none', borderRadius: '10px', color: priorityInput.trim() ? '#fff' : 'var(--muted)', fontSize: '14px', padding: '14px', cursor: priorityInput.trim() ? 'pointer' : 'default', fontWeight: 600 }}>
          Let's go →
        </button>
        <button onClick={() => { localStorage.setItem(`sumeria_priority_${today()}`, 'true'); setShowPriorityCheck(false) }}
          style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer' }}>
          Skip
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      <div style={{ background: 'var(--surf)', borderBottom: '0.5px solid var(--border)', padding: '8px 0 0' }}>
        <Skyline scores={scores} />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '3px' }}>{getGreeting()}</div>
        <div style={{ fontSize: '12px', color: 'var(--muted2)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
          {routineDone}/{routineItems.length} routines · {goalsDone}/{goals.length} goals · {medsDone}/{medicines.length} medicines
        </div>
      </div>

      {notifPerm !== 'granted' && typeof Notification !== 'undefined' && (
        <div style={{
          background: '#0e0d1c', border: '0.5px solid var(--work)',
          borderRadius: '10px', padding: '12px 14px', marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
              {notifPerm === 'denied' ? 'Notifications blocked' : 'Enable notifications'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
              {notifPerm === 'denied'
                ? 'Allow notifications for this site in your browser settings to get reminders'
                : 'Get morning, evening and medicine reminders'}
            </div>
          </div>
          {notifPerm !== 'denied' && (
            <button onClick={enableNotifs} style={{
              background: 'var(--work)', border: 'none', borderRadius: '7px',
              color: '#fff', fontSize: '12px', padding: '7px 12px', cursor: 'pointer', fontWeight: 500
            }}>Enable</button>
          )}
        </div>
      )}

      {/* Daily priority card */}
      {journal?.priority && (
        <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderLeft: '2px solid var(--acc)', borderRadius: '0 8px 8px 0', padding: '10px 13px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }}>Today's priority</div>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>{journal.priority}</div>
        </div>
      )}

      {!editingMantra ? (
        <div style={{
          padding: '12px 14px',
          marginBottom: '14px',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: 'var(--text)',
            lineHeight: 1.7,
            marginBottom: '6px'
          }}>
            "{mantra}"
          </div>
          <button
            onClick={() => { setEditingMantra(true); setMantraInput(mantra) }}
            style={{
              background: 'none', border: 'none',
              color: 'var(--muted2)', cursor: 'pointer',
              fontSize: '10px', padding: '0',
              textTransform: 'uppercase', letterSpacing: '.5px'
            }}>
            Edit mantra
          </button>
        </div>
      ) : (
        <div style={{
          background: 'var(--surf)',
          border: '0.5px solid var(--border)',
          borderRadius: '10px',
          padding: '13px 14px',
          marginBottom: '14px'
        }}>
          <textarea
            autoFocus
            value={mantraInput}
            onChange={e => setMantraInput(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              background: 'var(--surf3)',
              border: '0.5px solid var(--border)',
              borderRadius: '7px',
              color: 'var(--text)',
              fontSize: '13px',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              padding: '9px 11px',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.6,
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={async () => {
                if (!mantraInput.trim()) return
                await supabase.from('settings')
                  .upsert({ key: 'mantra', value: mantraInput.trim() })
                setMantra(mantraInput.trim())
                setEditingMantra(false)
              }}
              style={{
                flex: 1, background: 'var(--acc)', border: 'none',
                borderRadius: '7px', color: '#fff',
                fontSize: '13px', padding: '9px',
                cursor: 'pointer', fontWeight: 500
              }}>
              Save
            </button>
            <button
              onClick={() => setEditingMantra(false)}
              style={{
                background: 'var(--surf3)',
                border: '0.5px solid var(--border)',
                borderRadius: '7px', color: 'var(--muted)',
                fontSize: '13px', padding: '9px 14px',
                cursor: 'pointer'
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {reminders.length > 0 && (
        <>
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Reminders today</div>
          {reminders.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid #3d1a16', borderRadius: '8px', marginBottom: '6px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{r.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{r.contacts?.name}</div>
              </div>
              <button onClick={() => dismissReminder(r.id)} style={{ background: 'var(--fit)', border: 'none', borderRadius: '6px', color: '#000', fontSize: '11px', padding: '5px 10px', cursor: 'pointer', fontWeight: 500 }}>Done</button>
            </div>
          ))}
        </>
      )}

      {(routineItems.length > 0 || medicines.length > 0 || contactReminders.length > 0 || todayCalendarEvents.length > 0) && (
        <>
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Today's schedule</div>
          {routineItems.map(routine => {
            const isDone = routineLog[routine.id]?.done
            const isActive = !!activeTimers[routine.id]
            const elapsedMs = elapsed[routine.id] || 0
            const AreaIcon = AREA_ICONS[routine.area]
            const routineIcon = routine.area === 'fitness'
              ? (getWorkoutIcon(routine.title, 22, AREA_COLORS.fitness) || <FitnessSymbol size={22} />)
              : AreaIcon ? <AreaIcon size={22} /> : null
            return (
              <div key={routine.id} onClick={() => openRoutineModal(routine)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderLeft: `2px solid ${AREA_COLORS[routine.area] || 'var(--acc)'}`, borderRadius: '0 8px 8px 0', marginBottom: '6px', opacity: isDone ? 0.5 : 1, cursor: 'pointer', transition: 'opacity .2s' }}>
                <div style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isDone ? (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--acc)' }} />
                  ) : isActive ? (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--fit)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ) : routineIcon ? (
                    <div style={{ color: AREA_COLORS[routine.area] || 'var(--acc)', display: 'flex', alignItems: 'center' }}>
                      {routineIcon}
                    </div>
                  ) : (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: AREA_COLORS[routine.area] || 'var(--acc)' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--muted)' : 'var(--text)' }}>
                    {routine.title}
                  </div>
                  <div style={{ fontSize: '11px', color: isActive ? 'var(--fit)' : AREA_COLORS[routine.area] || 'var(--muted)', marginTop: '1px' }}>
                    {isActive ? `${formatElapsed(elapsedMs)} · tap to finish` : isDone ? 'Completed' : `${routine.area} · tap to log`}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>›</div>
              </div>
            )
          })}
          {medicines.map(med => (
            <div key={med.id} onClick={() => toggleMed(med)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderLeft: '2px solid var(--health)', borderRadius: '0 8px 8px 0', marginBottom: '6px', opacity: medLog[med.id] ? 0.5 : 1, cursor: 'pointer' }}>
              <div style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--health)' }}>
                <HealthSymbol size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, textDecoration: medLog[med.id] ? 'line-through' : 'none', color: medLog[med.id] ? 'var(--muted)' : 'var(--text)' }}>{med.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{med.dose} · {med.time}{med.with_food ? ' · with food' : ''}</div>
              </div>
              <div onClick={e => { e.stopPropagation(); toggleMed(med) }} style={{ width: '22px', height: '22px', borderRadius: '50%', border: medLog[med.id] ? 'none' : '1.5px solid var(--border)', background: medLog[med.id] ? 'var(--health)' : 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff' }}>
                {medLog[med.id] ? '✓' : ''}
              </div>
            </div>
          ))}
          {contactReminders.map(reminder => (
            <div key={reminder.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderLeft: '2px solid var(--social)', borderRadius: '0 8px 8px 0', marginBottom: '6px' }}>
              <div style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--social)' }}>
                <SocialSymbol size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{reminder.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{reminder.contacts?.name}</div>
              </div>
              <button onClick={() => completeContactReminder(reminder.id)} style={{ background: 'var(--social)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '5px 10px', cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}>Done</button>
            </div>
          ))}
          {todayCalendarEvents.length > 0 && todayCalendarEvents.map(ev => (
            <div key={ev.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', background: 'var(--surf)',
              border: '0.5px solid var(--border)',
              borderLeft: `2px solid ${AREA_COLORS[ev.area] || 'var(--sand)'}`,
              borderRadius: '0 8px 8px 0', marginBottom: '6px',
              opacity: ev.done ? 0.5 : 1
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, textDecoration: ev.done ? 'line-through' : 'none', color: ev.done ? 'var(--muted)' : 'var(--text)' }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '1px' }}>
                  {ev.time ? ev.time.slice(0, 5) + ' · ' : ''}
                  {ev.area ? ev.area.charAt(0).toUpperCase() + ev.area.slice(1) : 'Event'}
                  {ev.notes ? ' · ' + ev.notes : ''}
                </div>
              </div>
              <div style={{
                fontSize: '9px', color: AREA_COLORS[ev.area] || 'var(--sand)',
                textTransform: 'uppercase', letterSpacing: '.3px'
              }}>
                {ev.area}
              </div>
              <div onClick={() => !ev.done && dismissCalendarEvent(ev.id)}
                style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  border: ev.done ? 'none' : '1.5px solid var(--border)',
                  background: ev.done ? (AREA_COLORS[ev.area] || 'var(--sand)') : 'none',
                  cursor: ev.done ? 'default' : 'pointer',
                  flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#000'
                }}>
                {ev.done ? '✓' : ''}
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '12px 0 8px' }}>Daily goals</div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
      {!loading && goalsByArea.length === 0 && (
        <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
          No goals yet — add your first one below
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {goalsByArea.map(area => (
          <div key={area.id} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: area.color }} />
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px', color: area.color }}>{area.label}</div>
              <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--muted)' }}>{area.goals.filter(g => g.done).length}/{area.goals.length}</div>
            </div>
            {area.goals.map((goal, i) => (
              <div key={goal.id} style={{ padding: i === 0 ? '0' : '6px 0 0', borderTop: i === 0 ? 'none' : '0.5px solid var(--border)' }}>
                {editGoal?.id === goal.id ? (
                  <div style={{ padding: '2px 0' }}>
                    <input autoFocus value={editGoal.text} onChange={e => setEditGoal(p => ({ ...p, text: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && saveGoal()}
                      style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '12px', padding: '6px 8px', outline: 'none', marginBottom: '6px' }} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select value={editGoal.area} onChange={e => setEditGoal(p => ({ ...p, area: e.target.value }))}
                        style={{ flex: 1, background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '11px', padding: '5px 6px', outline: 'none' }}>
                        {AREAS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                      </select>
                      <button onClick={saveGoal} style={{ background: 'var(--acc)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '5px 10px', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditGoal(null)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--muted)', fontSize: '11px', padding: '5px 8px', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div onClick={() => toggleGoal(goal)} style={{ width: '16px', height: '16px', borderRadius: '50%', border: goal.done ? 'none' : '1.5px solid var(--border)', background: goal.done ? 'var(--acc)' : 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff' }}>{goal.done ? '✓' : ''}</div>
                    <div style={{ fontSize: '12px', flex: 1, textDecoration: goal.done ? 'line-through' : 'none', color: goal.done ? 'var(--muted)' : 'var(--text)' }}>{goal.text}</div>
                    <div onClick={() => setEditGoal({ id: goal.id, text: goal.text, area: goal.area })} style={{ fontSize: '10px', color: 'var(--muted)', cursor: 'pointer', opacity: .6 }}>Edit</div>
                    <div onClick={() => deleteGoal(goal.id)} style={{ fontSize: '14px', color: 'var(--muted)', cursor: 'pointer', opacity: .6 }}>×</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showAdd ? (
        <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px' }}>
          <input autoFocus placeholder="What do you want to accomplish?" value={newGoal}
            onChange={e => setNewGoal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGoal()}
            style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '9px' }} />
          <div style={{ display: 'flex', gap: '7px' }}>
            <select value={newArea} onChange={e => setNewArea(e.target.value)}
              style={{ flex: 1, background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '12px', padding: '8px 10px', outline: 'none' }}>
              {AREAS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            <button onClick={addGoal} style={{ background: 'var(--acc)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '12px', padding: '8px 16px', cursor: 'pointer' }}>Add</button>
            <button onClick={() => setShowAdd(false)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '12px', padding: '8px 12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px' }}>+ Add goal</button>
      )}

      {renderModal()}
    </div>
  )
}   