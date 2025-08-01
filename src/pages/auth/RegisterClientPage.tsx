import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import SubmitButton from '../../components/ui/SubmitButton';
import { useRegisterMutation } from '../../features/auth/authSlice';
import AddressWithGeolocation from '../../components/ui/AddressWithGeolocation';

// Validation avec critères ivoiriens
const RegisterClientSchema = Yup.object().shape({
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
    .required('📍 Votre adresse à Abidjan est requise'),
  acceptTerms: Yup.boolean()
    .oneOf([true], '📋 Vous devez accepter les conditions d\'utilisation')
    .required('📋 Acceptation des conditions requise'),
});

interface RegisterClientFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  acceptTerms: boolean;
}

const RegisterClientPage: React.FC = () => {
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const navigate = useNavigate();
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // Étapes: 1=Infos personnelles, 2=Compte, 3=Adresse
  const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (values: RegisterClientFormValues, { setFieldError }: any) => {
    // S'assurer que nous sommes à la dernière étape avant de soumettre
    if (step !== 3) return;

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      setNetworkError(null);

      // Mapping des champs du frontend (anglais) vers le backend (français)
      const payload = {
        prenom: values.firstName,
        nom: values.lastName,
        email: values.email,
        telephone: values.phone,
        password: values.password,
        adresse: values.address,
      };
      
      console.log('📤 Payload envoyé au backend:', payload);
      console.log('📋 Valeurs du formulaire:', values);

      const result = await register(payload).unwrap();
      
      console.log('✅ Inscription réussie, résultat complet:', result);
      console.log('🔑 Token reçu:', result.token ? 'Oui' : 'Non');
      console.log('👤 Données utilisateur reçues:', result.data ? 'Oui' : 'Non');
      
      // Vérifier que nous avons bien reçu les données nécessaires
      if (!result.token || !result.data) {
        console.error('❌ Données manquantes dans la réponse:', { token: !!result.token, data: !!result.data });
        toast.error('⚠️ Erreur lors de l\'inscription - données manquantes');
        return;
      }
      
      // Toast de succès
      toast.success('🎉 Inscription réussie ! Bienvenue sur Geopressci', {
        duration: 4000,
        position: 'top-center',
      });
      
      console.log('🚀 Redirection vers /client/dashboard...');
      
      // Redirection vers le dashboard client après inscription réussie
      // L'utilisateur est maintenant connecté automatiquement
      navigate('/client/dashboard', { replace: true });
      
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      
      // Gestion des erreurs spécifiques
      if (error?.status === 400) {
        // Erreur de validation ou email déjà utilisé
        if (error?.data?.field === 'email') {
          setFieldError('email', '📧 Cette adresse email est déjà utilisée');
          toast.error('📧 Email déjà utilisé');
        } else if (error?.data?.details) {
          // Erreurs de validation détaillées
          const details = error.data.details;
          Object.keys(details).forEach(field => {
            const frontendField = {
              'nom': 'lastName',
              'prenom': 'firstName', 
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

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Vos informations';
      case 2: return 'Votre compte';
      case 3: return 'Votre adresse';
      default: return 'Inscription';
    }
  };

  return (
    <AuthLayout 
      title="Inscription Client" 
      subtitle="🇨🇮 Créez votre compte pour utiliser Geopressci"
    >
      <Formik
        initialValues={{ 
          firstName: '', 
          lastName: '', 
          phone: '+225',
          email: '', 
          password: '', 
          confirmPassword: '', 
          address: '',
          acceptTerms: false
        }}
        validationSchema={RegisterClientSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched, values, setFieldValue, handleChange, handleBlur }) => {
          const isStep1Valid = !errors.firstName && !errors.lastName && !errors.phone;
          const isStep2Valid = !errors.email && !errors.password && !errors.confirmPassword;
          
          return (
            <Form className="space-y-6">
              {/* Indicateur de progression */}
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${step >= stepNumber 
                        ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}>
                      {step > stepNumber ? '✅' : stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`w-12 h-1 mx-2 ${
                        step > stepNumber ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-center text-gray-800 mb-4">
                {getStepTitle()}
              </h3>

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

              {/* Étape 1: Informations personnelles */}
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    label="Prénom"
                    name="firstName"
                    type="text"
                    icon="👤"
                    placeholder="Ex: Kouassi"
                    helpText="Votre prénom tel qu'il apparaît sur vos documents"
                    required
                  />
                  
                  <FormField
                    label="Nom de famille"
                    name="lastName"
                    type="text"
                    icon="👤"
                    placeholder="Ex: Yao"
                    helpText="Votre nom de famille"
                    required
                  />
                  
                  <FormField
                    label="Numéro de téléphone"
                    name="phone"
                    type="tel"
                    icon="📱"
                    placeholder="+225XXXXXXXX"
                    helpText="Format ivoirien: +225 suivi de 10 chiffres"
                    required
                  />
                  
                  <SubmitButton
                    type="button"
                    onClick={() => setStep(2)}
                    isSubmitting={false}
                    disabled={!isStep1Valid}
                    text="Continuer"
                    icon="➡️"
                    variant={isStep1Valid ? 'primary' : 'secondary'}
                  />
                </div>
              )}

              {/* Étape 2: Informations de compte */}
              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    label="Adresse Email"
                    name="email"
                    type="email"
                    icon="📧"
                    placeholder="exemple@email.com"
                    helpText="Utilisée pour la connexion et les notifications"
                    required
                  />
                  
                  <FormField
                    label="Mot de passe"
                    name="password"
                    type="password"
                    icon="🔒"
                    helpText="Au moins 8 caractères avec majuscule, minuscule et chiffre"
                    required
                  />
                  
                  <FormField
                    label="Confirmer le mot de passe"
                    name="confirmPassword"
                    type="password"
                    icon="🔒"
                    helpText="Retapez votre mot de passe"
                    required
                  />
                  
                  <div className="flex space-x-3">
                    <SubmitButton
                      type="button"
                      onClick={() => setStep(1)}
                      isSubmitting={false}
                      text="Retour"
                      icon="⬅️"
                      variant="secondary"
                      fullWidth={false}
                    />
                    <SubmitButton
                      type="button"
                      onClick={() => isStep2Valid && setStep(3)}
                      isSubmitting={false}
                      text="Continuer"
                      icon="➡️"
                      variant={isStep2Valid ? 'primary' : 'secondary'}
                      fullWidth={true}
                    />
                  </div>
                </div>
              )}

              {/* Étape 3: Adresse et finalisation */}
              {step === 3 && (
                <div className="space-y-4">
                  <AddressWithGeolocation 
                    label="Votre adresse à Abidjan" 
                    name="address"
                    helpText="Nous livrons dans tous les quartiers d'Abidjan"
                    required
                  />
                  
                  {/* Acceptation des conditions */}
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
                          📋 Requis pour créer votre compte
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex space-x-3">
                    <SubmitButton
                      type="button"
                      onClick={() => setStep(2)}
                      isSubmitting={false}
                      text="Retour"
                      icon="⬅️"
                      variant="secondary"
                      fullWidth={false}
                    />
                    <SubmitButton
                      type="submit" // Le type est "submit" pour déclencher la soumission de Formik
                      isSubmitting={isRegistering || isSubmitting}
                      text="Créer mon compte"
                      loadingText="Création en cours..."
                      icon="🚀"
                      fullWidth={true}
                    />
                  </div>
                </div>
              )}

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
                    Vous êtes un pressing ?
                  </p>
                  <Link 
                    to="/register-pressing" 
                    className="inline-flex items-center space-x-1 text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    <span>🏪</span>
                    <span>Inscription Pressing</span>
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
          );
        }}
      </Formik>
    </AuthLayout>
  );
};

export default RegisterClientPage;
