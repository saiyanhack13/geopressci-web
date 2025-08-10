import React, { useState } from 'react';
import { useField } from 'formik';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: string;
  helpText?: string;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  icon, 
  helpText, 
  required = false,
  ...props 
}) => {
  const [field, meta] = useField(props);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === 'password';
  const hasError = meta.touched && meta.error;
  const hasValue = field.value && field.value.length > 0;

  return (
    <div className="space-y-2">
      <label 
        htmlFor={props.name} 
        className="flex items-center text-sm font-medium text-gray-700"
      >
        {icon && <span className="mr-2">{icon}</span>}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          {...field}
          {...props}
          type={isPassword && showPassword ? 'text' : props.type}
          className={`
            appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm 
            placeholder-gray-400 focus:outline-none transition-all duration-200
            text-base sm:text-sm
            ${
              hasError
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                : hasValue
                ? 'border-green-300 focus:ring-orange-500 focus:border-orange-500 bg-green-50'
                : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white hover:border-gray-400'
            }
          `}
          placeholder={props.placeholder || `Entrez votre ${label.toLowerCase()}`}
        />
        
        {/* Bouton pour afficher/masquer le mot de passe */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <span className="text-lg">
              {showPassword ? '🙈' : '👁️'}
            </span>
          </button>
        )}
        
        {/* Indicateur de validation */}
        {hasValue && !hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-green-500 text-lg">✅</span>
          </div>
        )}
      </div>
      
      {/* Message d'erreur */}
      {hasError && (
        <div className="flex items-center space-x-2 text-red-600">
          <span>⚠️</span>
          <p className="text-sm" id={`${props.name}-error`}>
            {meta.error}
          </p>
        </div>
      )}
      
      {/* Texte d'aide */}
      {helpText && !hasError && (
        <p className="text-xs text-gray-500 flex items-center space-x-1">
          <span>💡</span>
          <span>{helpText}</span>
        </p>
      )}
    </div>
  );
};

export default FormField;
