/**
 * Service de notifications temps réel côté frontend
 * WebSocket client optimisé pour GeoPressCI
 */

import { toast } from 'react-hot-toast';

export interface RealtimeNotification {
  type: string;
  message?: string;
  data?: any;
  timestamp: string;
}

export interface OrderUpdate {
  orderId: string;
  orderNumber?: string;
  status: string;
  previousStatus?: string;
  customerName?: string;
  pressingName?: string;
  totalAmount?: number;
  updatedAt: string;
  message?: string;
  serviceType?: 'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff';
  deliveryFee?: number;
  serviceFee?: number;
  estimatedTime?: string;
  location?: {
    address: string;
    coordinates?: [number, number];
  };
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private listeners: Map<string, Function[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Se connecter au serveur WebSocket
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connexion déjà en cours'));
        return;
      }

      this.isConnecting = true;
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${token}`;
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('🟢 WebSocket connecté');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected', null);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const notification: RealtimeNotification = JSON.parse(event.data);
            this.handleNotification(notification);
          } catch (error) {
            console.error('❌ Erreur parsing message WebSocket:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔴 WebSocket fermé:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(token);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Erreur WebSocket:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Déconnecter le WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Déconnexion volontaire');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.reconnectAttempts = 0;
  }

  /**
   * Envoyer un message au serveur
   */
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible d\'envoyer le message');
    }
  }

  /**
   * Gérer les notifications reçues
   */
  private handleNotification(notification: RealtimeNotification) {
    console.log('📨 Notification reçue:', notification.type, notification);

    switch (notification.type) {
      case 'connection_established':
        this.handleConnectionEstablished(notification.data);
        break;
        
      case 'new_order':
        this.handleNewOrder(notification.data);
        break;
        
      case 'order_confirmation':
        this.handleOrderConfirmation(notification.data);
        break;
        
      case 'order_status_update':
        this.handleOrderStatusUpdate(notification.data);
        break;
        
      case 'order_updated':
        this.handleOrderUpdated(notification.data);
        break;
        
      case 'order_pickup_ready':
        this.handleOrderPickupReady(notification.data);
        break;
        
      case 'order_delivery_assigned':
        this.handleOrderDeliveryAssigned(notification.data);
        break;
        
      case 'order_fee_updated':
        this.handleOrderFeeUpdated(notification.data);
        break;
        
      case 'unread_notifications':
        this.handleUnreadNotifications(notification.data);
        break;
        
      case 'notification_marked_read':
        this.handleNotificationMarkedRead(notification.data);
        break;
        
      case 'admin_new_order':
        this.handleAdminNewOrder(notification.data);
        break;
        
      case 'pong':
        // Réponse au ping, connexion active
        break;
        
      default:
        console.log('❓ Type de notification inconnu:', notification.type);
    }

    // Émettre l'événement pour les listeners
    this.emit(notification.type, notification.data);
    this.emit('notification', notification);
  }

  /**
   * Gérer l'établissement de la connexion
   */
  private handleConnectionEstablished(data: any) {
    toast.success('🔗 Connexion temps réel établie', { id: 'websocket-connected' });
  }

  /**
   * Gérer une nouvelle commande (pour pressing)
   */
  private handleNewOrder(data: any) {
    toast.success(
      `📦 Nouvelle commande de ${data.customer.name}\nMontant: ${data.order.totalAmount} FCFA`,
      {
        duration: 6000,
        icon: '🔔',
        id: `new-order-${data.order.id}`
      }
    );

    // Jouer un son de notification si disponible
    this.playNotificationSound();
  }

  /**
   * Gérer la confirmation de commande (pour client)
   */
  private handleOrderConfirmation(data: any) {
    toast.success(
      `✅ Commande confirmée chez ${data.pressingName}\nCommande #${data.orderNumber}`,
      {
        duration: 5000,
        id: `order-confirmation-${data.orderId}`
      }
    );
  }

  /**
   * Gérer la mise à jour de statut (pour client)
   */
  private handleOrderStatusUpdate(data: OrderUpdate) {
    const statusEmojis: { [key: string]: string } = {
      'confirmee': '✅',
      'en_cours': '🔄',
      'prete': '🎉',
      'livree': '🚚',
      'annulee': '❌'
    };

    const emoji = statusEmojis[data.status] || '📋';
    
    const message = data.message || `Statut mis à jour: ${data.status}`;
    toast.success(
      `${emoji} ${message}\nCommande #${data.orderNumber}`,
      {
        duration: 5000,
        id: `status-update-${data.orderId}`
      }
    );
  }

  /**
   * Gérer la mise à jour de commande (pour pressing)
   */
  private handleOrderUpdated(data: OrderUpdate) {
    toast(
      `🔄 Commande mise à jour\n${data.customerName} - #${data.orderNumber}`,
      {
        duration: 4000,
        id: `order-updated-${data.orderId}`,
        icon: '🔄'
      }
    );
  }

  /**
   * Gérer les notifications non lues
   */
  private handleUnreadNotifications(notifications: any[]) {
    if (notifications.length > 0) {
      toast(
        `📬 ${notifications.length} notification${notifications.length > 1 ? 's' : ''} non lue${notifications.length > 1 ? 's' : ''}`,
        {
          duration: 4000,
          id: 'unread-notifications',
          icon: '📬'
        }
      );
    }
  }

  /**
   * Gérer la notification marquée comme lue
   */
  private handleNotificationMarkedRead(data: any) {
    // Notification silencieuse, juste émettre l'événement
    this.emit('notification_read', data.notificationId);
  }

  /**
   * Gérer les notifications admin
   */
  private handleAdminNewOrder(data: any) {
    console.log(' Nouvelle commande (Admin):', data);
    
    toast.success(` Nouvelle commande: ${data.orderNumber}`, {
      duration: 5000,
      icon: ' ',
    });
    
    this.playNotificationSound();
    this.emit('admin_new_order', data);
  }

  /**
   * Gérer la notification de commande prête pour retrait
   */
  private handleOrderPickupReady(data: OrderUpdate) {
    console.log(' Commande prête pour retrait:', data);
    
    const serviceTypeText = data.serviceType === 'store_pickup' ? 'retrait en magasin' : 'retrait';
    
    toast.success(` Votre commande ${data.orderNumber} est prête pour ${serviceTypeText}!`, {
      duration: 8000,
      icon: ' ',
    });
    
    this.playNotificationSound();
    this.emit('order_pickup_ready', data);
  }

  /**
   * Gérer l'assignation d'un livreur
   */
  private handleOrderDeliveryAssigned(data: OrderUpdate) {
    console.log(' Livreur assigné:', data);
    
    toast.success(` Un livreur a été assigné à votre commande ${data.orderNumber}`, {
      duration: 6000,
      icon: ' ',
    });
    
    this.emit('order_delivery_assigned', data);
  }

  /**
   * Gérer la mise à jour des frais (retrait/dépôt en magasin)
   */
  private handleOrderFeeUpdated(data: OrderUpdate) {
    console.log(' Frais mis à jour:', data);
    
    const feeMessage = data.deliveryFee === 0 && data.serviceFee === 0 
      ? 'Frais de livraison et de service supprimés' 
      : `Frais mis à jour: ${data.totalAmount} FCFA`;
    
    toast.success(` ${feeMessage}`, {
      duration: 5000,
      icon: ' ',
    });
    
    this.emit('order_fee_updated', data);
  }

  /**
   * Marquer une notification comme lue
   */
  markNotificationAsRead(notificationId: string) {
    this.send({
      type: 'mark_notification_read',
      notificationId
    });
  }

  /**
   * S'abonner aux mises à jour de commandes spécifiques
   */
  subscribeToOrderUpdates(orderIds: string[]) {
    this.send({
      type: 'subscribe_orders',
      orderIds
    });
  }

  /**
   * Notifier le changement de méthode de service (retrait/dépôt en magasin)
   */
  notifyServiceTypeChange(orderId: string, newServiceType: 'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff') {
    this.send({
      type: 'service_type_changed',
      orderId,
      serviceType: newServiceType,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Demander la mise à jour des frais en temps réel
   */
  requestFeeUpdate(orderId: string, serviceType: string) {
    this.send({
      type: 'request_fee_update',
      orderId,
      serviceType,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notifier l'arrivée d'un client pour retrait en magasin
   */
  notifyCustomerArrival(orderId: string, location?: { lat: number; lng: number }) {
    this.send({
      type: 'customer_arrived',
      orderId,
      location,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Ajouter un listener d'événement
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Supprimer un listener d'événement
   */
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Émettre un événement
   */
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Erreur dans le listener d\'événement:', error);
        }
      });
    }
  }

  /**
   * Programmer une reconnexion
   */
  private scheduleReconnect(token: string) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnexion WebSocket dans ${delay}ms (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(token).catch(error => {
        console.error('❌ Échec de reconnexion WebSocket:', error);
      });
    }, delay);
  }

  /**
   * Démarrer le heartbeat
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }

  /**
   * Arrêter le heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Jouer un son de notification
   */
  private playNotificationSound() {
    try {
      // Créer un son simple avec Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Fallback silencieux si Web Audio API n'est pas supporté
    }
  }

  /**
   * Configurer les listeners d'événements globaux
   */
  private setupEventListeners() {
    // Gérer la visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.ws && this.ws.readyState === WebSocket.CLOSED) {
        // Reconnecter si la page redevient visible et que la connexion est fermée
        const token = localStorage.getItem('geopressci_access_token');
        if (token) {
          this.connect(token);
        }
      }
    });

    // Gérer la fermeture de la page
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  /**
   * Obtenir le statut de la connexion
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Obtenir les statistiques de connexion
   */
  getConnectionStats() {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      readyState: this.ws ? this.ws.readyState : -1
    };
  }
}

// Instance singleton
export const realtimeService = new RealtimeService();
export default realtimeService;
