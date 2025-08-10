import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import TransactionStatus from '../../components/payment/TransactionStatus';
import { RetryWithOptions } from '../../components/payment/RetryButton';
import AmountDisplay from '../../components/payment/AmountDisplay';
import { MobileMoneyOperator } from '../../components/payment/MobileMoneySelector';
import { useGetPaymentStatusQuery, useInitiatePaymentMutation } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface PaymentFailedState {
  operator: MobileMoneyOperator;
  phoneNumber: string;
  amount: number;
  error: string;
  transactionId?: string;
  verifiedStatus?: string;
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

const COMMON_ERRORS = {
  'insufficient_funds': {
    title: 'Solde insuffisant',
    message: 'Votre compte Mobile Money n\'a pas suffisamment de solde pour effectuer cette transaction.',
    solutions: [
      'Rechargez votre compte Mobile Money',
      'Utilisez un autre compte avec suffisamment de solde',
      'Réduisez le montant de votre commande'
    ],
    icon: '💰'
  },
  'invalid_number': {
    title: 'Numéro invalide',
    message: 'Le numéro Mobile Money saisi n\'est pas valide ou n\'est pas activé.',
    solutions: [
      'Vérifiez que votre numéro est correct',
      'Assurez-vous que votre compte Mobile Money est activé',
      'Contactez votre opérateur si le problème persiste'
    ],
    icon: '📱'
  },
  'transaction_declined': {
    title: 'Transaction refusée',
    message: 'Votre opérateur Mobile Money a refusé la transaction.',
    solutions: [
      'Vérifiez les limites de votre compte',
      'Contactez votre opérateur pour débloquer votre compte',
      'Essayez avec un autre compte Mobile Money'
    ],
    icon: '🚫'
  },
  'network_error': {
    title: 'Problème de connexion',
    message: 'Une erreur de connexion s\'est produite lors du traitement de votre paiement.',
    solutions: [
      'Vérifiez votre connexion internet',
      'Réessayez dans quelques minutes',
      'Contactez le support si le problème persiste'
    ],
    icon: '📶'
  },
  'timeout': {
    title: 'Délai dépassé',
    message: 'La transaction a pris trop de temps et a été annulée.',
    solutions: [
      'Réessayez immédiatement',
      'Vérifiez votre connexion internet',
      'Utilisez un autre opérateur si disponible'
    ],
    icon: '⏰'
  }
};

const PaymentFailedPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId?: string }>();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const failedData = location.state as PaymentFailedState;
  const finalTransactionId = transactionId || failedData?.transactionId;
  
  const [initiatePayment] = useInitiatePaymentMutation();

  // Vérifier le statut réel du paiement pour confirmer l'échec
  const { 
    data: paymentStatus, 
    isLoading: isVerifying, 
    error: verificationError,
    refetch: refetchPaymentStatus
  } = useGetPaymentStatusQuery(
    finalTransactionId || '', 
    { 
      skip: !finalTransactionId || verificationComplete,
      pollingInterval: verificationComplete ? 0 : 5000, // Poll toutes les 5s
    }
  );

  useEffect(() => {
    if (paymentStatus && !verificationComplete) {
      // Vérifier si le statut a changé depuis l'échec initial
      if (paymentStatus.status === 'succeeded') {
        // Le paiement a finalement réussi, rediriger vers la page de succès
        navigate('/client/payment/success', {
          state: {
            ...failedData,
            transactionId: finalTransactionId
          },
          replace: true
        });
      } else if (paymentStatus.status === 'pending') {
        // Le paiement est en attente, rediriger vers la page pending
        navigate('/client/payment/pending', {
          state: {
            ...failedData,
            transactionId: finalTransactionId
          },
          replace: true
        });
      } else {
        // Confirmer l'échec et arrêter la vérification
        setVerificationComplete(true);
      }
    }
  }, [paymentStatus, navigate, failedData, finalTransactionId, verificationComplete]);

  if (!failedData) {
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

  // Déterminer le type d'erreur
  const getErrorType = (error: string): keyof typeof COMMON_ERRORS => {
    const errorLower = error.toLowerCase();
    if (errorLower.includes('solde') || errorLower.includes('insufficient')) return 'insufficient_funds';
    if (errorLower.includes('numéro') || errorLower.includes('invalid')) return 'invalid_number';
    if (errorLower.includes('refusé') || errorLower.includes('declined')) return 'transaction_declined';
    if (errorLower.includes('connexion') || errorLower.includes('network')) return 'network_error';
    if (errorLower.includes('timeout') || errorLower.includes('délai')) return 'timeout';
    return 'network_error'; // Par défaut
  };

  const errorType = getErrorType(failedData.error);
  const errorInfo = COMMON_ERRORS[errorType];
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = async () => {
    setRetryCount((prev: number) => prev + 1);
    
    // Rediriger vers la page de paiement avec les mêmes données
    navigate('/client/payment', {
      state: { orderDetails: failedData.orderDetails },
      replace: true
    });
  };

  const handleChangeMethod = () => {
    // Rediriger vers la page de paiement pour choisir une autre méthode
    navigate('/client/payment', {
      state: { orderDetails: failedData.orderDetails }
    });
  };

  const handleCancel = () => {
    // Rediriger vers la page d'accueil ou de commandes
    navigate('/client/orders');
  };

  const handleContactSupport = () => {
    // Ouvrir le chat support ou rediriger vers la page de contact
    const message = encodeURIComponent(
      `Bonjour, j'ai un problème de paiement.\n` +
      `Erreur: ${failedData.error}\n` +
      `Opérateur: ${failedData.operator.displayName}\n` +
      `Montant: ${failedData.amount} FCFA\n` +
      `Merci de m'aider.`
    );
    window.open(`https://wa.me/225XXXXXXXX?text=${message}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* En-tête d'échec */}
      <div className="text-center mb-8">
        <div className="text-8xl mb-4">😞</div>
        <h1 className="text-3xl font-bold text-red-600 mb-2">
          Paiement échoué
        </h1>
        <p className="text-gray-600">
          Votre paiement n'a pas pu être traité. Pas de panique, nous allons vous aider !
        </p>
      </div>

      {/* Statut de la transaction */}
      <div className="mb-6">
        <TransactionStatus
          status="failed"
          message={failedData.error}
          timestamp={new Date()}
        />
      </div>

      {/* Détails de l'erreur */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <span className="text-2xl">{errorInfo.icon}</span>
            <span>{errorInfo.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">{errorInfo.message}</p>
          
          <div>
            <h4 className="font-semibold mb-2">💡 Solutions recommandées :</h4>
            <ul className="space-y-1">
              {errorInfo.solutions.map((solution, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Détails du paiement tenté */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">📋 Détails du paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Opérateur:</span>
            <div className="flex items-center space-x-2">
              <span>{failedData.operator?.logo || '📱'}</span>
              <span className="font-medium">{failedData.operator?.displayName || 'Opérateur inconnu'}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Numéro:</span>
            <span className="font-mono">+225 {failedData.phoneNumber.replace(/(\d{2})(?=\d)/g, '$1 ')}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pressing:</span>
            <span className="font-medium">{failedData.orderDetails.pressingName}</span>
          </div>
          
          <div className="border-t pt-3">
            <AmountDisplay
              amount={failedData.amount}
              label="Montant à payer"
              size="md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Options de récupération */}
      <div className="mb-6">
        <RetryWithOptions
          onRetry={handleRetry}
          onChangeMethod={handleChangeMethod}
          onCancel={handleCancel}
          error={failedData.error}
          currentRetries={retryCount}
          maxRetries={3}
        />
      </div>

      {/* Support et aide */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>🆘</span>
            <span>Besoin d'aide ?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Notre équipe support est là pour vous aider à résoudre ce problème rapidement.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleContactSupport}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <span>💬</span>
              <span>Chat WhatsApp</span>
            </Button>
            
            <Button
              onClick={() => window.open('tel:+225XXXXXXXX')}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <span>📞</span>
              <span>Appeler le support</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ rapide */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>❓</span>
            <span>Questions fréquentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <details className="border rounded-lg p-3">
            <summary className="font-medium cursor-pointer">
              Pourquoi mon paiement a-t-il échoué ?
            </summary>
            <p className="mt-2 text-sm text-gray-600">
              Les échecs de paiement peuvent être dus à un solde insuffisant, un problème de réseau, 
              ou des restrictions sur votre compte Mobile Money.
            </p>
          </details>
          
          <details className="border rounded-lg p-3">
            <summary className="font-medium cursor-pointer">
              Mes fonds ont-ils été débités ?
            </summary>
            <p className="mt-2 text-sm text-gray-600">
              Non, en cas d'échec de paiement, aucun montant n'est débité de votre compte. 
              Vous pouvez vérifier votre solde pour confirmation.
            </p>
          </details>
          
          <details className="border rounded-lg p-3">
            <summary className="font-medium cursor-pointer">
              Combien de fois puis-je réessayer ?
            </summary>
            <p className="mt-2 text-sm text-gray-600">
              Vous pouvez réessayer jusqu'à 3 fois. Si le problème persiste, 
              nous recommandons de changer de méthode de paiement ou de contacter le support.
            </p>
          </details>
        </CardContent>
      </Card>

      {/* Actions finales */}
      <div className="space-y-3">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="w-full flex items-center justify-center space-x-2"
        >
          <span>🏠</span>
          <span>Retour à l'accueil</span>
        </Button>
      </div>

      {/* Support */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Support 24/7 : 📞 +225 XX XX XX XX | 📧 support@geopressci.com</p>
        <p className="mt-1">Nous sommes là pour vous aider ! 💪</p>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
