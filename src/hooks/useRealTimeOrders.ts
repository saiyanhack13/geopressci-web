import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/types';
import { realtimeService, OrderUpdate } from '../services/realtimeService';
import { toast } from 'react-hot-toast';
import { Order } from '../types';

interface UseRealTimeOrdersOptions {
  autoConnect?: boolean;
  enableNotifications?: boolean;
  enableSounds?: boolean;
  orderIds?: string[];
  onOrderUpdate?: (order: OrderUpdate) => void;
  onNewOrder?: (order: any) => void;
  onOrderConfirmation?: (order: any) => void;
  onOrderStatusChange?: (orderId: string, newStatus: string, previousStatus?: string) => void;
}

interface RealTimeOrdersState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
  connectionStats: {
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    readyState: number;
  };
}

export const useRealTimeOrders = (options: UseRealTimeOrdersOptions = {}) => {
  const {
    autoConnect = true,
    enableNotifications = true,
    enableSounds = true,
    orderIds = [],
    onOrderUpdate,
    onNewOrder,
    onOrderConfirmation,
    onOrderStatusChange
  } = options;

  // État Redux pour l'authentification
  const { token, user } = useSelector((state: RootState) => state.auth);
  
  // État local
  const [state, setState] = useState<RealTimeOrdersState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: null,
    connectionStats: {
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      readyState: -1
    }
  });

  // Références pour éviter les re-renders
  const callbacksRef = useRef({ onOrderUpdate, onNewOrder, onOrderStatusChange });
  const optionsRef = useRef({ enableNotifications, enableSounds });
  
  // Mettre à jour les références
  useEffect(() => {
    callbacksRef.current = { onOrderUpdate, onNewOrder, onOrderStatusChange };
    optionsRef.current = { enableNotifications, enableSounds };
  });

  // Gestionnaires d'événements WebSocket
  const handleConnected = useCallback(() => {
    console.log('🟢 WebSocket connecté pour les commandes');
    setState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      error: null,
      lastUpdate: new Date(),
      connectionStats: realtimeService.getConnectionStats()
    }));

    // S'abonner aux mises à jour des commandes spécifiques
    if (orderIds.length > 0) {
      realtimeService.subscribeToOrderUpdates(orderIds);
    }

    if (optionsRef.current.enableNotifications) {
      toast.success('🔄 Mises à jour en temps réel activées', {
        duration: 3000,
        id: 'realtime-connected'
      });
    }
  }, [orderIds]);

  const handleDisconnected = useCallback((data: any) => {
    console.log('🔴 WebSocket déconnecté:', data);
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: data.reason || 'Connexion fermée',
      connectionStats: realtimeService.getConnectionStats()
    }));

    if (optionsRef.current.enableNotifications && data.code !== 1000) {
      toast.error('❌ Connexion temps réel perdue', {
        duration: 4000,
        id: 'realtime-disconnected'
      });
    }
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('❌ Erreur WebSocket:', error);
    setState(prev => ({
      ...prev,
      isConnecting: false,
      error: error.message || 'Erreur de connexion',
      connectionStats: realtimeService.getConnectionStats()
    }));

    if (optionsRef.current.enableNotifications) {
      toast.error('❌ Erreur de connexion temps réel', {
        duration: 4000,
        id: 'realtime-error'
      });
    }
  }, []);

  const handleNewOrder = useCallback((data: any) => {
    console.log('📦 Nouvelle commande reçue:', data);
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
    
    if (callbacksRef.current.onNewOrder) {
      callbacksRef.current.onNewOrder(data);
    }

    // Notification spécifique selon le rôle
    if (user?.role === 'pressing' && optionsRef.current.enableNotifications) {
      toast.success(`🆕 Nouvelle commande: ${data.orderNumber}`, {
        duration: 6000,
        icon: '📦'
      });
    }
  }, [user?.role]);

  const handleOrderStatusUpdate = useCallback((data: OrderUpdate) => {
    console.log('🔄 Statut de commande mis à jour:', data);
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
    
    if (callbacksRef.current.onOrderUpdate) {
      callbacksRef.current.onOrderUpdate(data);
    }

    if (callbacksRef.current.onOrderStatusChange) {
      callbacksRef.current.onOrderStatusChange(data.orderId, data.status, data.previousStatus);
    }

    // Notifications contextuelles selon le statut
    if (optionsRef.current.enableNotifications) {
      const statusMessages = {
        'confirmed': '✅ Votre commande a été confirmée',
        'in_progress': '🔄 Votre commande est en cours de traitement',
        'ready': '📦 Votre commande est prête',
        'out_for_delivery': '🚚 Votre commande est en livraison',
        'delivered': '✅ Votre commande a été livrée',
        'cancelled': '❌ Votre commande a été annulée'
      };

      const message = statusMessages[data.status as keyof typeof statusMessages];
      if (message) {
        toast.success(`${message} - ${data.orderNumber}`, {
          duration: 5000
        });
      }
    }
  }, []);

  const handleOrderUpdated = useCallback((data: OrderUpdate) => {
    console.log('📝 Commande mise à jour:', data);
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
    
    if (callbacksRef.current.onOrderUpdate) {
      callbacksRef.current.onOrderUpdate(data);
    }
  }, []);

  const handleOrderPickupReady = useCallback((data: OrderUpdate) => {
    console.log('📦 Commande prête pour retrait:', data);
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
    
    if (callbacksRef.current.onOrderUpdate) {
      callbacksRef.current.onOrderUpdate(data);
    }

    if (optionsRef.current.enableNotifications) {
      const serviceTypeText = data.serviceType === 'store_pickup' ? 'retrait en magasin' : 'retrait';
      toast.success(`📦 Votre commande ${data.orderNumber} est prête pour ${serviceTypeText}!`, {
        duration: 8000,
        icon: '✅'
      });
    }
  }, []);

  const handleOrderDeliveryAssigned = useCallback((data: OrderUpdate) => {
    console.log('🚚 Livreur assigné:', data);
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
    
    if (callbacksRef.current.onOrderUpdate) {
      callbacksRef.current.onOrderUpdate(data);
    }

    if (optionsRef.current.enableNotifications) {
      toast.success(`🚚 Un livreur a été assigné à votre commande ${data.orderNumber}`, {
        duration: 6000
      });
    }
  }, []);

  const handleOrderFeeUpdated = useCallback((data: OrderUpdate) => {
    console.log('💰 Frais mis à jour:', data);
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
    
    if (callbacksRef.current.onOrderUpdate) {
      callbacksRef.current.onOrderUpdate(data);
    }

    if (optionsRef.current.enableNotifications) {
      const feeMessage = data.deliveryFee === 0 && data.serviceFee === 0 
        ? 'Frais de livraison et de service supprimés' 
        : `Frais mis à jour: ${data.totalAmount} FCFA`;
      
      toast.success(`💰 ${feeMessage}`, {
        duration: 5000,
        icon: '💸'
      });
    }
  }, []);

  const connectToRealTime = useCallback(async () => {
    if (!token || state.isConnecting) return;
    
    try {
      setState(prev => ({ ...prev, isConnecting: true }));
      await realtimeService.connect(token);
      setState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }));
      
      console.log('🟢 Connexion temps réel établie');
      
      if (optionsRef.current.enableNotifications) {
        toast.success('Connexion temps réel activée', {
          duration: 3000,
          icon: '🔗'
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur connexion temps réel:', error);
      setState(prev => ({ ...prev, isConnecting: false, error: error.message }));
      
      if (optionsRef.current.enableNotifications) {
        toast.error('Erreur de connexion temps réel');
      }
    }
  }, [token, state.isConnecting]);

  // Connexion automatique
  useEffect(() => {
    if (autoConnect && token && !state.isConnected && !state.isConnecting) {
      connectToRealTime();
    }
  }, [autoConnect, token, state.isConnected, state.isConnecting]);

  // Configuration des listeners
  useEffect(() => {
    // Ajouter les listeners
    realtimeService.on('connected', handleConnected);
    realtimeService.on('disconnected', handleDisconnected);
    realtimeService.on('error', handleError);
    realtimeService.on('new_order', handleNewOrder);
    realtimeService.on('order_status_update', handleOrderStatusUpdate);
    realtimeService.on('order_updated', handleOrderUpdated);
    realtimeService.on('order_pickup_ready', handleOrderPickupReady);
    realtimeService.on('order_delivery_assigned', handleOrderDeliveryAssigned);
    realtimeService.on('order_fee_updated', handleOrderFeeUpdated);

    // Nettoyage
    return () => {
      realtimeService.off('connected', handleConnected);
      realtimeService.off('disconnected', handleDisconnected);
      realtimeService.off('error', handleError);
      realtimeService.off('new_order', handleNewOrder);
      realtimeService.off('order_status_update', handleOrderStatusUpdate);
      realtimeService.off('order_updated', handleOrderUpdated);
      realtimeService.off('order_pickup_ready', handleOrderPickupReady);
      realtimeService.off('order_delivery_assigned', handleOrderDeliveryAssigned);
      realtimeService.off('order_fee_updated', handleOrderFeeUpdated);
    };
  }, [
    handleConnected,
    handleDisconnected,
    handleError,
    handleNewOrder,
    handleOrderStatusUpdate,
    handleOrderUpdated,
    handleOrderPickupReady,
    handleOrderDeliveryAssigned,
    handleOrderFeeUpdated
  ]);

  // S'abonner aux commandes spécifiques
  useEffect(() => {
    if (state.isConnected && orderIds.length > 0) {
      realtimeService.subscribeToOrderUpdates(orderIds);
    }
  }, [state.isConnected, orderIds]);

  // Méthodes publiques
  const connect = useCallback(async () => {
    if (!token) {
      throw new Error('Token d\'authentification requis');
    }
    
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      await realtimeService.connect(token);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message
      }));
      throw error;
    }
  }, [token]);

  const disconnect = useCallback(() => {
    realtimeService.disconnect();
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null
    }));
  }, []);

  const subscribeToOrders = useCallback((newOrderIds: string[]) => {
    if (realtimeService.isConnected()) {
      realtimeService.subscribeToOrderUpdates(newOrderIds);
    }
  }, []);

  const notifyServiceTypeChange = useCallback((orderId: string, serviceType: 'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff') => {
    if (realtimeService.isConnected()) {
      realtimeService.notifyServiceTypeChange(orderId, serviceType);
    }
  }, []);

  const requestFeeUpdate = useCallback((orderId: string, serviceType: string) => {
    if (realtimeService.isConnected()) {
      realtimeService.requestFeeUpdate(orderId, serviceType);
    }
  }, []);

  const notifyCustomerArrival = useCallback((orderId: string, location?: { lat: number; lng: number }) => {
    if (realtimeService.isConnected()) {
      realtimeService.notifyCustomerArrival(orderId, location);
    }
  }, []);

  return {
    // État
    ...state,
    
    // Données
    orders: [], // Liste des commandes (à implémenter selon les besoins)
    notifications: [], // Liste des notifications (à implémenter selon les besoins)
    
    // Méthodes
    connect,
    disconnect,
    subscribeToOrders,
    notifyServiceTypeChange,
    requestFeeUpdate,
    notifyCustomerArrival,
    
    // Utilitaires
    retry: connect,
    isReady: state.isConnected && !state.isConnecting,
    connectionStats: {
      reconnectAttempts: state.connectionStats.reconnectAttempts,
      maxReconnectAttempts: state.connectionStats.maxReconnectAttempts,
      readyState: state.connectionStats.readyState
    }
  };
};

export default useRealTimeOrders;
