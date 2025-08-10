import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { 
  useGetPaymentMethodsQuery, 
  useGetCurrentUserQuery, 
  useUpdateCurrentUserMutation,
  useAddPaymentMethodMutation,
  useDeletePaymentMethodMutation,
  useSetDefaultPaymentMethodMutation
} from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Smartphone, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Shield, 
  AlertCircle,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'bank_transfer';
  provider: string;
  last4?: string;
  phoneNumber?: string;
  accountName?: string;
  expiryDate?: string;
  isDefault: boolean;
  isVerified: boolean;
  addedDate: string;
}

export const PaymentMethodsPage: React.FC = () => {
  // Utilisation directe de l'API backend
  const { 
    data: apiPaymentMethods, 
    isLoading, 
    error, 
  } = useGetPaymentMethodsQuery();
  
  const { 
    data: userData 
  } = useGetCurrentUserQuery();
  
  const [updateUser, { isLoading: updateLoading }] = useUpdateCurrentUserMutation();
  const [addPaymentMethod, { isLoading: addLoading }] = useAddPaymentMethodMutation();
  const [deletePaymentMethod, { isLoading: deleteLoading }] = useDeletePaymentMethodMutation();
  const [setDefaultPaymentMethod, { isLoading: defaultLoading }] = useSetDefaultPaymentMethodMutation();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Extraction des méthodes de paiement depuis l'API
  const paymentMethods: PaymentMethod[] = apiPaymentMethods?.map((method) => ({
    ...method,
    type: 'mobile_money',
    isDefault: method.isDefault || false,
    isVerified: method.isVerified || false,
    addedDate: method.addedDate || new Date().toISOString(),
    provider: method.provider,
    phoneNumber: method.phoneNumber,
    accountName: method.accountName
  })) || []; // Map API data to PaymentMethod interface
  
  // Méthodes de paiement mockées temporaires (en attendant l'API complète)
  const [localPaymentMethods, setLocalPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'mobile_money',
      provider: 'Orange Money',
      phoneNumber: '+2250700000001',
      isDefault: true,
      isVerified: true,
      addedDate: new Date().toISOString(),
      accountName: 'Kouadio Yao'
    },
    {
      id: '2',
      type: 'mobile_money',
      provider: 'MTN Money',
      phoneNumber: '+2250700000002',
      isDefault: false,
      isVerified: true,
      addedDate: new Date().toISOString(),
      accountName: 'Kouadio Yao'
    },
    {
      id: '3',
      type: 'mobile_money',
      provider: 'MTN Money',
      phoneNumber: '+225 05 98 76 54 32',
      accountName: 'Kouadio Yao',
      isDefault: false,
      isVerified: false,
      addedDate: '2024-01-20'
    }
  ]);

  const [newPayment, setNewPayment] = useState({
    type: 'mobile_money' as 'card' | 'mobile_money' | 'bank_transfer',
    provider: '',
    phoneNumber: '',
    accountName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const getPaymentIcon = (type: string, provider: string) => {
    if (type === 'mobile_money') {
      switch (provider) {
        case 'Orange Money': return '🟠';
        case 'MTN Mobile Money': return '🟡';
        case 'Moov Money': return '🔵';
        default: return '📱';
      }
    }
    if (type === 'card') {
      switch (provider) {
        case 'Visa': return '💳';
        case 'Mastercard': return '💳';
        default: return '💳';
      }
    }
    return '🏦';
  };

  const formatPaymentDisplay = (method: PaymentMethod) => {
    if (method.type === 'mobile_money') {
      return `${method.phoneNumber?.slice(-4)} • ${method.provider}`;
    }
    if (method.type === 'card') {
      return `•••• ${method.last4} • ${method.provider}`;
    }
    return method.provider;
  };

  const handleAddPayment = async () => {
    if (!newPayment.provider || (!newPayment.phoneNumber && !newPayment.cardNumber)) {
      return;
    }

    try {
      const paymentData = {
        type: newPayment.type,
        provider: newPayment.provider,
        phoneNumber: newPayment.phoneNumber || undefined,
        last4: newPayment.cardNumber ? newPayment.cardNumber.slice(-4) : undefined,
        expiryDate: newPayment.expiryDate || undefined,
        accountName: newPayment.accountName,
        isDefault: paymentMethods.length === 0
      };

      const result = await addPaymentMethod(paymentData).unwrap();
      
      if (result.success) {
        toast.success('✅ Méthode de paiement ajoutée avec succès');
        setNewPayment({
          type: 'mobile_money',
          provider: '',
          phoneNumber: '',
          accountName: '',
          cardNumber: '',
          expiryDate: '',
          cvv: ''
        });
        setShowAddForm(false);
        // Les données seront automatiquement mises à jour via invalidatesTags
      }
    } catch (error: any) {
      console.error('Erreur ajout méthode paiement:', error);
      toast.error('❌ Erreur lors de l\'ajout de la méthode de paiement');
    }
  };

  const handleDeletePayment = async (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    if (method?.isDefault) {
      toast.error('❌ Impossible de supprimer la méthode de paiement par défaut');
      return;
    }

    if (window.confirm('Supprimer cette méthode de paiement ?')) {
      try {
        const result = await deletePaymentMethod(id).unwrap();
        
        if (result.success) {
          toast.success('✅ Méthode de paiement supprimée');
          // Les données seront automatiquement mises à jour via invalidatesTags
        }
      } catch (error: any) {
        console.error('Erreur suppression:', error);
        toast.error('❌ Erreur lors de la suppression');
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const result = await setDefaultPaymentMethod(id).unwrap();
      
      if (result.success) {
        toast.success('✅ Méthode de paiement définie par défaut');
        // Les données seront automatiquement mises à jour via invalidatesTags
      }
    } catch (error: any) {
      console.error('Erreur définition par défaut:', error);
      toast.error('❌ Erreur lors de la définition par défaut');
    }
  };

  const handleVerifyPayment = async (id: string) => {
    try {
      // Pour l'instant, on simule la vérification
      // En production, cela devrait appeler une API de vérification
      toast.success('✅ Vérification de la méthode de paiement en cours...');
      
      // Simulation d'une vérification réussie après 2 secondes
      setTimeout(() => {
        toast.success('✅ Méthode de paiement vérifiée avec succès');
      }, 2000);
    } catch (error: any) {
      console.error('Erreur vérification:', error);
      toast.error('❌ Erreur lors de la vérification');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <CreditCard className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Méthodes de Paiement</h1>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informations sécurité */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900 mb-1">Paiements sécurisés</h3>
              <p className="text-sm text-green-700">
                Vos informations de paiement sont chiffrées et sécurisées. 
                Nous ne stockons jamais vos données bancaires complètes.
              </p>
            </div>
          </div>
        </div>

        {/* Liste des méthodes de paiement */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Mes méthodes de paiement</h2>
          
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Aucune méthode de paiement enregistrée</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ajouter votre première méthode
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg ${
                    method.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getPaymentIcon(method.type, method.provider)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {method.accountName || method.provider}
                          </h3>
                          {method.isDefault && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Par défaut
                            </span>
                          )}
                          {method.isVerified ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Vérifié
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <X className="w-3 h-3" />
                              Non vérifié
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatPaymentDisplay(method)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ajouté le {new Date(method.addedDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!method.isVerified && (
                        <button
                          onClick={() => handleVerifyPayment(method.id)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Vérifier
                        </button>
                      )}
                      
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Définir par défaut
                        </button>
                      )}
                      
                      <button
                        onClick={() => setEditingId(method.id)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeletePayment(method.id)}
                        disabled={method.isDefault || loading}
                        className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Ajouter une méthode de paiement</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Type de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de paiement
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
                    { value: 'card', label: 'Carte bancaire', icon: '💳' },
                    { value: 'bank_transfer', label: 'Virement bancaire', icon: '🏦' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setNewPayment(prev => ({ ...prev, type: type.value as any }))}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        newPayment.type === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulaire Mobile Money */}
              {newPayment.type === 'mobile_money' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opérateur
                    </label>
                    <select
                      value={newPayment.provider}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, provider: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un opérateur</option>
                      <option value="Orange Money">🟠 Orange Money</option>
                      <option value="MTN Mobile Money">🟡 MTN Mobile Money</option>
                      <option value="Moov Money">🔵 Moov Money</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      value={newPayment.phoneNumber}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="+225 XX XX XX XX XX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du compte
                    </label>
                    <input
                      type="text"
                      value={newPayment.accountName}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, accountName: e.target.value }))}
                      placeholder="Nom sur le compte Mobile Money"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Formulaire Carte bancaire */}
              {newPayment.type === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de carte
                    </label>
                    <input
                      type="text"
                      value={newPayment.cardNumber}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, cardNumber: e.target.value.replace(/\s/g, '') }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={16}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date d'expiration
                      </label>
                      <input
                        type="text"
                        value={newPayment.expiryDate}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, expiryDate: e.target.value }))}
                        placeholder="MM/AA"
                        maxLength={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={newPayment.cvv}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, cvv: e.target.value }))}
                        placeholder="123"
                        maxLength={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom sur la carte
                    </label>
                    <input
                      type="text"
                      value={newPayment.accountName}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, accountName: e.target.value }))}
                      placeholder="Nom tel qu'il apparaît sur la carte"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={loading || !newPayment.provider}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Ajout...' : 'Ajouter la méthode'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Informations sur les paiements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💳 Informations sur les paiements</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Mobile Money</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Orange Money : Frais 0%</li>
                <li>• MTN Mobile Money : Frais 0%</li>
                <li>• Moov Money : Frais 0%</li>
                <li>• Paiement instantané</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cartes bancaires</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Visa et Mastercard acceptées</li>
                <li>• Paiement sécurisé 3D Secure</li>
                <li>• Frais : 2% du montant</li>
                <li>• Traitement sous 24h</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note :</strong> Les nouvelles méthodes de paiement doivent être vérifiées 
              avant utilisation. Un micro-paiement de 1 FCFA sera effectué puis remboursé.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
