import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import AddressWithGeolocation from '../../components/ui/AddressWithGeolocation';
import SubmitButton from '../../components/ui/SubmitButton';
import { useRegisterPressingMutation } from '../../features/auth/authSlice';

const RegisterPressingSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, '👤 Le prénom doit contenir au moins 2 caractères')
    .max(50, '👤 Le prénom ne peut pas dépasser 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/, '👤 Le prénom ne peut contenir que des lettres')
    .required('👤 Votre prénom est requis'),
  lastName: Yup.string()
    .min(2, '👤 Le nom doit contenir au moins 2 caractères')
    .max(50, '👤 Le nom ne peut pas dépasser 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/, '👤 Le nom ne peut contenir que des lettres')
    .required('👤 Votre nom est requis'),
  businessName: Yup.string()
    .min(2, '🏢 Le nom du pressing doit contenir au moins 2 caractères')
    .max(100, '🏢 Le nom du pressing ne peut pas dépasser 100 caractères')
    .required('🏢 Le nom du pressing est requis'),
  phone: Yup.string()
    .matches(/^\+225[0-9]{10}$/, '📱 Format: +225XXXXXXXXX (10 chiffres après +225)')
    .required('📱 Votre numéro de téléphone est requis'),
  email: Yup.string()
    .email('📧 Adresse email invalide')
    .required('📧 Votre email est requis'),
  password: Yup.string()
    .min(8, '🔒 Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '🔒 Doit contenir: 1 minuscule, 1 majuscule, 1 chiffre')
    .required('🔒 Votre mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], '🔒 Les mots de passe ne correspondent pas')
    .required('🔒 Veuillez confirmer votre mot de passe'),
  address: Yup.string()
    .min(10, '📍 L\'adresse doit être plus détaillée')
    .required('📍 L\'adresse de votre pressing à Abidjan est requise'),
  coordinates: Yup.object().shape({
    lat: Yup.number(),
    lng: Yup.number(),
    accuracy: Yup.number()
  }).nullable(),
  acceptTerms: Yup.boolean()
    .oneOf([true], '📋 Vous devez accepter les conditions d\'utilisation')
    .required('📋 Acceptation des conditions requise'),
});

interface RegisterPressingFormValues {
  firstName: string;
  lastName: string;
  businessName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
    accuracy: number;
  } | null;
  acceptTerms: boolean;
}

const RegisterPressingPage: React.FC = () => {
  const [registerPressing, { isLoading: isRegistering }] = useRegisterPressingMutation();
  const navigate = useNavigate();
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: RegisterPressingFormValues, { setFieldError }: any) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      setNetworkError(null);

      // Payload simplifié conforme au contrôleur backend
      const payload = {
        // Champs de base attendus par le contrôleur
        prenom: values.firstName,
        nom: values.lastName,
        email: values.email,
        telephone: values.phone,
        password: values.password,
        
        // Champs spécifiques pressing attendus par le contrôleur
        nomCommerce: values.businessName,
        adresse: values.address,  // String simple comme attendu
        ville: 'Abidjan',
        codePostal: '00225',
        
        // Services avec noms français
        services: [
          {
            nom: "Lavage standard",
            description: "Lavage classique de vêtements",
            prix: 1000,
            category: "lavage",
            duration: 60,
            isAvailable: true
          },
          {
            nom: "Repassage",
            description: "Repassage professionnel",
            prix: 500,
            category: "repassage",
            duration: 30,
            isAvailable: true
          }
        ]
      };

      const result = await registerPressing(payload).unwrap();
      
      console.log('✅ Inscription pressing réussie, résultat:', result);
      
      // Toast de succès
      toast.success('🎉 Inscription réussie ! Bienvenue sur Geopressci', {
        duration: 4000,
        position: 'top-center',
      });
      
      // Redirection vers le dashboard pressing après inscription réussie
      navigate('/pressing/dashboard', { replace: true });
      
    } catch (error: any) {
      console.error('Erreur d\'inscription pressing:', error);
      
      // Gestion des erreurs spécifiques
      if (error?.status === 400) {
        if (error?.data?.field === 'email') {
          setFieldError('email', '📧 Cette adresse email est déjà utilisée');
          toast.error('📧 Email déjà utilisé');
        } else if (error?.data?.details) {
          const details = error.data.details;
          Object.keys(details).forEach(field => {
            const frontendField = {
              'nom': 'lastName',
              'prenom': 'firstName',
              'nomCommerce': 'businessName', 
              'telephone': 'phone',
              'email': 'email',
              'password': 'password',
              'adresse': 'address'
            }[field] || field;
            
            setFieldError(frontendField, details[field]);
          });
          toast.error('⚠️ Veuillez corriger les erreurs dans le formulaire');
        } else {
          toast.error(error?.data?.message || '⚠️ Erreur de validation');
        }
      } else if (error?.status === 409) {
        setFieldError('email', '📧 Cette adresse email est déjà utilisée');
        toast.error('📧 Email déjà utilisé');
      } else if (error?.name === 'NetworkError' || !navigator.onLine) {
        setNetworkError('🌐 Problème de connexion internet. Vérifiez votre réseau.');
        toast.error('🌐 Pas de connexion internet');
      } else {
        setNetworkError('⚠️ Erreur d\'inscription. Réessayez dans quelques instants.');
        toast.error('⚠️ Erreur d\'inscription');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout 
      title="Inscription Pressing" 
      subtitle="🏢 Rejoignez Geopressci et développez votre activité"
    >
      <Formik
        initialValues={{
          firstName: '', 
          lastName: '', 
          businessName: '', 
          address: '', 
          phone: '', 
          email: '', 
          password: '',
          confirmPassword: '',
          coordinates: null,
          acceptTerms: false
        }}
        validationSchema={RegisterPressingSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, handleChange, handleBlur }) => (
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

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <span>👤</span>
                <span>Informations personnelles</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Prénom"
                  name="firstName"
                  type="text"
                  icon="👤"
                  placeholder="Votre prénom"
                  autoComplete="given-name"
                  required
                />
                <FormField
                  label="Nom"
                  name="lastName"
                  type="text"
                  icon="👤"
                  placeholder="Votre nom"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            {/* Informations du pressing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <span>🏢</span>
                <span>Informations du pressing</span>
              </h3>
              
              <FormField
                label="Nom du Pressing"
                name="businessName"
                type="text"
                icon="🏢"
                placeholder="Nom de votre pressing"
                helpText="Le nom qui apparaîtra sur l'application"
                required
              />
              
              <AddressWithGeolocation 
                label="Adresse du Pressing" 
                name="address"
                coordinatesFieldName="coordinates"
                showCoordinates={true}
                helpText="📍 Utilisez 'Ma position' depuis votre local pour une localisation précise"
                required
              />
            </div>

            {/* Informations de contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <span>📞</span>
                <span>Contact et sécurité</span>
              </h3>
              
              <FormField
                label="Numéro de Téléphone"
                name="phone"
                type="tel"
                icon="📱"
                placeholder="+225XXXXXXXXX"
                autoComplete="tel"
                helpText="Format ivoirien avec +225"
                required
              />
              
              <FormField
                label="Adresse Email"
                name="email"
                type="email"
                icon="📧"
                placeholder="contact@monpressing.com"
                autoComplete="email"
                helpText="Email de contact pour votre pressing"
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Mot de passe"
                  name="password"
                  type="password"
                  icon="🔒"
                  placeholder="Mot de passe sécurisé"
                  autoComplete="new-password"
                  helpText="Au moins 8 caractères avec majuscule, minuscule et chiffre"
                  required
                />
                <FormField
                  label="Confirmer le mot de passe"
                  name="confirmPassword"
                  type="password"
                  icon="🔒"
                  placeholder="Confirmer le mot de passe"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Conditions d'utilisation */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  checked={values.acceptTerms}
                />
                <div className="text-sm">
                  <p className="text-gray-700">
                    J'accepte les{' '}
                    <Link to="/terms" className="text-orange-600 hover:text-orange-500 underline">
                      conditions d'utilisation
                    </Link>
                    {' '}et la{' '}
                    <Link to="/privacy" className="text-orange-600 hover:text-orange-500 underline">
                      politique de confidentialité
                    </Link>
                    {' '}de Geopressci.
                  </p>
                  <p className="text-gray-500 mt-1">
                    📋 Requis pour créer votre compte pressing
                  </p>
                </div>
              </label>
            </div>
            
            <SubmitButton 
              isSubmitting={isRegistering || isSubmitting} 
              text="Créer mon compte pressing" 
              loadingText="Création en cours..."
              icon="🚀"
            />

            {/* Liens de navigation */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Déjà un compte ?
                </p>
                <Link 
                  to="/login" 
                  className="inline-flex items-center space-x-1 text-sm font-medium text-orange-600 hover:text-orange-500"
                >
                  <span>🔑</span>
                  <span>Se connecter</span>
                </Link>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Vous êtes un client ?
                </p>
                <Link 
                  to="/register-client" 
                  className="inline-flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  <span>👤</span>
                  <span>Inscription Client</span>
                </Link>
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

export default RegisterPressingPage;
