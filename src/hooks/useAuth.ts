import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/types';
import { User } from '../types';
import { useState, useEffect } from 'react';
import { logout as logoutAction, syncFromLocalStorage } from '../features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si nous avons un token et un utilisateur dans le state Redux
    // ou dans localStorage au démarrage
    const storedToken = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    console.log('🔍 useAuth - État actuel:', {
      reduxUser: !!user,
      reduxToken: !!token,
      localStorageToken: !!storedToken,
      localStorageUser: !!storedUserData,
      userRole: user?.role,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
      localTokenPreview: storedToken ? `${storedToken.substring(0, 20)}...` : 'null'
    });
    
    // Si localStorage a des données mais pas Redux, forcer la synchronisation
    if (!user && !token && storedToken && storedUserData && storedUserData !== 'undefined') {
      console.log('🔄 Synchronisation forcée depuis localStorage...');
      dispatch(syncFromLocalStorage());
    }
    
    setLoading(false);
  }, [user, token, dispatch]);

  const logout = async () => {
    try {
      console.log('🚪 Déconnexion de l\'utilisateur...');
      // Nettoyer l'état local directement (pas d'appel API pour le moment)
      dispatch(logoutAction());
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Forcer le nettoyage même en cas d'erreur
      dispatch(logoutAction());
    }
  };

  // Créer un nom d'affichage à partir de nom et prenom
  const displayName = user ? `${user.prenom} ${user.nom}` : null;

  return {
    user: user ? { ...user, name: displayName } : null, // Ajouter la propriété name pour compatibilité
    isAuthenticated: !!user && (!!token || !!user?.role), // Authentifié si user ET (token OU rôle valide)
    loading,
    token,
    logout
  };
};
