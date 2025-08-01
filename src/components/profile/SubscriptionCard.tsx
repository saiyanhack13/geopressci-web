import React, { useState } from 'react';
import { Crown, Check, X, CreditCard, Calendar, Zap, Users, BarChart3, Headphones } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  description: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  current?: boolean;
}

interface SubscriptionCardProps {
  plans: SubscriptionPlan[];
  currentPlan?: string;
  onSelectPlan: (planId: string) => void;
  onCancelSubscription: () => void;
  loading?: boolean;
}

const PLAN_FEATURES = {
  free: [
    'Jusqu\'à 10 commandes/mois',
    'Gestion basique des commandes',
    'Support par email',
    'Profil pressing simple'
  ],
  starter: [
    'Jusqu\'à 50 commandes/mois',
    'Gestion avancée des commandes',
    'Notifications SMS',
    'Galerie photos (10 images)',
    'Statistiques basiques',
    'Support prioritaire'
  ],
  professional: [
    'Commandes illimitées',
    'Gestion multi-utilisateurs',
    'Notifications push avancées',
    'Galerie photos illimitée',
    'Statistiques détaillées',
    'Zone de couverture étendue',
    'Support téléphonique',
    'API d\'intégration'
  ],
  enterprise: [
    'Tout du plan Professional',
    'Pressing multiples',
    'Tableau de bord avancé',
    'Rapports personnalisés',
    'Support dédié 24/7',
    'Formation personnalisée',
    'Intégration ERP'
  ]
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plans,
  currentPlan,
  onSelectPlan,
  onCancelSubscription,
  loading = false
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const filteredPlans = plans.filter(plan => plan.period === selectedPeriod);
  const currentPlanData = plans.find(plan => plan.id === currentPlan);

  const formatPrice = (price: number, period: string) => {
    if (price === 0) return 'Gratuit';
    return `${price.toLocaleString()} FCFA/${period === 'monthly' ? 'mois' : 'an'}`;
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return '🆓';
      case 'starter': return '🚀';
      case 'professional': return '💼';
      case 'enterprise': return '👑';
      default: return '📦';
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('illimité')) return <Zap className="w-4 h-4 text-yellow-500" />;
    if (feature.includes('Support')) return <Headphones className="w-4 h-4 text-blue-500" />;
    if (feature.includes('Statistiques')) return <BarChart3 className="w-4 h-4 text-green-500" />;
    if (feature.includes('multi-utilisateurs')) return <Users className="w-4 h-4 text-purple-500" />;
    return <Check className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Abonnements</h2>
      </div>

      {/* Abonnement actuel */}
      {currentPlanData && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getPlanIcon(currentPlanData.id)}</span>
                <h3 className="font-semibold text-blue-900">{currentPlanData.name}</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Actuel
                </span>
              </div>
              <p className="text-blue-700 text-sm">
                {formatPrice(currentPlanData.price, currentPlanData.period)}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Renouvellement automatique le 15 août 2024
              </p>
            </div>
            
            {currentPlanData.id !== 'free' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Résilier
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sélecteur de période */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setSelectedPeriod('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annuel
            <span className="ml-1 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative border rounded-lg p-6 ${
              plan.popular
                ? 'border-blue-500 bg-blue-50'
                : plan.current
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            } transition-colors`}
          >
            {/* Badge populaire */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                  Populaire
                </span>
              </div>
            )}

            {/* Badge actuel */}
            {plan.current && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                  Plan actuel
                </span>
              </div>
            )}

            {/* En-tête du plan */}
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">{getPlanIcon(plan.id)}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatPrice(plan.price, plan.period)}
              </div>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>

            {/* Fonctionnalités */}
            <div className="space-y-3 mb-6">
              {PLAN_FEATURES[plan.id as keyof typeof PLAN_FEATURES]?.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  {getFeatureIcon(feature)}
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Limitations */}
            {plan.limitations && plan.limitations.length > 0 && (
              <div className="space-y-2 mb-6">
                {plan.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <X className="w-4 h-4 text-red-500 mt-0.5" />
                    <span className="text-sm text-gray-600">{limitation}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton d'action */}
            <button
              onClick={() => onSelectPlan(plan.id)}
              disabled={loading || plan.current}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.current
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Traitement...
                </div>
              ) : plan.current ? (
                'Plan actuel'
              ) : plan.price === 0 ? (
                'Commencer gratuitement'
              ) : (
                'Choisir ce plan'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Informations de facturation</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Paiement sécurisé par carte bancaire ou Mobile Money</li>
              <li>• Résiliation possible à tout moment</li>
              <li>• Remboursement au prorata en cas de résiliation anticipée</li>
              <li>• Support client disponible pour toute question</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de résiliation */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Résilier l'abonnement
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir résilier votre abonnement ? 
              Vous perdrez l'accès aux fonctionnalités premium à la fin de la période de facturation actuelle.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onCancelSubscription();
                  setShowCancelModal(false);
                }}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmer la résiliation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
