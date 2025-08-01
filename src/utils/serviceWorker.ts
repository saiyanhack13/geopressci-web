// Utilitaires pour la gestion du Service Worker
import type { ServiceWorkerConfig, PWANotificationOptions } from '../types/pwa';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'Cette application web est servie en cache-first par un service worker. ' +
            'Pour en savoir plus, visitez https://cra.link/PWA'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker enregistré avec succès:', registration);
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'Nouveau contenu disponible et sera utilisé lorsque tous les ' +
                'onglets de cette page seront fermés.'
              );

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Le contenu est mis en cache pour une utilisation hors ligne.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Erreur lors de l\'enregistrement du service worker:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'Aucune connexion internet trouvée. L\'application fonctionne en mode hors ligne.'
      );
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Fonction pour demander la permission de notifications
export function requestNotificationPermission(): Promise<NotificationPermission> {
  return new Promise((resolve) => {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications');
      resolve('denied');
      return;
    }

    if (Notification.permission === 'granted') {
      resolve('granted');
      return;
    }

    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        resolve(permission);
      });
    } else {
      resolve('denied');
    }
  });
}

// Fonction pour afficher une notification
export function showNotification(title: string, options?: PWANotificationOptions) {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        const notificationOptions: PWANotificationOptions = {
          title,
          icon: '/logo192.png',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          ...options
        };
        
        // Utiliser la méthode avec les types étendus
        registration.showNotification(title, notificationOptions);
      });
    }
  }
}
