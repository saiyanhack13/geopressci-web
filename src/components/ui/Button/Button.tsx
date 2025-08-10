import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

// Définir les variantes personnalisées que nous voulons supporter
type ButtonVariant = 'primary' | 'secondary' | 'mobile-money';

// Étendre les props du bouton MUI pour inclure notre variante personnalisée
interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
  // Mapper nos variantes personnalisées aux classes Tailwind CSS
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white hover:bg-orange-600';
      case 'secondary':
        return 'bg-secondary text-white hover:bg-green-700';
      case 'mobile-money':
        return 'bg-accent text-neutral-900 hover:bg-yellow-500';
      default:
        return 'bg-primary text-white hover:bg-orange-600';
    }
  };

  return (
    <MuiButton
      className={`font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
