import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import TransactionStatus from '../../components/payment/TransactionStatus';
import { ReceiptDisplay, ReceiptSummary } from '../../components/payment/ReceiptDisplay';
import { MobileMoneyOperator } from '../../components/payment/MobileMoneySelector';
import { useGetPaymentStatusQuery, useGetOrderByIdQuery } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// Type pour les détails de la commande
interface OrderDetails {
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
}

// Création d'un opérateur de paiement à domicile compatible avec MobileMoneyOperator
const CASH_OPERATOR: MobileMoneyOperator = {
  id: 'cash',
  name: 'Paiement à domicile',
  displayName: 'Espèces',
  logo: '🏠',
  color: '#4f46e5',
  prefix: ['00'], // Doit être un tableau de chaînes
  maxLength: 10,
  minLength: 10
};

interface PaymentSuccessState {
  transactionId?: string;
  orderId: string;
  operator?: MobileMoneyOperator;
  phoneNumber?: string;
  amount: number;
  paymentMethod?: 'mobile_money' | 'cash_on_delivery';
  message?: string;
  deliveryInfo?: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    specialInstructions?: string;
  };
  orderDetails: OrderDetails;
}

const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId?: string }>();
  const [showFullReceipt, setShowFullReceipt] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const paymentData = location.state as PaymentSuccessState;
  const finalTransactionId = transactionId || paymentData?.transactionId;

  // Vérifier le statut réel du paiement (seulement pour Mobile Money)
  const { 
    data: paymentStatus, 
    isLoading: isVerifying, 
    error: verificationError,
    refetch: refetchPaymentStatus
  } = useGetPaymentStatusQuery(
    finalTransactionId || '', 
    { 
      skip: !finalTransactionId || paymentData?.paymentMethod === 'cash_on_delivery',
      pollingInterval: verificationComplete ? 0 : 3000, // Poll toutes les 3s jusqu'à vérification complète
    }
  );

  // Récupérer l'ID de commande et valider qu'il est un ObjectId MongoDB valide
  const orderId = paymentData?.orderId || (typeof paymentStatus?.order === 'string' ? paymentStatus.order : paymentStatus?.order?.id) || '';
  const isValidObjectId = orderId && /^[0-9a-fA-F]{24}$/.test(orderId);
  
  // Récupérer les détails de la commande si on a un orderId valide
  const { 
    data: orderDetails, 
    isLoading: isLoadingOrder 
  } = useGetOrderByIdQuery(
    orderId, 
    { 
      skip: !orderId || !isValidObjectId // Skip si pas d'ID ou ID invalide
    }
  );

  useEffect(() => {
    // Nettoyer les données de commande en attente du localStorage
    // car le paiement a été traité avec succès
    localStorage.removeItem('pendingOrderData');
    localStorage.removeItem('pendingOrderTimestamp');
    
    // Pour le paiement à domicile, pas besoin de vérification
    if (paymentData?.paymentMethod === 'cash_on_delivery') {
      setVerificationComplete(true);
      toast.success('✅ Commande confirmée ! Vous paierez à la livraison.');
      return;
    }
    
    if (paymentStatus) {
      // Vérifier si le paiement Mobile Money est vraiment réussi
      if (paymentStatus.status === 'succeeded') {
        setVerificationComplete(true);
        console.log('Paiement vérifié et réussi:', paymentStatus);
        toast.success('✅ Paiement confirmé avec succès!');
      } else if (paymentStatus.status === 'failed' || paymentStatus.status === 'canceled') {
        navigate('/client/payment/failed', {
          state: {
            ...paymentData,
            error: 'Le paiement a été refusé ou annulé',
            verifiedStatus: paymentStatus.status
          },
          replace: true
        });
      } else if (paymentStatus.status === 'pending') {
        navigate('/client/payment/pending', {
          state: {
            ...paymentData,
            transactionId: finalTransactionId
          },
          replace: true
        });
      }
    }
  }, [paymentStatus, navigate, paymentData, finalTransactionId]);

  // Afficher un loader pendant la vérification (seulement pour Mobile Money)
  if (isVerifying && !verificationComplete && paymentData?.paymentMethod !== 'cash_on_delivery') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <h2 className="text-xl font-semibold">Vérification du paiement...</h2>
          <p className="text-gray-600">Veuillez patienter pendant que nous confirmons votre transaction.</p>
        </div>
      </div>
    );
  }

  // Gérer les erreurs de vérification
  if (verificationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-red-600">Erreur de vérification</h2>
          <p className="text-gray-600">Impossible de vérifier le statut du paiement.</p>
          <div className="space-y-2">
            <Button 
              onClick={() => refetchPaymentStatus()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Réessayer la vérification
            </Button>
            <Button 
              onClick={() => navigate('/client/orders')}
              variant="outline"
              className="w-full"
            >
              Voir mes commandes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData && !paymentStatus) {
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

  // Préparer les données pour le reçu
  const receiptData = {
    transactionId: finalTransactionId || paymentData.orderId,
    orderId: paymentData.orderId,
    timestamp: new Date(),
    operator: paymentData.operator || CASH_OPERATOR,
    phoneNumber: paymentData.phoneNumber || paymentData.orderDetails.customerPhone,
    items: paymentData.orderDetails.items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.quantity * item.price
    })),
    subtotal: paymentData.orderDetails.subtotal,
    fees: paymentData.orderDetails.fees,
    discount: paymentData.orderDetails.discount,
    total: paymentData.amount, // Utiliser le montant total du paiement
    status: 'success' as const,
    pressingName: paymentData.orderDetails.pressingName,
    customerName: paymentData.orderDetails.customerName,
    customerPhone: paymentData.orderDetails.customerPhone
  };

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    try {
      // Simuler le téléchargement
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Téléchargement du reçu:', receiptData.transactionId);
      // Ici on implémenterait la génération PDF
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareReceipt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Reçu de paiement Geopressci',
          text: `Paiement réussi de ${paymentData.amount.toLocaleString('fr-FR')} FCFA via ${paymentData.operator?.displayName || 'Mobile Money'}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas Web Share API
      navigator.clipboard.writeText(
        `Paiement réussi de ${paymentData.amount.toLocaleString('fr-FR')} FCFA via ${paymentData.operator?.displayName || 'Mobile Money'}\nTransaction: ${paymentData.transactionId}`
      );
      alert('Informations copiées dans le presse-papiers!');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Animation de succès */}
      <div className="text-center mb-8">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
          paymentData?.paymentMethod === 'cash_on_delivery' 
            ? 'bg-blue-100' 
            : 'bg-green-100'
        }`}>
          <span className="text-4xl">
            {paymentData?.paymentMethod === 'cash_on_delivery' ? '🏠' : '✅'}
          </span>
        </div>
        <h1 className={`text-3xl font-bold mb-2 ${
          paymentData?.paymentMethod === 'cash_on_delivery' 
            ? 'text-blue-600' 
            : 'text-green-600'
        }`}>
          {paymentData?.paymentMethod === 'cash_on_delivery' 
            ? 'Commande confirmée !' 
            : 'Paiement réussi !'
          }
        </h1>
        <p className="text-gray-600">
          {paymentData?.paymentMethod === 'cash_on_delivery' 
            ? 'Vous paierez en espèces à la livraison' 
            : 'Votre transaction a été traitée avec succès'
          }
        </p>
        {paymentData?.message && (
          <p className="text-sm text-blue-600 mt-2 font-medium">
            {paymentData.message}
          </p>
        )}
      </div>

      {/* Statut de la transaction */}
      <div className="mb-6">
        <TransactionStatus
          status="success"
          message="Votre paiement a été traité avec succès. Vous recevrez une confirmation par SMS."
          transactionId={paymentData.transactionId}
          timestamp={new Date()}
        />
      </div>

      {/* Résumé du reçu */}
      <div className="mb-6">
        <ReceiptSummary receipt={receiptData} />
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => navigate(`/client/orders/${paymentData.orderId}/track`)}
          className="flex items-center justify-center space-x-2"
        >
          <span>📦</span>
          <span>Suivre ma commande</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowFullReceipt(!showFullReceipt)}
          className="flex items-center justify-center space-x-2"
        >
          <span>🧾</span>
          <span>{showFullReceipt ? 'Masquer' : 'Voir'} le reçu</span>
        </Button>
      </div>

      {/* Reçu complet */}
      {showFullReceipt && (
        <div className="mb-6">
          <ReceiptDisplay
            receipt={receiptData}
            onDownload={handleDownloadReceipt}
            onShare={handleShareReceipt}
            onPrint={handlePrintReceipt}
          />
        </div>
      )}

      {/* Informations importantes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>💡</span>
            <span>Que se passe-t-il maintenant ?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 text-xl">1️⃣</span>
              <div>
                <h4 className="font-semibold">Confirmation SMS</h4>
                <p className="text-sm text-gray-600">
                  Vous recevrez un SMS de confirmation sur le {paymentData.orderDetails.customerPhone}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 text-xl">2️⃣</span>
              <div>
                <h4 className="font-semibold">Traitement de la commande</h4>
                <p className="text-sm text-gray-600">
                  {paymentData.orderDetails.pressingName} va traiter votre commande dans les prochaines heures
                </p>
              </div>
            </div>
            
            {paymentData?.paymentMethod === 'cash_on_delivery' && (
              <div className="flex items-start space-x-3">
                <span className="text-blue-500 text-xl">3️⃣</span>
                <div>
                  <p className="text-sm text-gray-500">Opérateur</p>
                  <div className="flex items-center space-x-2">
                    <span>{paymentData.operator?.logo || '💳'}</span>
                    <span className="text-sm font-medium">{paymentData.operator?.displayName || 'Mobile Money'}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 text-xl">{paymentData?.paymentMethod === 'cash_on_delivery' ? '4️⃣' : '3️⃣'}</span>
              <div>
                <h4 className="font-semibold">Suivi en temps réel</h4>
                <p className="text-sm text-gray-600">
                  Suivez l'avancement de votre commande depuis votre espace client
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions finales */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => navigate('/client/orders')}
            variant="outline"
            className="flex items-center justify-center space-x-2"
          >
            <span>📋</span>
            <span>Toutes mes commandes</span>
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center justify-center space-x-2"
          >
            <span>🏠</span>
            <span>Retour à l'accueil</span>
          </Button>
        </div>
        
        <Button
          onClick={handleDownloadReceipt}
          disabled={isDownloading}
          className="w-full flex items-center justify-center space-x-2"
        >
          <span>{isDownloading ? '⏳' : '📥'}</span>
          <span>{isDownloading ? 'Téléchargement...' : 'Télécharger le reçu'}</span>
        </Button>
      </div>

      {/* Support */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Besoin d'aide ? 📞 +225 XX XX XX XX | 📧 support@geopressci.com</p>
        <p className="mt-1">Merci de faire confiance à Geopressci ! 🙏</p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
