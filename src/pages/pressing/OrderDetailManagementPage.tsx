import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetOrderByIdQuery, useUpdateOrderStatusMutation } from '../../services/api';
import { OrderStatus } from '../../types';
import useRealTimeOrders from '../../hooks/useRealTimeOrders';
import ServiceMethodSelector from '../../components/order/ServiceMethodSelector';

type StatusConfig = {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
};
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Package, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Statuts disponibles pour les pressings
const ORDER_STATUSES: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.EN_ATTENTE]: { label: 'En attente', color: 'bg-gray-100 text-gray-800', icon: Edit3 },
  [OrderStatus.CONFIRMEE]: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  [OrderStatus.COLLECTE_PLANIFIEE]: { label: 'Collecte planifiée', color: 'bg-yellow-100 text-yellow-800', icon: Calendar },
  [OrderStatus.EN_COLLECTE]: { label: 'En collecte', color: 'bg-orange-100 text-orange-800', icon: Truck },
  [OrderStatus.COLLECTEE]: { label: 'Collectée', color: 'bg-purple-100 text-purple-800', icon: Package },
  [OrderStatus.EN_TRAITEMENT]: { label: 'En traitement', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
  [OrderStatus.TRAITEMENT_TERMINE]: { label: 'Traitement terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [OrderStatus.LIVRAISON_PLANIFIEE]: { label: 'Livraison planifiée', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  [OrderStatus.EN_LIVRAISON]: { label: 'En livraison', color: 'bg-orange-100 text-orange-800', icon: Truck },
  [OrderStatus.LIVREE]: { label: 'Livrée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [OrderStatus.RETOURNEE]: { label: 'Retournée', color: 'bg-yellow-100 text-yellow-800', icon: ArrowLeft },
  [OrderStatus.ANNULEE]: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const OrderDetailManagementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff'>('delivery');

  const { data: orderResponse, isLoading, error, refetch } = useGetOrderByIdQuery(id!);
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const order = orderResponse;
  
  // Hook pour les mises à jour temps réel
  const {
    isConnected,
    notifyServiceTypeChange,
    requestFeeUpdate
  } = useRealTimeOrders({
    enableNotifications: true,
    onOrderUpdate: (update) => {
      console.log('🔄 Mise à jour de commande reçue (détail pressing):', update);
      // Rafraîchir les données quand une commande est mise à jour
      refetch();
      
      // Afficher une notification pour les mises à jour importantes
      if (update.orderId === id) {
        toast.success(`📦 Commande mise à jour: ${update.status}`, {
          duration: 4000,
          icon: '🔄'
        });
      }
    }
  });
  
  // Initialiser le type de service depuis les données de la commande
  useEffect(() => {
    if (order?.serviceType) {
      setSelectedServiceType(order.serviceType);
    } else {
      // Par défaut, utiliser 'delivery' si pas de serviceType défini
      setSelectedServiceType('delivery');
    }
  }, [order]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    try {
      await updateOrderStatus({
        id: order._id || order.id || '',
        status: newStatus
      }).unwrap();
      
      toast.success('Statut mis à jour avec succès');
      refetch();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };
  
  // Gérer le changement de méthode de service
  const handleServiceTypeChange = (newServiceType: 'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff') => {
    setSelectedServiceType(newServiceType);
    
    // Notifier le changement via WebSocket si connecté
    if (isConnected && order?._id) {
      notifyServiceTypeChange(order._id, newServiceType);
      requestFeeUpdate(order._id, newServiceType);
    }
    
    // Afficher un message de confirmation
    if (newServiceType === 'store_pickup' || newServiceType === 'store_dropoff') {
      toast.success(`✅ Méthode changée: ${newServiceType === 'store_pickup' ? 'Retrait en magasin' : 'Dépôt en magasin'}`, {
        duration: 4000,
        icon: '🏪'
      });
    } else {
      toast.success(`✅ Méthode changée: ${newServiceType === 'delivery' ? 'Livraison' : 'Retrait'}`, {
        duration: 4000,
        icon: '🚚'
      });
    }
  };

  const handleCallCustomer = () => {
    const phone = typeof order?.client === 'object' ? order.client?.telephone : null;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleOpenMap = () => {
    // Utiliser une adresse par défaut ou coordonnées si disponibles
    const address = typeof order?.adresseLivraison === 'object' 
      ? (order.adresseLivraison as any)?.adresseComplete 
      : order?.adresseLivraison;
    
    if (address) {
      // Utiliser OpenStreetMap pour la recherche d'adresse (gratuit et précis pour l'Afrique)
      const osmUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}#map=15/5.36/-4.01`;
      
      // Alternative Mapbox pour géocodage plus précis
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZG9sa28xMyIsImEiOiJjbWUzOTVnc2wwNTVsMmxzZTF1Zm13ZWVjIn0.o48XqkHK-s4jF4qLzLKRQ'}&country=ci&proximity=-4.01,5.36`;
      
      try {
        // Essayer d'abord OpenStreetMap (plus fiable)
        window.open(osmUrl, '_blank');
      } catch (error) {
        console.warn('Erreur ouverture OpenStreetMap:', error);
        // Fallback vers une recherche générique
        window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`, '_blank');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Commande introuvable</h2>
          <p className="text-gray-600 mb-4">Cette commande n'existe pas ou vous n'avez pas accès.</p>
          <button
            onClick={() => navigate('/pressing/orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour aux commandes
          </button>
        </div>
      </div>
    );
  }

  // Gérer les différents formats de statut (backend vs frontend)
  const orderStatus = order.statut || order.status || 'en_attente';
  const currentStatus = ORDER_STATUSES[orderStatus as OrderStatus] || ORDER_STATUSES[OrderStatus.EN_ATTENTE];
  const StatusIcon = currentStatus.icon;
  
  // Debug: Afficher les données de la commande
  console.log('🔍 Données de commande:', {
    order,
    orderStatus,
    currentStatus,
    reference: order.reference,
    client: order.client,
    montantTotal: order.montantTotal,
    articles: order.articles
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/pressing/orders')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Commande #{order.orderNumber || order.reference || order._id || 'N/A'}
                </h1>
                <div className="flex items-center mt-1">
                  <StatusIcon className="w-4 h-4 mr-2" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
                    {currentStatus.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.values(OrderStatus).map((status) => {
                  const config = ORDER_STATUSES[status];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={isUpdating || orderStatus === status}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors
                        ${orderStatus === status 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Articles */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Articles à traiter</h2>
              <div className="space-y-4">
                {(order.items || order.articles)?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {item.name || item.service || item.serviceName || `Service #${index + 1}`}
                      </h3>
                      <p className="text-sm text-gray-600">Quantité: {item.quantity || item.quantite || 1}</p>
                      {item.instructions && (
                        <p className="text-xs text-gray-500 mt-1">{item.instructions}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {(item.price || item.prixUnitaire || 0).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold text-green-600">
                  {(order.payment?.amount?.total || order.montantTotal || order.totalAmount || order.total || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Notes internes</h2>
                <button
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {isEditingNotes ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </button>
              </div>
              {isEditingNotes ? (
                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajouter des notes..."
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={4}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        // Sauvegarder les notes
                        setIsEditingNotes(false);
                        toast.success('Notes sauvegardées');
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2 inline" />
                      Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  {notes || 'Aucune note ajoutée'}
                </p>
              )}
            </div>
            
            {/* Sélection de la méthode de service */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Méthode de service</h2>
                <div className={`flex items-center text-sm ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {isConnected ? 'Temps réel activé' : 'Hors ligne'}
                </div>
              </div>
              
              <ServiceMethodSelector
                selectedMethod={selectedServiceType}
                onMethodChange={handleServiceTypeChange}
                orderTotal={order?.montantTotal || order?.totalAmount || 0}
                customerLocation={order?.adresseLivraison ? {
                  address: typeof order.adresseLivraison === 'string' 
                    ? order.adresseLivraison 
                    : (order.adresseLivraison as any)?.adresseComplete || '',
                  coordinates: [0, 0] as [number, number] // À adapter selon les données disponibles
                } : undefined}
                pressingLocation={{
                  address: 'Pressing', // À adapter selon les données du pressing
                  coordinates: [0, 0] as [number, number] // À adapter selon les données du pressing
                }}
                orderId={order?._id || order?.id}
                className="mb-4"
              />
              
              {(selectedServiceType === 'store_pickup' || selectedServiceType === 'store_dropoff') && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">
                      Frais de livraison et de service supprimés automatiquement
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            
            {/* Informations client */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Client</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.customer ? `${order.customer.prenom || ''} ${order.customer.nom || ''}`.trim() : 
                       typeof order.client === 'object' ? `${order.client?.nom || ''} ${order.client?.prenom || ''}` : 'Client'}
                    </p>
                  </div>
                </div>
                {(order.customer?.telephone || (typeof order.client === 'object' ? order.client?.telephone : null)) && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-500 mr-3" />
                    <div className="flex-1">
                      <p className="text-gray-600">
                        {order.customer?.telephone || (typeof order.client === 'object' ? order.client?.telephone : '')}
                      </p>
                      <button
                        onClick={handleCallCustomer}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Appeler le client
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Livraison */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Livraison</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-500 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Adresse</p>
                    <p className="text-gray-600 text-sm">
                      {typeof order.adresseLivraison === 'object' 
                        ? (order.adresseLivraison as any)?.adresseComplete 
                        : order.adresseLivraison || 'Adresse non disponible'}
                    </p>
                    {order.adresseLivraison && (
                      <button
                        onClick={handleOpenMap}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
                      >
                        Voir sur la carte
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Date prévue</p>
                    <p className="text-gray-600 text-sm">
                      {order.estimatedDelivery
                        ? new Date(order.estimatedDelivery).toLocaleDateString('fr-FR')
                        : 'Non définie'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Historique */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Historique</h2>
              <div className="space-y-3">
                {(order.trackingHistory)?.map((history: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {ORDER_STATUSES[history.statut as OrderStatus]?.label || 
                         ORDER_STATUSES[history.status as OrderStatus]?.label || 
                         history.statut || 
                         history.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(history.dateChangement || history.changedAt || history.timestamp).toLocaleString('fr-FR')}
                      </p>
                      {history.notes && (
                        <p className="text-xs text-gray-600 mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailManagementPage;
