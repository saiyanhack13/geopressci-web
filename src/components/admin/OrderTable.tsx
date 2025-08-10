import React from 'react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pressingName: string;
  pressingLocation: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  scheduledDate: string;
  deliveryDate?: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  items: {
    type: string;
    quantity: number;
    price: number;
  }[];
  issues?: {
    type: 'delay' | 'quality' | 'payment' | 'other';
    description: string;
    reportedAt: string;
  }[];
}

interface OrderTableProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onOrderAction: (orderId: string, action: 'confirm' | 'cancel' | 'priority_up' | 'priority_down' | 'resolve_issue') => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  selectedOrders,
  onSelectionChange,
  onOrderAction
}) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(orders.map(order => order.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedOrders, orderId]);
    } else {
      onSelectionChange(selectedOrders.filter(id => id !== orderId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">🟡 En attente</span>;
      case 'confirmed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">🔵 Confirmée</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">🔄 En cours</span>;
      case 'ready':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">🟢 Prête</span>;
      case 'delivered':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">✅ Livrée</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">❌ Annulée</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">❓ Inconnu</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">🔴 Urgent</span>;
      case 'high':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">🟠 Élevée</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">🟡 Moyenne</span>;
      case 'low':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">🟢 Faible</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">❓ Inconnu</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">💳 Payé</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">⏳ En attente</span>;
      case 'refunded':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">↩️ Remboursé</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">❓ Inconnu</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'delay': return '⏰';
      case 'quality': return '⚠️';
      case 'payment': return '💳';
      case 'other': return '❓';
      default: return '⚠️';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
        <p className="text-gray-500">Aucune commande ne correspond aux critères de recherche.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commande
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pressing
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priorité
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dates
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className={`hover:bg-gray-50 ${order.issues && order.issues.length > 0 ? 'bg-red-50' : ''}`}>
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                      📦
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    <div className="text-sm text-gray-500">
                      {order.items.length} article(s)
                    </div>
                    {order.issues && order.issues.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {order.issues.map((issue, index) => (
                          <span key={index} className="text-red-600" title={issue.description}>
                            {getIssueIcon(issue.type)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                <div className="text-sm text-gray-500">📧 {order.customerEmail}</div>
                <div className="text-sm text-gray-500">📱 {order.customerPhone}</div>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{order.pressingName}</div>
                <div className="text-sm text-gray-500">📍 {order.pressingLocation}</div>
              </td>
              
              <td className="px-6 py-4">
                <div className="space-y-1">
                  {getStatusBadge(order.status)}
                  {getPaymentStatusBadge(order.paymentStatus)}
                </div>
              </td>
              
              <td className="px-6 py-4">
                {getPriorityBadge(order.priority)}
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(order.totalAmount)}
                </div>
                <div className="text-xs text-gray-500">
                  {order.items.map(item => `${item.quantity}x ${item.type}`).join(', ')}
                </div>
              </td>
              
              <td className="px-6 py-4 text-sm text-gray-900">
                <div>📅 Créée: {formatDate(order.createdAt)}</div>
                <div>🎯 Prévue: {formatDate(order.scheduledDate)}</div>
                {order.deliveryDate && (
                  <div className="text-green-600">✅ Livrée: {formatDate(order.deliveryDate)}</div>
                )}
              </td>
              
              <td className="px-6 py-4 text-sm font-medium">
                <div className="flex flex-col gap-1">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => onOrderAction(order.id, 'confirm')}
                      className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 text-xs"
                      title="Confirmer"
                    >
                      ✅ Confirmer
                    </button>
                  )}
                  
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                      onClick={() => onOrderAction(order.id, 'cancel')}
                      className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 text-xs"
                      title="Annuler"
                    >
                      ❌ Annuler
                    </button>
                  )}
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => onOrderAction(order.id, 'priority_up')}
                      className="text-orange-600 hover:text-orange-900 px-1 py-1 rounded hover:bg-orange-50 text-xs"
                      title="Augmenter priorité"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => onOrderAction(order.id, 'priority_down')}
                      className="text-blue-600 hover:text-blue-900 px-1 py-1 rounded hover:bg-blue-50 text-xs"
                      title="Diminuer priorité"
                    >
                      ⬇️
                    </button>
                  </div>
                  
                  {order.issues && order.issues.length > 0 && (
                    <button
                      onClick={() => onOrderAction(order.id, 'resolve_issue')}
                      className="text-purple-600 hover:text-purple-900 px-2 py-1 rounded hover:bg-purple-50 text-xs"
                      title="Résoudre problème"
                    >
                      🔧 Résoudre
                    </button>
                  )}
                  
                  <button
                    className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 text-xs"
                    title="Voir détails"
                  >
                    👁️ Détails
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
