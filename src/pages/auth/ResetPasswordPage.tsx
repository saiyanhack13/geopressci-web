import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import SubmitButton from '../../components/ui/SubmitButton';
import { useResetPasswordMutation } from '../../features/auth/authSlice';

const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string().min(8, '8 caractères minimum').required('Mot de passe requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), undefined], 'Les mots de passe doivent correspondre')
    .required('Veuillez confirmer le mot de passe'),
});

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (values: any) => {
    if (!token) {
      setError('Token de réinitialisation manquant ou invalide.');
      return;
    }
    try {
      await resetPassword({ token, password: values.password }).unwrap();
      setMessage('Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError('Ce lien est peut-être expiré ou invalide. Veuillez réessayer.');
      console.error('Erreur de réinitialisation:', err);
    }
  };

  return (
    <AuthLayout title="Réinitialiser le mot de passe">
      <Formik
        initialValues={{ password: '', confirmPassword: '' }}
        validationSchema={ResetPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            <FormField label="Nouveau mot de passe" name="password" type="password" />
            <FormField label="Confirmer le nouveau mot de passe" name="confirmPassword" type="password" />

            {message && <p className="text-center text-sm text-green-600">{message}</p>}
            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <SubmitButton isSubmitting={isLoading || isSubmitting} text="Réinitialiser" />
            
            {message && (
                <div className="text-sm text-center">
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Aller à la page de connexion
                    </Link>
                </div>
            )}
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
