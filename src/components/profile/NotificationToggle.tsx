import React, { useState } from 'react';
import { Bell, BellOff, Smartphone, Mail, MessageSquare, Package, Star, Clock } from 'lucide-react';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

interface NotificationToggleProps {
  settings: NotificationSetting[];
  onUpdateSetting: (id: string, setting: Partial<NotificationSetting>) => void;
  loading?: boolean;
}

export const NotificationToggle: React.FC<NotificationToggleProps> = ({
  settings,
  onUpdateSetting,
  loading = false
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSetting = (id: string) => {
    const setting = settings.find(s => s.id === id);
    if (setting) {
      onUpdateSetting(id, { enabled: !setting.enabled });
    }
  };

  const toggleChannel = (id: string, channel: 'push' | 'email' | 'sms') => {
    const setting = settings.find(s => s.id === id);
    if (setting) {
      onUpdateSetting(id, {
        channels: {
          ...setting.channels,
          [channel]: !setting.channels[channel]
        }
      });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'push': return <Smartphone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'push': return 'Notifications push';
      case 'email': return 'Email';
      case 'sms': return 'SMS';
      default: return channel;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Préférences de notifications</h2>
      </div>

      <div className="space-y-4">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            {/* En-tête de la notification */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="text-blue-600">
                  {setting.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{setting.title}</h3>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpandedId(expandedId === setting.id ? null : setting.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {expandedId === setting.id ? 'Masquer' : 'Configurer'}
                </button>

                <button
                  onClick={() => toggleSetting(setting.id)}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      setting.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Configuration détaillée */}
            {expandedId === setting.id && setting.enabled && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Recevoir via :
                </p>
                <div className="space-y-3">
                  {Object.entries(setting.channels).map(([channel, enabled]) => (
                    <div key={channel} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-500">
                          {getChannelIcon(channel)}
                        </div>
                        <span className="text-sm text-gray-700">
                          {getChannelLabel(channel)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => toggleChannel(setting.id, channel as 'push' | 'email' | 'sms')}
                        disabled={loading}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message si désactivé */}
            {expandedId === setting.id && !setting.enabled && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-500">
                  <BellOff className="w-4 h-4" />
                  <span className="text-sm">Cette notification est désactivée</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions globales */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              settings.forEach(setting => {
                onUpdateSetting(setting.id, { enabled: true });
              });
            }}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            Tout activer
          </button>
          
          <button
            onClick={() => {
              settings.forEach(setting => {
                onUpdateSetting(setting.id, { enabled: false });
              });
            }}
            disabled={loading}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm"
          >
            Tout désactiver
          </button>
        </div>
      </div>

      {/* Note informative */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Astuce :</strong> Vous pouvez personnaliser chaque type de notification 
          selon vos préférences. Les notifications push nécessitent l'autorisation de votre navigateur.
        </p>
      </div>
    </div>
  );
};

// Données par défaut pour les notifications
export const defaultNotificationSettings: NotificationSetting[] = [
  {
    id: 'order_status',
    title: 'Statut des commandes',
    description: 'Mises à jour sur l\'état de vos commandes',
    icon: <Package className="w-5 h-5" />,
    enabled: true,
    channels: { push: true, email: true, sms: false }
  },
  {
    id: 'order_ready',
    title: 'Commande prête',
    description: 'Quand votre commande est prête pour récupération',
    icon: <Clock className="w-5 h-5" />,
    enabled: true,
    channels: { push: true, email: false, sms: true }
  },
  {
    id: 'promotions',
    title: 'Promotions et offres',
    description: 'Offres spéciales et réductions',
    icon: <Star className="w-5 h-5" />,
    enabled: false,
    channels: { push: false, email: true, sms: false }
  },
  {
    id: 'reminders',
    title: 'Rappels',
    description: 'Rappels pour récupérer vos commandes',
    icon: <Bell className="w-5 h-5" />,
    enabled: true,
    channels: { push: true, email: false, sms: false }
  },
  {
    id: 'reviews',
    title: 'Demandes d\'avis',
    description: 'Invitations à noter nos services',
    icon: <MessageSquare className="w-5 h-5" />,
    enabled: true,
    channels: { push: false, email: true, sms: false }
  }
];
