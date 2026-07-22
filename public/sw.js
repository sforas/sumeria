const _CACHE_NAME = 'sumeria-v1'

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [{ action: 'open', title: 'Open Sumeria' }]
  }
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})
