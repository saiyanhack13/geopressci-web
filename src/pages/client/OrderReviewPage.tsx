import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, MapPin, User, Phone, Package, CreditCard, Edit3, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { toast } from 'react-hot-toast';
import ServiceMethodSelector from '../../components/order/ServiceMethodSelector';
import useRealTimeOrders from '../../hooks/useRealTimeOrders';

interface OrderReviewData {
  pressingId: string;
  pressingName: string;
  pressingAddress: string;
  pressingPhone: string;
  selectedItems: Array<{
    serviceId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  customerInfo: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
  deliveryAddress: {
    fullAddress: string;
    instructions?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  collectionDateTime: string;
  deliveryDateTime?: string;
  serviceType?: 'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff';
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee?: number;
    total: number;
  };
  apiData: {
    pressingId: string;
    services: Array<{
      serviceId: string;
      quantite: number;
      instructions?: string;
    }>;
    adresseLivraison: string;
    dateRecuperationSouhaitee: string;
    instructionsSpeciales?: string;
  };
}

const OrderReviewPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff'>('delivery');
  const [dynamicPricing, setDynamicPricing] = useState<{
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    total: number;
  } | null>(null);
  
  // Hook pour les mises à jour temps réel
  const {
    isConnected,
    requestFeeUpdate,
    notifyServiceTypeChange
  } = useRealTimeOrders({
    enableNotifications: true,
    onOrderUpdate: (update) => {
      console.log('🔄 Mise à jour de commande reçue:', update);
      // Mettre à jour les frais si nécessaire
      if (update.deliveryFee !== undefined && update.serviceFee !== undefined && update.totalAmount !== undefined) {
        setDynamicPricing({
          subtotal: orderData?.pricing.subtotal || 0,
          deliveryFee: update.deliveryFee,
          serviceFee: update.serviceFee,
          total: update.totalAmount
        });
      }
    }
  });

  // Récupérer les données de commande depuis l'état de navigation
  const { orderData: navigationOrderData, fromOrderCreate } = (location.state || {}) as {
    orderData?: OrderReviewData;
    fromOrderCreate?: boolean;
  };

  // Fonction pour récupérer les données depuis localStorage
  const getOrderDataFromStorage = (): OrderReviewData | null => {
    try {
      const storedData = localStorage.getItem('pendingOrderData');
      const timestamp = localStorage.getItem('pendingOrderTimestamp');
      
      if (!storedData || !timestamp) return null;
      
      // Vérifier que les données ne sont pas trop anciennes (1 heure max)
      const now = Date.now();
      const dataAge = now - parseInt(timestamp);
      const maxAge = 60 * 60 * 1000; // 1 heure en millisecondes
      
      if (dataAge > maxAge) {
        // Nettoyer les données expirées
        localStorage.removeItem('pendingOrderData');
        localStorage.removeItem('pendingOrderTimestamp');
        return null;
      }
      
      return JSON.parse(storedData);
    } catch (error) {
      console.error('Erreur lors de la récupération des données depuis localStorage:', error);
      return null;
    }
  };

  // Utiliser les données de navigation ou localStorage
  const orderData = navigationOrderData || getOrderDataFromStorage();
  const isFromNavigation = !!navigationOrderData;
  const isFromStorage = !navigationOrderData && !!orderData;

  // Initialiser le type de service depuis les données ou par défaut
  useEffect(() => {
    if (orderData?.serviceType) {
      setSelectedServiceType(orderData.serviceType);
    }
  }, [orderData]);

  // Gérer le changement de méthode de service
  const handleServiceTypeChange = (newServiceType: 'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff') => {
    setSelectedServiceType(newServiceType);
    
    // Calculer les nouveaux frais localement
    const currentPricing = dynamicPricing || orderData?.pricing;
    if (currentPricing) {
      let newDeliveryFee = 0;
      let newServiceFee = 0;
      
      // Logique de calcul des frais selon la méthode
      switch (newServiceType) {
        case 'delivery':
          newDeliveryFee = 1000; // Frais de livraison standard
          newServiceFee = 500;   // Frais de service
          break;
        case 'pickup':
        case 'store_pickup':
        case 'store_dropoff':
          newDeliveryFee = 0;    // Pas de frais pour retrait/dépôt en magasin
          newServiceFee = 0;
          break;
      }
      
      const newTotal = currentPricing.subtotal + newDeliveryFee + newServiceFee;
      
      setDynamicPricing({
        subtotal: currentPricing.subtotal,
        deliveryFee: newDeliveryFee,
        serviceFee: newServiceFee,
        total: newTotal
      });
      
      // Notifier le changement via WebSocket si connecté
      if (isConnected) {
        notifyServiceTypeChange('temp-order-id', newServiceType);
        requestFeeUpdate('temp-order-id', newServiceType);
      }
      
      // Afficher un message de confirmation
      if (newDeliveryFee === 0 && newServiceFee === 0) {
        toast.success(`✅ Frais de livraison et de service supprimés!`, {
          duration: 4000,
          icon: '💸'
        });
      }
    }
  };

  // Calculer les frais actuels à afficher
  const getCurrentPricing = () => {
    if (dynamicPricing) {
      return dynamicPricing;
    }
    
    if (orderData?.pricing) {
      return {
        subtotal: orderData.pricing.subtotal,
        deliveryFee: orderData.pricing.deliveryFee,
        serviceFee: orderData.pricing.serviceFee || 500,
        total: orderData.pricing.total
      };
    }
    
    return {
      subtotal: 0,
      deliveryFee: 0,
      serviceFee: 0,
      total: 0
    };
  };

  // Debug: Afficher les données reçues
  console.log('🔍 OrderReviewPage - Debug navigation state:', {
    hasLocationState: !!location.state,
    hasNavigationOrderData: !!navigationOrderData,
    hasStorageOrderData: !!getOrderDataFromStorage(),
    finalOrderData: !!orderData,
    fromOrderCreate,
    isFromNavigation,
    isFromStorage,
    orderDataKeys: orderData ? Object.keys(orderData) : [],
    currentPath: location.pathname,
    locationState: location.state
  });

  // Rediriger si les données sont manquantes
  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Données manquantes</h2>
            <p className="text-gray-600 mb-4">
              Les informations de commande sont introuvables. Veuillez recommencer le processus.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleConfirmOrder = async () => {
    setIsConfirming(true);
    
    try {
      // Générer un ID temporaire pour la commande
      const tempOrderId = `GEO-${Date.now().toString().slice(-6)}`;
      
      console.log('📋 Préparation des données pour le paiement...');
      
      // Préparer les détails complets pour la page de paiement
      const currentPricing = getCurrentPricing();
      const orderDetails = {
        orderId: tempOrderId,
        pressingName: orderData.pressingName,
        items: orderData.selectedItems.map(item => ({
          id: item.serviceId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: currentPricing.subtotal,
        deliveryFee: currentPricing.deliveryFee,
        serviceFee: currentPricing.serviceFee,
        totalAmount: currentPricing.total,
        serviceType: selectedServiceType,
        customerName: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
        customerPhone: orderData.customerInfo.phoneNumber,
        // Données complètes pour la création backend (après validation paiement)
        fullOrderData: {
          ...orderData.apiData,
          // Enrichir avec les informations client
          customerInfo: {
            firstName: orderData.customerInfo.firstName,
            lastName: orderData.customerInfo.lastName,
            phone: orderData.customerInfo.phoneNumber,
            email: orderData.customerInfo.email
          },
          // Informations de pricing
          pricing: {
            subtotal: orderData.pricing.subtotal,
            deliveryFee: orderData.pricing.deliveryFee,
            total: orderData.pricing.total
          },
          // Métadonnées enrichies
          metadata: {
            // Récupérer les métadonnées existantes de manière sécurisée
            ...(orderData.apiData as any)?.metadata || {},
            orderReview: {
              reviewedAt: new Date().toISOString(),
              customerConfirmed: true,
              tempOrderId
            },
            orderFlow: {
              currentStep: 'payment_pending',
              previousSteps: ['pressing_detail', 'order_create', 'order_review'],
              nextStep: 'payment_validation'
            }
          }
        }
      };
      
      console.log('💳 Redirection vers la page de paiement avec données complètes:', {
        tempOrderId,
        pressingName: orderData.pressingName,
        totalAmount: orderData.pricing.total,
        servicesCount: orderData.selectedItems.length,
        hasFullOrderData: !!orderDetails.fullOrderData
      });
      
      // Rediriger vers la page de paiement SANS créer la commande backend
      // La commande sera créée après validation du paiement
      navigate('/client/payment', {
        state: { 
          orderDetails,
          fromOrderReview: true
        },
        replace: true
      });
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la préparation des données de paiement:', error);
      const errorMessage = error?.message || 'Erreur lors de la préparation du paiement';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEditOrder = () => {
    // Retourner à la page de création avec les données actuelles
    navigate('/client/orders/create', {
      state: {
        selectedItems: orderData.selectedItems,
        collectionDateTime: orderData.collectionDateTime,
        deliveryDateTime: orderData.deliveryDateTime,
        pressingId: orderData.pressingId,
        pressingName: orderData.pressingName,
        pressingAddress: orderData.pressingAddress,
        customerInfo: orderData.customerInfo,
        deliveryAddress: orderData.deliveryAddress,
        editMode: true
      },
      replace: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vérification finale</h1>
                <p className="text-gray-600">Vérifiez les détails avant de confirmer votre commande</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4" />
              <span>Étape 3/4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Informations du pressing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Pressing sélectionné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{orderData.pressingName}</h3>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{orderData.pressingAddress}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{orderData.pressingPhone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sélection de la méthode de service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2 text-orange-600" />
              Méthode de service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceMethodSelector
              selectedMethod={selectedServiceType}
              onMethodChange={handleServiceTypeChange}
              orderTotal={getCurrentPricing().subtotal}
              customerLocation={orderData.deliveryAddress.coordinates ? {
                address: orderData.deliveryAddress.fullAddress,
                coordinates: [orderData.deliveryAddress.coordinates.lng, orderData.deliveryAddress.coordinates.lat] as [number, number]
              } : undefined}
              pressingLocation={{
                address: orderData.pressingAddress,
                coordinates: [0, 0] as [number, number] // À adapter selon les données du pressing
              }}
              orderId={undefined} // Pas encore d'ID de commande
              className="mb-4"
            />
            
            {/* Indicateur de connexion temps réel */}
            <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>
                  {isConnected ? 'Temps réel activé' : 'Hors ligne'}
                </span>
              </div>
              {selectedServiceType !== 'delivery' && (
                <span className="text-green-600 font-medium">
                  ✅ Frais de livraison supprimés
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2 text-purple-600" />
                Informations client
              </div>
              <button
                onClick={() => toast('Modification des informations client disponible dans votre profil', { icon: '👤' })}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Modifier
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-3 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-700">Nom complet:</span>
                  <span className="ml-2 text-gray-900">
                    {orderData.customerInfo.firstName && orderData.customerInfo.lastName
                      ? `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`
                      : orderData.customerInfo.firstName || orderData.customerInfo.lastName || 'Non renseigné'
                    }
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-3 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-700">Téléphone:</span>
                  <span className="ml-2 text-gray-900">
                    {orderData.customerInfo.phoneNumber || 'Non renseigné'}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-3 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">
                    {orderData.customerInfo.email || 'Non renseigné'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services sélectionnés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                Services sélectionnés
              </div>
              <button
                onClick={handleEditOrder}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Modifier
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderData.selectedItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-semibold">{item.total.toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
              
              {/* Résumé financier */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{getCurrentPricing().subtotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frais de livraison</span>
                  <span className={getCurrentPricing().deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {getCurrentPricing().deliveryFee === 0 
                      ? 'Gratuit 🎉' 
                      : `${getCurrentPricing().deliveryFee.toLocaleString('fr-FR')} FCFA`
                    }
                  </span>
                </div>
                {getCurrentPricing().serviceFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Frais de service</span>
                    <span>{getCurrentPricing().serviceFee.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {selectedServiceType !== 'delivery' && (
                  <div className="flex justify-between text-green-600 text-sm font-medium">
                    <span>💸 Économie réalisée</span>
                    <span>-{(orderData?.pricing.deliveryFee + (orderData?.pricing.serviceFee || 500)).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">{getCurrentPricing().total.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Adresse de livraison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-red-600" />
                Adresse de livraison
              </div>
              <button
                onClick={handleEditOrder}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Modifier
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-900">
                {orderData.deliveryAddress.fullAddress}
                {orderData.deliveryAddress.coordinates && (
                  <span className="text-gray-500 text-sm ml-2">
                    (Position: {orderData.deliveryAddress.coordinates.lat.toFixed(6)}, {orderData.deliveryAddress.coordinates.lng.toFixed(6)})
                  </span>
                )}
              </p>
              {orderData.deliveryAddress.instructions && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Instructions spéciales</label>
                  <p className="text-gray-600 italic">{orderData.deliveryAddress.instructions}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date et heure de collecte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-600" />
                Créneau de collecte
              </div>
              <button
                onClick={handleEditOrder}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Modifier
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-orange-600">
              {format(new Date(orderData.collectionDateTime), "eeee dd MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Nous viendrons récupérer vos vêtements à cette date et heure
            </p>
            {orderData.deliveryDateTime && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-1">Livraison prévue :</p>
                <p className="text-lg font-medium text-green-600">
                  {format(new Date(orderData.deliveryDateTime), "eeee dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Vos vêtements seront livrés à cette date et heure
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button
            variant="outline"
            onClick={handleEditOrder}
            className="flex-1"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Modifier la commande
          </Button>
          <Button
            onClick={handleConfirmOrder}
            disabled={isConfirming}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Préparation...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Confirmer et payer
              </>
            )}
          </Button>
        </div>

        {/* Note importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important :</p>
              <p>
                En confirmant cette commande, vous acceptez nos conditions de service. 
                Un SMS de confirmation vous sera envoyé après le paiement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewPage;
