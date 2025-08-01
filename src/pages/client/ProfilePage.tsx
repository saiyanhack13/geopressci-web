import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Shield, Bell, MapPin, CreditCard, History, Heart, LogOut, Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { ProfileForm } from '../../components/profile/ProfileForm';
import { SupportChat } from '../../components/profile/SupportChat';
import { useGetCurrentUserQuery, useUpdateCurrentUserMutation, useUpdatePasswordMutation } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showSupportChat, setShowSupportChat] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Hooks API pour les données utilisateur
  const { data: user, isLoading: userLoading, error: userError, refetch } = useGetCurrentUserQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !localStorage.getItem('authToken'),
  });
  const [updateProfile, { isLoading: updateLoading }] = useUpdateCurrentUserMutation();
  const [updatePassword, { isLoading: passwordLoading }] = useUpdatePasswordMutation();

  // Handle 401 errors - mais seulement si on a vraiment essayé de charger les données
  useEffect(() => {
    if (userError && 'status' in userError && userError.status === 401) {
      console.log('🔍 Erreur 401 détectée dans ProfilePage:', userError);
      
      // Vérifier si on a un token valide dans le localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('❌ Aucun token trouvé, redirection vers login');
        logout();
        toast.error('Votre session a expiré. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        console.log('⚠️ Token présent mais erreur 401, tentative de rechargement...');
        // Ne pas déconnecter immédiatement, laisser une chance à l'utilisateur
        toast.error('Erreur de chargement du profil. Veuillez actualiser la page.');
      }
    }
  }, [userError, logout, navigate]);

  const handleUpdateProfile = async (data: any) => {
    try {
      await updateProfile(data).unwrap();
      toast.success('✅ Profil mis à jour avec succès !');
      refetch(); // Recharger les données utilisateur
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      toast.error(error?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  const handlePasswordChange = async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      await updatePassword(passwordData).unwrap();
      toast.success('🔒 Mot de passe changé avec succès !');
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error);
      toast.error(error?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('👋 Déconnexion réussie');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  // Gestion des états de chargement et d'erreur - UI/UX 2025
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chargement du profil</h2>
          <p className="text-gray-600 text-sm leading-relaxed">Récupération de vos informations personnelles...</p>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">Impossible de charger les données du profil. Vérifiez votre connexion internet.</p>
          <button 
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 min-w-[44px] min-h-[44px] font-medium"
            aria-label="Réessayer le chargement du profil"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { id: 'profile', label: 'Profil', icon: User, href: '/profile' },
    { id: 'addresses', label: 'Adresses', icon: MapPin, href: '/profile/addresses' },
    { id: 'payments', label: 'Paiements', icon: CreditCard, href: '/profile/payments' },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/profile/notifications' },
    { id: 'history', label: 'Historique', icon: History, href: '/profile/history' },
    { id: 'favorites', label: 'Favoris', icon: Heart, href: '/profile/favorites' },
    { id: 'settings', label: 'Paramètres', icon: Settings, href: '/profile/settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - UI/UX 2025 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mon Profil</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Gérez vos informations personnelles</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSupportChat(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg hover:bg-blue-50"
                aria-label="Ouvrir le support client"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Support</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors duration-200 min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg hover:bg-red-50"
                aria-label="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Sidebar - UI/UX 2025 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              {/* Avatar et infos utilisateur - UI/UX 2025 */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden mx-auto mb-4 shadow-lg">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Photo de profil" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-blue-600" />
                    )}
                  </div>
                  <button 
                    className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Modifier la photo de profil"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  {user.prenom} {user.nom}
                </h2>
                <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                <p className="text-sm text-gray-500">{user.telephone}</p>
                
                {/* Stats rapides - UI/UX 2025 */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{user.totalOrders || 0}</div>
                    <div className="text-xs text-gray-600 font-medium">Commandes</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">{user.favoritePressed || 0}</div>
                    <div className="text-xs text-gray-600 font-medium">Favoris</div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                  Membre depuis {user.memberSince ? new Date(user.memberSince).toLocaleDateString('fr-FR', { 
                    month: 'long', 
                    year: 'numeric' 
                  }) : 'récemment'}
                </p>
              </div>

              {/* Menu de navigation - UI/UX 2025 */}
              <nav className="space-y-2" role="tablist" aria-label="Navigation du profil">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      role="tab"
                      aria-selected={activeTab === item.id}
                      aria-controls={`panel-${item.id}`}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 min-h-[44px] touch-target ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                      }`}
                      aria-label={`Aller à ${item.label}`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{item.label}</span>
                      {activeTab === item.id && (
                        <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Contenu principal - UI/UX 2025 */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="space-y-6 sm:space-y-8" role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">
                {/* Security Status Card - UI/UX 2025 */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Statut de Sécurité</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors duration-200">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-green-900 text-sm sm:text-base">✅ Email vérifié</p>
                        <p className="text-xs sm:text-sm text-green-700 leading-relaxed">Votre email est confirmé</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors duration-200">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-green-900 text-sm sm:text-base">📱 Téléphone vérifié</p>
                        <p className="text-xs sm:text-sm text-green-700 leading-relaxed">SMS de confirmation reçu</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors duration-200">
                      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-orange-900 text-sm sm:text-base">🔐 2FA recommandé</p>
                        <p className="text-xs sm:text-sm text-orange-700 leading-relaxed">Activez l'authentification à deux facteurs</p>
                      </div>
                    </div>
                  </div>
                </div>

                <ProfileForm
                  initialData={{
                    firstName: user.firstName || user.prenom || '',
                    lastName: user.lastName || user.nom || '',
                    email: user.email || '',
                    phone: user.phone || user.telephone || '',
                    address: user.address || '',
                    dateOfBirth: user.dateOfBirth || '',
                    avatar: user.avatar || ''
                  }}
                  onSubmit={handleUpdateProfile}
                  onPasswordChange={handlePasswordChange}
                  loading={updateLoading}
                  userType="client"
                  showPasswordSection={true}
                />

                {/* Sécurité - UI/UX 2025 */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">🔒 Sécurité</h2>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          🔑 Mot de passe
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Dernière modification il y a 3 mois</p>
                      </div>
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 min-h-[44px] text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
                        aria-label="Modifier le mot de passe"
                      >
                        Modifier
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          🛡️ Authentification à deux facteurs
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Sécurisez votre compte avec 2FA</p>
                      </div>
                      <button 
                        className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 min-h-[44px] text-sm sm:text-base font-medium border border-orange-200"
                        aria-label="Activer l'authentification à deux facteurs"
                      >
                        Activer
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-green-200 hover:bg-green-50/30 transition-all duration-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          📱 Sessions actives
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Gérer les appareils connectés</p>
                      </div>
                      <button 
                        className="text-blue-600 hover:text-blue-800 font-medium min-h-[44px] px-3 py-2 rounded-lg hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base"
                        aria-label="Voir toutes les sessions actives"
                      >
                        Voir tout
                      </button>
                    </div>
                  </div>
                </div>

                {/* Préférences - UI/UX 2025 */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">⚙️ Préférences</h2>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-purple-200 hover:bg-purple-50/30 transition-all duration-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          🌍 Langue
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Interface en français</p>
                      </div>
                      <select 
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-h-[44px] text-sm sm:text-base bg-white hover:border-purple-300"
                        aria-label="Sélectionner la langue"
                      >
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇺🇸 English</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          🕐 Fuseau horaire
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">GMT+0 (Abidjan)</p>
                      </div>
                      <select 
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] text-sm sm:text-base bg-white hover:border-blue-300"
                        aria-label="Sélectionner le fuseau horaire"
                      >
                        <option value="Africa/Abidjan">🌍 GMT+0 (Abidjan)</option>
                        <option value="Europe/Paris">🇫🇷 GMT+1 (Paris)</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-green-200 hover:bg-green-50/30 transition-all duration-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          💰 Devise
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Franc CFA (FCFA)</p>
                      </div>
                      <select 
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 min-h-[44px] text-sm sm:text-base bg-white hover:border-green-300"
                        aria-label="Sélectionner la devise"
                      >
                        <option value="XOF">🇨🇮 Franc CFA (FCFA)</option>
                        <option value="EUR">🇪🇺 Euro (€)</option>
                        <option value="USD">🇺🇸 Dollar US ($)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder pour les autres onglets */}
            {activeTab !== 'profile' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-gray-400 mb-4">
                  {menuItems.find(item => item.id === activeTab)?.icon && 
                    React.createElement(menuItems.find(item => item.id === activeTab)!.icon, { className: "w-12 h-12 mx-auto" })
                  }
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {menuItems.find(item => item.id === activeTab)?.label}
                </h3>
                <p className="text-gray-600">
                  Cette section sera bientôt disponible. Utilisez la navigation pour accéder aux autres pages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support Chat */}
      <SupportChat
        isOpen={showSupportChat}
        onClose={() => setShowSupportChat(false)}
        userType="client"
      />
    </div>
  );
};

export default ProfilePage;
