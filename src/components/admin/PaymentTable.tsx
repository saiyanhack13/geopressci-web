import React from 'react';

interface Payment {
  id: string;
  transactionId: string;
  orderNumber: string;
  customerName: string;
  pressingName: string;
  amount: number;
  method: 'mobile_money' | 'card' | 'cash' | 'bank_transfer';
  provider: 'orange_money' | 'mtn_money' | 'moov_money' | 'visa' | 'mastercard' | 'cash' | 'bank';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  refundReason?: string;
  fees: number;
  netAmount: number;
}

interface PaymentTableProps {
  payments: Payment[];
  selectedPayments: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onPaymentAction: (paymentId: string, action: 'retry' | 'refund' | 'resolve_dispute' | 'cancel') => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  selectedPayments,
  onSelectionChange,
  onPaymentAction
}) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(payments.map(payment => payment.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedPayments, paymentId]);
    } else {
      onSelectionChange(selectedPayments.filter(id => id !== paymentId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✅ Complétée</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">⏳ En attente</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">❌ Échouée</span>;
      case 'refunded':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">↩️ Remboursée</span>;
      case 'disputed':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">⚠️ Litige</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">❓ Inconnu</span>;
    }
  };

  const getMethodBadge = (method: string, provider: string) => {
    const getProviderIcon = () => {
      switch (provider) {
        case 'orange_money': return '🟠';
        case 'mtn_money': return '🟡';
        case 'moov_money': return '🔵';
        case 'visa': return '💳';
        case 'mastercard': return '💳';
        case 'cash': return '💵';
        case 'bank': return '🏦';
        default: return '❓';
      }
    };

    const getProviderName = () => {
      switch (provider) {
        case 'orange_money': return 'Orange Money';
        case 'mtn_money': return 'MTN Money';
        case 'moov_money': return 'Moov Money';
        case 'visa': return 'Visa';
        case 'mastercard': return 'Mastercard';
        case 'cash': return 'Espèces';
        case 'bank': return 'Banque';
        default: return 'Inconnu';
      }
    };

    return (
      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
        {getProviderIcon()} {getProviderName()}
      </span>
    );
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

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💳</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune transaction trouvée</h3>
        <p className="text-gray-500">Aucune transaction ne correspond aux critères de recherche.</p>
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
                checked={selectedPayments.length === payments.length && payments.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transaction
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pressing
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Méthode
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
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
          {payments.map((payment) => (
            <tr key={payment.id} className={`hover:bg-gray-50 ${payment.status === 'disputed' ? 'bg-orange-50' : payment.status === 'failed' ? 'bg-red-50' : ''}`}>
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedPayments.includes(payment.id)}
                  onChange={(e) => handleSelectPayment(payment.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-lg">
                      💳
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{payment.transactionId}</div>
                    <div className="text-sm text-gray-500">📦 {payment.orderNumber}</div>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{payment.customerName}</div>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{payment.pressingName}</div>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(payment.amount)}
                </div>
                {payment.fees > 0 && (
                  <div className="text-xs text-gray-500">
                    Frais: {formatCurrency(payment.fees)}
                  </div>
                )}
                {payment.netAmount > 0 && (
                  <div className="text-xs text-green-600">
                    Net: {formatCurrency(payment.netAmount)}
                  </div>
                )}
              </td>
              
              <td className="px-6 py-4">
                {getMethodBadge(payment.method, payment.provider)}
              </td>
              
              <td className="px-6 py-4">
                <div className="space-y-1">
                  {getStatusBadge(payment.status)}
                  {payment.failureReason && (
                    <div className="text-xs text-red-600">
                      ❌ {payment.failureReason}
                    </div>
                  )}
                  {payment.refundReason && (
                    <div className="text-xs text-blue-600">
                      ↩️ {payment.refundReason}
                    </div>
                  )}
                </div>
              </td>
              
              <td className="px-6 py-4 text-sm text-gray-900">
                <div>📅 Créée: {formatDate(payment.createdAt)}</div>
                {payment.completedAt && (
                  <div className="text-green-600">✅ Complétée: {formatDate(payment.completedAt)}</div>
                )}
              </td>
              
              <td className="px-6 py-4 text-sm font-medium">
                <div className="flex flex-col gap-1">
                  {payment.status === 'failed' && (
                    <button
                      onClick={() => onPaymentAction(payment.id, 'retry')}
                      className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 text-xs"
                      title="Réessayer"
                    >
                      🔄 Réessayer
                    </button>
                  )}
                  
                  {payment.status === 'completed' && (
                    <button
                      onClick={() => onPaymentAction(payment.id, 'refund')}
                      className="text-orange-600 hover:text-orange-900 px-2 py-1 rounded hover:bg-orange-50 text-xs"
                      title="Rembourser"
                    >
                      ↩️ Rembourser
                    </button>
                  )}
                  
                  {payment.status === 'disputed' && (
                    <button
                      onClick={() => onPaymentAction(payment.id, 'resolve_dispute')}
                      className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 text-xs"
                      title="Résoudre litige"
                    >
                      ✅ Résoudre
                    </button>
                  )}
                  
                  {(payment.status === 'pending' || payment.status === 'failed') && (
                    <button
                      onClick={() => onPaymentAction(payment.id, 'cancel')}
                      className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 text-xs"
                      title="Annuler"
                    >
                      ❌ Annuler
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

export default PaymentTable;
