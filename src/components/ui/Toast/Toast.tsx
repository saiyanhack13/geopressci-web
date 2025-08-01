import React from 'react';
import { Snackbar, Alert, AlertProps } from '@mui/material';

interface ToastProps {
  open: boolean;
  onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void;
  message: string;
  severity: 'success' | 'error' | 'info';
  autoHideDuration?: number;
}

const Toast: React.FC<ToastProps> = ({ open, onClose, message, severity, autoHideDuration = 6000 }) => {
  // Appliquer des classes de fond et de texte personnalisées en fonction de la sévérité
  const getSeverityClasses = (severity: 'success' | 'error' | 'info') => {
    switch (severity) {
      case 'success':
        return 'bg-secondary text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-neutral-800 text-white';
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        className={getSeverityClasses(severity)}
        sx={{ width: '100%' }}
        iconMapping={{
          success: <span className="text-white">🎉</span>,
          error: <span className="text-white">🔥</span>,
          info: <span className="text-white">💡</span>,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
