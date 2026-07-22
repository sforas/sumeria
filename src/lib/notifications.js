const VAPID_PUBLIC_KEY = 'BKvdYXXeytTepQbbcBom0gd1D0WFW6n2JVfo7c8TWMSRRn6Z4tOGiXhsw0XREuiiIalEe1tSCMZm7FtJ3sP4Kco'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch (err) {
    console.error('SW registration failed:', err)
    return null
  }
}

async function subscribeToPush(registration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    // Save subscription to Supabase
    const { supabase } = await import('./supabase')
    const { endpoint, keys } = subscription.toJSON()
    await supabase.from('push_subscriptions').upsert({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    }, { onConflict: 'endpoint' })

    return subscription
  } catch (err) {
    console.error('Push subscription failed:', err)
    return null
  }
}

export async function sendPushNotification(title, body, url = '/') {
  try {
    const { supabase } = await import('./supabase')
    await supabase.functions.invoke('send-push-notification', {
      body: { title, body, url }
    })
  } catch (err) {
    console.error('Failed to send push notification:', err)
  }
}

export const Notifs = {
  async init() {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      const reg = await registerServiceWorker()
      if (reg) await subscribeToPush(reg)
      this.scheduleToday()
    }
  },

  async enable() {
    if (!('Notification' in window)) return false
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const reg = await registerServiceWorker()
    if (!reg) return false
    await subscribeToPush(reg)
    this.scheduleToday()
    return true
  },

  scheduleToday() {
    const now = new Date()
    const todayKey = now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
    const lastScheduled = localStorage.getItem('sumeria_notifs_date')
    if (lastScheduled === todayKey) return
    localStorage.setItem('sumeria_notifs_date', todayKey)

    // Schedule morning notification — 7:00 AM
    this.scheduleAt(7, 0, '☀️ Good morning', 'Open Sumeria to set your priority and start your day.')

    // Schedule evening reflection — 8:00 PM
    this.scheduleAt(20, 0, '🌙 Evening reflection', "How was your day? Log your win and gratitude.")

    // Schedule medicine notifications
    this.scheduleMedicines()
  },

  scheduleAt(hour, minute, title, body) {
    const now = new Date()
    const fire = new Date()
    fire.setHours(hour, minute, 0, 0)
    const delay = fire - now
    if (delay <= 0) return

    setTimeout(async () => {
      // Try real push first, fall back to local
      try {
        await sendPushNotification(title, body)
      } catch {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.svg' })
        }
      }
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
        let fireHour = h
        let fireMins = m - notifyMin
        if (fireMins < 0) { fireHour -= 1; fireMins += 60 }
        this.scheduleAt(
          fireHour, fireMins,
          `Medicine reminder`,
          `Time to take ${med.name} — ${med.dose}${med.with_food ? ' with food' : ''}`
        )
      })
    } catch (err) {
      console.error('Medicine scheduling failed:', err)
    }
  }
}
