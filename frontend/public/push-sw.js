// Gestion des notifications push, importée dans le service worker généré par vite-plugin-pwa (workbox.importScripts)

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Samalocation';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      tag: data.tag,
      data: { link: data.link || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  // Liens internes uniquement
  const target = new URL(link.startsWith('/') && !link.startsWith('//') ? link : '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // Réutilise un onglet ou l'app déjà ouverte
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        return existing.focus().then((client) => (client && 'navigate' in client ? client.navigate(target) : client));
      }
      return self.clients.openWindow(target);
    })
  );
});
