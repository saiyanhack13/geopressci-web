import React, { useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { SettingsItem, NotificationSettings, PrivacySettings, SecuritySettings, NotificationSetting } from '../types';

interface SettingsItemRendererProps {
  item: SettingsItem;
  sectionId: string;
  handleTopLevelChange: (field: 'language' | 'theme' | 'currency' | 'timezone', value: string) => void;
  handleNestedChange: (
    category: 'notifications' | 'privacy' | 'security',
    field: string,
    value: boolean | string | number
  ) => void;
}

const SettingsItemRenderer: React.FC<SettingsItemRendererProps> = ({ item, sectionId, handleTopLevelChange, handleNestedChange }) => {
  const handleItemChange = useCallback((value: boolean | string | number) => {
    if (sectionId === 'preferences') {
      if (item.id === 'language' || item.id === 'theme' || item.id === 'currency' || item.id === 'timezone') {
        handleTopLevelChange(item.id as 'language' | 'theme' | 'currency' | 'timezone', value as string);
      }
    } else if (sectionId === 'notifications') {
      const field = item.id.replace('-notifications', '').replace('-', '') as keyof NotificationSettings;
      handleNestedChange('notifications', field as string, value as boolean);
    } else if (sectionId === 'privacy') {
      const field = item.id.replace('-', '') as keyof PrivacySettings;
      if (field === 'profileVisibility') {
        handleNestedChange('privacy', 'profileVisibility', value);
      } else {
        handleNestedChange('privacy', field as string, value as boolean | 'public' | 'private');
      }
    } else if (sectionId === 'security') {
      const field = item.id.replace('-', '') as keyof SecuritySettings;
        handleNestedChange('security', field as string, value);
    }
  }, [sectionId, item.id, handleTopLevelChange, handleNestedChange]);

  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = item.options?.find((opt: { value: string | number; label: string }) => opt.value.toString() === e.target.value)?.value;
    if (value !== undefined) {
      handleItemChange(value);
    }
  }, [handleItemChange, item.options]);

  const commonProps = {
    className: `flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${item.danger ? 'border-red-200 dark:border-red-900/30' : ''}`
  };

  const renderSelect = (item: SettingsItem, onChange: (field: 'language' | 'theme' | 'currency' | 'timezone', value: string) => void) => {
    return (
      <div {...commonProps}>
        <div className="flex-1">
          <label htmlFor={item.id} className="font-medium text-gray-900 dark:text-white">{item.label}</label>
          {item.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {item.description}
            </p>
          )}
        </div>
        <select
          id={item.id}
          value={item.value}
          onChange={handleSelectChange}
          disabled={item.disabled}
          className="block w-1/3 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        >
          {item.options?.map((opt: { value: string | number; label: string }) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  };

  switch (item.type) {
    case 'toggle':
      return (
        <div {...commonProps}>
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
            {item.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {item.description}
              </p>
            )}
          </div>
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${item.value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={item.value}
            onClick={() => handleItemChange(!item.value)}
            disabled={item.disabled}
          >
            <span className="sr-only">{item.label}</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.value ? 'translate-x-5' : 'translate-x-0'}`}
            ></span>
          </button>
        </div>
      );
    case 'select':
      return renderSelect(item, handleTopLevelChange);
    case 'action':
    case 'navigation':
      return (
        <button
          type="button"
          onClick={item.action}
          disabled={item.disabled}
          className={`w-full text-left p-3 rounded-lg transition-colors ${item.danger 
            ? 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{item.label}</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          {item.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {item.description}
            </p>
          )}
        </button>
      );
    default:
      return null;
  }
};

export default SettingsItemRenderer;
