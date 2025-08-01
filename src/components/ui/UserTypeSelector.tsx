import React from 'react';
import { useField } from 'formik';

interface UserTypeSelectorProps {
  name: string;
  label?: string;
}

const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ 
  name, 
  label = "Je suis un" 
}) => {
  const [field, meta, helpers] = useField(name);

  const userTypes = [
    {
      value: 'client',
      label: 'Client',
      icon: '👤',
      description: 'Je veux faire nettoyer mes vêtements',
      color: 'from-blue-500 to-blue-600'
    },
    {
      value: 'pressing',
      label: 'Pressing',
      icon: '🏪',
      description: 'Je propose des services de pressing',
      color: 'from-orange-500 to-green-500'
    }
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {userTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => helpers.setValue(type.value)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              hover:shadow-lg transform hover:scale-105
              ${
                field.value === type.value
                  ? `border-orange-500 bg-gradient-to-r ${type.color} text-white shadow-lg`
                  : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="text-2xl">{type.icon}</span>
              <span className="font-semibold text-sm">{type.label}</span>
              <span className={`text-xs text-center ${
                field.value === type.value ? 'text-white/90' : 'text-gray-500'
              }`}>
                {type.description}
              </span>
            </div>
            
            {/* Indicateur de sélection */}
            {field.value === type.value && (
              <div className="absolute top-2 right-2">
                <span className="text-white text-lg">✅</span>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {meta.touched && meta.error && (
        <div className="flex items-center space-x-2 text-red-600">
          <span>⚠️</span>
          <p className="text-sm">{meta.error}</p>
        </div>
      )}
    </div>
  );
};

export default UserTypeSelector;
