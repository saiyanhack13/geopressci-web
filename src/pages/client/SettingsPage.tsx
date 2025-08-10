import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Shield, Bell, User, 
  Loader2, Save, HelpCircle, LogOut, Trash2, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useGetCurrentUserQuery, useUpdateCurrentUserMutation } from '../../services/api';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Hooks API pour les données utilisateur en temps réel
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError, 
    refetch 
  } = useGetCurrentUserQuery();
  
  const [updateUser, { isLoading: updateLoading }] = useUpdateCurrentUserMutation();
  
  // État local pour les paramètres (initialisé depuis les données API)
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      email: true,
      sms: false
    },
    privacy: {
      profileVisible: true,
      shareData: false
    }
  });
  
  // Initialiser les paramètres depuis les données utilisateur
  useEffect(() => {
    if (userData) {
      setSettings({
        notifications: {
          push: userData.notifications?.push ?? true,
          email: userData.notifications?.email ?? true,
          sms: userData.notifications?.sms ?? false
        },
        privacy: {
          profileVisible: userData.privacy?.profileVisibility === 'public',
          shareData: userData.privacy?.dataSharing ?? false
        }
      });
    }
  }, [userData]);

  const handleSaveSettings = async () => {
    try {
      // Sauvegarder les paramètres via l'API
      await updateUser({
        notifications: settings.notifications,
        privacy: {
          profileVisibility: settings.privacy.profileVisible ? 'public' : 'private',
          dataSharing: settings.privacy.shareData
        }
      }).unwrap();
      
      await refetch();
      toast.success('✅ Paramètres sauvegardés avec succès !');
    } catch (error: any) {
      console.error('Erreur sauvegarde paramètres:', error);
      toast.error('❌ Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleLogout = () => {
    toast.success('👋 À bientôt !', { duration: 2000 });
    setTimeout(() => {
      logout();
      navigate('/');
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    try {
      // Simuler la suppression du compte (en attendant l'implémentation de l'API)
      // TODO: Implémenter l'endpoint de suppression de compte dans l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('🗑️ Demande de suppression envoyée');
      toast('Votre compte sera supprimé dans les 24h', { icon: 'ℹ️' });
      
      logout();
      navigate('/');
    } catch (error: any) {
      console.error('Erreur suppression compte:', error);
      toast.error('❌ Erreur lors de la suppression du compte');
    }
  };

  // Gestion des états de chargement
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }
  
  if (userError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger vos paramètres</p>
          <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
            </div>
            
            {/* Informations utilisateur */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {userData?.prenom} {userData?.nom}
                </p>
                <p className="text-xs text-gray-500">{userData?.email}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={updateLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Notifications push</h4>
                  <p className="text-sm text-gray-600">Recevoir des notifications sur votre appareil</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: !prev.notifications.push }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.push ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Notifications email</h4>
                  <p className="text-sm text-gray-600">Recevoir des emails de notification</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: !prev.notifications.email }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Confidentialité */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Confidentialité</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Profil visible</h4>
                  <p className="text-sm text-gray-600">Permettre aux autres de voir votre profil</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, profileVisible: !prev.privacy.profileVisible }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.privacy.profileVisible ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.privacy.profileVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Actions du compte */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-purple-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Compte</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="font-medium text-gray-900">Se déconnecter</span>
                </div>
              </button>
              
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer le compte
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Modal de confirmation de suppression */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supprimer le compte</h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="flex-1"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
