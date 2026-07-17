import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function daysAgoStr(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function sleepMinutes(s) {
  if (!s.sleep_time || !s.wake_time) return 0
  const [sh, sm] = s.sleep_time.split(':').map(Number)
  const [wh, wm] = s.wake_time.split(':').map(Number)
  let mins = (wh * 60 + wm) - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  return mins
}

const EMPTY_SCORES = {
  fitness: 0, work: 0, reading: 0, learning: 0,
  social: 0, health: 0, savings: 0, journal: 0
}

export function useDistrictScores() {
  const [scores, setScores] = useState(EMPTY_SCORES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchScores() {
      const weekAgo = daysAgoStr(7)
      const monthAgo = daysAgoStr(30)

      const [
        { data: workouts },
        { data: applications },
        { data: books },
        { data: sessions },
        { data: completedReminders },
        { data: activeContacts },
        { data: sleep },
        { data: transactions },
        { data: journalEntries }
      ] = await Promise.all([
        supabase.from('workouts').select('id').gte('date', weekAgo),
        supabase.from('applications').select('id'),
        supabase.from('books').select('pages_read'),
        supabase.from('study_sessions').select('minutes').gte('date', weekAgo),
        supabase.from('contact_reminders').select('id').eq('done', true).gte('remind_on', monthAgo),
        supabase.from('contacts').select('id').not('contact_frequency', 'is', null).neq('contact_frequency', 'none'),
        supabase.from('sleep_log').select('sleep_time, wake_time').gte('date', weekAgo),
        supabase.from('transactions').select('amount, type').eq('type', 'saving'),
        supabase.from('daily_journal').select('id').gte('date', monthAgo)
      ])

      if (cancelled) return

      const totalPagesRead = (books || []).reduce((sum, b) => sum + (b.pages_read || 0), 0)
      const studyMins = (sessions || []).reduce((sum, s) => sum + (s.minutes || 0), 0)
      const goodSleepNights = (sleep || []).filter(s => sleepMinutes(s) >= 420).length
      const totalSaved = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0)
      const socialScore = ((completedReminders || []).length / 8 * 60) + ((activeContacts || []).length / 10 * 40)

      setScores({
        fitness: Math.min(100, ((workouts || []).length / 20) * 100),
        work: Math.min(100, ((applications || []).length / 30) * 100),
        reading: Math.min(100, (totalPagesRead / 500) * 100),
        learning: Math.min(100, (studyMins / 1200) * 100),
        social: Math.min(100, socialScore),
        health: Math.min(100, (goodSleepNights / 7) * 100),
        savings: Math.min(100, (totalSaved / 100000) * 100),
        journal: Math.min(100, ((journalEntries || []).length / 30) * 100)
      })
      setLoading(false)
    }

    fetchScores()
    return () => { cancelled = true }
  }, [])

  return { scores, loading }
}
