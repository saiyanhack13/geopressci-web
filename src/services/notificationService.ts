/**
 * Service de notification pour les pressings
 * Gère les notifications en temps réel pour informer les pressings des nouvelles commandes
 */

export interface NotificationData {
  pressingId: string;
  pressingName: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  servicesCount: number;
  orderReference?: string;
  collectionDateTime?: string;
  deliveryAddress?: string;
}

export interface NotificationResult {
  success: boolean;
  method: string;
  message: string;
  timestamp: string;
}

class NotificationService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1';
  }

  /**
   * Notifier un pressing d'une nouvelle commande
   */
  async notifyPressingNewOrder(data: NotificationData): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const timestamp = new Date().toISOString();

    try {
      console.log('📢 Démarrage des notifications pressing:', {
        pressingId: data.pressingId,
        orderId: data.orderId,
        customerName: data.customerName,
        totalAmount: data.totalAmount
      });

      // 1. Notification Toast (immédiate)
      results.push({
        success: true,
        method: 'toast',
        message: `Nouvelle commande de ${data.customerName} (${data.totalAmount} FCFA)`,
        timestamp
      });

      // 2. Notification WebSocket (temps réel)
      try {
        await this.sendWebSocketNotification(data);
        results.push({
          success: true,
          method: 'websocket',
          message: 'Notification WebSocket envoyée',
          timestamp
        });
      } catch (wsError) {
        console.warn('⚠️ Notification WebSocket échouée:', wsError);
        results.push({
          success: false,
          method: 'websocket',
          message: 'WebSocket non disponible',
          timestamp
        });
      }

      // 3. Notification Email (asynchrone)
      try {
        await this.sendEmailNotification(data);
        results.push({
          success: true,
          method: 'email',
          message: 'Email de notification envoyé',
          timestamp
        });
      } catch (emailError) {
        console.warn('⚠️ Notification Email échouée:', emailError);
        results.push({
          success: false,
          method: 'email',
          message: 'Service email temporairement indisponible',
          timestamp
        });
      }

      // 4. Notification SMS (optionnelle)
      try {
        await this.sendSMSNotification(data);
        results.push({
          success: true,
          method: 'sms',
          message: 'SMS de notification envoyé',
          timestamp
        });
      } catch (smsError) {
        console.warn('⚠️ Notification SMS échouée:', smsError);
        results.push({
          success: false,
          method: 'sms',
          message: 'Service SMS temporairement indisponible',
          timestamp
        });
      }

      console.log('✅ Notifications pressing terminées:', results);
      return results;

    } catch (error) {
      console.error('❌ Erreur lors des notifications pressing:', error);
      results.push({
        success: false,
        method: 'general',
        message: `Erreur générale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        timestamp
      });
      return results;
    }
  }

  /**
   * Notification WebSocket en temps réel
   */
  private async sendWebSocketNotification(data: NotificationData): Promise<void> {
    // TODO: Implémenter WebSocket pour notifications temps réel
    console.log('🔌 WebSocket notification (à implémenter):', {
      channel: `pressing_${data.pressingId}`,
      event: 'new_order',
      payload: {
        orderId: data.orderId,
        customerName: data.customerName,
        totalAmount: data.totalAmount,
        servicesCount: data.servicesCount,
        timestamp: new Date().toISOString()
      }
    });

    // Simulation pour l'instant
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Notification par email
   */
  private async sendEmailNotification(data: NotificationData): Promise<void> {
    try {
      const emailPayload = {
        pressingId: data.pressingId,
        subject: `Nouvelle commande #${data.orderReference || data.orderId}`,
        template: 'new_order',
        data: {
          pressingName: data.pressingName,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          totalAmount: data.totalAmount,
          servicesCount: data.servicesCount,
          orderId: data.orderId,
          orderReference: data.orderReference,
          collectionDateTime: data.collectionDateTime,
          deliveryAddress: data.deliveryAddress
        }
      };

      console.log('📧 Email notification (à implémenter):', emailPayload);

      // TODO: Appel API backend pour envoi email
      // const response = await fetch(`${this.baseUrl}/notifications/email`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify(emailPayload)
      // });

      // Simulation pour l'instant
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error('❌ Erreur notification email:', error);
      throw error;
    }
  }

  /**
   * Notification par SMS
   */
  private async sendSMSNotification(data: NotificationData): Promise<void> {
    try {
      const smsPayload = {
        pressingId: data.pressingId,
        message: `Nouvelle commande GeopressCi: ${data.customerName} - ${data.totalAmount} FCFA. Consultez votre tableau de bord.`,
        data: {
          orderId: data.orderId,
          customerName: data.customerName,
          totalAmount: data.totalAmount
        }
      };

      console.log('📱 SMS notification (à implémenter):', smsPayload);

      // TODO: Appel API backend pour envoi SMS
      // const response = await fetch(`${this.baseUrl}/notifications/sms`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify(smsPayload)
      // });

      // Simulation pour l'instant
      await new Promise(resolve => setTimeout(resolve, 150));

    } catch (error) {
      console.error('❌ Erreur notification SMS:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut des services de notification
   */
  async checkNotificationServices(): Promise<{
    websocket: boolean;
    email: boolean;
    sms: boolean;
  }> {
    return {
      websocket: false, // TODO: Vérifier connexion WebSocket
      email: false,     // TODO: Vérifier service email
      sms: false        // TODO: Vérifier service SMS
    };
  }
}

// Instance singleton
export const notificationService = new NotificationService();
