import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import SubmitButton from '../../components/ui/SubmitButton';
import { useForgotPasswordMutation } from '../../features/auth/authSlice';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Adresse email invalide').required('Champ requis'),
});

const ForgotPasswordPage: React.FC = () => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [message, setMessage] = useState('');

  const handleSubmit = async (values: { email: string }) => {
    try {
      await forgotPassword(values).unwrap();
      setMessage('Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.');
    } catch (error) {
      setMessage('Une erreur est survenue. Veuillez réessayer.');
      console.error('Erreur lors de la demande de réinitialisation:', error);
    }
  };

  return (
    <AuthLayout title="Mot de passe oublié">
      <Formik
        initialValues={{ email: '' }}
        validationSchema={ForgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            <p className="text-center text-sm text-gray-600">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
            <FormField
              label="Adresse Email"
              name="email"
              type="email"
            />
            
            {message && <p className="text-center text-sm text-green-600">{message}</p>}

            <SubmitButton isSubmitting={isLoading || isSubmitting} text="Envoyer le lien" />

            <div className="text-sm text-center">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Retour à la connexion
              </Link>
            </div>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
