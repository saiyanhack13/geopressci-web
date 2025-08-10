import React, { useState } from 'react';
import { ArrowLeft, LifeBuoy, ChevronDown, Send, BookOpen, MessageSquare } from 'lucide-react';

interface FaqItemProps {
  q: string;
  a: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 py-4">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
        <span className="font-medium text-gray-800">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-3 text-gray-600">
          <p>{a}</p>
        </div>
      )}
    </div>
  );
};

export const SupportPage: React.FC = () => {
  const faqs = [
    { q: 'Comment modifier mes tarifs ?', a: 'Allez dans la section "Services et Tarifs" de votre profil pour mettre à jour les prix de chaque prestation.' },
    { q: 'Un client a annulé, que faire ?', a: 'Si une commande est annulée, elle apparaîtra comme telle dans votre liste de commandes. Aucun frais ne vous sera facturé.' },
    { q: 'Comment suis-je payé ?', a: 'Les paiements sont transférés sur votre compte bancaire ou mobile money enregistré tous les lundis. Vous pouvez suivre vos revenus dans la page "Gains".' },
    { q: 'Puis-je mettre mon pressing en pause ?', a: 'Oui, vous pouvez désactiver temporairement votre visibilité dans les paramètres de votre profil. Vous ne recevrez plus de nouvelles commandes.' }
  ];

  const [form, setForm] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setLoading(false);
    }
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
              <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              <h1 className="text-base sm:text-xl font-semibold text-gray-900">Support</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Section Contact - Mobile Optimized */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Contactez-nous</h2>
          {submitted ? (
            <div className="text-center p-8 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">Message envoyé !</h3>
              <p className="text-green-700 mt-2">Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais (généralement sous 24h).</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                <input 
                  type="text" 
                  id="subject"
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Problème avec une commande"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Votre message</label>
                <textarea 
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Décrivez votre problème en détail..."
                ></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                <Send className="w-4 h-4" />
                {loading ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>

        {/* Section FAQ - Mobile Optimized */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Questions Fréquentes (FAQ)</h2>
          <div className="divide-y divide-gray-200">
            {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>

        {/* Ressources - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <a href="#" className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow touch-target">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Guide du Partenaire</h4>
              <p className="text-xs sm:text-sm text-gray-600">Toutes les infos pour bien démarrer.</p>
            </div>
          </a>
          <a href="#" className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow touch-target">
            <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Forum Communautaire</h4>
              <p className="text-xs sm:text-sm text-gray-600">Échangez avec d'autres pressings.</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
