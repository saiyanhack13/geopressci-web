/**
 * Service de notifications push côté frontend
 * Gestion des subscriptions et réception des notifications push
 */

import { toast } from 'react-hot-toast';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private pushSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Vérifier le support des notifications push
   */
  private checkSupport(): void {
    this.pushSupported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
  }

  /**
   * Initialiser le service worker et les notifications push
   */
  async initialize(): Promise<boolean> {
    if (!this.pushSupported) {
      console.warn('Les notifications push ne sont pas supportées par ce navigateur');
      return false;
    }

    try {
      // Enregistrer le service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré:', this.registration);

      // Attendre que le service worker soit prêt
      await navigator.serviceWorker.ready;

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service worker:', error);
      return false;
    }
  }

  /**
   * Demander la permission pour les notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.pushSupported) {
      throw new Error('Les notifications ne sont pas supportées');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Les notifications ont été refusées par l\'utilisateur');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('🔔 Notifications activées avec succès !');
    } else if (permission === 'denied') {
      toast.error('🚫 Notifications refusées. Vous pouvez les activer dans les paramètres du navigateur.');
    }

    return permission;
  }

  /**
   * S'abonner aux notifications push
   */
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      throw new Error('Service Worker non initialisé');
    }

    try {
      // Demander la permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }

      // Vérifier s'il y a déjà une subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Créer une nouvelle subscription
        const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error('Clé VAPID publique non configurée');
        }

        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Convertir la subscription au format attendu par le backend
      const subscriptionData: PushSubscriptionData = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!)
        }
      };

      // Envoyer la subscription au backend
      await this.sendSubscriptionToBackend(subscriptionData);

      console.log('Subscription push créée:', subscriptionData);
      return subscriptionData;

    } catch (error) {
      console.error('Erreur lors de la création de la subscription push:', error);
      toast.error('❌ Erreur lors de l\'activation des notifications push');
      throw error;
    }
  }

  /**
   * Se désabonner des notifications push
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      // Supprimer la subscription côté client
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        // Supprimer la subscription côté serveur
        await this.removeSubscriptionFromBackend(this.subscription.endpoint);
        
        this.subscription = null;
        toast.success('🔕 Notifications désactivées');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression de la subscription:', error);
      toast.error('❌ Erreur lors de la désactivation des notifications');
      return false;
    }
  }

  /**
   * Vérifier si l'utilisateur est abonné
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription !== null;
    } catch (error) {
      console.error('Erreur lors de la vérification de la subscription:', error);
      return false;
    }
  }

  /**
   * Obtenir l'état de la permission
   */
  getPermissionState(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Envoyer la subscription au backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscriptionData): Promise<void> {
    const token = localStorage.getItem('geopressci_access_token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch('/api/v1/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'enregistrement de la subscription');
    }
  }

  /**
   * Supprimer la subscription du backend
   */
  private async removeSubscriptionFromBackend(endpoint: string): Promise<void> {
    const token = localStorage.getItem('geopressci_access_token');
    if (!token) {
      return; // Pas de token, pas besoin de supprimer côté serveur
    }

    try {
      const response = await fetch('/api/v1/push/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ endpoint })
      });

      if (!response.ok) {
        console.warn('Erreur lors de la suppression de la subscription côté serveur');
      }
    } catch (error) {
      console.warn('Erreur lors de la suppression de la subscription côté serveur:', error);
    }
  }

  /**
   * Envoyer une notification de test
   */
  async sendTestNotification(): Promise<void> {
    const token = localStorage.getItem('geopressci_access_token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch('/api/v1/push/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: '🧪 Test GeoPressCI',
        body: 'Votre système de notifications push fonctionne parfaitement !',
        data: { test: true }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'envoi de la notification de test');
    }

    toast.success('📱 Notification de test envoyée !');
  }

  /**
   * Convertir une clé VAPID URL-safe base64 en Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convertir un ArrayBuffer en base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Afficher une notification locale (fallback)
   */
  showLocalNotification(payload: PushNotificationPayload): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        tag: payload.tag,
        data: payload.data
      });

      // Auto-fermer après 5 secondes
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Gérer les clics sur la notification
      notification.onclick = () => {
        window.focus();
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
        notification.close();
      };
    }
  }

  /**
   * Vérifier si les notifications push sont supportées
   */
  isPushSupported(): boolean {
    return this.pushSupported;
  }
}

// Instance singleton
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
