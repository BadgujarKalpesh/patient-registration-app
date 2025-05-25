// This script should be registered in your app to handle cross-tab communication

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DATA_UPDATED') {
    // Broadcast to all clients
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'DATA_UPDATED'
        });
      });
    });
  }
});