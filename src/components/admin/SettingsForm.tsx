import React from 'react';

interface FormFieldProps {
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'checkbox' | 'select';
  value: string | number | boolean;
  onChange: (value: any) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

interface SettingsFormProps {
  title: string;
  icon?: string;
  fields: FormFieldProps[];
  onSave?: () => void;
  loading?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  rows = 3
}) => {
  const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed";

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={baseInputClasses}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">{label}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type={type}
            value={value as string | number}
            onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
          />
        );
    }
  };

  if (type === 'checkbox') {
    return <div className="flex items-center">{renderInput()}</div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  );
};

export const SettingsForm: React.FC<SettingsFormProps> = ({
  title,
  icon,
  fields,
  onSave,
  loading,
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h3>
      </div>
      
      <div className="px-6 py-4">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <FormField key={index} {...field} />
          ))}
        </div>
        
        {onSave && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  💾 Sauvegarder
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsForm;
