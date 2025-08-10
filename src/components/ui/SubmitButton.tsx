import React from 'react';

interface SubmitButtonProps {
  isSubmitting: boolean;
  text: string;
  loadingText?: string;
  onClick?: () => void;
  type?: 'submit' | 'button';
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  icon?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ 
  isSubmitting, 
  text, 
  loadingText = 'Chargement...', 
  onClick,
  type = 'submit',
  variant = 'primary',
  icon,
  fullWidth = true,
  size = 'md',
  disabled = false
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white shadow-lg';
      case 'secondary':
        return 'bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50';
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white shadow-lg';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-4 text-sm';
      case 'md':
        return 'py-3 px-6 text-base';
      case 'lg':
        return 'py-4 px-8 text-lg';
      default:
        return 'py-3 px-6 text-base';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isSubmitting || disabled}
      className={`
        ${fullWidth ? 'w-full' : ''}
        flex justify-center items-center space-x-2
        ${getSizeClasses()}
        border-0 rounded-xl font-semibold
        transition-all duration-300 transform
        focus:outline-none focus:ring-4 focus:ring-orange-200
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
        hover:scale-105 active:scale-95
        ${getVariantClasses()}
        ${isSubmitting ? 'animate-pulse' : ''}
      `}
    >
      {isSubmitting ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="text-lg">{icon}</span>}
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

export default SubmitButton;
