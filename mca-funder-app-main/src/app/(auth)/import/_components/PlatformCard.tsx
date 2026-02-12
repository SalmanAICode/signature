'use client';

import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Platform {
  id: string;
  name: string;
  description: string;
  logo: string;
  available: boolean;
  comingSoon: boolean;
}

interface PlatformCardProps {
  platform: Platform;
  onSelect: () => void;
  isSelected: boolean;
}

export default function PlatformCard({ platform, onSelect, isSelected }: PlatformCardProps) {
  return (
    <div
      className={`
        relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${platform.available 
          ? 'border-gray-300 hover:border-blue-500 bg-white hover:shadow-md' 
          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
        }
        ${isSelected ? 'border-blue-500 shadow-md' : ''}
      `}
      onClick={platform.available ? onSelect : undefined}
    >
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        {platform.available ? (
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
        ) : (
          <ClockIcon className="w-5 h-5 text-yellow-500" />
        )}
      </div>

      {/* Logo */}
      <div className="flex justify-center mb-4">
        <div className={`w-36 h-20 flex items-center justify-center rounded-lg ${
          platform.id === 'onyxiq' ? 'bg-gray-900' : 'bg-transparent'
        }`}>
          <img 
            src={platform.logo} 
            alt={`${platform.name} logo`}
            className="max-w-32 max-h-16 object-contain"
          />
        </div>
      </div>

      {/* Platform info */}
      <div className="text-center">
        <h3 className={`text-lg font-semibold mb-2 ${platform.available ? 'text-gray-800' : 'text-gray-500'}`}>
          {platform.name}
        </h3>
        <p className={`text-sm mb-4 ${platform.available ? 'text-gray-600' : 'text-gray-400'}`}>
          {platform.description}
        </p>

        {/* Status badge */}
        <div className="flex justify-center">
          {platform.available ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Available Now
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Coming Soon
            </span>
          )}
        </div>
      </div>

      {/* Import button */}
      {platform.available && (
        <div className="mt-4">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Start Import
          </button>
        </div>
      )}
    </div>
  );
} 