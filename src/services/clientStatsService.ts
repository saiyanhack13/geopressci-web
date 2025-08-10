import { api } from './api';
import { Order } from '../types';

export interface ClientStats {
  totalOrders: number;
  completedOrders: number;
  deliveredOrders?: number; // Deprecated, use completedOrders
  totalSpent: number;
  favoritePressing: string;
  mostUsedService: string;
  satisfactionRate?: number; // Deprecated, use averageRating
  averageRating: number;
  monthlyData: MonthlyData[];
  ordersByStatus: { [key: string]: number };
  averageOrderValue: number;
  lastOrderDate: string;
  memberSince: string;
}

export interface MonthlyData {
  month: string;
  orders: number;
  amount: number;
}

export interface ExportOptions {
  format: 'pdf' | 'json' | 'csv';
  dateRange?: {
    start: string;
    end: string;
  };
  includeDetails?: boolean;
}

/**
 * Service pour les statistiques et exports client
 */
class ClientStatsService {
  
  /**
   * Calcule les statistiques personnelles du client
   */
  async calculatePersonalStats(orders: Order[]): Promise<ClientStats> {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'livree').length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Pressing favori
    const pressingCounts: { [key: string]: number } = {};
    orders.forEach(order => {
      // Gérer les différents formats de pressing
      let pressingName: string | undefined;
      if (typeof order.pressing === 'string') {
        pressingName = order.pressing;
      } else if (order.pressing && typeof order.pressing === 'object' && 'nomCommerce' in order.pressing) {
        pressingName = (order.pressing as any).nomCommerce;
      } else if ((order as any).pressingName) {
        pressingName = (order as any).pressingName;
      }
      
      if (pressingName) {
        pressingCounts[pressingName] = (pressingCounts[pressingName] || 0) + 1;
      }
    });
    
    const favoritePressing = Object.entries(pressingCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Aucun';

    // Services les plus utilisés
    const serviceCounts: { [key: string]: number } = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        // Gérer les différents formats de service
        let serviceName: string;
        if ((item as any).service) {
          serviceName = (item as any).service;
        } else if ((item as any).serviceName) {
          serviceName = (item as any).serviceName;
        } else if (item.serviceId) {
          serviceName = `Service ${item.serviceId}`;
        } else {
          serviceName = 'Service inconnu';
        }
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + item.quantity;
      });
    });
    
    const mostUsedService = Object.entries(serviceCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Aucun';

    // Calcul de la note moyenne
    const ratingsSum = orders.reduce((sum, order) => {
      const rating = (order as any).rating || 0;
      return sum + rating;
    }, 0);
    const ratedOrdersCount = orders.filter(order => {
      const rating = (order as any).rating;
      return rating && rating > 0;
    }).length;
    const averageRating = ratedOrdersCount > 0 ? ratingsSum / ratedOrdersCount : 0;

    // Données mensuelles
    const monthlyData = this.calculateMonthlyData(orders);

    // Commandes par statut
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Dates importantes
    const sortedOrders = orders.sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
    const lastOrderDate = sortedOrders[0]?.createdAt || '';
    const memberSince = sortedOrders[sortedOrders.length - 1]?.createdAt || '';

    return {
      totalOrders,
      completedOrders,
      totalSpent,
      favoritePressing,
      mostUsedService,
      averageRating,
      monthlyData,
      ordersByStatus,
      averageOrderValue,
      lastOrderDate,
      memberSince
    };
  }

  /**
   * Calcule les données mensuelles
   */
  private calculateMonthlyData(orders: Order[]): MonthlyData[] {
    const monthlyMap = new Map<string, { orders: number; amount: number }>();

    orders.forEach(order => {
      const date = new Date(order.createdAt || '');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      
      const existing = monthlyMap.get(monthKey) || { orders: 0, amount: 0 };
      monthlyMap.set(monthKey, {
        orders: existing.orders + 1,
        amount: existing.amount + (order.totalAmount || 0)
      });
    });

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Derniers 12 mois
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long' 
        });
        return {
          month: monthName,
          orders: data.orders,
          amount: data.amount
        };
      });
  }

  /**
   * Exporte les données client
   */
  async exportClientData(orders: Order[], stats: ClientStats, options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'pdf':
        await this.exportToPDF(orders, stats, options);
        break;
      case 'json':
        this.exportToJSON(orders, stats, options);
        break;
      case 'csv':
        this.exportToCSV(orders, options);
        break;
      default:
        throw new Error('Format d\'export non supporté');
    }
  }

  /**
   * Export PDF (utilise le PDFGenerator)
   */
  private async exportToPDF(orders: Order[], stats: ClientStats, options: ExportOptions): Promise<void> {
    const { pdfGenerator } = await import('../utils/pdfGenerator');
    
    // Filtrer les commandes selon la période si spécifiée
    const filteredOrders = this.filterOrdersByDateRange(orders, options.dateRange);
    
    const pdfOptions = {
      title: 'Historique des Commandes GeoPressCI',
      subtitle: options.dateRange 
        ? `Période: ${options.dateRange.start} - ${options.dateRange.end}`
        : 'Toutes les commandes',
      clientName: 'Client GeoPressCI', // À récupérer depuis le profil utilisateur
      clientEmail: 'client@example.com', // À récupérer depuis le profil utilisateur
      exportDate: new Date().toLocaleDateString('fr-FR')
    };

    if (options.includeDetails && filteredOrders.length === 1) {
      // Export détaillé d'une seule commande
      await pdfGenerator.generateOrderDetailsPDF(filteredOrders[0], pdfOptions);
    } else {
      // Export de l'historique complet
      pdfGenerator.generateOrderHistoryPDF(filteredOrders, pdfOptions);
    }
  }

  /**
   * Export JSON
   */
  private exportToJSON(orders: Order[], stats: ClientStats, options: ExportOptions): void {
    const filteredOrders = this.filterOrdersByDateRange(orders, options.dateRange);
    
    const exportData = {
      exportInfo: {
        date: new Date().toISOString(),
        format: 'json',
        totalOrders: filteredOrders.length,
        dateRange: options.dateRange
      },
      clientStats: stats,
      orders: options.includeDetails ? filteredOrders : filteredOrders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        pressingName: typeof order.pressing === 'string' ? order.pressing : (order.pressing as any)?.nomCommerce || 'Pressing inconnu'
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geopressci-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export CSV
   */
  private exportToCSV(orders: Order[], options: ExportOptions): void {
    const filteredOrders = this.filterOrdersByDateRange(orders, options.dateRange);
    
    const headers = [
      'Numéro de commande',
      'Date',
      'Statut',
      'Pressing',
      'Montant total (FCFA)',
      'Mode de paiement',
      'Évaluation'
    ];

    const csvData = filteredOrders.map(order => [
      order.orderNumber || order._id || '',
      new Date(order.createdAt || '').toLocaleDateString('fr-FR'),
      this.getStatusLabel(order.status),
      typeof order.pressing === 'string' ? order.pressing : (order.pressing as any)?.nomCommerce || '',
      (order.totalAmount || 0).toString(),
      (order as any).paymentMethod || 'Non spécifié',
      (order as any).rating ? `${(order as any).rating}/5` : 'Non noté'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geopressci-commandes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Filtre les commandes par période
   */
  private filterOrdersByDateRange(orders: Order[], dateRange?: { start: string; end: string }): Order[] {
    if (!dateRange) return orders;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt || '');
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  /**
   * Convertit le statut en libellé français
   */
  private getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'in_progress': 'En cours',
      'ready': 'Prête',
      'out_for_delivery': 'En livraison',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
      'refunded': 'Remboursée'
    };
    return statusLabels[status] || status;
  }

  /**
   * Génère un rapport de statistiques personnelles en PDF
   */
  async generatePersonalStatsPDF(stats: ClientStats, clientInfo: { name: string; email: string }): Promise<void> {
    const { pdfGenerator } = await import('../utils/pdfGenerator');
    
    const pdfOptions = {
      title: 'Mes Statistiques GeoPressCI',
      subtitle: 'Résumé de votre activité',
      clientName: clientInfo.name,
      clientEmail: clientInfo.email,
      exportDate: new Date().toLocaleDateString('fr-FR')
    };

    pdfGenerator.generatePersonalStatsPDF(stats, pdfOptions);
  }
}

// Instance singleton
export const clientStatsService = new ClientStatsService();
