/**
 * Utilitaires de test pour le processus de commande optimisé
 * Permet de valider le flux: PressingDetail → OrderCreate → OrderReview → Payment → Backend + Notification
 */

export interface OrderProcessTestData {
  pressingId: string;
  selectedServices: Array<{
    serviceId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  collectionDateTime: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  deliveryAddress: string;
  deliveryInstructions?: string;
  specialInstructions?: string;
}

export interface OrderProcessValidation {
  step: string;
  success: boolean;
  data?: any;
  errors?: string[];
  timestamp: string;
}

/**
 * Valider les données à chaque étape du processus de commande
 */
export class OrderProcessValidator {
  private validations: OrderProcessValidation[] = [];

  /**
   * Valider les données de PressingDetailPage
   */
  validatePressingDetailData(data: {
    selectedItems: any[];
    collectionDateTime: string;
    pressingId: string;
    pressingName?: string;
    pressingAddress?: string;
  }): OrderProcessValidation {
    const errors: string[] = [];
    
    if (!data.pressingId) {
      errors.push('Pressing ID manquant');
    }
    
    if (!data.selectedItems || data.selectedItems.length === 0) {
      errors.push('Aucun service sélectionné');
    }
    
    if (!data.collectionDateTime) {
      errors.push('Date/heure de collecte manquante');
    }
    
    // Valider chaque service sélectionné
    data.selectedItems?.forEach((item, index) => {
      if (!item.serviceId) {
        errors.push(`Service ${index + 1}: ID manquant`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Service ${index + 1}: Quantité invalide`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(`Service ${index + 1}: Prix invalide`);
      }
    });

    const validation: OrderProcessValidation = {
      step: 'PressingDetailPage',
      success: errors.length === 0,
      data: {
        servicesCount: data.selectedItems?.length || 0,
        hasPressingInfo: !!(data.pressingName || data.pressingAddress),
        hasDateTime: !!data.collectionDateTime
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    this.validations.push(validation);
    return validation;
  }

  /**
   * Valider les données de OrderCreatePage
   */
  validateOrderCreateData(data: {
    deliveryAddress: string;
    customerInfo: any;
    selectedServices: Record<string, number>;
    pricing: any;
  }): OrderProcessValidation {
    const errors: string[] = [];
    
    if (!data.deliveryAddress?.trim()) {
      errors.push('Adresse de livraison manquante');
    }
    
    if (!data.customerInfo?.firstName?.trim()) {
      errors.push('Prénom client manquant');
    }
    
    if (!data.customerInfo?.lastName?.trim()) {
      errors.push('Nom client manquant');
    }
    
    if (!data.customerInfo?.phone?.trim()) {
      errors.push('Téléphone client manquant');
    }
    
    if (!data.selectedServices || Object.keys(data.selectedServices).length === 0) {
      errors.push('Aucun service sélectionné');
    }
    
    if (!data.pricing?.total || data.pricing.total <= 0) {
      errors.push('Montant total invalide');
    }

    const validation: OrderProcessValidation = {
      step: 'OrderCreatePage',
      success: errors.length === 0,
      data: {
        servicesCount: Object.keys(data.selectedServices || {}).length,
        totalAmount: data.pricing?.total || 0,
        hasCustomerInfo: !!(data.customerInfo?.firstName && data.customerInfo?.lastName),
        hasDeliveryAddress: !!data.deliveryAddress?.trim()
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    this.validations.push(validation);
    return validation;
  }

  /**
   * Valider les données de OrderReviewPage
   */
  validateOrderReviewData(data: {
    orderData: any;
    fromOrderCreate: boolean;
  }): OrderProcessValidation {
    const errors: string[] = [];
    
    if (!data.fromOrderCreate) {
      errors.push('Navigation incorrecte - doit venir de OrderCreatePage');
    }
    
    if (!data.orderData) {
      errors.push('Données de commande manquantes');
    }
    
    const orderData = data.orderData;
    if (orderData) {
      if (!orderData.apiData) {
        errors.push('Données API backend manquantes');
      }
      
      if (!orderData.selectedItems || orderData.selectedItems.length === 0) {
        errors.push('Services sélectionnés manquants');
      }
      
      if (!orderData.customerInfo) {
        errors.push('Informations client manquantes');
      }
      
      if (!orderData.pricing?.total) {
        errors.push('Informations de pricing manquantes');
      }
    }

    const validation: OrderProcessValidation = {
      step: 'OrderReviewPage',
      success: errors.length === 0,
      data: {
        hasApiData: !!orderData?.apiData,
        servicesCount: orderData?.selectedItems?.length || 0,
        totalAmount: orderData?.pricing?.total || 0,
        hasCustomerInfo: !!orderData?.customerInfo,
        correctNavigation: data.fromOrderCreate
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    this.validations.push(validation);
    return validation;
  }

  /**
   * Valider les données de PaymentPage
   */
  validatePaymentData(data: {
    orderDetails: any;
    fromOrderReview: boolean;
  }): OrderProcessValidation {
    const errors: string[] = [];
    
    if (!data.fromOrderReview) {
      errors.push('Navigation incorrecte - doit venir de OrderReviewPage');
    }
    
    if (!data.orderDetails) {
      errors.push('Détails de commande manquants');
    }
    
    const orderDetails = data.orderDetails;
    if (orderDetails) {
      if (!orderDetails.fullOrderData) {
        errors.push('Données complètes pour backend manquantes');
      }
      
      if (!orderDetails.items || orderDetails.items.length === 0) {
        errors.push('Articles de commande manquants');
      }
      
      if (!orderDetails.totalAmount || orderDetails.totalAmount <= 0) {
        errors.push('Montant total invalide');
      }
      
      if (!orderDetails.customerName?.trim()) {
        errors.push('Nom client manquant');
      }
      
      if (!orderDetails.customerPhone?.trim()) {
        errors.push('Téléphone client manquant');
      }
    }

    const validation: OrderProcessValidation = {
      step: 'PaymentPage',
      success: errors.length === 0,
      data: {
        hasFullOrderData: !!orderDetails?.fullOrderData,
        itemsCount: orderDetails?.items?.length || 0,
        totalAmount: orderDetails?.totalAmount || 0,
        hasCustomerInfo: !!(orderDetails?.customerName && orderDetails?.customerPhone),
        correctNavigation: data.fromOrderReview
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    this.validations.push(validation);
    return validation;
  }

  /**
   * Valider la création de commande backend
   */
  validateBackendOrderCreation(data: {
    backendResult: any;
    notificationResults: any[];
  }): OrderProcessValidation {
    const errors: string[] = [];
    
    if (!data.backendResult) {
      errors.push('Résultat backend manquant');
    }
    
    if (!data.backendResult?._id) {
      errors.push('ID de commande backend manquant');
    }
    
    if (!data.notificationResults || data.notificationResults.length === 0) {
      errors.push('Aucun résultat de notification');
    }
    
    const successfulNotifications = data.notificationResults?.filter(r => r.success) || [];
    if (successfulNotifications.length === 0) {
      errors.push('Aucune notification réussie');
    }

    const validation: OrderProcessValidation = {
      step: 'BackendOrderCreation',
      success: errors.length === 0,
      data: {
        backendOrderId: data.backendResult?._id,
        orderReference: data.backendResult?.reference,
        notificationsCount: data.notificationResults?.length || 0,
        successfulNotifications: successfulNotifications.length,
        notificationMethods: successfulNotifications.map(n => n.method)
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    this.validations.push(validation);
    return validation;
  }

  /**
   * Obtenir le rapport complet de validation
   */
  getValidationReport(): {
    overallSuccess: boolean;
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    validations: OrderProcessValidation[];
    summary: string;
  } {
    const totalSteps = this.validations.length;
    const successfulSteps = this.validations.filter(v => v.success).length;
    const failedSteps = totalSteps - successfulSteps;
    const overallSuccess = failedSteps === 0;

    let summary = `Processus de commande: ${successfulSteps}/${totalSteps} étapes réussies`;
    if (!overallSuccess) {
      const failedStepNames = this.validations.filter(v => !v.success).map(v => v.step);
      summary += `. Échecs: ${failedStepNames.join(', ')}`;
    }

    return {
      overallSuccess,
      totalSteps,
      successfulSteps,
      failedSteps,
      validations: this.validations,
      summary
    };
  }

  /**
   * Réinitialiser les validations
   */
  reset(): void {
    this.validations = [];
  }
}

/**
 * Données de test par défaut pour le processus de commande
 */
export const defaultTestData: OrderProcessTestData = {
  pressingId: 'test-pressing-123',
  selectedServices: [
    {
      serviceId: 'service-1',
      name: 'Lavage standard',
      price: 1000,
      quantity: 2
    },
    {
      serviceId: 'service-2',
      name: 'Repassage',
      price: 500,
      quantity: 1
    }
  ],
  collectionDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
  customerInfo: {
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+225 0701234567',
    email: 'jean.dupont@example.com'
  },
  deliveryAddress: '123 Rue de la Paix, Cocody, Abidjan',
  deliveryInstructions: 'Sonner à la porte principale',
  specialInstructions: 'Attention aux vêtements délicats'
};

// Instance globale pour les tests
export const orderProcessValidator = new OrderProcessValidator();
