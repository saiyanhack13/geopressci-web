import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Order, OrderItem, Pressing } from '../types';

// Extension des types jsPDF pour autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

// Types étendus pour gérer les propriétés manquantes
interface ExtendedOrder extends Order {
  statusHistory?: Array<{ status: string; date: string; note?: string }>;
  paymentMethod?: string;
  rating?: number;
  pickupAddress?: string;
  deliveryDate?: string;
  pressingName?: string;
}

interface ExtendedOrderItem extends OrderItem {
  name?: string;
  service?: string;
  serviceName?: string;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  clientName: string;
  clientEmail: string;
  exportDate: string;
}

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  /**
   * Génère un PDF de l'historique des commandes
   */
  generateOrderHistoryPDF(orders: Order[], options: PDFExportOptions): void {
    this.doc = new jsPDF();
    
    // En-tête
    this.addHeader(options);
    
    // Informations client
    this.addClientInfo(options);
    
    // Résumé statistiques
    this.addOrdersSummary(orders);
    
    // Tableau des commandes
    this.addOrdersTable(orders);
    
    // Pied de page
    this.addFooter();
    
    // Télécharger le PDF
    this.doc.save(`geopressci-historique-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Génère un PDF détaillé d'une commande
   */
  async generateOrderDetailsPDF(order: ExtendedOrder, options: PDFExportOptions): Promise<void> {
    this.doc = new jsPDF();
    
    // En-tête
    this.addHeader({
      ...options,
      title: `Détails de la Commande #${order.orderNumber || order._id}`,
      subtitle: `Statut: ${this.getStatusLabel(order.status)}`
    });
    
    // Informations commande
    this.addOrderDetails(order);
    
    // Articles de la commande
    this.addOrderItems(order);
    
    // Informations de livraison
    this.addDeliveryInfo(order);
    
    // Historique des statuts
    if (order.statusHistory) {
      this.addStatusHistory(order.statusHistory);
    }
    
    // Pied de page
    this.addFooter();
    
    // Télécharger le PDF
    this.doc.save(`geopressci-commande-${order.orderNumber || order._id}.pdf`);
  }

  /**
   * Génère un PDF des statistiques personnelles
   */
  generatePersonalStatsPDF(stats: any, options: PDFExportOptions): void {
    this.doc = new jsPDF();
    
    // En-tête
    this.addHeader({
      ...options,
      title: 'Mes Statistiques GeoPressCI',
      subtitle: 'Résumé de votre activité'
    });
    
    // Informations client
    this.addClientInfo(options);
    
    // Statistiques générales
    this.addPersonalStats(stats);
    
    // Graphiques (si disponibles)
    if (stats.monthlyData) {
      this.addMonthlyChart(stats.monthlyData);
    }
    
    // Pied de page
    this.addFooter();
    
    // Télécharger le PDF
    this.doc.save(`geopressci-statistiques-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private addHeader(options: PDFExportOptions): void {
    // Logo et titre
    this.doc.setFontSize(20);
    this.doc.setTextColor(59, 130, 246); // Bleu GeoPressCI
    this.doc.text('GeoPressCI', 20, 25);
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(options.title, 20, 40);
    
    if (options.subtitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text(options.subtitle, 20, 50);
    }
    
    // Date d'export
    this.doc.setFontSize(10);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(`Généré le: ${options.exportDate}`, 20, this.doc.internal.pageSize.height - 20);
  }

  private addClientInfo(options: PDFExportOptions): void {
    const startY = options.subtitle ? 65 : 55;
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Informations Client:', 20, startY);
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(`Nom: ${options.clientName}`, 20, startY + 10);
    this.doc.text(`Email: ${options.clientEmail}`, 20, startY + 20);
  }

  private addOrdersSummary(orders: Order[]): void {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedOrders = orders.filter(order => order.status === 'livree').length;
    const avgAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;

    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Résumé:', 20, 100);

    const summaryData = [
      ['Nombre total de commandes', totalOrders.toString()],
      ['Commandes livrées', completedOrders.toString()],
      ['Montant total dépensé', `${totalAmount.toLocaleString()} FCFA`],
      ['Montant moyen par commande', `${Math.round(avgAmount).toLocaleString()} FCFA`]
    ];

    (this.doc as any).autoTable({
      startY: 110,
      head: [['Métrique', 'Valeur']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 }
    });
  }

  private addOrdersTable(orders: Order[]): void {
    const tableData = orders.map(order => [
      order.orderNumber || order._id?.substring(0, 8),
      this.getStatusLabel(order.status),
      new Date(order.createdAt || '').toLocaleDateString('fr-FR'),
      this.getPressingName(order.pressing) || 'N/A',
      `${(order.totalAmount || 0).toLocaleString()} FCFA`
    ]);

    (this.doc as any).autoTable({
      startY: (this.doc as any).lastAutoTable ? (this.doc as any).lastAutoTable.finalY + 20 : 160,
      head: [['N° Commande', 'Statut', 'Date', 'Pressing', 'Montant']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 }
    });
  }

  private addOrderDetails(order: ExtendedOrder): void {
    const startY = 80;
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Détails de la Commande:', 20, startY);

    const details = [
      ['Numéro de commande', order.orderNumber || order._id || 'N/A'],
      ['Date de création', new Date(order.createdAt || '').toLocaleDateString('fr-FR')],
      ['Statut actuel', this.getStatusLabel(order.status)],
      ['Pressing', this.getPressingName(order.pressing) || 'N/A'],
      ['Montant total', `${(order.totalAmount || 0).toLocaleString()} FCFA`],
      ['Méthode de paiement', order.paymentMethod || 'Non spécifiée']
    ];

    (this.doc as any).autoTable({
      startY: startY + 10,
      body: details,
      theme: 'plain',
      margin: { left: 20, right: 20 },
      styles: { fontSize: 10 }
    });
  }

  private getOrderStatusHistory(order: ExtendedOrder): string {
    const extendedOrder = order as ExtendedOrder;
    if (!extendedOrder.statusHistory || extendedOrder.statusHistory.length === 0) {
      return `Statut actuel: ${this.getStatusLabel(order.status)}`;
    }
    return extendedOrder.statusHistory
      .map(entry => `${entry.date}: ${this.getStatusLabel(entry.status)}${entry.note ? ` (${entry.note})` : ''}`)
      .join('\n');
  }

  private addOrderItems(order: ExtendedOrder): void {
    if (!order.items || order.items.length === 0) return;

    const itemsData = order.items.map(item => [
      item.serviceName || 'Article',
      item.quantity?.toString() || '1',
      'Service standard',
      `${(item.price || 0).toLocaleString()} FCFA`,
      `${((item.quantity || 1) * (item.price || 0)).toLocaleString()} FCFA`
    ]);

    (this.doc as any).autoTable({
      startY: (this.doc as any).lastAutoTable ? (this.doc as any).lastAutoTable.finalY + 20 : 140,
      head: [['Article', 'Quantité', 'Service', 'Prix unitaire', 'Total']],
      body: itemsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 }
    });
  }

  private addDeliveryInfo(order: ExtendedOrder): void {
    if (!order.deliveryAddress) return;

    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    const startY = (this.doc as any).lastAutoTable ? (this.doc as any).lastAutoTable.finalY + 20 : 180;
    this.doc.text('Informations de Livraison:', 20, startY);

    const deliveryData = [];
    if (order.deliveryAddress) {
      deliveryData.push(['Adresse de livraison', order.deliveryAddress]);
    }
    if (order.status === 'livree') {
      deliveryData.push(['Date de livraison estimée', new Date(order.estimatedDelivery).toLocaleDateString('fr-FR')]);
    }

    if (deliveryData.length > 0) {
      (this.doc as any).autoTable({
        startY: startY + 10,
        body: deliveryData,
        theme: 'plain',
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 }
      });
    }
  }

  private addStatusHistory(statusHistory: { status: string; date: string; note?: string; }[]): void {
    if (!statusHistory || statusHistory.length === 0) return;

    const historyData = statusHistory.map(entry => [
      this.getStatusLabel(entry.status),
      entry.date,
      entry.note || '-'
    ]);

    (this.doc as any).autoTable({
      startY: (this.doc as any).lastAutoTable ? (this.doc as any).lastAutoTable.finalY + 20 : 200,
      head: [['Statut', 'Date', 'Commentaire']],
      body: historyData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 }
    });
  }

  private addPersonalStats(stats: any): void {
    const startY = 100;
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Vos Statistiques:', 20, startY);

    const statsData = [
      ['Commandes totales', stats.totalOrders?.toString() || '0'],
      ['Commandes livrées', stats.deliveredOrders?.toString() || '0'],
      ['Montant total dépensé', `${(stats.totalSpent || 0).toLocaleString()} FCFA`],
      ['Pressing favori', stats.favoritePressing || 'N/A'],
      ['Service le plus utilisé', stats.mostUsedService || 'N/A'],
      ['Taux de satisfaction', `${stats.satisfactionRate || 0}%`]
    ];

    (this.doc as any).autoTable({
      startY: startY + 10,
      head: [['Métrique', 'Valeur']],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 }
    });
  }

  private addMonthlyChart(monthlyData: any[]): void {
    // Pour une implémentation complète, on pourrait utiliser Chart.js pour générer une image
    // et l'insérer dans le PDF. Pour l'instant, on affiche les données sous forme de tableau.
    
    const chartData = monthlyData.map(data => [
      data.month,
      data.orders?.toString() || '0',
      `${(data.amount || 0).toLocaleString()} FCFA`
    ]);

    (this.doc as any).autoTable({
      startY: (this.doc as any).lastAutoTable ? (this.doc as any).lastAutoTable.finalY + 20 : 180,
      head: [['Mois', 'Commandes', 'Montant']],
      body: chartData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 }
    });
  }

  private addFooter(): void {
    const pageHeight = this.doc.internal.pageSize.height;
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text('GeoPressCI - Service de pressing à domicile', 20, pageHeight - 10);
    this.doc.text('Contact: support@geopressci.com | Tél: +225 XX XX XX XX', 20, pageHeight - 5);
  }

  private getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'confirmee': 'Confirmée',
      'en_traitement': 'En traitement',
      'traitement_termine': 'Traitement terminé',
      'en_livraison': 'En livraison',
      'livree': 'Livrée',
      'annulee': 'Annulée',
      'retournee': 'Retournée',
      // Fallback pour les anciens statuts
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

  private getPressingName(pressing: string | Pressing | undefined): string {
    if (!pressing) return 'N/A';
    // Gérer les différents formats de pressing
    let pressingName: string;
    if (typeof pressing === 'string') {
      pressingName = pressing;
    } else if (pressing && typeof pressing === 'object' && 'nomCommerce' in pressing) {
      pressingName = (pressing as any).nomCommerce;
    } else if (pressingName) {
      pressingName = pressingName;
    } else {
      pressingName = 'Pressing inconnu';
    }
    return pressingName;
  }
}

// Instance singleton pour l'utilisation globale
export const pdfGenerator = new PDFGenerator();
