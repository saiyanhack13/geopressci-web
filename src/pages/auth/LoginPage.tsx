import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import SubmitButton from '../../components/ui/SubmitButton';
import UserTypeSelector from '../../components/ui/UserTypeSelector';
import { useLoginMutation } from '../../features/auth/authSlice';
import { User } from '../../types';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('📧 Adresse email invalide')
    .required('📧 Votre email est requis'),
  password: Yup.string()
    .min(6, '🔒 Le mot de passe doit contenir au moins 6 caractères')
    .required('🔒 Votre mot de passe est requis'),
  userType: Yup.string()
    .oneOf(['client', 'pressing'], 'Veuillez choisir un type de compte')
    .required('👤 Veuillez choisir votre type de compte'),
});

interface LoginFormValues {
  email: string;
  password: string;
  userType: 'client' | 'pressing';
}

const LoginPage: React.FC = () => {
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const [networkError, setNetworkError] = useState<string | null>(null);

  const handleSubmit = async (values: LoginFormValues, { setFieldError }: any) => {
    try {
      setNetworkError(null);
      
      const result = await login(values).unwrap();
      
      // Extract token and user data from response
      const token = result.token || localStorage.getItem('authToken');
      
      // Determine user data location and role
      let userData: User | null = null;
      let userRole: string | null = null;
      
      // Helper function to safely extract user data
      const extractUserData = (data: any): User | null => {
        if (!data || typeof data !== 'object') return null;
        
        // Check if we have all required User properties
        const requiredProps = ['nom', 'prenom', 'email', 'telephone'];
        if (requiredProps.every(prop => prop in data)) {
          return {
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            telephone: data.telephone,
            role: data.role,
            ...(data.address && { address: data.address }),
            ...(data._id && { _id: data._id }),
            ...(data.createdAt && { createdAt: data.createdAt }),
            ...(data.updatedAt && { updatedAt: data.updatedAt })
          };
        }
        return null;
      };
      
      // Try different locations for user data
      if (result.data && 'role' in result.data) {
        userData = extractUserData(result.data);
        userRole = result.data.role as string;
      } else if (result.user && 'role' in result.user) {
        userData = extractUserData(result.user);
        userRole = result.user.role as string;
      } else if (typeof result === 'object' && result !== null && 'role' in result) {
        userData = extractUserData(result);
        userRole = result.role as string;
      }
      
      // Store token and user data in localStorage if we have valid data
      if (token && userData) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
      }
      
      // Toast de succès
      toast.success('🎉 Connexion réussie ! Bienvenue sur Geopressci', {
        duration: 3000,
        position: 'top-center',
      });
      
      // Log the response structure
      console.log('🎯 Rôle utilisateur détecté:', userRole);
      console.log('📋 Réponse complète de connexion:', result);
      console.log('🔍 Structure détaillée:', {
        hasData: !!result.data,
        hasRole: !!userRole,
        dataRole: result.data?.role,
        directRole: userRole
      });
      
      const redirectPath = userRole === 'client' 
        ? '/client/dashboard' 
        : userRole === 'pressing'
        ? '/pressing/dashboard'
        : userRole === 'admin'
        ? '/admin/dashboard'
        : '/'; // Fallback vers l'accueil
      
      console.log('🚀 Redirection vers:', redirectPath);
      
      // Petit délai pour laisser Redux se mettre à jour
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
      
    } catch (error: any) {
      console.error('Failed to login:', error);
      
      // Gestion des erreurs spécifiques
      if (error?.status === 401) {
        setFieldError('password', '🚫 Email ou mot de passe incorrect');
        toast.error('🚫 Identifiants incorrects');
      } else if (error?.status === 403) {
        setFieldError('email', '⛔ Compte suspendu. Contactez le support');
        toast.error('⛔ Compte suspendu');
      } else if (error?.status === 422) {
        setFieldError('userType', '❌ Type de compte incorrect');
      } else if (error?.name === 'NetworkError' || !navigator.onLine) {
        setNetworkError('🌐 Problème de connexion internet. Vérifiez votre réseau.');
        toast.error('🌐 Pas de connexion internet');
      } else {
        setNetworkError('⚠️ Erreur de connexion. Réessayez dans quelques instants.');
        toast.error('⚠️ Erreur de connexion');
      }
    }
  };

  return (
    <AuthLayout 
      title="Connexion" 
      subtitle="🇨🇮 Connectez-vous à votre compte Geopressci"
    >
      <Formik
        initialValues={{ 
          email: '', 
          password: '', 
          userType: 'client' as 'client' | 'pressing'
        }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-6">
            {/* Alerte d'erreur réseau */}
            {networkError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <span>⚠️</span>
                  <p className="text-sm font-medium">{networkError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNetworkError(null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Fermer
                </button>
              </div>
            )}

            {/* Sélecteur de type d'utilisateur */}
            <UserTypeSelector 
              name="userType" 
              label="👤 Je suis un"
            />

            {/* Champs du formulaire */}
            <FormField
              label="Adresse Email"
              name="email"
              type="email"
              icon="📧"
              placeholder="exemple@email.com"
              autoComplete="email"
              helpText="Utilisez l'email de votre inscription"
              required
            />
            
            <FormField
              label="Mot de passe"
              name="password"
              type="password"
              icon="🔒"
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              helpText="Au moins 6 caractères"
              required
            />

            {/* Lien mot de passe oublié */}
            <div className="flex items-center justify-between">
              <Link 
                to="/forgot-password" 
                className="text-sm font-medium text-orange-600 hover:text-orange-500 flex items-center space-x-1"
              >
                <span>🤔</span>
                <span>Mot de passe oublié ?</span>
              </Link>
            </div>

            {/* Bouton de connexion */}
            <SubmitButton 
              isSubmitting={isLoading || isSubmitting} 
              text="Se connecter" 
              loadingText="Connexion en cours..."
              icon="🚀"
            />

            {/* Liens d'inscription */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Ou</span>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Pas encore de compte ?
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link 
                    to="/register-client" 
                    className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>👤</span>
                    <span>Client</span>
                  </Link>
                  <Link 
                    to="/register-pressing" 
                    className="flex-1 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>🏪</span>
                    <span>Pressing</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Indicateur de connexion */}
            {!navigator.onLine && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <div className="flex items-center space-x-2 text-yellow-700">
                  <span>📶</span>
                  <p className="text-xs">Mode hors ligne détecté</p>
                </div>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default LoginPage;
