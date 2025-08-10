import React from 'react';
import { CircularProgress, CircularProgressProps, Box } from '@mui/material';

interface LoaderProps extends CircularProgressProps {
  fullScreen?: boolean;
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ fullScreen = false, message, ...props }) => {
  const loaderContent = (
    <Box
      className="flex flex-col items-center justify-center gap-4"
      sx={{ color: 'primary.main' }} // Utilise la couleur primaire du thème MUI
    >
      <CircularProgress color="inherit" {...props} />
      {message && <p className="text-primary font-semibold">{message}</p>}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {loaderContent}
      </Box>
    );
  }

  return loaderContent;
};

export default Loader;
