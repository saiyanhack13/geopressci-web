import React, { useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetOrderByIdQuery, useGetCurrentUserQuery, useUpdateOrderStatusMutation } from '../../services/api';
import { Clock, Package, Truck, CheckCircle, AlertCircle, MapPin, Phone, ArrowLeft, ExternalLink, Navigation, MessageCircle, Calendar, CreditCard, User, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

import { Order, OrderStatus, OrderItem, MobileMoneyProvider, PaymentStatus } from '../../types';
import { useRealTimeOrders } from '../../hooks/useRealTimeOrders';
import ServiceMethodSelector from '../../components/order/ServiceMethodSelector';

// Configuration des statuts pour l'affichage
const statusConfig = {
  [OrderStatus.EN_ATTENTE]: { 
    text: 'En attente', 
    icon: <Clock className="w-5 h-5" />, 
    color: 'text-orange-500',
    bgColor: 'bg-orange-100'
  },
  [OrderStatus.CONFIRMEE]: { 
    text: 'Confirmée', 
    icon: <CheckCircle className="w-5 h-5" />, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  [OrderStatus.COLLECTEE]: { 
    text: 'Collectée', 
    icon: <Package className="w-5 h-5" />, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  [OrderStatus.EN_TRAITEMENT]: { 
    text: 'En cours de traitement', 
    icon: <Package className="w-5 h-5" />, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  [OrderStatus.TRAITEMENT_TERMINE]: { 
    text: 'Traitement terminé', 
    icon: <CheckCircle className="w-5 h-5" />, 
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  [OrderStatus.LIVRAISON_PLANIFIEE]: { 
    text: 'Livraison planifiée', 
    icon: <Truck className="w-5 h-5" />, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-100'
  },
  [OrderStatus.EN_LIVRAISON]: { 
    text: 'En cours de livraison', 
    icon: <Truck className="w-5 h-5" />, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-100'
  },
  [OrderStatus.LIVREE]: { 
    text: 'Livrée', 
    icon: <CheckCircle className="w-5 h-5" />, 
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  [OrderStatus.ANNULEE]: { 
    text: 'Annulée', 
    icon: <AlertCircle className="w-5 h-5" />, 
    color: 'text-red-500',
    bgColor: 'bg-red-100'
  },
  [OrderStatus.RETOURNEE]: { 
    text: 'Retournée', 
    icon: <AlertCircle className="w-5 h-5" />, 
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100'
  },
};

// Exemple d'ordre pour référence locale
const mockOrder: Order = {
  id: 'CMD-ABJ-12345',
  orderNumber: 'CMD-ABJ-12345',
  status: OrderStatus.EN_LIVRAISON,
  createdAt: '2024-07-18T14:30:00Z',
  updatedAt: '2024-07-18T14:30:00Z',
  client: 'user-123',
  pressing: 'pressing-1',
  items: [
    { 
      serviceId: 'service-1', 
      serviceName: 'Nettoyage à sec', 
      quantity: 3, 
      price: 2500,
      total: 7500
    },
  ],
  totalAmount: 7500,
  fees: {
    delivery: 500,
    service: 0,
    total: 600
  },
  deliveryAddress: 'Cocody, Abidjan',
  estimatedDelivery: '2024-03-15T14:00:00Z',
  trackingHistory: [
    { status: OrderStatus.EN_ATTENTE, timestamp: '2024-07-18T10:30:00Z', notes: 'Commande reçue' },
    { status: OrderStatus.EN_TRAITEMENT, timestamp: '2024-07-18T12:45:00Z', notes: 'Traitement en cours' },
    { status: OrderStatus.EN_LIVRAISON, timestamp: '2024-07-18T14:30:00Z', notes: 'En cours de livraison' },
  ],
};

const OrderStatusStepper: React.FC<{ currentStatus: OrderStatus }> = ({ currentStatus }) => {
  // Définir l'ordre des statuts pour la barre de progression
  const statusFlow: OrderStatus[] = [
    OrderStatus.EN_ATTENTE,
    OrderStatus.CONFIRMEE,
    OrderStatus.COLLECTEE,
    OrderStatus.EN_TRAITEMENT,
    OrderStatus.TRAITEMENT_TERMINE,
    OrderStatus.EN_LIVRAISON,
    OrderStatus.LIVREE
  ];
  
  const currentIndex = statusFlow.indexOf(currentStatus);
  
  // Si le statut actuel n'est pas dans le flux standard, on l'ajoute à la fin
  if (currentIndex === -1 && currentStatus === OrderStatus.ANNULEE) {
    statusFlow.push(OrderStatus.ANNULEE);
  }

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex items-center">
        {statusFlow.map((status, index) => {
          const statusInfo = statusConfig[status as keyof typeof statusConfig];
          const isActive = index <= currentIndex || (currentStatus === OrderStatus.ANNULEE && index === statusFlow.length - 1);
          
          return (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive 
                      ? `${statusInfo.color.replace('text-', 'bg-').replace('-500', '-100')} text-white` 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                  {statusInfo.icon}
                </div>
                <p className={`mt-2 text-xs text-center ${
                  isActive ? 'font-bold text-gray-800' : 'text-gray-500'
                }`}>
                  {statusInfo.text}
                </p>
              </div>
              {index < statusFlow.length - 1 && (
                <div className={`flex-1 h-1 ${isActive ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Récupérer les données
  const { data: currentUser } = useGetCurrentUserQuery();
  const { data: orderResponse, isLoading, error, refetch } = useGetOrderByIdQuery(id!, {
    pollingInterval: 30000, // Rafraîchissement automatique toutes les 30 secondes
    refetchOnFocus: true
  });
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  
  // Extraire la commande de la réponse
  const order = (orderResponse as any)?.data || orderResponse;
  
  // Hook temps réel pour les notifications et mises à jour
  const { 
    isConnected, 
    notifyServiceTypeChange,
    requestFeeUpdate 
  } = useRealTimeOrders({
    orderIds: id ? [id] : [],
    onOrderUpdate: () => {
      // Rafraîchir les données quand une mise à jour arrive
      refetch();
    },
    onOrderStatusChange: (orderId, newStatus) => {
      if (orderId === id) {
        // Rafraîchir les données pour le nouveau statut
        refetch();
      }
    }
  });
  
  // Gérer les différents formats de statut (backend vs frontend)
  const orderStatus = order?.statut || order?.status || 'en_attente';
  const currentStatus = statusConfig[orderStatus as OrderStatus] || statusConfig[OrderStatus.EN_ATTENTE];
  
  // Fonction pour mettre à jour le statut de la commande
  const handleStatusUpdate = useCallback(async (newStatus: OrderStatus) => {
    if (!order?._id) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateOrderStatus({ id: order._id, status: newStatus as any }).unwrap();
      toast.success(`Statut mis à jour: ${newStatus}`);
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
      console.error('Erreur mise à jour statut:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [order?._id, updateOrderStatus, refetch]);
  
  // Fonction pour ouvrir la carte avec l'adresse de livraison
  const handleOpenMap = useCallback(() => {
    if (order?.deliveryLocation) {
      const { latitude, longitude } = order.deliveryLocation;
      // Utiliser Mapbox pour l'affichage de carte (plus précis pour l'Afrique)
      const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${longitude},${latitude})/${longitude},${latitude},15/600x400@2x?access_token=pk.eyJ1IjoiZG9sa28xMyIsImEiOiJjbWU1eXZhOGoweWJ4MmpzY2Z5cmNxZ2N5In0.ju34YgThquClMpMP-HQwyA`;
      // Fallback vers OpenStreetMap
      const fallbackUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15#map=15/${latitude}/${longitude}`;
      window.open(mapUrl, '_blank');
    } else if (order?.adresseLivraison) {
      // Utiliser OpenStreetMap pour la recherche d'adresse (plus fiable que Google pour l'Afrique)
      const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(order.adresseLivraison)}#map=15/5.36/-4.01`;
      // Alternative Mapbox pour géocodage
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(order.adresseLivraison)}.json?access_token=pk.eyJ1IjoiZG9sa28xMyIsImEiOiJjbWU1eXZhOGoweWJ4MmpzY2Z5cmNxZ2N5In0.ju34YgThquClMpMP-HQwyA&country=ci&proximity=-4.01,5.36`;
      window.open(mapUrl, '_blank');
    }
  }, [order]);
  
  // Fonction pour obtenir l'itinéraire
  const handleGetDirections = useCallback(() => {
    if (order?.deliveryLocation) {
      const { latitude, longitude } = order.deliveryLocation;
      // Utiliser OpenStreetMap pour les directions (gratuit et précis)
      const directionsUrl = `https://www.openstreetmap.org/directions?to=${latitude},${longitude}#map=15/${latitude}/${longitude}`;
      // Alternative Mapbox pour directions
      const mapboxDirectionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/-4.01,5.36;${longitude},${latitude}?geometries=geojson&access_token=pk.eyJ1IjoiZG9sa28xMyIsImEiOiJjbWU1eXZhOGoweWJ4MmpzY2Z5cmNxZ2N5In0.ju34YgThquClMpMP-HQwyA`;
      window.open(directionsUrl, '_blank');
    }
  }, [order]);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Commande introuvable</h2>
          <p className="text-gray-600 mb-8">La commande que vous recherchez n'existe pas ou a été supprimée.</p>
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null; // ou un autre état vide
  }

  // Debug: Afficher les données reçues
  console.log('🔍 Données de commande reçues:', order);
  console.log('📋 Articles:', order.items);
  console.log('🏢 Pressing populé:', order.pressing);
  console.log('📦 Metadata pressingSnapshot:', order.metadata?.pressingSnapshot);
  console.log('💰 Payment:', order.payment);

  // Récupérer la configuration du statut actuel
  const currentStatusConfig = statusConfig[order.status as keyof typeof statusConfig] || {
    text: order.status,
    icon: <Package className="w-5 h-5" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100'
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec navigation */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Commande #{order.orderNumber || order.reference || order._id}
                  </h1>
                  {/* Indicateur de connexion temps réel */}
                  <div className="flex items-center mt-2">
                    {isConnected ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <Wifi className="w-4 h-4 mr-1" />
                        <span>Connecté en temps réel</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 text-sm">
                        <WifiOff className="w-4 h-4 mr-1" />
                        <span>Connexion temps réel indisponible</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${currentStatus.bgColor} ${currentStatus.color}`}>
                  {currentStatus.icon}
                  <span className="ml-2">
                    {currentStatus.text}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mt-2">
                Commandé le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          {/* Actions pour les pressings */}
          {currentUser?.role === 'pressing' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">Actions Pressing</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusUpdate(OrderStatus.CONFIRMEE)}
                  disabled={isUpdatingStatus || order.status === OrderStatus.CONFIRMEE}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ✅ Confirmer
                </button>
                <button
                  onClick={() => handleStatusUpdate(OrderStatus.COLLECTE_PLANIFIEE)}
                  disabled={isUpdatingStatus || order.status === OrderStatus.COLLECTE_PLANIFIEE}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  📅 Planifier collecte
                </button>
                <button
                  onClick={() => handleStatusUpdate(OrderStatus.COLLECTEE)}
                  disabled={isUpdatingStatus || order.status === OrderStatus.COLLECTEE}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  📦 Collecté
                </button>
                <button
                  onClick={() => handleStatusUpdate(OrderStatus.EN_TRAITEMENT)}
                  disabled={isUpdatingStatus || order.status === OrderStatus.EN_TRAITEMENT}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🔄 En traitement
                </button>
                <button
                  onClick={() => handleStatusUpdate(OrderStatus.TRAITEMENT_TERMINE)}
                  disabled={isUpdatingStatus || order.status === OrderStatus.TRAITEMENT_TERMINE}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ✨ Traitement terminé
                </button>
                <button
                  onClick={() => handleStatusUpdate(OrderStatus.EN_LIVRAISON)}
                  disabled={isUpdatingStatus || order.status === OrderStatus.EN_LIVRAISON}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🚚 En livraison
                </button>
                <button
                  onClick={() => handleStatusUpdate(OrderStatus.LIVREE)}
                  disabled={isUpdatingStatus || order.status === OrderStatus.LIVREE}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ✅ Livré
                </button>
              </div>
            </div>
          )}
          
          {/* Barre de progression */}
          <div className="pt-6 border-t">
            <OrderStatusStepper currentStatus={order.status} />
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Articles de la commande */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Articles</h2>
              <ul className="divide-y divide-gray-200">
                {(order.items || order.articles || []).map((item: any, index: number) => {
                  // Utiliser les vraies propriétés backend
                  const serviceName = item.name || item.service || item.serviceName || item.serviceDetails?.name || `Service #${index + 1}`;
                  const unitPrice = item.price || item.prixUnitaire || item.unitPrice || 0;
                  const quantity = item.quantity || item.quantite || 1;
                  const instructions = item.instructions || item.serviceDetails?.description;
                  
                  return (
                    <li key={`${item._id || item.service || item.serviceId || 'item'}-${index}`} className="py-4 flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-700">{serviceName}</p>
                        <p className="text-sm text-gray-500">Quantité : {quantity}</p>
                        {instructions && (
                          <p className="text-xs text-gray-400 mt-1">{instructions}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{unitPrice.toLocaleString('fr-FR')} FCFA</p>
                        <p className="text-xs text-gray-500">Prix unitaire</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <p className="text-lg font-bold">Total</p>
                <p className="text-xl font-bold text-green-600">
                  {(order.payment?.amount?.total || order.totalAmount || order.total || 0).toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Informations de livraison avec géolocalisation */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Livraison</h2>
              <div className="flex items-start mb-4">
                <MapPin className="text-gray-500 mr-3 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Adresse</p>
                  <p className="text-gray-600 mb-2">
                    {(() => {
                      // Essayer différentes sources d'adresse
                      const address = order.delivery?.address || 
                                    order.adresseLivraison || 
                                    order.deliveryAddress ||
                                    order.metadata?.deliveryAddress;
                      
                      if (typeof address === 'object' && address !== null) {
                        // Si c'est un objet adresse, formater les champs
                        const parts = [];
                        if (address.formattedAddress) return address.formattedAddress;
                        if (address.street) parts.push(address.street);
                        if (address.city) parts.push(address.city);
                        if (address.district) parts.push(address.district);
                        if (address.country) parts.push(address.country);
                        return parts.join(', ') || 'Adresse non disponible';
                      }
                      return address || 'Adresse non disponible';
                    })()} 
                  </p>
                  
                  <div className="mt-4">
                    <p className="font-semibold text-gray-900">Date prévue</p>
                    <p className="text-gray-600">
                      {(() => {
                        const deliveryDate = order.timeSlot?.preferredDate || 
                                           order.timeSlot?.startTime ||
                                           order.delivery?.estimatedDeliveryTime ||
                                           order.estimatedDelivery;
                        
                        if (deliveryDate) {
                          return new Date(deliveryDate).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        }
                        return 'Non définie';
                      })()} 
                    </p>
                  </div>
                  
                  {/* Actions de géolocalisation pour les pressings */}
                  {currentUser?.role === 'pressing' && (order.deliveryLocation || order.adresseLivraison) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={handleOpenMap}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        Voir sur la carte
                      </button>
                      {order.deliveryLocation && (
                        <button
                          onClick={handleGetDirections}
                          className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          Itinéraire
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Informations de géolocalisation pour les pressings */}
                  {currentUser?.role === 'pressing' && order.deliveryLocation && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium text-gray-700 mb-1">Coordonnées GPS:</p>
                      <p className="text-gray-600">
                        Lat: {order.deliveryLocation.latitude.toFixed(6)}, 
                        Lng: {order.deliveryLocation.longitude.toFixed(6)}
                      </p>
                      {order.deliveryLocation.accuracy && (
                        <p className="text-gray-500 text-xs mt-1">
                          Précision: ±{order.deliveryLocation.accuracy}m
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center mb-3">
                <Calendar className="w-4 h-4 text-gray-500 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">Livraison estimée</p>
                  <p className="text-gray-600">
                    {(() => {
                      const deliveryDate = order.estimatedDelivery || order.timeSlot?.preferredDate;
                      if (deliveryDate) {
                        const date = new Date(deliveryDate);
                        const timeRange = order.timeSlot?.startTime && order.timeSlot?.endTime 
                          ? ` (${new Date(order.timeSlot.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(order.timeSlot.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`
                          : '';
                        return date.toLocaleDateString('fr-FR') + timeRange;
                      }
                      return 'Non définie';
                    })()} 
                  </p>
                </div>
              </div>
            </div>
            
            {/* Informations client pour les pressings */}
            {currentUser?.role === 'pressing' && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Informations Client</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-500 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {typeof order.customer === 'object' 
                          ? `${order.customer.prenom || ''} ${order.customer.nom || ''}`.trim() || 'Client'
                          : 'Client'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {typeof order.customer === 'object' && order.customer.telephone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-500 mr-3" />
                      <div className="flex-1">
                        <p className="text-gray-600">{order.customer.telephone}</p>
                        <a 
                          href={`tel:${order.customer.telephone}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Appeler le client
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {typeof order.customer === 'object' && order.customer.email && (
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 text-gray-500 mr-3" />
                      <div className="flex-1">
                        <p className="text-gray-600">{order.customer.email}</p>
                        <a 
                          href={`mailto:${order.customer.email}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Envoyer un email
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Informations du Pressing (pour les clients) */}
            {currentUser?.role !== 'pressing' && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Votre Pressing</h2>
                <div className="flex items-center mb-3">
                  <MapPin className="text-gray-500 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {order.metadata?.pressingSnapshot?.name || 
                       order.pressing?.nomCommerce || 
                       order.pressing?.name || 
                       'Pressing'}
                    </h3>
                    <p className="text-gray-600">
                      {order.metadata?.pressingSnapshot?.address?.formattedAddress ||
                       order.metadata?.pressingSnapshot?.address?.street ||
                       order.pressing?.adresse ||
                       'Adresse non disponible'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-500 mr-3" />
                  <p className="text-gray-600">
                    {order.metadata?.pressingSnapshot?.phone ||
                     order.pressing?.telephone ||
                     'Non disponible'}
                  </p>
                </div>
              </div>
            )}

            {/* Suivi temps réel */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                 <Truck className="w-10 h-10 text-purple-500 mx-auto mb-3"/>
                 <h2 className="text-xl font-bold text-gray-800 mb-2">Suivi en direct</h2>
                 <p className="text-gray-600 mb-4">Suivez votre livreur en temps réel sur la carte.</p>
                 <Link 
                    to={`/client/orders/${order.id}/track`}
                    className="w-full inline-block bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-300"
                 >
                    Voir la carte
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderDetailSkeleton: React.FC = () => (
  <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans animate-pulse">
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="mt-6 pt-6 border-t">
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
      {/* Contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md h-32"></div>
            <div className="bg-white p-6 rounded-lg shadow-md h-40"></div>
        </div>
      </div>
    </div>
  </div>
);

export default OrderDetailPage;

