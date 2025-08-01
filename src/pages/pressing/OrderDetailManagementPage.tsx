import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetOrderByIdQuery, useUpdateOrderStatusMutation } from '../../services/api';
import { OrderStatus } from '../../types';

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

  const { data: orderResponse, isLoading, error, refetch } = useGetOrderByIdQuery(id!);
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const order = orderResponse;

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
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
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

  const currentStatus = ORDER_STATUSES[order.status as OrderStatus] || ORDER_STATUSES[OrderStatus.EN_ATTENTE];
  const StatusIcon = currentStatus.icon;

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
                  Commande #{order.orderNumber}
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
                      disabled={isUpdating || order.status === status}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors
                        ${order.status === status 
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
                {(order.articles || order.items)?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {item.service || item.serviceName || `Service #${index + 1}`}
                      </h3>
                      <p className="text-sm text-gray-600">Quantité: {item.quantite || item.quantity}</p>
                      {item.instructions && (
                        <p className="text-xs text-gray-500 mt-1">{item.instructions}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {((item.prixUnitaire || item.price || 0) * (item.quantite || item.quantity || 0)).toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold text-green-600">
                  {(order.montantTotal || order.totalAmount || order.total || 0).toLocaleString()} FCFA
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
                      {typeof order.client === 'object' ? `${order.client?.nom || ''} ${order.client?.prenom || ''}` : 'Client'}
                    </p>
                  </div>
                </div>
                {(typeof order.client === 'object' ? order.client?.telephone : null) && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-500 mr-3" />
                    <div className="flex-1">
                      <p className="text-gray-600">{typeof order.client === 'object' ? order.client?.telephone : ''}</p>
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
