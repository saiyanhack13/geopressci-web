import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Store, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { realtimeService } from '../../services/realtimeService';

export interface ServiceMethod {
  type: 'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff';
  label: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime: string;
  deliveryFee: number;
  serviceFee: number;
  available: boolean;
  conditions?: string[];
}

interface ServiceMethodSelectorProps {
  selectedMethod: ServiceMethod['type'];
  onMethodChange: (method: ServiceMethod['type']) => void;
  orderTotal: number;
  pressingLocation?: {
    address: string;
    coordinates: [number, number];
  };
  customerLocation?: {
    address: string;
    coordinates: [number, number];
  };
  orderId?: string;
  disabled?: boolean;
  className?: string;
}

const ServiceMethodSelector: React.FC<ServiceMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  orderTotal,
  pressingLocation,
  customerLocation,
  orderId,
  disabled = false,
  className = ''
}) => {
  const [isUpdatingFees, setIsUpdatingFees] = useState(false);
  const [calculatedFees, setCalculatedFees] = useState<{
    [key: string]: { deliveryFee: number; serviceFee: number; total: number };
  }>({});

  // Configuration des méthodes de service
  const serviceMethods: ServiceMethod[] = [
    {
      type: 'delivery',
      label: 'Livraison à domicile',
      description: 'Collecte et livraison à votre adresse',
      icon: <Truck className="w-5 h-5" />,
      estimatedTime: '2-4h',
      deliveryFee: 1000,
      serviceFee: 500,
      available: true,
      conditions: ['Disponible dans un rayon de 15km', 'Frais de livraison selon la distance']
    },
    {
      type: 'pickup',
      label: 'Retrait au pressing',
      description: 'Vous récupérez votre commande au pressing',
      icon: <Store className="w-5 h-5" />,
      estimatedTime: '1-2h',
      deliveryFee: 0,
      serviceFee: 0,
      available: true,
      conditions: ['Aucun frais supplémentaire', 'Horaires d\'ouverture du pressing']
    },
    {
      type: 'store_pickup',
      label: 'Retrait en magasin',
      description: 'Dépôt et retrait directement au magasin',
      icon: <MapPin className="w-5 h-5" />,
      estimatedTime: 'Immédiat',
      deliveryFee: 0,
      serviceFee: 0,
      available: true,
      conditions: ['Service immédiat', 'Aucun frais de transport', 'Disponible aux heures d\'ouverture']
    },
    {
      type: 'store_dropoff',
      label: 'Dépôt en magasin',
      description: 'Vous apportez vos vêtements directement',
      icon: <Store className="w-5 h-5" />,
      estimatedTime: 'Selon service',
      deliveryFee: 0,
      serviceFee: 0,
      available: true,
      conditions: ['Aucun frais de collecte', 'Livraison ou retrait selon votre choix']
    }
  ];

  // Calculer les frais en temps réel
  useEffect(() => {
    const calculateFees = async () => {
      const newCalculatedFees: typeof calculatedFees = {};
      
      for (const method of serviceMethods) {
        let deliveryFee = method.deliveryFee;
        let serviceFee = method.serviceFee;
        
        // Logique de calcul des frais selon la méthode
        if (method.type === 'delivery' && customerLocation && pressingLocation) {
          // Calculer la distance pour la livraison
          const distance = calculateDistance(
            pressingLocation.coordinates,
            customerLocation.coordinates
          );
          deliveryFee = Math.max(1000, distance * 100); // 100 FCFA par km, minimum 1000
        } else if (method.type === 'pickup' || method.type === 'store_pickup' || method.type === 'store_dropoff') {
          // Pas de frais pour les retraits/dépôts en magasin
          deliveryFee = 0;
          serviceFee = 0;
        }
        
        newCalculatedFees[method.type] = {
          deliveryFee,
          serviceFee,
          total: orderTotal + deliveryFee + serviceFee
        };
      }
      
      setCalculatedFees(newCalculatedFees);
    };
    
    calculateFees();
  }, [orderTotal, customerLocation, pressingLocation]);

  // Calculer la distance entre deux points (formule de Haversine)
  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Gérer le changement de méthode
  const handleMethodChange = async (method: ServiceMethod['type']) => {
    if (disabled || method === selectedMethod) return;
    
    setIsUpdatingFees(true);
    
    try {
      // Notifier le changement via WebSocket si disponible
      if (realtimeService.isConnected()) {
        realtimeService.notifyServiceTypeChange(orderId || 'temp-order', method);
        realtimeService.requestFeeUpdate(orderId || 'temp-order', method);
      }
      
      // Mettre à jour la méthode sélectionnée
      onMethodChange(method);
      
      // Afficher un message de confirmation
      const selectedMethodConfig = serviceMethods.find(m => m.type === method);
      if (selectedMethodConfig) {
        const fees = calculatedFees[method];
        if (fees && (fees.deliveryFee === 0 && fees.serviceFee === 0)) {
          toast.success(`✅ ${selectedMethodConfig.label} sélectionné - Frais supprimés!`, {
            duration: 4000,
            icon: '💸'
          });
        } else {
          toast.success(`✅ ${selectedMethodConfig.label} sélectionné`, {
            duration: 3000
          });
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du changement de méthode:', error);
      toast.error('❌ Erreur lors de la mise à jour de la méthode de service');
    } finally {
      setIsUpdatingFees(false);
    }
  };

  // Formater le prix
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center space-x-2 mb-6">
        <Truck className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Méthode de service
        </h3>
        {isUpdatingFees && (
          <div className="flex items-center space-x-1 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span>Mise à jour...</span>
          </div>
        )}
      </div>

      {/* Options de service */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceMethods.map((method) => {
          const isSelected = selectedMethod === method.type;
          const fees = calculatedFees[method.type];
          const isStoreMethod = method.type === 'store_pickup' || method.type === 'store_dropoff';
          
          return (
            <div
              key={method.type}
              onClick={() => handleMethodChange(method.type)}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${!method.available ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              {/* Badge de sélection */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}

              {/* Badge d'économie pour les méthodes en magasin */}
              {isStoreMethod && (
                <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  GRATUIT
                </div>
              )}

              {/* Contenu principal */}
              <div className="flex items-start space-x-3">
                <div className={`
                  p-2 rounded-lg flex-shrink-0
                  ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                `}>
                  {method.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {method.label}
                    </h4>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{method.estimatedTime}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {method.description}
                  </p>

                  {/* Détails des frais */}
                  {fees && (
                    <div className="space-y-1 mb-3">
                      {fees.deliveryFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Livraison:</span>
                          <span className="font-medium">{formatPrice(fees.deliveryFee)}</span>
                        </div>
                      )}
                      {fees.serviceFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service:</span>
                          <span className="font-medium">{formatPrice(fees.serviceFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold border-t pt-1">
                        <span>Total:</span>
                        <span className={isStoreMethod ? 'text-green-600' : 'text-gray-900'}>
                          {formatPrice(fees.total)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Conditions */}
                  {method.conditions && method.conditions.length > 0 && (
                    <div className="space-y-1">
                      {method.conditions.map((condition, index) => (
                        <div key={index} className="flex items-start space-x-1 text-xs text-gray-500">
                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{condition}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message d'information pour les méthodes en magasin */}
      {(selectedMethod === 'store_pickup' || selectedMethod === 'store_dropoff') && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                Économies réalisées !
              </h4>
              <p className="text-sm text-green-800">
                En choisissant le {selectedMethod === 'store_pickup' ? 'retrait' : 'dépôt'} en magasin, 
                vous économisez sur les frais de livraison et de service. 
                {pressingLocation && (
                  <span className="block mt-1 font-medium">
                    📍 Adresse: {pressingLocation.address}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Avertissement si pas de localisation */}
      {selectedMethod === 'delivery' && (!customerLocation || !pressingLocation) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">
                Localisation requise
              </h4>
              <p className="text-sm text-yellow-800">
                Pour calculer les frais de livraison précis, nous avons besoin de votre adresse de livraison.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceMethodSelector;
