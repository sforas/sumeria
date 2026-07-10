export const Notifs = {
  async requestPermission() {
    if (!('Notification' in window)) return false
    const perm = await Notification.requestPermission()
    return perm === 'granted'
  },

  async init() {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') {
      await this.requestPermission()
    }
    if (Notification.permission === 'granted') {
      this.scheduleToday()
    }
  },

  scheduleToday() {
    const now = new Date()
    const todayKey = now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
    const lastScheduled = localStorage.getItem('sumeria_notifs_date')
    if (lastScheduled === todayKey) return
    localStorage.setItem('sumeria_notifs_date', todayKey)

    // Morning notification — 7:00 AM
    this.scheduleAt(7, 0, '☀️ Good morning!', 'Open Sumeria to set your priority and start your day.')

    // Evening reflection — 8:00 PM
    this.scheduleAt(20, 0, '🌙 Evening reflection', "How was your day? Log your win and gratitude before bed.")

    // Schedule medicine notifications
    this.scheduleMedicines()
  },

  scheduleAt(hour, minute, title, body) {
    const now = new Date()
    const fire = new Date()
    fire.setHours(hour, minute, 0, 0)
    const delay = fire - now
    if (delay <= 0) return
    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200]
      })
    }, delay)
  },

  async scheduleMedicines() {
    try {
      const { supabase } = await import('./supabase')
      const { data: meds } = await supabase.from('medicines').select('*')
      if (!meds) return
      meds.forEach(med => {
        if (!med.time) return
        const [h, m] = med.time.split(':').map(Number)
        const notifyMin = med.notify_before_min || 15
        const fireHour = h
        const fireMins = m - notifyMin
        const adjustedH = fireMins < 0 ? fireHour - 1 : fireHour
        const adjustedM = fireMins < 0 ? 60 + fireMins : fireMins
        this.scheduleAt(
          adjustedH, adjustedM,
          `💊 Time for ${med.name}`,
          `${med.dose}${med.with_food ? ' — take with food' : ''}`
        )
      })
    } catch {}
  }
}