import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AdminCard } from '../../components/admin/AdminCard';
import { AnalyticsChart } from '../../components/admin/AnalyticsChart';
import { SecurityAudit } from '../../components/admin/SecurityAudit';
import { ReportGenerator } from '../../components/admin/ReportGenerator';

interface DashboardStats {
  totalUsers: number;
  totalPressings: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  pendingOrders: number;
  monthlyGrowth: number;
  averageOrderValue: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'pressing' | 'order' | 'payment';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPressings: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingOrders: 0,
    monthlyGrowth: 0,
    averageOrderValue: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulation des données - à remplacer par les vraies API calls
        setTimeout(() => {
          setStats({
            totalUsers: 2847,
            totalPressings: 156,
            totalOrders: 8934,
            totalRevenue: 45678900,
            activeUsers: 1234,
            pendingOrders: 89,
            monthlyGrowth: 12.5,
            averageOrderValue: 5100
          });

          setRecentActivity([
            {
              id: '1',
              type: 'user',
              message: 'Nouvel utilisateur inscrit: Kouame Jean',
              timestamp: '2024-01-19 14:30',
              status: 'success'
            },
            {
              id: '2',
              type: 'pressing',
              message: 'Pressing "Clean Express" en attente de validation',
              timestamp: '2024-01-19 14:15',
              status: 'warning'
            },
            {
              id: '3',
              type: 'order',
              message: 'Commande #8934 livrée avec succès',
              timestamp: '2024-01-19 14:00',
              status: 'success'
            },
            {
              id: '4',
              type: 'payment',
              message: 'Paiement de 15,000 FCFA traité',
              timestamp: '2024-01-19 13:45',
              status: 'success'
            },
            {
              id: '5',
              type: 'order',
              message: 'Litige signalé sur commande #8920',
              timestamp: '2024-01-19 13:30',
              status: 'error'
            }
          ]);

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return '👤';
      case 'pressing': return '🏪';
      case 'order': return '📦';
      case 'payment': return '💳';
      default: return '📊';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
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
            🏢 Tableau de Bord Admin
          </h1>
          <p className="text-gray-600">
            Vue d'ensemble de la plateforme Geopressci
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminCard
            title="Utilisateurs Total"
            value={stats.totalUsers.toLocaleString()}
            icon="👥"
            trend={`+${stats.monthlyGrowth}%`}
            trendUp={true}
            subtitle={`${stats.activeUsers} actifs`}
          />
          <AdminCard
            title="Pressings"
            value={stats.totalPressings.toString()}
            icon="🏪"
            trend="+8 ce mois"
            trendUp={true}
            subtitle="156 validés"
          />
          <AdminCard
            title="Commandes"
            value={stats.totalOrders.toLocaleString()}
            icon="📦"
            trend={`${stats.pendingOrders} en attente`}
            trendUp={false}
            subtitle="Ce mois"
          />
          <AdminCard
            title="Revenus"
            value={formatCurrency(stats.totalRevenue)}
            icon="💰"
            trend="+15.2%"
            trendUp={true}
            subtitle="Ce mois"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminCard
            title="Utilisateurs Actifs"
            value={stats.activeUsers.toLocaleString()}
            icon="🟢"
            trend="Dernières 24h"
            trendUp={true}
            subtitle="En ligne"
          />
          <AdminCard
            title="Commandes en Attente"
            value={stats.pendingOrders.toString()}
            icon="⏳"
            trend="À traiter"
            trendUp={false}
            subtitle="Urgent"
          />
          <AdminCard
            title="Panier Moyen"
            value={formatCurrency(stats.averageOrderValue)}
            icon="🛒"
            trend="+5.8%"
            trendUp={true}
            subtitle="Ce mois"
          />
          <AdminCard
            title="Croissance"
            value={`${stats.monthlyGrowth}%`}
            icon="📈"
            trend="Mensuelle"
            trendUp={true}
            subtitle="Utilisateurs"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analytics Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Statistiques des 30 derniers jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔔 Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">{getActivityIcon(activity.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Voir toute l'activité →
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-sm font-medium text-blue-900">Gérer Utilisateurs</div>
                </button>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                  <div className="text-2xl mb-2">🏪</div>
                  <div className="text-sm font-medium text-green-900">Valider Pressings</div>
                </button>
                <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors">
                  <div className="text-2xl mb-2">📦</div>
                  <div className="text-sm font-medium text-yellow-900">Superviser Commandes</div>
                </button>
                <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm font-medium text-purple-900">Voir Analytics</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Overview */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛡️ Aperçu Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SecurityAudit className="" />
            </CardContent>
          </Card>
        </div>

        {/* Reports Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Génération de Rapports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReportGenerator className="" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
