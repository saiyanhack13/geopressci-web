import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface SystemSettings {
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  defaultLanguage: string;
  timezone: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoApproveUsers: boolean;
  autoApprovePressings: boolean;
  maxOrdersPerDay: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  platformCommission: number;
  paymentMethods: string[];
}

interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  auditLogRetention: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  encryptionEnabled: boolean;
}

interface NotificationSettings {
  newUserRegistration: boolean;
  newPressingApplication: boolean;
  orderStatusUpdates: boolean;
  paymentNotifications: boolean;
  systemAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  emergencyAlerts: boolean;
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'security' | 'notifications' | 'integrations'>('system');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    platformName: 'Geopressci',
    platformDescription: 'Plateforme de pressing à domicile pour Abidjan',
    supportEmail: 'support@geopressci.ci',
    supportPhone: '+225 07 00 00 00 00',
    defaultCurrency: 'XOF',
    defaultLanguage: 'fr',
    timezone: 'Africa/Abidjan',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: true,
    autoApproveUsers: false,
    autoApprovePressings: false,
    maxOrdersPerDay: 100,
    minOrderAmount: 1000,
    maxOrderAmount: 100000,
    platformCommission: 15,
    paymentMethods: ['orange_money', 'mtn_money', 'moov_money', 'cash']
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
    ipWhitelist: [],
    auditLogRetention: 90,
    backupFrequency: 'daily',
    encryptionEnabled: true
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newUserRegistration: true,
    newPressingApplication: true,
    orderStatusUpdates: true,
    paymentNotifications: true,
    systemAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
    emergencyAlerts: true
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulation de sauvegarde - à remplacer par les vraies API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'system', label: '⚙️ Système', icon: '⚙️' },
    { id: 'security', label: '🔒 Sécurité', icon: '🔒' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
    { id: 'integrations', label: '🔗 Intégrations', icon: '🔗' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Paramètres Système</h1>
          <p className="text-gray-600">Configuration et paramètres de la plateforme Geopressci</p>
        </div>

        {/* Save Status */}
        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <span>✅</span>
              <span className="font-medium">Paramètres sauvegardés avec succès</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* System Settings */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🏢 Informations Générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de la plateforme
                    </label>
                    <input
                      type="text"
                      value={systemSettings.platformName}
                      onChange={(e) => setSystemSettings({...systemSettings, platformName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email de support
                    </label>
                    <input
                      type="email"
                      value={systemSettings.supportEmail}
                      onChange={(e) => setSystemSettings({...systemSettings, supportEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description de la plateforme
                  </label>
                  <textarea
                    value={systemSettings.platformDescription}
                    onChange={(e) => setSystemSettings({...systemSettings, platformDescription: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💰 Paramètres Commerciaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commission plateforme (%)
                    </label>
                    <input
                      type="number"
                      value={systemSettings.platformCommission}
                      onChange={(e) => setSystemSettings({...systemSettings, platformCommission: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant minimum (FCFA)
                    </label>
                    <input
                      type="number"
                      value={systemSettings.minOrderAmount}
                      onChange={(e) => setSystemSettings({...systemSettings, minOrderAmount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant maximum (FCFA)
                    </label>
                    <input
                      type="number"
                      value={systemSettings.maxOrderAmount}
                      onChange={(e) => setSystemSettings({...systemSettings, maxOrderAmount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔧 Options Système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.maintenanceMode}
                        onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mode maintenance</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.registrationEnabled}
                        onChange={(e) => setSystemSettings({...systemSettings, registrationEnabled: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Inscription ouverte</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoApproveUsers}
                        onChange={(e) => setSystemSettings({...systemSettings, autoApproveUsers: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto-validation utilisateurs</span>
                    </label>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.emailNotifications}
                        onChange={(e) => setSystemSettings({...systemSettings, emailNotifications: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Notifications email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.smsNotifications}
                        onChange={(e) => setSystemSettings({...systemSettings, smsNotifications: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Notifications SMS</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoApprovePressings}
                        onChange={(e) => setSystemSettings({...systemSettings, autoApprovePressings: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto-validation pressings</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🔐 Sécurité des Mots de Passe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longueur minimale
                    </label>
                    <input
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tentatives de connexion max
                    </label>
                    <input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={securitySettings.passwordRequireSpecialChars}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireSpecialChars: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Caractères spéciaux obligatoires</span>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🛡️ Sécurité Avancée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout session (minutes)
                    </label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rétention logs (jours)
                    </label>
                    <input
                      type="number"
                      value={securitySettings.auditLogRetention}
                      onChange={(e) => setSecuritySettings({...securitySettings, auditLogRetention: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Authentification à deux facteurs</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.encryptionEnabled}
                      onChange={(e) => setSecuritySettings({...securitySettings, encryptionEnabled: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Chiffrement des données</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📧 Notifications Système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newUserRegistration}
                        onChange={(e) => setNotificationSettings({...notificationSettings, newUserRegistration: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Nouveaux utilisateurs</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newPressingApplication}
                        onChange={(e) => setNotificationSettings({...notificationSettings, newPressingApplication: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Demandes de pressing</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.orderStatusUpdates}
                        onChange={(e) => setNotificationSettings({...notificationSettings, orderStatusUpdates: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mises à jour commandes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.paymentNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, paymentNotifications: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Notifications paiement</span>
                    </label>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.systemAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, systemAlerts: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Alertes système</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyReports}
                        onChange={(e) => setNotificationSettings({...notificationSettings, weeklyReports: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Rapports hebdomadaires</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.monthlyReports}
                        onChange={(e) => setNotificationSettings({...notificationSettings, monthlyReports: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Rapports mensuels</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emergencyAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, emergencyAlerts: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Alertes d'urgence</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>💳 Méthodes de Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.paymentMethods.includes('orange_money')}
                        onChange={(e) => {
                          const methods = e.target.checked 
                            ? [...systemSettings.paymentMethods, 'orange_money']
                            : systemSettings.paymentMethods.filter(m => m !== 'orange_money');
                          setSystemSettings({...systemSettings, paymentMethods: methods});
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">🟠 Orange Money</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.paymentMethods.includes('mtn_money')}
                        onChange={(e) => {
                          const methods = e.target.checked 
                            ? [...systemSettings.paymentMethods, 'mtn_money']
                            : systemSettings.paymentMethods.filter(m => m !== 'mtn_money');
                          setSystemSettings({...systemSettings, paymentMethods: methods});
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">🟡 MTN Money</span>
                    </label>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.paymentMethods.includes('moov_money')}
                        onChange={(e) => {
                          const methods = e.target.checked 
                            ? [...systemSettings.paymentMethods, 'moov_money']
                            : systemSettings.paymentMethods.filter(m => m !== 'moov_money');
                          setSystemSettings({...systemSettings, paymentMethods: methods});
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">🔵 Moov Money</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.paymentMethods.includes('cash')}
                        onChange={(e) => {
                          const methods = e.target.checked 
                            ? [...systemSettings.paymentMethods, 'cash']
                            : systemSettings.paymentMethods.filter(m => m !== 'cash');
                          setSystemSettings({...systemSettings, paymentMethods: methods});
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">💵 Espèces</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔗 API et Webhooks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">🔑 Clés API</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Key Production</span>
                      <code className="px-2 py-1 bg-gray-200 rounded text-xs">gp_prod_••••••••••••••••</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Key Test</span>
                      <code className="px-2 py-1 bg-gray-200 rounded text-xs">gp_test_••••••••••••••••</code>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">🔗 Webhooks</h4>
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="https://votre-site.com/webhook/orders"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Tester Webhook
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                💾 Sauvegarder les Paramètres
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
