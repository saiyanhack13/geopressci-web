import React from 'react';
import { Modal as MuiModal, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer, className }) => {
  return (
    <MuiModal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      className="flex items-center justify-center"
    >
      <Box className={`bg-white rounded-lg shadow-xl max-w-md w-full m-4 ${className}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <h2 id="modal-title" className="text-xl font-bold text-neutral-800">{title}</h2>
          <IconButton onClick={onClose} aria-label="Fermer la modale">
            <CloseIcon />
          </IconButton>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end p-4 bg-neutral-100 rounded-b-lg">
            {footer}
          </div>
        )}
      </Box>
    </MuiModal>
  );
};

export default Modal;
