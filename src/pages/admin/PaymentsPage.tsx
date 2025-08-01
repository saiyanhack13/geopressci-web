import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { PaymentTable } from '../../components/admin/PaymentTable';

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

interface PaymentStats {
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  disputedTransactions: number;
  totalVolume: number;
  totalFees: number;
  todayVolume: number;
  todayTransactions: number;
}

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    disputedTransactions: 0,
    totalVolume: 0,
    totalFees: 0,
    todayVolume: 0,
    todayTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Payment['status']>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | Payment['method']>('all');
  const [filterProvider, setFilterProvider] = useState<'all' | Payment['provider']>('all');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // Simulation des données - à remplacer par les vraies API calls
        setTimeout(() => {
          const mockPayments: Payment[] = [
            {
              id: '1',
              transactionId: 'TXN-2024-001',
              orderNumber: 'GEO-2024-001',
              customerName: 'Kouame Jean-Baptiste',
              pressingName: 'Clean Express',
              amount: 15000,
              method: 'mobile_money',
              provider: 'orange_money',
              status: 'completed',
              createdAt: '2024-01-19 08:30',
              completedAt: '2024-01-19 08:32',
              fees: 150,
              netAmount: 14850
            },
            {
              id: '2',
              transactionId: 'TXN-2024-002',
              orderNumber: 'GEO-2024-002',
              customerName: 'Aya Fatou',
              pressingName: 'Pressing Royal',
              amount: 8500,
              method: 'mobile_money',
              provider: 'mtn_money',
              status: 'completed',
              createdAt: '2024-01-18 15:45',
              completedAt: '2024-01-18 15:47',
              fees: 85,
              netAmount: 8415
            },
            {
              id: '3',
              transactionId: 'TXN-2024-003',
              orderNumber: 'GEO-2024-003',
              customerName: 'Kone Ibrahim',
              pressingName: 'Laverie Moderne',
              amount: 25000,
              method: 'card',
              provider: 'visa',
              status: 'pending',
              createdAt: '2024-01-19 16:20',
              fees: 500,
              netAmount: 24500
            },
            {
              id: '4',
              transactionId: 'TXN-2024-004',
              orderNumber: 'GEO-2024-004',
              customerName: 'Adjoua Marie',
              pressingName: 'Express Clean',
              amount: 12000,
              method: 'mobile_money',
              provider: 'moov_money',
              status: 'completed',
              createdAt: '2024-01-17 10:15',
              completedAt: '2024-01-17 10:17',
              fees: 120,
              netAmount: 11880
            },
            {
              id: '5',
              transactionId: 'TXN-2024-005',
              orderNumber: 'GEO-2024-005',
              customerName: 'Yao Patrick',
              pressingName: 'Clean Express',
              amount: 7500,
              method: 'mobile_money',
              provider: 'orange_money',
              status: 'refunded',
              createdAt: '2024-01-18 14:00',
              completedAt: '2024-01-18 14:02',
              refundReason: 'Commande annulée par le client',
              fees: 75,
              netAmount: 7425
            },
            {
              id: '6',
              transactionId: 'TXN-2024-006',
              orderNumber: 'GEO-2024-006',
              customerName: 'Bamba Sekou',
              pressingName: 'Pressing Deluxe',
              amount: 18000,
              method: 'card',
              provider: 'mastercard',
              status: 'failed',
              createdAt: '2024-01-19 11:30',
              failureReason: 'Fonds insuffisants',
              fees: 0,
              netAmount: 0
            },
            {
              id: '7',
              transactionId: 'TXN-2024-007',
              orderNumber: 'GEO-2024-007',
              customerName: 'Traore Aminata',
              pressingName: 'Laverie Moderne',
              amount: 22000,
              method: 'bank_transfer',
              provider: 'bank',
              status: 'disputed',
              createdAt: '2024-01-18 09:15',
              completedAt: '2024-01-18 09:20',
              fees: 220,
              netAmount: 21780
            }
          ];

          setPayments(mockPayments);
          
          const todayPayments = mockPayments.filter(payment => 
            payment.createdAt.startsWith('2024-01-19')
          );
          
          setStats({
            totalTransactions: mockPayments.length,
            completedTransactions: mockPayments.filter(p => p.status === 'completed').length,
            pendingTransactions: mockPayments.filter(p => p.status === 'pending').length,
            failedTransactions: mockPayments.filter(p => p.status === 'failed').length,
            disputedTransactions: mockPayments.filter(p => p.status === 'disputed').length,
            totalVolume: mockPayments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0),
            totalFees: mockPayments.reduce((sum, p) => sum + (p.status === 'completed' ? p.fees : 0), 0),
            todayVolume: todayPayments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0),
            todayTransactions: todayPayments.length
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des paiements:', error);
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesMethod = filterMethod === 'all' || payment.method === filterMethod;
    const matchesProvider = filterProvider === 'all' || payment.provider === filterProvider;
    
    return matchesSearch && matchesStatus && matchesMethod && matchesProvider;
  });

  const handlePaymentAction = async (paymentId: string, action: 'retry' | 'refund' | 'resolve_dispute' | 'cancel') => {
    try {
      // Simulation de l'action - à remplacer par les vraies API calls
      setPayments(prevPayments => 
        prevPayments.map(payment => {
          if (payment.id === paymentId) {
            switch (action) {
              case 'retry':
                return { ...payment, status: 'pending' as const };
              case 'refund':
                return { ...payment, status: 'refunded' as const, refundReason: 'Remboursement administratif' };
              case 'resolve_dispute':
                return { ...payment, status: 'completed' as const };
              case 'cancel':
                return { ...payment, status: 'failed' as const, failureReason: 'Annulé par admin' };
              default:
                return payment;
            }
          }
          return payment;
        })
      );
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💳 Gestion des Paiements
          </h1>
          <p className="text-gray-600">
            Supervisez toutes les transactions financières de la plateforme
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volume Total</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalVolume)}</p>
                  <p className="text-xs text-gray-500">{stats.totalTransactions} transactions</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.todayVolume)}</p>
                  <p className="text-xs text-gray-500">{stats.todayTransactions} transactions</p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Frais Collectés</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalFees)}</p>
                  <p className="text-xs text-gray-500">Commission plateforme</p>
                </div>
                <div className="text-3xl">🏦</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
                  <p className="text-2xl font-bold text-green-600">
                    {((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">{stats.completedTransactions}/{stats.totalTransactions}</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-green-600">{stats.completedTransactions}</div>
              <div className="text-sm text-gray-600">✅ Complétées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
              <div className="text-sm text-gray-600">⏳ En attente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-red-600">{stats.failedTransactions}</div>
              <div className="text-sm text-gray-600">❌ Échouées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-orange-600">{stats.disputedTransactions}</div>
              <div className="text-sm text-gray-600">⚠️ Litiges</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Rechercher par transaction, commande ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">✅ Complétées</option>
                <option value="pending">⏳ En attente</option>
                <option value="failed">❌ Échouées</option>
                <option value="refunded">↩️ Remboursées</option>
                <option value="disputed">⚠️ Litiges</option>
              </select>

              {/* Method Filter */}
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les méthodes</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="card">💳 Carte</option>
                <option value="cash">💵 Espèces</option>
                <option value="bank_transfer">🏦 Virement</option>
              </select>

              {/* Provider Filter */}
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les opérateurs</option>
                <option value="orange_money">🟠 Orange Money</option>
                <option value="mtn_money">🟡 MTN Money</option>
                <option value="moov_money">🔵 Moov Money</option>
                <option value="visa">💳 Visa</option>
                <option value="mastercard">💳 Mastercard</option>
                <option value="cash">💵 Espèces</option>
                <option value="bank">🏦 Banque</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Transactions ({filteredPayments.length})</span>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  📊 Rapport Financier
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  📤 Exporter
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentTable
              payments={filteredPayments}
              selectedPayments={selectedPayments}
              onSelectionChange={setSelectedPayments}
              onPaymentAction={handlePaymentAction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentsPage;
