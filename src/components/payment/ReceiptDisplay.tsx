import React from 'react';
import { MobileMoneyOperator } from './MobileMoneySelector';

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ReceiptData {
  transactionId: string;
  orderId: string;
  timestamp: Date;
  operator: MobileMoneyOperator;
  phoneNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  fees: number;
  discount?: number;
  total: number;
  status: 'success' | 'pending' | 'failed' | 'cancelled';
  pressingName: string;
  customerName: string;
  customerPhone: string;
}

interface ReceiptDisplayProps {
  receipt: ReceiptData;
  showActions?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
  className?: string;
}

export const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({
  receipt,
  showActions = true,
  onDownload,
  onShare,
  onPrint,
  className = ''
}) => {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusConfig = {
    success: { icon: '✅', text: 'Payé', color: 'text-green-600' },
    pending: { icon: '⏳', text: 'En attente', color: 'text-yellow-600' },
    failed: { icon: '❌', text: 'Échec', color: 'text-red-600' },
    cancelled: { icon: '🚫', text: 'Annulé', color: 'text-gray-600' }
  };

  const currentStatus = statusConfig[receipt.status];

  return (
    <div className={`bg-white border rounded-lg shadow-lg ${className}`}>
      {/* En-tête */}
      <div className="bg-blue-50 px-6 py-4 border-b">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-900">🧾 Reçu de paiement</h2>
          <p className="text-sm text-gray-600">Geopressci - Service de pressing</p>
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color} bg-white`}>
            <span>{currentStatus.icon}</span>
            <span>{currentStatus.text}</span>
          </div>
        </div>
      </div>

      {/* Informations de transaction */}
      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">N° Transaction</p>
            <p className="font-mono font-medium">{receipt.transactionId}</p>
          </div>
          <div>
            <p className="text-gray-600">N° Commande</p>
            <p className="font-mono font-medium">{receipt.orderId}</p>
          </div>
          <div>
            <p className="text-gray-600">Date & Heure</p>
            <p className="font-medium">{formatDate(receipt.timestamp)}</p>
          </div>
          <div>
            <p className="text-gray-600">Méthode de paiement</p>
            <div className="flex items-center space-x-2">
              <span>{receipt.operator?.logo || '💳'}</span>
              <span className="font-medium">{receipt.operator?.displayName || 'Mobile Money'}</span>
            </div>
          </div>
        </div>

        {/* Informations client et pressing */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">👤 Client</h4>
              <p>{receipt.customerName}</p>
              <p className="text-gray-600">{receipt.customerPhone}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🏪 Pressing</h4>
              <p>{receipt.pressingName}</p>
              <p className="text-gray-600">Paiement via {receipt.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Détail des articles */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">📋 Détail de la commande</h4>
          <div className="space-y-2">
            {receipt.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-600">
                    {item.quantity} × {formatAmount(item.unitPrice)} FCFA
                  </p>
                </div>
                <p className="font-medium">{formatAmount(item.totalPrice)} FCFA</p>
              </div>
            ))}
          </div>
        </div>

        {/* Calcul du total */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sous-total</span>
            <span>{formatAmount(receipt.subtotal)} FCFA</span>
          </div>
          
          {receipt.fees > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frais de transaction</span>
              <span className="text-orange-600">+{formatAmount(receipt.fees)} FCFA</span>
            </div>
          )}
          
          {receipt.discount && receipt.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Réduction</span>
              <span className="text-green-600">-{formatAmount(receipt.discount)} FCFA</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total payé</span>
            <span className="text-blue-600">{formatAmount(receipt.total)} FCFA</span>
          </div>
        </div>

        {/* Note de bas de page */}
        <div className="border-t pt-4 text-center text-xs text-gray-500 space-y-1">
          <p>💡 Conservez ce reçu pour vos archives</p>
          <p>📞 Support: +225 XX XX XX XX | 📧 support@geopressci.com</p>
          <p>Merci de faire confiance à Geopressci ! 🙏</p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>📥</span>
                <span>Télécharger</span>
              </button>
            )}
            
            {onShare && (
              <button
                onClick={onShare}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>📤</span>
                <span>Partager</span>
              </button>
            )}
            
            {onPrint && (
              <button
                onClick={onPrint}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span>🖨️</span>
                <span>Imprimer</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ReceiptSummaryProps {
  receipt: ReceiptData;
  compact?: boolean;
  className?: string;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({
  receipt,
  compact = false,
  className = ''
}) => {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const statusConfig = {
    success: { icon: '✅', color: 'text-green-600' },
    pending: { icon: '⏳', color: 'text-yellow-600' },
    failed: { icon: '❌', color: 'text-red-600' },
    cancelled: { icon: '🚫', color: 'text-gray-600' }
  };

  const currentStatus = statusConfig[receipt.status];

  if (compact) {
    return (
      <div className={`bg-white border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{receipt.operator?.logo || '💳'}</span>
            <div>
              <p className="font-medium">{formatAmount(receipt.total)} FCFA</p>
              <p className="text-sm text-gray-600">{receipt.transactionId}</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 ${currentStatus.color}`}>
            <span>{currentStatus.icon}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      <div className="text-center space-y-4">
        <div className="text-4xl">{receipt.operator?.logo || '💳'}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatAmount(receipt.total)} FCFA
          </p>
          <p className="text-sm text-gray-600">via {receipt.operator.displayName}</p>
        </div>
        <div className={`inline-flex items-center space-x-2 ${currentStatus.color}`}>
          <span className="text-xl">{currentStatus.icon}</span>
          <span className="font-medium">Transaction {receipt.status === 'success' ? 'réussie' : receipt.status === 'pending' ? 'en attente' : receipt.status === 'cancelled' ? 'annulée' : 'échouée'}</span>
        </div>
        <p className="text-xs text-gray-500 font-mono">{receipt.transactionId}</p>
      </div>
    </div>
  );
};

export default ReceiptDisplay;
