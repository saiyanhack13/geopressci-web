import React from 'react';
import { FrontendOrderStatus } from '../../types/order';

interface BusinessOrderCardProps {
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    items: Array<{
      type: string;
      quantity: number;
      price: number;
    }>;
    status: FrontendOrderStatus;
    totalAmount: number;
    createdAt: string;
    pickupDate?: string;
    deliveryDate?: string;
    notes?: string;
  };
  onStatusChange: (orderId: string, newStatus: string) => void;
  onViewDetails: (orderId: string) => void;
  onPrintLabel: (orderId: string) => void;
  onContactCustomer: (orderId: string) => void;
}

const BusinessOrderCard: React.FC<BusinessOrderCardProps> = ({
  order,
  onStatusChange,
  onViewDetails,
  onPrintLabel,
  onContactCustomer
}) => {
  const statusConfig: Record<FrontendOrderStatus, {
    label: string;
    icon: string;
    color: string;
    nextStatus: FrontendOrderStatus | null;
  }> = {
    nouveau: { 
      label: 'Nouveau', 
      icon: '🆕', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      nextStatus: 'en_cours'
    },
    en_cours: { 
      label: 'En cours', 
      icon: '⚡', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      nextStatus: 'pret'
    },
    pret: { 
      label: 'Prêt', 
      icon: '✅', 
      color: 'bg-green-100 text-green-800 border-green-200',
      nextStatus: 'livre'
    },
    livre: { 
      label: 'Livré', 
      icon: '🎉', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      nextStatus: null
    }
  };

  const currentStatus = statusConfig[order.status];
  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg">#{order.id.slice(-6)}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${currentStatus.color}`}>
            {currentStatus.icon} {currentStatus.label}
          </span>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-green-600">{(order.totalAmount || 0).toLocaleString()} FCFA</p>
          <p className="text-xs text-gray-500">{itemsCount} article{itemsCount > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-3">
        <p className="font-medium text-gray-900">{order.customerName}</p>
        <p className="text-sm text-gray-600">📞 {order.customerPhone}</p>
        <p className="text-xs text-gray-500">
          Créé le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Items Summary */}
      <div className="mb-3">
        <div className="text-sm text-gray-600">
          {order.items.slice(0, 2).map((item, index) => (
            <span key={index}>
              {item.quantity}x {item.type}
              {index < Math.min(order.items.length, 2) - 1 ? ', ' : ''}
            </span>
          ))}
          {order.items.length > 2 && (
            <span className="text-gray-400"> +{order.items.length - 2} autres</span>
          )}
        </div>
      </div>

      {/* Dates */}
      {(order.pickupDate || order.deliveryDate) && (
        <div className="mb-3 text-xs text-gray-500">
          {order.pickupDate && (
            <p>📅 Collecte: {new Date(order.pickupDate).toLocaleDateString('fr-FR')}</p>
          )}
          {order.deliveryDate && (
            <p>🚚 Livraison: {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</p>
          )}
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            💬 {order.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {currentStatus.nextStatus && (
          <button
            onClick={() => onStatusChange(order.id, currentStatus.nextStatus!)}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {currentStatus.nextStatus === 'en_cours' && '▶️ Commencer'}
            {currentStatus.nextStatus === 'pret' && '✅ Marquer prêt'}
            {currentStatus.nextStatus === 'livre' && '🎉 Marquer livré'}
          </button>
        )}
        
        <button
          onClick={() => onViewDetails(order.id)}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
        >
          👁️ Détails
        </button>
        
        <button
          onClick={() => onPrintLabel(order.id)}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
        >
          🏷️ Étiquette
        </button>
        
        <button
          onClick={() => onContactCustomer(order.id)}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
        >
          💬 Contacter
        </button>
      </div>
    </div>
  );
};

export default BusinessOrderCard;
