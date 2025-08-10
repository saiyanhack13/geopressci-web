// Service Worker pour GeoPressCI PWA avec Push Notifications
const CACHE_NAME = 'geopressci-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Erreur lors de la mise en cache', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Notification push reçue');
  
  let notificationData = {
    title: 'GeoPressCI',
    body: 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('Erreur lors du parsing des données push:', error);
      notificationData.body = event.data.text() || 'Nouvelle notification';
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.data?.requireInteraction || false,
    silent: notificationData.data?.silent || false,
    actions: notificationData.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Clic sur notification');
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  let urlToOpen = '/';
  
  // Gestion des actions spécifiques
  if (action) {
    switch (action) {
      case 'view':
        urlToOpen = notificationData.url || '/';
        break;
      case 'accept':
        if (notificationData.type === 'new_order' && notificationData.orderId) {
          urlToOpen = `/pressing/orders/${notificationData.orderId}`;
        }
        break;
      case 'dismiss':
        return; // Ne pas ouvrir de page
      default:
        urlToOpen = notificationData.url || '/';
    }
  } else {
    // Clic direct sur la notification
    if (notificationData.url) {
      urlToOpen = notificationData.url;
    } else if (notificationData.type) {
      // Redirection selon le type de notification
      switch (notificationData.type) {
        case 'new_order':
          urlToOpen = notificationData.orderId ? 
            `/pressing/orders/${notificationData.orderId}` : 
            '/pressing/orders';
          break;
        case 'order_status_update':
          urlToOpen = notificationData.orderId ? 
            `/orders/${notificationData.orderId}` : 
            '/orders';
          break;
        case 'payment_received':
          urlToOpen = '/pressing/earnings';
          break;
        case 'new_review':
          urlToOpen = '/pressing/reviews';
          break;
        case 'promotion_alert':
          urlToOpen = '/pressing/promotions';
          break;
        default:
          urlToOpen = '/';
      }
    }
  }

  // Ouvrir ou focuser la fenêtre
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre existante avec la même origine
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        // Ouvrir une nouvelle fenêtre si aucune n'existe
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('Erreur lors de l\'ouverture de la fenêtre:', error);
      })
  );
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification fermée');
  
  const notificationData = event.notification.data || {};
  
  // Envoyer des analytics si nécessaire
  if (notificationData.trackClose) {
    // Ici on pourrait envoyer des données d'analytics
    console.log('Notification fermée sans interaction:', notificationData);
  }
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message reçu:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      case 'CLEAR_CACHE':
        caches.delete(CACHE_NAME).then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
      default:
        console.log('Type de message non reconnu:', event.data.type);
    }
  }
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // Stratégie Cache First pour les ressources statiques
  if (event.request.destination === 'image' || 
      event.request.destination === 'script' || 
      event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
  // Stratégie Network First pour les API calls
  else if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cloner la réponse car elle ne peut être consommée qu'une fois
          const responseToCache = response.clone();
          
          if (response.status === 200) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        })
        .catch(() => {
          // En cas d'échec réseau, essayer le cache
          return caches.match(event.request);
        })
    );
  }
  // Stratégie Stale While Revalidate pour les pages
  else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
            });
          
          return response || fetchPromise;
        })
    );
  }
});

// Gestion des notifications push (pour plus tard)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Notification push reçue');
  
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification GeoPressCI',
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir',
        icon: '/icon-view.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icon-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('GeoPressCI', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Clic sur notification');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Ne rien faire, la notification est déjà fermée
  } else {
    // Clic sur la notification elle-même
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Synchronisation en arrière-plan');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Ici, vous pouvez synchroniser les données en attente
      console.log('Synchronisation des données...')
    );
  }
});
