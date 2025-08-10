import React, { useState } from 'react';
import { ArrowLeft, Star, CheckCircle, CreditCard, Download } from 'lucide-react';

interface Plan {
  name: string;
  price: number;
  features: string[];
  isCurrent: boolean;
  isRecommended?: boolean;
}

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  planName: string;
  status: 'Payé' | 'En attente' | 'Échoué';
}

export const SubscriptionPage: React.FC = () => {
  const plans: Plan[] = [
    {
      name: 'Essentiel',
      price: 10000,
      features: ['Profil visible', '50 commandes/mois', 'Support email'],
      isCurrent: false
    },
    {
      name: 'Pro',
      price: 25000,
      features: ['Profil mis en avant', 'Commandes illimitées', 'Support prioritaire', 'Statistiques avancées'],
      isCurrent: true,
      isRecommended: true
    },
    {
      name: 'Premium',
      price: 50000,
      features: ['Avantages Pro', 'Marketing personnalisé', 'Consultant dédié'],
      isCurrent: false
    }
  ];

  const billingHistory: BillingHistoryItem[] = [
    { id: 'inv-001', date: '01/07/2024', amount: 25000, planName: 'Pro', status: 'Payé' },
    { id: 'inv-002', date: '01/06/2024', amount: 25000, planName: 'Pro', status: 'Payé' },
    { id: 'inv-003', date: '01/05/2024', amount: 10000, planName: 'Essentiel', status: 'Payé' }
  ];

  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    if (status === 'Payé') return 'text-green-600 bg-green-100';
    if (status === 'Échoué') return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => window.history.back()} 
                className="p-2 text-gray-500 hover:text-gray-700 touch-target"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              <h1 className="text-base sm:text-xl font-semibold text-gray-900">Abonnement</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Plans - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-lg border p-4 sm:p-6 flex flex-col ${plan.isRecommended ? 'border-blue-500 border-2' : 'border-gray-200 bg-white'}`}>
              {plan.isRecommended && <span className="bg-blue-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full self-start mb-3 sm:mb-4">Recommandé</span>}
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-2xl sm:text-3xl font-bold my-3 sm:my-4">
                {plan.price.toLocaleString()} 
                <span className="text-sm sm:text-lg font-normal text-gray-500">FCFA/mois</span>
              </p>
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                disabled={loading || plan.isCurrent}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm sm:text-base touch-target ${plan.isCurrent ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {plan.isCurrent ? 'Plan Actuel' : 'Choisir'}
              </button>
            </div>
          ))}
        </div>

        {/* Facturation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique de Facturation</h3>
          <div className="space-y-3">
            {billingHistory.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Abonnement {item.planName} - {item.date}</p>
                  <p className={`text-sm font-medium px-2 py-0.5 rounded-full inline-block ${getStatusColor(item.status)}`}>{item.status}</p>
                </div>
                <div className="flex items-center gap-4">
                   <span className="font-semibold">{item.amount.toLocaleString()} FCFA</span>
                   <button className="text-blue-600 hover:text-blue-800 p-2">
                     <Download className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
