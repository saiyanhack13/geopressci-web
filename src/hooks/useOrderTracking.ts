import { useEffect, useRef, useState } from 'react';
import { Order, OrderStatus } from '../types';

interface OrderTrackingUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
  message?: string;
}

interface UseOrderTrackingOptions {
  orderId?: string;
  enabled?: boolean;
  onUpdate?: (update: OrderTrackingUpdate) => void;
}

export const useOrderTracking = ({ 
  orderId, 
  enabled = true, 
  onUpdate 
}: UseOrderTrackingOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<OrderTrackingUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!enabled || !orderId) return;

    try {
      // Utilise ws:// pour le développement local, wss:// pour la production
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws/orders/${orderId}/tracking`
        : `ws://localhost:5002/ws/orders/${orderId}/tracking`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connecté pour le tracking de la commande:', orderId);
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const update: OrderTrackingUpdate = JSON.parse(event.data);
          setLastUpdate(update);
          onUpdate?.(update);
        } catch (err) {
          console.error('Erreur lors du parsing du message WebSocket:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket fermé:', event.code, event.reason);
        setIsConnected(false);
        
        // Tentative de reconnexion automatique pour les connexions mobiles instables
        if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Tentative de reconnexion dans ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        setError('Erreur de connexion au service de tracking');
      };

    } catch (err) {
      console.error('Erreur lors de la création de la connexion WebSocket:', err);
      setError('Impossible de se connecter au service de tracking');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setLastUpdate(null);
    setError(null);
    reconnectAttempts.current = 0;
  };

  useEffect(() => {
    if (enabled && orderId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [orderId, enabled]);

  return {
    isConnected,
    lastUpdate,
    error,
    reconnect: connect,
    disconnect,
  };
};
