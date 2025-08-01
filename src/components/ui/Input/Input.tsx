import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

// Étendre les props de TextField pour inclure les propriétés personnalisées
interface InputProps extends Omit<TextFieldProps, 'variant' | 'fullWidth'> {
  // Ajouter des propriétés personnalisées ici si nécessaire
}

const Input: React.FC<InputProps> = (props) => {
  const { className, error, helperText, ...rest } = props;
  // Classes de base pour le champ de saisie
  const baseInputStyle = 'w-full bg-neutral-100 rounded-md p-3';

  // Classes pour le style du contour en fonction de l'état
  const borderStyle = error
    ? 'border-2 border-red-500' // Erreur : bordure rouge
    : 'border border-neutral-300 hover:border-primary focus-within:border-2 focus-within:border-primary'; // Normal, hover et focus

  return (
    <TextField
      variant="outlined"
      className={`${baseInputStyle} ${borderStyle} ${className || ''}`}
      error={error}
      helperText={helperText}
      fullWidth
      // Appliquer les styles aux éléments internes du TextField
      InputProps={{
        classes: {
          root: 'h-full',
          notchedOutline: 'border-none', // On désactive la bordure par défaut de MUI pour utiliser la nôtre
        },
      }}
      InputLabelProps={{
        classes: {
          root: 'text-neutral-500',
          focused: '!text-primary', // Style du label au focus
        },
      }}
      {...rest}
    />
  );
};

export default Input;
