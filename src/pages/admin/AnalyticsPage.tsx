import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AnalyticsChart } from '../../components/admin/AnalyticsChart';
import { AdminCard } from '../../components/admin/AdminCard';

interface AnalyticsData {
  userGrowth: {
    period: string;
    newUsers: number;
    activeUsers: number;
    retentionRate: number;
  }[];
  revenueData: {
    period: string;
    revenue: number;
    orders: number;
    averageOrderValue: number;
  }[];
  pressingPerformance: {
    name: string;
    location: string;
    orders: number;
    revenue: number;
    rating: number;
    growth: number;
  }[];
  topCustomers: {
    name: string;
    orders: number;
    totalSpent: number;
    lastOrder: string;
  }[];
  geographicData: {
    location: string;
    users: number;
    orders: number;
    revenue: number;
    marketShare: number;
  }[];
}

interface KPIData {
  totalRevenue: number;
  monthlyGrowth: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  churnRate: number;
  averageOrderValue: number;
  conversionRate: number;
  platformCommission: number;
}

export const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: [],
    revenueData: [],
    pressingPerformance: [],
    topCustomers: [],
    geographicData: []
  });
  const [kpiData, setKPIData] = useState<KPIData>({
    totalRevenue: 0,
    monthlyGrowth: 0,
    customerAcquisitionCost: 0,
    customerLifetimeValue: 0,
    churnRate: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    platformCommission: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'users' | 'orders'>('revenue');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Simulation des données - à remplacer par les vraies API calls
        setTimeout(() => {
          setAnalyticsData({
            userGrowth: [
              { period: '01/01', newUsers: 45, activeUsers: 234, retentionRate: 78 },
              { period: '02/01', newUsers: 52, activeUsers: 267, retentionRate: 82 },
              { period: '03/01', newUsers: 48, activeUsers: 289, retentionRate: 79 },
              { period: '04/01', newUsers: 61, activeUsers: 324, retentionRate: 85 },
              { period: '05/01', newUsers: 55, activeUsers: 356, retentionRate: 83 },
              { period: '06/01', newUsers: 67, activeUsers: 398, retentionRate: 87 },
              { period: '07/01', newUsers: 72, activeUsers: 445, retentionRate: 89 }
            ],
            revenueData: [
              { period: '01/01', revenue: 1250000, orders: 89, averageOrderValue: 14045 },
              { period: '02/01', revenue: 1450000, orders: 102, averageOrderValue: 14216 },
              { period: '03/01', revenue: 1380000, orders: 95, averageOrderValue: 14526 },
              { period: '04/01', revenue: 1680000, orders: 118, averageOrderValue: 14237 },
              { period: '05/01', revenue: 1520000, orders: 106, averageOrderValue: 14340 },
              { period: '06/01', revenue: 1890000, orders: 134, averageOrderValue: 14104 },
              { period: '07/01', revenue: 2100000, orders: 148, averageOrderValue: 14189 }
            ],
            pressingPerformance: [
              { name: 'Clean Express', location: 'Cocody', orders: 156, revenue: 2340000, rating: 4.8, growth: 15.2 },
              { name: 'Laverie Moderne', location: 'Plateau', orders: 134, revenue: 2010000, rating: 4.6, growth: 12.8 },
              { name: 'Pressing Royal', location: 'Marcory', orders: 98, revenue: 1470000, rating: 4.4, growth: 8.5 },
              { name: 'Express Clean', location: 'Yopougon', orders: 87, revenue: 1305000, rating: 4.2, growth: 6.3 },
              { name: 'Pressing Deluxe', location: 'Adjamé', orders: 76, revenue: 1140000, rating: 4.0, growth: 4.1 }
            ],
            topCustomers: [
              { name: 'Kouame Jean-Baptiste', orders: 24, totalSpent: 360000, lastOrder: '2024-01-19' },
              { name: 'Aya Fatou', orders: 18, totalSpent: 270000, lastOrder: '2024-01-18' },
              { name: 'Kone Ibrahim', orders: 15, totalSpent: 225000, lastOrder: '2024-01-17' },
              { name: 'Adjoua Marie', orders: 12, totalSpent: 180000, lastOrder: '2024-01-16' },
              { name: 'Yao Patrick', orders: 10, totalSpent: 150000, lastOrder: '2024-01-15' }
            ],
            geographicData: [
              { location: 'Cocody', users: 456, orders: 234, revenue: 3510000, marketShare: 28.5 },
              { location: 'Plateau', users: 389, orders: 198, revenue: 2970000, marketShare: 24.1 },
              { location: 'Yopougon', users: 298, orders: 156, revenue: 2340000, marketShare: 19.0 },
              { location: 'Marcory', users: 234, orders: 123, revenue: 1845000, marketShare: 15.0 },
              { location: 'Adjamé', users: 167, orders: 89, revenue: 1335000, marketShare: 10.8 },
              { location: 'Treichville', users: 98, orders: 45, revenue: 675000, marketShare: 5.5 }
            ]
          });

          setKPIData({
            totalRevenue: 12315000,
            monthlyGrowth: 18.5,
            customerAcquisitionCost: 2500,
            customerLifetimeValue: 45000,
            churnRate: 12.3,
            averageOrderValue: 14250,
            conversionRate: 3.8,
            platformCommission: 615750
          });

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Analytics & Rapports
              </h1>
              <p className="text-gray-600">
                Statistiques détaillées et insights de la plateforme
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
                <option value="1y">1 an</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                📤 Exporter Rapport
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminCard
            title="Revenus Total"
            value={formatCurrency(kpiData.totalRevenue)}
            icon="💰"
            trend={`+${formatPercentage(kpiData.monthlyGrowth)}`}
            trendUp={true}
            subtitle="Ce mois"
          />
          <AdminCard
            title="Panier Moyen"
            value={formatCurrency(kpiData.averageOrderValue)}
            icon="🛒"
            trend="+5.2%"
            trendUp={true}
            subtitle="Mensuel"
          />
          <AdminCard
            title="Taux de Conversion"
            value={formatPercentage(kpiData.conversionRate)}
            icon="📈"
            trend="+0.8%"
            trendUp={true}
            subtitle="Visiteurs → Clients"
          />
          <AdminCard
            title="Commission Plateforme"
            value={formatCurrency(kpiData.platformCommission)}
            icon="🏦"
            trend="+18.5%"
            trendUp={true}
            subtitle="5% des revenus"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminCard
            title="Coût d'Acquisition"
            value={formatCurrency(kpiData.customerAcquisitionCost)}
            icon="📊"
            trend="-12%"
            trendUp={true}
            subtitle="Par client"
          />
          <AdminCard
            title="Valeur Vie Client"
            value={formatCurrency(kpiData.customerLifetimeValue)}
            icon="👤"
            trend="+8.3%"
            trendUp={true}
            subtitle="LTV moyenne"
          />
          <AdminCard
            title="Taux de Rétention"
            value={formatPercentage(100 - kpiData.churnRate)}
            icon="🔄"
            trend="+2.1%"
            trendUp={true}
            subtitle="Clients fidèles"
          />
          <AdminCard
            title="ROI Marketing"
            value={`${(kpiData.customerLifetimeValue / kpiData.customerAcquisitionCost).toFixed(1)}x`}
            icon="🎯"
            trend="+15%"
            trendUp={true}
            subtitle="Retour investissement"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📈 Évolution des Revenus</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as any)}
                  className="text-sm px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="revenue">💰 Revenus</option>
                  <option value="orders">📦 Commandes</option>
                  <option value="users">👥 Utilisateurs</option>
                </select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsChart />
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>🗺️ Répartition Géographique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.geographicData.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">📍 {location.location}</div>
                        <div className="text-sm text-gray-500">
                          {location.users} utilisateurs • {location.orders} commandes
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(location.revenue)}</div>
                      <div className="text-sm text-gray-500">{formatPercentage(location.marketShare)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pressings */}
          <Card>
            <CardHeader>
              <CardTitle>🏪 Top Pressings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.pressingPerformance.map((pressing, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{pressing.name}</div>
                        <div className="text-sm text-gray-500">
                          📍 {pressing.location} • ⭐ {pressing.rating}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(pressing.revenue)}</div>
                      <div className="text-sm text-gray-500">
                        📦 {pressing.orders} • 📈 +{formatPercentage(pressing.growth)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>👑 Top Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          Dernière commande: {new Date(customer.lastOrder).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">{formatCurrency(customer.totalSpent)}</div>
                      <div className="text-sm text-gray-500">📦 {customer.orders} commandes</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
