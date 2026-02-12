'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PlatformCard from './PlatformCard';

const platforms = [
  {
    id: 'orgmeter',
    name: 'OrgMeter',
    description: 'Import your MCA data from OrgMeter platform',
    logo: 'https://app.orgmeter.com/logo.png',
    available: true,
    comingSoon: false,
  },
  {
    id: 'lendsaas',
    name: 'LendSaaS',
    description: 'Import your lending data from LendSaaS platform',
    logo: 'https://www.lendsaas.com/wp-content/uploads/2021/07/EPS-file-01-light-1-e1626985219608.png',
    available: false,
    comingSoon: true,
  },
  {
    id: 'onyxiq',
    name: 'OnyxIQ',
    description: 'Import your loan management data from OnyxIQ',
    logo: 'https://app.onyxiq.com/assets/images/onyx_logo-white.svg',
    available: false,
    comingSoon: true,
  },
];

export default function ImportClient() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    
    if (platformId === 'orgmeter') {
      // Navigate to OrgMeter import flow (to be implemented later)
      router.push(`/import/orgmeter`);
    } else {
      // Show coming soon message for other platforms
      alert('This platform integration is coming soon!');
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <main className="flex flex-col min-h-screen w-full gap-[32px] justify-center items-center p-4 bg-custom-blue">
      <div className="w-full max-w-4xl bg-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center relative shadow-[inset_0px_4px_4px_rgba(0,0,0,0.25)] box-border">
        {/* Back button */}
        <button
          onClick={handleBackToLogin}
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Login
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Import Your Data
          </h1>
                     <p className="text-gray-600 max-w-2xl">
             Choose the platform you want to import your data from. We&apos;ll guide you through 
             the process to seamlessly transfer your existing data to Funder CRM.
           </p>
        </div>

        {/* Platform options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              onSelect={() => handlePlatformSelect(platform.id)}
              isSelected={selectedPlatform === platform.id}
            />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
                     <p className="text-sm text-gray-500">
             Don&apos;t see your platform? <a href="#" className="text-blue-700 hover:underline">Contact us</a> and we&apos;ll help you with a custom import solution.
           </p>
        </div>
      </div>
    </main>
  );
} 