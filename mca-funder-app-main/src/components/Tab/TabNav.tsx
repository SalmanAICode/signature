import React from 'react';

export interface TabOption {
  label: string;
  value: string;
}

interface TabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ options, value, onChange, className }) => {
  return (
    <div className={`flex border-b border-gray-200 ${className || ''}`}>
      {options.map((tab) => (
        <button
          key={tab.value}
          className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150
            ${value === tab.value
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300 bg-gray-50'}
          `}
          onClick={() => onChange(tab.value)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs; 