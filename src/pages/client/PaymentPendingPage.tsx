import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import TransactionStatus, { ProgressBar } from '../../components/payment/TransactionStatus';
import AmountDisplay from '../../components/payment/AmountDisplay';
import { MobileMoneyOperator } from '../../components/payment/MobileMoneySelector';
import { useGetPaymentStatusQuery } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Loader2, Clock } from 'lucide-react';

interface PaymentPendingState {
  transactionId?: string;
  operator: MobileMoneyOperator;
  phoneNumber: string;
  amount: number;
  orderDetails: {
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
  };
}

const PENDING_STEPS = [
  { id: 1, label: 'Initiation du paiement', duration: 2000 },
  { id: 2, label: 'Connexion avec l\'opérateur', duration: 3000 },
  { id: 3, label: 'Vérification du compte', duration: 2500 },
  { id: 4, label: 'Traitement de la transaction', duration: 4000 },
  { id: 5, label: 'Confirmation finale', duration: 1500 }
];

const PaymentPendingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId?: string }>();
  
  const paymentData = location.state as PaymentPendingState;
  const finalTransactionId = transactionId || paymentData?.transactionId;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);
  const [maxWaitTime] = useState(300000); // 5 minutes max

  // Vérifier le statut réel du paiement en temps réel
  const { 
    data: paymentStatus, 
    isLoading: isVerifying, 
    error: verificationError,
    refetch: refetchPaymentStatus
  } = useGetPaymentStatusQuery(
    finalTransactionId || '', 
    { 
      skip: !finalTransactionId || isTimeout,
      pollingInterval: isTimeout ? 0 : 2000, // Poll toutes les 2s
    }
  );

  // Gestion du statut de paiement en temps réel
  useEffect(() => {
    if (paymentStatus && !isTimeout) {
      if (paymentStatus.status === 'succeeded') {
        // Le paiement a réussi, rediriger vers la page de succès
        navigate('/client/payment/success', {
          state: {
            ...paymentData,
            transactionId: finalTransactionId,
            verifiedStatus: paymentStatus.status
          },
          replace: true
        });
      } else if (paymentStatus.status === 'failed' || paymentStatus.status === 'canceled') {
        // Le paiement a échoué, rediriger vers la page d'échec
        navigate('/client/payment/failed', {
          state: {
            ...paymentData,
            error: 'Transaction échouée',
            transactionId: finalTransactionId,
            verifiedStatus: paymentStatus.status
          },
          replace: true
        });
      }
      // Si le statut est toujours 'pending', continuer à attendre
    }
  }, [paymentStatus, navigate, paymentData, finalTransactionId, isTimeout]);

  // Timeout après 5 minutes
  const TIMEOUT_DURATION = maxWaitTime; // 5 minutes

  useEffect(() => {
    if (!paymentData) return;

    let stepTimer: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    // Timer pour les étapes
    const processSteps = () => {
      if (currentStep < PENDING_STEPS.length) {
        const step = PENDING_STEPS[currentStep];
        stepTimer = setTimeout(() => {
          setCurrentStep(prev => prev + 1);
          setProgress(((currentStep + 1) / PENDING_STEPS.length) * 100);
        }, step.duration);
      } else {
        // Toutes les étapes terminées, simuler le résultat
        setTimeout(() => {
          simulatePaymentResult();
        }, 1000);
      }
    };

    // Timer pour le temps écoulé
    const timeTimer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Timer pour le timeout
    timeoutTimer = setTimeout(() => {
      setIsTimeout(true);
      handleTimeout();
    }, TIMEOUT_DURATION);

    processSteps();

    return () => {
      clearTimeout(stepTimer);
      clearTimeout(timeoutTimer);
      clearInterval(timeTimer);
    };
  }, [currentStep, paymentData]);

  const simulatePaymentResult = () => {
    if (isTimeout) return;

    // 85% de chance de succès, 15% d'échec
    const isSuccess = Math.random() > 0.15;
    
    if (isSuccess) {
      const transactionId = paymentData.transactionId || `TXN-${Date.now().toString().slice(-8)}`;
      const orderId = paymentData.orderDetails.orderId || `GEO-${Date.now().toString().slice(-6)}`;
      
      navigate('/client/payment/success', {
        state: {
          transactionId,
          orderId,
          operator: paymentData.operator,
          phoneNumber: paymentData.phoneNumber,
          amount: paymentData.amount,
          orderDetails: paymentData.orderDetails
        },
        replace: true
      });
    } else {
      navigate('/client/payment/failed', {
        state: {
          operator: paymentData.operator,
          phoneNumber: paymentData.phoneNumber,
          amount: paymentData.amount,
          error: 'Transaction refusée par l\'opérateur Mobile Money',
          orderDetails: paymentData.orderDetails
        },
        replace: true
      });
    }
  };

  const handleTimeout = () => {
    navigate('/client/payment/failed', {
      state: {
        operator: paymentData.operator,
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        error: 'La transaction a expiré. Délai de traitement dépassé.',
        orderDetails: paymentData.orderDetails
      },
      replace: true
    });
  };

  const handleCancel = () => {
    // Annuler la transaction en cours
    navigate('/client/payment/failed', {
      state: {
        operator: paymentData.operator,
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        error: 'Transaction annulée par l\'utilisateur',
        orderDetails: paymentData.orderDetails
      },
      replace: true
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!paymentData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold mb-4">Informations manquantes</h1>
          <p className="text-gray-600 mb-6">
            Les détails du paiement sont introuvables.
          </p>
          <Button onClick={() => navigate('/client/orders')} className="w-full">
            📋 Voir mes commandes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="text-8xl mb-4">⏳</div>
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          Paiement en cours...
        </h1>
        <p className="text-gray-600">
          Votre paiement est en cours de traitement. Veuillez patienter.
        </p>
      </div>

      {/* Statut de la transaction */}
      <div className="mb-6">
        <TransactionStatus
          status="processing"
          message={
            currentStep < PENDING_STEPS.length 
              ? PENDING_STEPS[currentStep]?.label || 'Traitement en cours...'
              : 'Finalisation de la transaction...'
          }
          transactionId={paymentData.transactionId}
          timestamp={new Date()}
        />
      </div>

      {/* Barre de progression */}
      <div className="mb-6">
        <ProgressBar
          progress={progress}
          label="Progression du paiement"
          showPercentage={true}
        />
      </div>

      {/* Étapes détaillées */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>📋</span>
            <span>Étapes du traitement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PENDING_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-3">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                  ${index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                      ? 'bg-blue-500 text-white animate-pulse' 
                      : 'bg-gray-300 text-gray-600'
                  }
                `}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className={`
                  ${index <= currentStep ? 'text-gray-900' : 'text-gray-500'}
                  ${index === currentStep ? 'font-medium' : ''}
                `}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Détails du paiement */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">💳 Détails du paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Opérateur:</span>
            <div className="flex items-center space-x-2">
              <span>{paymentData.operator.logo}</span>
              <span className="font-medium">{paymentData.operator.displayName}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Numéro:</span>
            <span className="font-mono">+225 {paymentData.phoneNumber.replace(/(\d{2})(?=\d)/g, '$1 ')}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pressing:</span>
            <span className="font-medium">{paymentData.orderDetails.pressingName}</span>
          </div>
          
          <div className="border-t pt-3">
            <AmountDisplay
              amount={paymentData.amount}
              label="Montant en cours de traitement"
              size="md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Informations importantes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>⚠️</span>
            <span>Important</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>Ne fermez pas cette page pendant le traitement</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>Vous pourriez recevoir une notification de votre opérateur</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>Le traitement peut prendre jusqu'à 2 minutes</span>
              </li>
            </ul>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Temps écoulé:</span>
            <span className="font-mono">{formatTime(timeElapsed)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Temps restant:</span>
            <span className="font-mono">
              {formatTime(Math.max(0, Math.floor(TIMEOUT_DURATION / 1000) - timeElapsed))}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleCancel}
          variant="outline"
          className="w-full flex items-center justify-center space-x-2"
        >
          <span>❌</span>
          <span>Annuler la transaction</span>
        </Button>
      </div>

      {/* Support */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Problème ? 📞 +225 XX XX XX XX | 📧 support@geopressci.com</p>
        <p className="mt-1">Notre équipe est disponible 24/7 ! 🕐</p>
      </div>
    </div>
  );
};

export default PaymentPendingPage;
