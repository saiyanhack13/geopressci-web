import React from 'react';
import { Order, OrderStatus } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useGetCurrentUserQuery, useUpdateOrderStatusMutation } from '../../services/api';
import { Phone, MessageCircle, Printer, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderCardProps {
  order: Order;
  onViewDetails: (orderId: string) => void;
  onTrackOrder: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails, onTrackOrder }) => {
  const { data: currentUser } = useGetCurrentUserQuery();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const isPressing = currentUser?.role === 'pressing';
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
      case 'confirmee':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'collected':
      case 'collectee':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
      case 'en_traitement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready':
      case 'prete':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivering':
      case 'en_livraison':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
      case 'livree':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'annulee':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
      case 'terminee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'draft':
        return '📝';
      case 'pending':
      case 'en_attente':
        return '⏳';
      case 'confirmed':
      case 'confirmee':
        return '✅';
      case 'collected':
      case 'collectee':
        return '📦';
      case 'processing':
      case 'en_traitement':
        return '🔄';
      case 'ready':
      case 'prete':
        return '✨';
      case 'delivering':
      case 'en_livraison':
        return '🚚';
      case 'delivered':
      case 'livree':
        return '🎉';
      case 'cancelled':
      case 'annulee':
        return '❌';
      case 'completed':
      case 'terminee':
        return '✅';
      default:
        return '📋';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'pending':
      case 'en_attente':
        return 'En attente';
      case 'confirmed':
      case 'confirmee':
        return 'Confirmée';
      case 'collected':
      case 'collectee':
        return 'Collectée';
      case 'processing':
      case 'en_traitement':
        return 'En traitement';
      case 'ready':
      case 'prete':
        return 'Prête';
      case 'delivering':
      case 'en_livraison':
        return 'En livraison';
      case 'delivered':
      case 'livree':
        return 'Livrée';
      case 'cancelled':
      case 'annulee':
        return 'Annulée';
      case 'completed':
      case 'terminee':
        return 'Terminée';
      default:
        return status || 'Statut inconnu';
    }
  };

  const currentStatus = order.status || order.statut || 'draft';
  
  const canTrack = [
    'confirmed', 'confirmee',
    'collected', 'collectee', 
    'processing', 'en_traitement',
    'ready', 'prete',
    'delivering', 'en_livraison'
  ].includes(currentStatus);
  
  // Actions spécifiques aux pressings
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateOrderStatus({ 
        id: (order as any)._id || (order as any).id || '', 
        status: newStatus as any
      }).unwrap();
      toast.success(`✅ Statut mis à jour: ${getStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error('❌ Erreur lors de la mise à jour du statut');
    }
  };
  
  const handleContactCustomer = () => {
    const customer = (order as any).customer;
    const phone = customer?.telephone || customer?.phone;
    if (phone) {
      window.open(`tel:${phone}`);
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  };
  
  const handleSendMessage = () => {
    const customer = (order as any).customer;
    const phone = customer?.telephone || customer?.phone;
    if (phone) {
      const orderNumber = (order as any).orderNumber || (order as any)._id;
      const message = `Bonjour, votre commande ${orderNumber} est en cours de traitement.`;
      window.open(`sms:${phone}?body=${encodeURIComponent(message)}`);
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  };
  
  const getNextStatus = (current: string): string | null => {
    const statusFlow = {
      'draft': 'pending',
      'pending': 'confirmed',
      'confirmed': 'collected',
      'collected': 'processing',
      'processing': 'ready',
      'ready': 'delivering',
      'delivering': 'delivered',
      'delivered': 'completed'
    };
    return (statusFlow as any)[current] || null;
  };
  
  const getNextStatusLabel = (current: string): string => {
    const nextStatus = getNextStatus(current);
    if (!nextStatus) return '';
    
    const labels = {
      'pending': 'Mettre en attente',
      'confirmed': 'Confirmer',
      'collected': 'Marquer collectée',
      'processing': 'Commencer traitement',
      'ready': 'Marquer prête',
      'delivering': 'Commencer livraison',
      'delivered': 'Marquer livrée',
      'completed': 'Terminer'
    };
    return (labels as any)[nextStatus] || 'Suivant';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow">
      {/* En-tête avec numéro de commande et statut */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">
            {(order as any).orderNumber || `Commande #${((order as any)._id || '').slice(-8).toUpperCase()}`}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date((order as any).createdAt || new Date()), { 
              addSuffix: true, 
              locale: fr 
            })}
          </p>
          {/* Pressing info */}
          {(order as any).pressing && typeof (order as any).pressing === 'object' && (
            <p className="text-xs text-blue-600 mt-1">
              🏢 {((order as any).pressing as any).nomCommerce || ((order as any).pressing as any).name || 'Pressing'}
            </p>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(currentStatus)}`}>
          <span>{getStatusIcon(currentStatus)}</span>
          <span>{getStatusLabel(currentStatus)}</span>
        </div>
      </div>

      {/* Détails de la commande */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Articles:</span>
          <span className="text-sm font-medium">
            {(() => {
              const items: any[] = (order as any).items || (order as any).articles || [];
              return items.reduce((total: number, item: any) => {
                const quantity = item.quantity || item.quantite || 1;
                return total + quantity;
              }, 0);
            })()} pièce(s)
          </span>
        </div>
        
        {/* Service type */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Service:</span>
          <span className="text-sm font-medium flex items-center gap-1">
            {(order as any).serviceType === 'delivery' ? '🚚 Livraison' : 
             (order as any).serviceType === 'pickup' ? '🏢 Retrait' : 
             (order as any).serviceType === 'on_site' ? '📍 Sur place' : 'Non spécifié'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Montant total:</span>
          <span className="text-sm font-semibold text-green-600">
            {(() => {
              const payment = (order as any).payment || {};
              const amount = payment.amount || {};
              const total = amount.total || (order as any).montantTotal || (order as any).totalAmount || 0;
              return total.toLocaleString('fr-FR');
            })()} {(order as any).payment?.amount?.currency || 'XOF'}
          </span>
        </div>
        
        {/* Date de créneau si disponible */}
        {(order as any).timeSlot?.preferredDate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Créneau:</span>
            <span className="text-sm font-medium">
              {new Date((order as any).timeSlot.preferredDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {isPressing ? (
          // Actions pour les pressings
          <>
            {/* Informations client pour pressing */}
            {(order as any).customer && typeof (order as any).customer === 'object' && (
              <div className="flex items-center justify-between text-xs text-gray-600 bg-blue-50 p-2 rounded">
                <span>👤 {((order as any).customer as any).nom} {((order as any).customer as any).prenom}</span>
                <div className="flex gap-1">
                  <button
                    onClick={handleContactCustomer}
                    className="p-1 hover:bg-blue-200 rounded transition-colors"
                    title="Appeler le client"
                  >
                    <Phone className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="p-1 hover:bg-blue-200 rounded transition-colors"
                    title="Envoyer un SMS"
                  >
                    <MessageCircle className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Actions principales pressing */}
            <div className="flex gap-2">
              {getNextStatus(currentStatus) && (
                <button
                  onClick={() => handleStatusUpdate(getNextStatus(currentStatus)!)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  {getNextStatusLabel(currentStatus)}
                </button>
              )}
              
              <button
                onClick={() => onViewDetails((order as any)._id || (order as any).id || '')}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
                title="Voir détails"
              >
                <Eye className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => window.print()}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
                title="Imprimer étiquette"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          // Actions pour les clients
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails((order as any)._id || (order as any).id || '')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Voir détails
            </button>
            {canTrack && (
              <button
                onClick={() => onTrackOrder((order as any)._id || (order as any).id || '')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <span>📍</span>
                Suivre
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
