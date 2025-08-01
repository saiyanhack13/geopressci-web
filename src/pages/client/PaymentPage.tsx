import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { MobileMoneyOperatorSelector, MobileMoneyOperator } from '../../components/payment/MobileMoneySelector';
import NumberInput from '../../components/payment/NumberInput';
import AmountDisplay from '../../components/payment/AmountDisplay';
import { TransactionStatus } from '../../components/payment/TransactionStatus';
import { useInitiatePaymentMutation, useCreateOrderMutation } from '../../services/api';
import { toast } from 'react-hot-toast';
import { notificationService, NotificationData } from '../../services/notificationService';

interface PaymentStep {
  step: 'method' | 'operator' | 'details' | 'confirmation' | 'processing';
}

type PaymentMethod = 'mobile_money' | 'cash_on_delivery';

interface CashOnDeliveryInfo {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  specialInstructions?: string;
}

interface OrderDetails {
  orderId?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  fees: number;
  discount?: number;
  totalAmount: number;
  pressingName: string;
  customerName: string;
  customerPhone: string;
  // Données complètes pour la création de commande backend
  fullOrderData?: {
    pressingId: string;
    services: Array<{
      serviceId: string;
      quantite: number;
      instructions?: string;
      prix: number;
      nom: string;
      description?: string;
      categorie?: string;
    }>;
    adresseLivraison: string;
    dateRecuperationSouhaitee: string;
    instructionsSpeciales?: string;
    deliveryInstructions?: string;
    pressingName?: string;
    pressingAddress?: string;
    metadata?: any;
  };
}

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { orderDetails } = (location.state || {}) as { orderDetails?: OrderDetails };
  
  const [currentStep, setCurrentStep] = useState<PaymentStep['step']>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<MobileMoneyOperator | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashOnDeliveryInfo, setCashOnDeliveryInfo] = useState<CashOnDeliveryInfo>({
    customerName: orderDetails?.customerName || '',
    customerPhone: orderDetails?.customerPhone || '',
    deliveryAddress: '',
    specialInstructions: ''
  });
  
  const [initiatePayment, { isLoading: isInitiating }] = useInitiatePaymentMutation();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();

  const handleOperatorSelect = (operator: MobileMoneyOperator) => {
    setSelectedOperator(operator);
    setPhoneNumber('');
    setPhoneError('');
  };

  const handleNextStep = () => {
    if (currentStep === 'method' && paymentMethod) {
      if (paymentMethod === 'mobile_money') {
        setCurrentStep('operator');
      } else if (paymentMethod === 'cash_on_delivery') {
        setCurrentStep('confirmation');
      }
    } else if (currentStep === 'operator' && selectedOperator) {
      setCurrentStep('details');
    } else if (currentStep === 'details' && validatePhoneNumber()) {
      setCurrentStep('confirmation');
    } else if (currentStep === 'confirmation') {
      handlePayment();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'operator') {
      setCurrentStep('method');
    } else if (currentStep === 'details') {
      setCurrentStep('operator');
    } else if (currentStep === 'confirmation') {
      if (paymentMethod === 'mobile_money') {
        setCurrentStep('details');
      } else if (paymentMethod === 'cash_on_delivery') {
        setCurrentStep('method');
      }
    }
  };

  const validatePhoneNumber = (): boolean => {
    if (!selectedOperator) {
      setPhoneError('Veuillez sélectionner un opérateur');
      return false;
    }
    
    if (!phoneNumber || phoneNumber.length < selectedOperator.minLength) {
      setPhoneError('Veuillez saisir un numéro valide');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const handlePayment = async () => {
    if (!orderDetails) return;
    
    setCurrentStep('processing');
    setIsProcessing(true);
    
    try {
      let paymentResult = null;
      let orderId = orderDetails.orderId || `GEO-${Date.now().toString().slice(-6)}`;
      
      // Étape 1: Traitement du paiement selon la méthode choisie
      if (paymentMethod === 'cash_on_delivery') {
        // Pour le paiement à domicile, pas de traitement de paiement immédiat
        console.log('💰 Paiement à domicile sélectionné - Pas de traitement de paiement immédiat');
        paymentResult = {
          status: 'pending',
          paymentMethod: 'cash_on_delivery',
          orderId,
          customerInfo: cashOnDeliveryInfo
        };
      } else if (paymentMethod === 'mobile_money' && selectedOperator) {
        // Paiement Mobile Money
        const paymentData = {
          orderId,
          provider: selectedOperator.name.toLowerCase().replace(/\s+/g, '_') as any,
          phoneNumber: phoneNumber,
          amount: orderDetails.totalAmount
        };

        console.log('💳 Initiation du paiement Mobile Money:', paymentData);
        
        const mobileMoneyResult = await initiatePayment(paymentData).unwrap();
        
        if (!mobileMoneyResult || mobileMoneyResult.status !== 'succeeded') {
          throw new Error('Paiement Mobile Money échoué');
        }
        
        paymentResult = {
          status: 'succeeded',
          paymentMethod: 'mobile_money',
          transactionId: mobileMoneyResult.transactionId,
          orderId,
          operator: selectedOperator,
          phoneNumber
        };
        
        console.log('✅ Paiement Mobile Money réussi:', paymentResult);
      } else {
        throw new Error('Méthode de paiement non valide');
      }
      
      // Étape 2: Création de la commande backend après validation du paiement
      if (orderDetails.fullOrderData) {
        console.log('📦 Création de la commande backend...');
        
        // Enrichir les données de commande avec les informations de paiement
        const backendOrderData = {
          ...orderDetails.fullOrderData,
          // Informations de paiement
          payment: {
            method: paymentMethod === 'cash_on_delivery' ? 'cash' : 'mobile_money',
            status: paymentResult.status === 'succeeded' ? 'completed' : 'pending',
            amount: {
              subtotal: orderDetails.subtotal,
              delivery: orderDetails.fees,
              total: orderDetails.totalAmount,
              currency: 'XOF'
            },
            ...(paymentResult.transactionId && { transactionId: paymentResult.transactionId }),
            ...(paymentResult.operator && { provider: paymentResult.operator.name }),
            ...(paymentResult.phoneNumber && { phoneNumber: paymentResult.phoneNumber })
          },
          // Informations client
          customerInfo: {
            name: orderDetails.customerName,
            phone: orderDetails.customerPhone,
            ...(paymentMethod === 'cash_on_delivery' && { deliveryInfo: cashOnDeliveryInfo })
          },
          // Référence de commande
          orderReference: orderId,
          // Statut initial
          status: 'confirmed',
          // Métadonnées enrichies
          metadata: {
            ...orderDetails.fullOrderData.metadata,
            paymentValidation: {
              method: paymentMethod,
              validatedAt: new Date().toISOString(),
              ...(paymentResult.transactionId && { transactionId: paymentResult.transactionId })
            },
            orderFlow: {
              createdVia: 'payment_validation',
              sourcePages: ['PressingDetailPage', 'OrderCreatePage', 'OrderReviewPage', 'PaymentPage'],
              finalValidationStep: 'PaymentPage'
            }
          }
        };
        
        console.log('📤 Envoi de la commande au backend:', {
          pressingId: backendOrderData.pressingId,
          servicesCount: backendOrderData.services.length,
          totalAmount: orderDetails.totalAmount,
          paymentMethod,
          paymentStatus: paymentResult.status
        });
        
        // Créer la commande dans le backend
        const backendResult = await createOrder(backendOrderData).unwrap();
        
        if (!backendResult || !backendResult._id) {
          throw new Error('Erreur lors de la création de la commande backend');
        }
        
        console.log('✅ Commande créée avec succès dans le backend:', {
          backendOrderId: backendResult._id,
          reference: backendResult.reference || orderId
        });
        
        // Mise à jour de l'orderId avec l'ID backend
        orderId = backendResult._id;
        
        // Étape 3: Notification du pressing
        console.log('📢 Démarrage des notifications pressing...');
        
        try {
          const notificationData: NotificationData = {
            pressingId: backendOrderData.pressingId,
            pressingName: orderDetails.pressingName,
            orderId: backendResult._id,
            customerName: orderDetails.customerName,
            customerPhone: orderDetails.customerPhone,
            totalAmount: orderDetails.totalAmount,
            servicesCount: backendOrderData.services.length,
            orderReference: backendResult.reference || orderId,
            collectionDateTime: backendOrderData.dateRecuperationSouhaitee,
            deliveryAddress: backendOrderData.adresseLivraison
          };
          
          // Envoyer toutes les notifications (WebSocket, Email, SMS)
          const notificationResults = await notificationService.notifyPressingNewOrder(notificationData);
          
          // Analyser les résultats des notifications
          const successfulNotifications = notificationResults.filter(r => r.success);
          const failedNotifications = notificationResults.filter(r => !r.success);
          
          console.log('✅ Notifications réussies:', successfulNotifications.map(n => n.method));
          if (failedNotifications.length > 0) {
            console.warn('⚠️ Notifications échouées:', failedNotifications.map(n => `${n.method}: ${n.message}`));
          }
          
          // Toast de confirmation principal
          toast.success(`🎉 Commande envoyée au pressing ${orderDetails.pressingName}!`);
          
          // Toast additionnel pour les notifications
          if (successfulNotifications.length > 0) {
            const methods = successfulNotifications.map(n => n.method).join(', ');
            toast.success(`📢 Pressing notifié via: ${methods}`, { duration: 3000 });
          }
          
        } catch (notificationError) {
          console.error('❌ Erreur lors des notifications pressing:', notificationError);
          // Ne pas faire échouer la commande si les notifications échouent
          toast.error('⚠️ Commande créée mais notification pressing partielle');
        }
      } else {
        console.warn('⚠️ Données de commande complètes manquantes - Création backend ignorée');
      }
      
      // Étape 4: Redirection vers la page de succès
      const successState = {
        orderId,
        paymentMethod,
        amount: orderDetails.totalAmount,
        orderDetails,
        paymentResult,
        ...(paymentMethod === 'cash_on_delivery' && { deliveryInfo: cashOnDeliveryInfo }),
        ...(paymentMethod === 'mobile_money' && {
          transactionId: paymentResult.transactionId,
          operator: selectedOperator,
          phoneNumber
        }),
        message: paymentMethod === 'cash_on_delivery' 
          ? 'Commande confirmée ! Vous paierez à la livraison.' 
          : 'Paiement réussi ! Votre commande a été confirmée.'
      };
      
      console.log('🎯 Redirection vers la page de succès:', successState);
      
      navigate('/client/payment/success', {
        state: successState,
        replace: true
      });
      
    } catch (error: any) {
      console.error('❌ Erreur lors du processus de paiement/commande:', error);
      
      let errorMessage = 'Erreur lors du traitement. Veuillez réessayer.';
      
      if (error.status === 400) {
        errorMessage = 'Données invalides';
      } else if (error.status === 401) {
        errorMessage = 'Veuillez vous connecter pour continuer';
      } else if (error.status === 402) {
        errorMessage = 'Solde insuffisant';
      } else if (error.status === 403) {
        errorMessage = 'Transaction refusée';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      navigate('/client/payment/failed', {
        state: {
          operator: selectedOperator,
          phoneNumber,
          amount: orderDetails?.totalAmount,
          error: errorMessage,
          orderDetails,
          paymentMethod
        },
        replace: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'method':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choisissez votre mode de paiement</h3>
              <p className="text-gray-600 text-sm">Sélectionnez comment vous souhaitez régler votre commande</p>
            </div>
            
            <div className="space-y-4">
              {/* Option Mobile Money */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'mobile_money' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentMethod('mobile_money')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">💳</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Mobile Money</h4>
                      <p className="text-sm text-gray-600">Orange Money, MTN, Moov, Wave</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'mobile_money' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'mobile_money' && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  ⚡ Paiement instantané et sécurisé
                </div>
              </div>

              {/* Option Paiement à domicile */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'cash_on_delivery' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentMethod('cash_on_delivery')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">🏠</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Paiement à domicile</h4>
                      <p className="text-sm text-gray-600">Payez en espèces à la livraison</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'cash_on_delivery' 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'cash_on_delivery' && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  💰 Payez uniquement à la réception de vos vêtements
                </div>
              </div>
            </div>
            
            {paymentMethod === 'cash_on_delivery' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-0.5">ℹ️</span>
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Important à savoir :</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Préparez le montant exact : <strong>{orderDetails?.totalAmount.toLocaleString('fr-FR')} FCFA</strong></li>
                      <li>• Le paiement se fait uniquement en espèces</li>
                      <li>• Votre commande sera confirmée immédiatement</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'operator':
        return (
          <div className="space-y-6">
            <MobileMoneyOperatorSelector
              selectedOperator={selectedOperator}
              onOperatorSelect={handleOperatorSelect}
            />
            
            <AmountDisplay
              amount={orderDetails?.totalAmount || 0}
              label="Montant à payer"
              size="lg"
              breakdown={{
                subtotal: orderDetails?.subtotal || 0,
                fees: orderDetails?.fees || 0,
                discount: orderDetails?.discount
              }}
            />
          </div>
        );
        
      case 'details':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Paiement via {selectedOperator?.displayName}
              </h3>
              <div className="text-3xl mb-4">{selectedOperator?.logo}</div>
            </div>
            
            <NumberInput
              operator={selectedOperator}
              value={phoneNumber}
              onChange={setPhoneNumber}
              error={phoneError}
            />
            
            <AmountDisplay
              amount={orderDetails?.totalAmount || 0}
              size="md"
            />
          </div>
        );
        
      case 'confirmation':
        if (paymentMethod === 'cash_on_delivery') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Confirmez votre commande</h3>
                <p className="text-gray-600 text-sm">Paiement à la livraison</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Mode de paiement:</span>
                  <span className="font-medium text-green-600">🏠 Paiement à domicile</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Client:</span>
                  <span className="font-medium">{orderDetails?.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Téléphone:</span>
                  <span className="font-medium">{orderDetails?.customerPhone}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Montant à payer:</span>
                    <span className="text-green-600">{orderDetails?.totalAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">✅</span>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Votre commande sera confirmée immédiatement</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Le pressing recevra votre commande pour traitement</li>
                      <li>• Vous recevrez une confirmation par SMS</li>
                      <li>• Préparez le montant exact pour la livraison</li>
                      <li>• Vous pourrez suivre votre commande en temps réel</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Confirmez votre paiement</h3>
              <p className="text-gray-600 text-sm">Vérifiez les informations avant de procéder</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Opérateur:</span>
                <span className="font-medium">{selectedOperator?.displayName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Numéro:</span>
                <span className="font-medium">{phoneNumber}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Montant:</span>
                  <span className="text-blue-600">{orderDetails?.totalAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> Vous allez être redirigé vers l'application {selectedOperator?.displayName} pour finaliser le paiement.
              </p>
            </div>
          </div>
        );
        
      case 'processing':
        if (paymentMethod === 'cash_on_delivery') {
          return (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Confirmation de votre commande...</h3>
                <p className="text-gray-600 mb-4">
                  Création de votre commande avec paiement à domicile
                </p>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    ✅ <strong>Votre commande sera confirmée dans quelques instants.</strong>
                  </p>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="text-center space-y-6">
            <TransactionStatus status="processing" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Traitement en cours...</h3>
              <p className="text-gray-600 mb-4">
                Connexion avec {selectedOperator?.displayName}
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  💡 <strong>Ne fermez pas cette page.</strong> Vous serez redirigé automatiquement.
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'method':
        return paymentMethod !== null;
      case 'operator':
        return selectedOperator !== null;
      case 'details':
        return phoneNumber.length >= (selectedOperator?.minLength || 10);
      case 'confirmation':
        return true;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'method':
        return '1️⃣ Mode de paiement';
      case 'operator':
        return '2️⃣ Choisissez votre opérateur';
      case 'details':
        return '3️⃣ Saisissez vos informations';
      case 'confirmation':
        return paymentMethod === 'cash_on_delivery' ? '2️⃣ Confirmez votre commande' : '4️⃣ Confirmez le paiement';
      case 'processing':
        return paymentMethod === 'cash_on_delivery' ? '3️⃣ Création de la commande' : '5️⃣ Traitement du paiement';
      default:
        return 'Paiement';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {getStepTitle()}
          </CardTitle>
          
          {currentStep !== 'processing' && (
            <div className="flex justify-center space-x-2 mt-4">
              {(() => {
                const steps = paymentMethod === 'cash_on_delivery' 
                  ? ['method', 'confirmation']
                  : ['method', 'operator', 'details', 'confirmation'];
                return steps.map((step, index) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      steps.indexOf(currentStep) >= index
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ));
              })()}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStepContent()}
          
          {currentStep !== 'processing' && (
            <div className="flex space-x-3">
              {currentStep !== 'method' && (
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  className="flex-1"
                >
                  ← Précédent
                </Button>
              )}
              
              <Button
                onClick={handleNextStep}
                disabled={!canProceed() || isProcessing}
                className="flex-1"
              >
                {currentStep === 'confirmation' 
                  ? (paymentMethod === 'cash_on_delivery' ? '✅ Confirmer la commande' : '💳 Payer maintenant')
                  : 'Suivant →'
                }
              </Button>
            </div>
          )}
          
          {currentStep === 'method' && (
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              ❌ Annuler
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;
