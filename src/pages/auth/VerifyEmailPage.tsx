import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import SubmitButton from '../../components/ui/SubmitButton';
import { useResendVerificationEmailMutation } from '../../features/auth/authSlice';

const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const [resend, { isLoading }] = useResendVerificationEmailMutation();
  const [message, setMessage] = useState('');

  // L'email de l'utilisateur pourrait être passé via l'état de la navigation
  const userEmail = location.state?.email || 'votre adresse email';

  const handleResendEmail = async () => {
    if (userEmail === 'votre adresse email') {
        setMessage('Impossible de déterminer votre adresse e-mail. Veuillez vous reconnecter.');
        return;
    }
    try {
      await resend({ email: userEmail }).unwrap();
      setMessage('Un nouvel e-mail de vérification a été envoyé.');
    } catch (error) {
      setMessage('Une erreur est survenue. Veuillez réessayer.');
      console.error('Erreur lors du renvoi de l\'e-mail:', error);
    }
  };

  return (
    <AuthLayout title="Vérifiez votre adresse e-mail">
      <div className="text-center space-y-6">
        <p className="text-gray-600">
          Un e-mail de vérification a été envoyé à <strong>{userEmail}</strong>.
          Veuillez cliquer sur le lien dans l'e-mail pour activer votre compte.
        </p>

        {message && <p className="text-sm text-green-600">{message}</p>}

        <div>
          <p className="text-sm text-gray-500">Vous n'avez pas reçu l'e-mail ?</p>
          <SubmitButton 
            type="button"
            isSubmitting={isLoading} 
            text="Renvoyer l'e-mail"
            onClick={handleResendEmail}
          />
        </div>

        <div className="text-sm">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
