import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { OrderTable } from '../../components/admin/OrderTable';

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

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  readyOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  urgentOrders: number;
  issuesReported: number;
  todayRevenue: number;
}

export const OrdersOverviewPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    urgentOrders: 0,
    issuesReported: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | Order['priority']>('all');
  const [filterIssues, setFilterIssues] = useState<'all' | 'with_issues' | 'no_issues'>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Simulation des données - à remplacer par les vraies API calls
        setTimeout(() => {
          const mockOrders: Order[] = [
            {
              id: '1',
              orderNumber: 'GEO-2024-001',
              customerName: 'Kouame Jean-Baptiste',
              customerEmail: 'kouame.jean@gmail.com',
              customerPhone: '+225 07 12 34 56 78',
              pressingName: 'Clean Express',
              pressingLocation: 'Cocody',
              status: 'in_progress',
              priority: 'medium',
              createdAt: '2024-01-19 08:30',
              updatedAt: '2024-01-19 14:30',
              scheduledDate: '2024-01-20',
              totalAmount: 15000,
              paymentStatus: 'paid',
              items: [
                { type: 'Chemise', quantity: 3, price: 3000 },
                { type: 'Pantalon', quantity: 2, price: 3000 }
              ]
            },
            {
              id: '2',
              orderNumber: 'GEO-2024-002',
              customerName: 'Aya Fatou',
              customerEmail: 'aya.fatou@yahoo.fr',
              customerPhone: '+225 01 23 45 67 89',
              pressingName: 'Pressing Royal',
              pressingLocation: 'Marcory',
              status: 'ready',
              priority: 'high',
              createdAt: '2024-01-18 15:45',
              updatedAt: '2024-01-19 12:00',
              scheduledDate: '2024-01-19',
              totalAmount: 8500,
              paymentStatus: 'paid',
              items: [
                { type: 'Robe', quantity: 1, price: 5000 },
                { type: 'Veste', quantity: 1, price: 3500 }
              ]
            },
            {
              id: '3',
              orderNumber: 'GEO-2024-003',
              customerName: 'Kone Ibrahim',
              customerEmail: 'kone.ibrahim@hotmail.com',
              customerPhone: '+225 05 55 66 77 88',
              pressingName: 'Laverie Moderne',
              pressingLocation: 'Plateau',
              status: 'pending',
              priority: 'urgent',
              createdAt: '2024-01-19 16:20',
              updatedAt: '2024-01-19 16:20',
              scheduledDate: '2024-01-20',
              totalAmount: 25000,
              paymentStatus: 'pending',
              items: [
                { type: 'Costume', quantity: 2, price: 10000 },
                { type: 'Chemise', quantity: 5, price: 1000 }
              ],
              issues: [
                {
                  type: 'payment',
                  description: 'Paiement en attente depuis 2h',
                  reportedAt: '2024-01-19 16:20'
                }
              ]
            },
            {
              id: '4',
              orderNumber: 'GEO-2024-004',
              customerName: 'Adjoua Marie',
              customerEmail: 'adjoua.marie@gmail.com',
              customerPhone: '+225 07 88 99 00 11',
              pressingName: 'Express Clean',
              pressingLocation: 'Yopougon',
              status: 'delivered',
              priority: 'low',
              createdAt: '2024-01-17 10:15',
              updatedAt: '2024-01-19 09:30',
              scheduledDate: '2024-01-18',
              deliveryDate: '2024-01-19 09:30',
              totalAmount: 12000,
              paymentStatus: 'paid',
              items: [
                { type: 'Jupe', quantity: 2, price: 2500 },
                { type: 'Blouse', quantity: 3, price: 2500 }
              ]
            },
            {
              id: '5',
              orderNumber: 'GEO-2024-005',
              customerName: 'Yao Patrick',
              customerEmail: 'yao.patrick@yahoo.fr',
              customerPhone: '+225 01 44 55 66 77',
              pressingName: 'Clean Express',
              pressingLocation: 'Cocody',
              status: 'cancelled',
              priority: 'medium',
              createdAt: '2024-01-18 14:00',
              updatedAt: '2024-01-18 18:30',
              scheduledDate: '2024-01-19',
              totalAmount: 7500,
              paymentStatus: 'refunded',
              items: [
                { type: 'Polo', quantity: 3, price: 2500 }
              ],
              issues: [
                {
                  type: 'other',
                  description: 'Client a annulé - changement de programme',
                  reportedAt: '2024-01-18 18:30'
                }
              ]
            }
          ];

          setOrders(mockOrders);
          
          const todayOrders = mockOrders.filter(order => 
            order.createdAt.startsWith('2024-01-19')
          );
          
          setStats({
            totalOrders: mockOrders.length,
            pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
            inProgressOrders: mockOrders.filter(o => o.status === 'in_progress').length,
            readyOrders: mockOrders.filter(o => o.status === 'ready').length,
            deliveredOrders: mockOrders.filter(o => o.status === 'delivered').length,
            cancelledOrders: mockOrders.filter(o => o.status === 'cancelled').length,
            urgentOrders: mockOrders.filter(o => o.priority === 'urgent').length,
            issuesReported: mockOrders.filter(o => o.issues && o.issues.length > 0).length,
            todayRevenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.pressingName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
    const matchesIssues = filterIssues === 'all' || 
                         (filterIssues === 'with_issues' && order.issues && order.issues.length > 0) ||
                         (filterIssues === 'no_issues' && (!order.issues || order.issues.length === 0));
    
    return matchesSearch && matchesStatus && matchesPriority && matchesIssues;
  });

  const handleOrderAction = async (orderId: string, action: 'confirm' | 'cancel' | 'priority_up' | 'priority_down' | 'resolve_issue') => {
    try {
      // Simulation de l'action - à remplacer par les vraies API calls
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            switch (action) {
              case 'confirm':
                return { ...order, status: 'confirmed' as const };
              case 'cancel':
                return { ...order, status: 'cancelled' as const };
              case 'priority_up':
                const priorities = ['low', 'medium', 'high', 'urgent'];
                const currentIndex = priorities.indexOf(order.priority);
                const newPriority = currentIndex < priorities.length - 1 ? priorities[currentIndex + 1] : order.priority;
                return { ...order, priority: newPriority as Order['priority'] };
              case 'priority_down':
                const prioritiesDown = ['low', 'medium', 'high', 'urgent'];
                const currentIndexDown = prioritiesDown.indexOf(order.priority);
                const newPriorityDown = currentIndexDown > 0 ? prioritiesDown[currentIndexDown - 1] : order.priority;
                return { ...order, priority: newPriorityDown as Order['priority'] };
              case 'resolve_issue':
                return { ...order, issues: [] };
              default:
                return order;
            }
          }
          return order;
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
            📦 Supervision des Commandes
          </h1>
          <p className="text-gray-600">
            Supervisez et gérez toutes les commandes de la plateforme
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgressOrders}</div>
              <div className="text-sm text-gray-600">En cours</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.readyOrders}</div>
              <div className="text-sm text-gray-600">Prêtes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.deliveredOrders}</div>
              <div className="text-sm text-gray-600">Livrées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</div>
              <div className="text-sm text-gray-600">Annulées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.urgentOrders}</div>
              <div className="text-sm text-gray-600">Urgentes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.issuesReported}</div>
              <div className="text-sm text-gray-600">Problèmes</div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">💰 Revenus du Jour</h3>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Rechercher par numéro, client ou pressing..."
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
                <option value="pending">🟡 En attente</option>
                <option value="confirmed">🔵 Confirmées</option>
                <option value="in_progress">🔄 En cours</option>
                <option value="ready">🟢 Prêtes</option>
                <option value="delivered">✅ Livrées</option>
                <option value="cancelled">❌ Annulées</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes priorités</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 Élevée</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="low">🟢 Faible</option>
              </select>

              {/* Issues Filter */}
              <select
                value={filterIssues}
                onChange={(e) => setFilterIssues(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous</option>
                <option value="with_issues">⚠️ Avec problèmes</option>
                <option value="no_issues">✅ Sans problème</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Liste des Commandes ({filteredOrders.length})</span>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  📊 Rapport
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  📤 Exporter
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTable
              orders={filteredOrders}
              selectedOrders={selectedOrders}
              onSelectionChange={setSelectedOrders}
              onOrderAction={handleOrderAction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrdersOverviewPage;
