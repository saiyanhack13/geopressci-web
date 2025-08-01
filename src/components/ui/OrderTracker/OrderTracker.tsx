import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import HomeIcon from '@mui/icons-material/Home';

const steps = [
  { name: 'Commande passée', icon: <CheckCircleIcon /> },
  { name: 'Collecte', icon: <LocalShippingIcon /> },
  { name: 'Lavage', icon: <LocalLaundryServiceIcon /> },
  { name: 'Prêt', icon: <CheckroomIcon /> },
  { name: 'Livré', icon: <HomeIcon /> },
];

interface OrderTrackerProps {
  currentStep: number; // Index de l'étape actuelle (commence à 0)
  className?: string;
}

const OrderTracker: React.FC<OrderTrackerProps> = ({ currentStep, className }) => {
  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <React.Fragment key={step.name}>
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isCompleted ? 'bg-secondary text-white' : isActive ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'
                }`}>
                {React.cloneElement(step.icon, { style: { fontSize: 24 } })}
              </div>
              <p className={`mt-2 text-xs font-semibold ${
                isCompleted || isActive ? 'text-neutral-800' : 'text-neutral-500'
              }`}>
                {step.name}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${
                isCompleted ? 'bg-secondary' : 'bg-neutral-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OrderTracker;
