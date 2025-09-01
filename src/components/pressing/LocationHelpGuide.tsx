import React, { useState } from 'react';
import { 
  HelpCircle, 
  MapPin, 
  Target, 
  Satellite, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Smartphone,
  Wifi,
  Navigation,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LocationHelpGuideProps {
  className?: string;
}

const LocationHelpGuide: React.FC<LocationHelpGuideProps> = ({ className = '' }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const helpSections = [
    {
      id: 'why-location',
      title: 'Pourquoi définir ma position précise ?',
      icon: Target,
      color: 'blue',
      content: [
        '🎯 Améliore votre visibilité dans les recherches locales',
        '📍 Permet aux clients de vous trouver facilement',
        '🚚 Calcul précis des distances et frais de livraison',
        '⭐ Augmente la confiance des clients',
        '📱 Facilite la navigation GPS pour vos clients'
      ]
    },
    {
      id: 'real-time-tracking',
      title: 'Comment fonctionne le suivi en temps réel ?',
      icon: Clock,
      color: 'green',
      content: [
        '🛰️ Utilise le GPS de votre appareil pour une précision maximale',
        '📡 Met à jour automatiquement votre position toutes les 30 secondes',
        '💾 Sauvegarde automatique si vous vous déplacez de plus de 50 mètres',
        '🔋 Optimisé pour préserver la batterie de votre appareil',
        '🔒 Vos données de localisation restent privées et sécurisées'
      ]
    },
    {
      id: 'accuracy-levels',
      title: 'Niveaux de précision GPS',
      icon: Satellite,
      color: 'purple',
      content: [
        '🟢 Excellente (0-10m) : Position très précise, idéale pour les clients',
        '🔵 Bonne (10-50m) : Position fiable pour la plupart des usages',
        '🟡 Moyenne (50-100m) : Position acceptable, peut nécessiter des ajustements',
        '🔴 Faible (100m+) : Position approximative, recommandé de réessayer'
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Résolution des problèmes courants',
      icon: AlertTriangle,
      color: 'orange',
      content: [
        '📱 Assurez-vous que la géolocalisation est activée dans votre navigateur',
        '🛰️ Sortez à l\'extérieur pour une meilleure réception GPS',
        '📶 Vérifiez votre connexion internet',
        '🔄 Actualisez la page si la position ne se met pas à jour',
        '⚙️ Activez la "Haute précision" dans les paramètres de votre appareil'
      ]
    },
    {
      id: 'manual-selection',
      title: 'Sélection manuelle sur carte',
      icon: MapPin,
      color: 'red',
      content: [
        '🗺️ Cliquez sur "Sélectionner sur carte" pour ouvrir la carte interactive',
        '👆 Cliquez directement sur la carte pour placer le marqueur',
        '🔄 Déplacez le marqueur bleu pour ajuster la position',
        '🏘️ Le quartier est détecté automatiquement',
        '✅ Confirmez votre choix pour sauvegarder la position'
      ]
    },
    {
      id: 'best-practices',
      title: 'Bonnes pratiques',
      icon: CheckCircle,
      color: 'teal',
      content: [
        '🕐 Mettez à jour votre position pendant les heures d\'ouverture',
        '📍 Placez le marqueur exactement à l\'entrée de votre pressing',
        '🔄 Vérifiez régulièrement que votre position est à jour',
        '📱 Utilisez le suivi en temps réel si vous vous déplacez souvent',
        '💬 Informez vos clients de votre position exacte par message'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', icon: 'text-orange-600' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-600' },
      teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', icon: 'text-teal-600' }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Guide de géolocalisation
          </h3>
          <p className="text-sm text-gray-600">
            Tout savoir sur la gestion de votre position
          </p>
        </div>
      </div>

      {/* Sections d'aide */}
      <div className="space-y-3">
        {helpSections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const colors = getColorClasses(section.color);
          const IconComponent = section.icon;

          return (
            <div
              key={section.id}
              className={`border rounded-xl transition-all duration-200 ${colors.border} ${colors.bg}`}
            >
              {/* En-tête de section */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-opacity-80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                  <span className={`font-medium ${colors.text}`}>
                    {section.title}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className={`w-4 h-4 ${colors.icon}`} />
                ) : (
                  <ChevronDown className={`w-4 h-4 ${colors.icon}`} />
                )}
              </button>

              {/* Contenu de section */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="pl-8 space-y-2">
                    {section.content.map((item, index) => (
                      <div
                        key={index}
                        className={`text-sm ${colors.text} flex items-start gap-2`}
                      >
                        <span className="text-xs mt-1">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conseils rapides */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">
              💡 Conseil du jour
            </h4>
            <p className="text-sm text-blue-800">
              Pour une précision optimale, activez le suivi en temps réel pendant vos heures d'ouverture. 
              Vos clients pourront ainsi vous localiser avec une précision de quelques mètres !
            </p>
          </div>
        </div>
      </div>

      {/* Liens d'aide supplémentaires */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-gray-600" />
          Ressources utiles
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="#"
            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
          >
            <Wifi className="w-4 h-4 text-gray-500" />
            <span>Paramètres de géolocalisation</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
          >
            <Target className="w-4 h-4 text-gray-500" />
            <span>Tester ma précision GPS</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default LocationHelpGuide;
