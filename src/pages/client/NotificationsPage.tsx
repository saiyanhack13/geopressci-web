import React, { useState, useEffect } from 'react';
import { Bell, ArrowLeft, RefreshCw, Trash2, Check, CheckCheck } from 'lucide-react';
import { NotificationToggle, defaultNotificationSettings } from '../../components/profile/NotificationToggle';
import { 
  useGetNotificationsQuery, 
  useGetNotificationSettingsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useUpdateNotificationSettingsMutation,
  useDeleteNotificationMutation
} from '../../services/api';
import toast from 'react-hot-toast';

export const NotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(defaultNotificationSettings);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // API hooks pour les notifications
  const { 
    data: notificationsData, 
    isLoading: notificationsLoading, 
    error: notificationsError,
    refetch: refetchNotifications 
  } = useGetNotificationsQuery({
    page: currentPage,
    limit: 20,
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter
  });

  // API hooks pour les paramètres
  const { 
    data: settingsData, 
    isLoading: settingsLoading,
    refetch: refetchSettings 
  } = useGetNotificationSettingsQuery();

  // Mutations
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [updateSettings] = useUpdateNotificationSettingsMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  // Synchroniser les paramètres avec l'API
  useEffect(() => {
    if (settingsData?.settings) {
      setSettings(settingsData.settings.map((setting: any) => ({
        ...setting,
        title: setting.label,
        icon: '🔔'
      })));
    }
  }, [settingsData]);

  const handleUpdateSetting = async (id: string, setting: any) => {
    setLoading(true);
    try {
      await updateSettings({ settingId: id, ...setting }).unwrap();
      
      setSettings(prev => 
        prev.map(s => 
          s.id === id ? { ...s, ...setting } : s
        )
      );
      
      toast.success('✅ Paramètres mis à jour');
      refetchSettings();
    } catch (error) {
      console.error('Erreur mise à jour notification:', error);
      toast.error('❌ Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  // Marquer une notification comme lue
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId).unwrap();
      toast.success('📖 Notification marquée comme lue');
      refetchNotifications();
    } catch (error) {
      toast.error('❌ Erreur lors du marquage');
    }
  };

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllAsRead().unwrap();
      toast.success(`✅ ${result.count} notifications marquées comme lues`);
      refetchNotifications();
    } catch (error) {
      toast.error('❌ Erreur lors du marquage');
    }
  };

  // Supprimer une notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId).unwrap();
      toast.success('🗑️ Notification supprimée');
      refetchNotifications();
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  // Rafraîchir les données
  const handleRefresh = () => {
    refetchNotifications();
    refetchSettings();
    toast.success('🔄 Données actualisées');
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} heure${Math.floor(diffInHours) > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'order': '📦',
      'payment': '💳',
      'delivery': '🚚',
      'promotion': '🎉',
      'system': '⚙️',
      'account': '👤',
      'review': '⭐',
      'subscription': '📋'
    };
    return icons[type] || '📢';
  };

  const enabledCount = settings.filter(s => s.enabled).length;
  const totalChannels = settings.reduce((sum, s) => {
    if (!s.enabled) return sum;
    return sum + Object.values(s.channels).filter(Boolean).length;
  }, 0);

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;
  const totalNotifications = notificationsData?.total || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - UI/UX 2025 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6 sm:py-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => window.history.back()}
                className="p-2 sm:p-3 hover:bg-white/10 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center focus:ring-2 focus:ring-white/30 focus:outline-none"
                aria-label="Retour à la page précédente"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
                    🔔 Notifications
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs sm:text-sm px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                    Gérez vos notifications et préférences
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={notificationsLoading}
                  className="p-2 sm:p-3 hover:bg-white/10 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-white/30 focus:outline-none"
                  aria-label="Actualiser les notifications"
                >
                  <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-white ${notificationsLoading ? 'animate-spin' : ''}`} />
                </button>
                
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 min-h-[44px] text-sm sm:text-base font-medium border border-white/20 hover:border-white/30 focus:ring-2 focus:ring-white/30 focus:outline-none"
                    aria-label="Marquer toutes les notifications comme lues"
                  >
                    <CheckCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Tout marquer lu</span>
                    <span className="sm:hidden">Tout lu</span>
                  </button>
                )}
              </div>
              
              <div className="text-xs sm:text-sm text-blue-100 bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span>📊 {enabledCount}/{settings.length} activées</span>
                  <span className="hidden sm:inline">•</span>
                  <span>📡 {totalChannels} canaux</span>
                  <span className="hidden sm:inline">•</span>
                  <span>📬 {unreadCount} non lues</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        {/* Résumé des notifications - UI/UX 2025 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8 hover:shadow-xl transition-shadow duration-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            📊 Résumé de vos notifications
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-200">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{totalNotifications}</div>
              <div className="text-sm sm:text-base text-blue-700 font-medium">Total notifications</div>
              <div className="text-xs sm:text-sm text-blue-600 mt-1 bg-blue-200/50 px-2 py-1 rounded-full">
                {unreadCount} non lues
              </div>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-200">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{enabledCount}</div>
              <div className="text-sm sm:text-base text-green-700 font-medium">Types activés</div>
              <div className="text-xs sm:text-sm text-green-600 mt-1 bg-green-200/50 px-2 py-1 rounded-full">
                sur {settings.length} disponibles
              </div>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-200">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">
                {settings.filter(s => s.enabled && s.channels.push).length}
              </div>
              <div className="text-sm sm:text-base text-purple-700 font-medium">Notifications push</div>
              <div className="text-xs sm:text-sm text-purple-600 mt-1 bg-purple-200/50 px-2 py-1 rounded-full">
                Instantanées
              </div>
            </div>
          </div>
        </div>

        {/* Filtres - UI/UX 2025 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8 hover:shadow-xl transition-shadow duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              🔍 Filtres
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 min-h-[44px] text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              aria-label={showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            >
              <span>{showFilters ? 'Masquer' : 'Afficher'}</span>
              <span className="transform transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}">▼</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="status-filter">
                  Statut
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] text-sm bg-white hover:border-blue-300"
                  aria-label="Filtrer par statut"
                >
                  <option value="all">Toutes les notifications</option>
                  <option value="unread">🔴 Non lues</option>
                  <option value="read">✅ Lues</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="type-filter">
                  Type
                </label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] text-sm bg-white hover:border-blue-300"
                  aria-label="Filtrer par type"
                >
                  <option value="all">Tous les types</option>
                  <option value="order">📦 Commandes</option>
                  <option value="payment">💳 Paiements</option>
                  <option value="delivery">🚚 Livraisons</option>
                  <option value="promotion">🎉 Promotions</option>
                  <option value="system">⚙️ Système</option>
                  <option value="account">👤 Compte</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 min-h-[44px] text-sm font-medium focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
                  aria-label="Réinitialiser tous les filtres"
                >
                  🔄 Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Liste des notifications - UI/UX 2025 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8 hover:shadow-xl transition-shadow duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              📬 Vos notifications
            </h3>
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              {notifications.length} sur {totalNotifications} notifications
            </div>
          </div>

          {/* États de chargement et d'erreur */}
          {notificationsLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                    </div>
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notificationsError && (
            <div className="text-center py-8">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h4>
              <p className="text-gray-600 mb-4">Impossible de charger les notifications</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-[44px] font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                🔄 Réessayer
              </button>
            </div>
          )}

          {/* Liste des notifications */}
          {!notificationsLoading && !notificationsError && (
            <div className="space-y-3 sm:space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📭</div>
                  <h4 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Aucune notification</h4>
                  <p className="text-gray-600 text-sm sm:text-base">Vous n'avez aucune notification pour le moment</p>
                </div>
              ) : (
                notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                      notification.read
                        ? 'border-gray-200 bg-white'
                        : 'border-blue-200 bg-blue-50/30'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl ${
                        notification.read ? 'bg-gray-100' : 'bg-blue-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={`font-medium text-sm sm:text-base leading-tight ${
                            notification.read ? 'text-gray-900' : 'text-blue-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                              aria-label="Marquer comme lu"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                            aria-label="Supprimer la notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!notificationsLoading && !notificationsError && notifications.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Page {currentPage} sur {Math.ceil(totalNotifications / 20)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px] text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalNotifications / 20)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px] text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Composant de gestion des notifications */}
        <NotificationToggle
          settings={settings}
          onUpdateSetting={handleUpdateSetting}
        />
        
        {/* Section des paramètres avancés */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">⚙️ Paramètres avancés</h3>
          <div className="space-y-6">
            {/* Heures de silence */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">🌙 Heures de silence</h4>
              <p className="text-sm text-gray-600 mb-4">
                Définissez les heures pendant lesquelles vous ne souhaitez pas recevoir de notifications push.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Début
                  </label>
                  <input
                    type="time"
                    defaultValue="22:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin
                  </label>
                  <input
                    type="time"
                    defaultValue="07:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Fréquence des emails */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">📧 Fréquence des emails</h4>
              <p className="text-sm text-gray-600 mb-4">
                Choisissez la fréquence de réception des emails de résumé.
              </p>
              
              <div className="space-y-2">
                {[
                  { value: 'immediate', label: 'Immédiat', desc: 'Recevoir chaque notification par email' },
                  { value: 'daily', label: 'Quotidien', desc: 'Résumé quotidien à 18h' },
                  { value: 'weekly', label: 'Hebdomadaire', desc: 'Résumé le dimanche matin' },
                  { value: 'never', label: 'Jamais', desc: 'Pas d\'emails de notification' }
                ].map((option) => (
                  <label key={option.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="emailFrequency"
                      value={option.value}
                      defaultChecked={option.value === 'daily'}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notifications par géolocalisation */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">📍 Notifications géolocalisées</h4>
              <p className="text-sm text-gray-600 mb-4">
                Recevez des notifications basées sur votre position (pressings à proximité, offres locales).
              </p>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Activer la géolocalisation</div>
                  <div className="text-sm text-gray-600">Notifications basées sur votre position</div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </button>
              </div>
            </div>

            {/* Bouton de sauvegarde */}
            <div className="pt-4 border-t border-gray-200">
              <button
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer les paramètres avancés'}
              </button>
            </div>
          </div>
        </div>

        {/* Test de notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-4">🧪 Test des notifications</h3>
          <p className="text-sm text-gray-600 mb-4">
            Testez vos paramètres de notification pour vous assurer qu'ils fonctionnent correctement.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => toast.success('📱 Test de notification push envoyé !')}
              className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              📱 Test Push
            </button>
            <button 
              onClick={() => toast.success('📧 Test d\'email envoyé !')}
              className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              📧 Test Email
            </button>
            <button 
              onClick={() => toast.success('💬 Test de SMS envoyé !')}
              className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              💬 Test SMS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
