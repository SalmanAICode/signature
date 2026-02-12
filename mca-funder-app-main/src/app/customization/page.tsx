'use client';

import Link from 'next/link';
import useAuthStore from '@/lib/store/auth';
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  BanknotesIcon,
  ChevronRightIcon,
  LockClosedIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import MathOperators from '@/svg/MathOperators';

const customizationModules = [
  {
    name: 'Formula',
    href: '/customization/formula',
    description: 'Manage calculation formulas and fee structures',
    icon: MathOperators,
    color: 'bg-blue-500'
  },
  {
    name: 'Fee Type',
    href: '/customization/fee-type',
    description: 'Configure different types of fees and charges',
    icon: CurrencyDollarIcon,
    color: 'bg-green-500'
  },
  {
    name: 'Expense Type',
    href: '/customization/expense-type',
    description: 'Define and manage expense categories and types',
    icon: CreditCardIcon,
    color: 'bg-red-500'
  },
  {
    name: 'Stipulation Type',
    href: '/customization/stipulation-type',
    description: 'Define and manage stipulation requirements',
    icon: DocumentTextIcon,
    color: 'bg-purple-500'
  },
  {
    name: 'Application Status',
    href: '/customization/application-status',
    description: 'Configure application workflow statuses',
    icon: CheckCircleIcon,
    color: 'bg-orange-500'
  },
  {
    name: 'Funding Status',
    href: '/customization/funding-status',
    description: 'Manage funding lifecycle and status tracking',
    icon: BanknotesIcon,
    color: 'bg-cyan-500'
  }
];

export default function CustomizationPage() {
  const { funder } = useAuthStore();

  return (
    <div className="h-full">
      <div className="bg-theme-background rounded-lg shadow-theme-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-theme-foreground mb-2">Customization Settings</h1>
            <p className="text-theme-muted">
              {funder 
                ? `Welcome to the customization settings page for ${funder.name}!`
                : 'You need to have a funder assigned to access customization settings.'
              }
            </p>
          </div>
          {funder && (
            <div className="text-sm text-theme-muted">
              Current funder: <span className="font-medium text-theme-foreground">{funder.name}</span>
            </div>
          )}
        </div>

        {funder ? (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {customizationModules.map((module) => {
                const IconComponent = module.icon;
                return (
                  <Link
                    key={module.name}
                    href={module.href}
                    className="group relative bg-theme-secondary border border-theme-border rounded-lg hover:shadow-theme-lg transition-all duration-200 hover:border-theme-accent hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${module.color} text-white mr-4`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-theme-foreground group-hover:text-theme-primary transition-colors">
                              {module.name}
                            </h3>
                          </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-theme-muted group-hover:text-theme-primary transition-colors" />
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-theme-muted leading-relaxed">
                          {module.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-theme-border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-theme-muted">Click to configure</span>
                          <span className="inline-flex items-center text-theme-primary group-hover:text-theme-primary font-medium">
                            Manage Settings
                            <ChevronRightIcon className="ml-1 w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            {/* Show disabled cards when no funder is assigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              {customizationModules.map((module) => {
                const IconComponent = module.icon;
                return (
                  <div
                    key={module.name}
                    className="relative bg-theme-secondary border border-theme-border rounded-lg opacity-60 cursor-not-allowed"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-theme-muted text-white mr-4`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-theme-muted">
                              {module.name}
                            </h3>
                          </div>
                        </div>
                        <LockClosedIcon className="w-5 h-5 text-theme-muted" />
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-theme-muted leading-relaxed">
                          {module.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-theme-border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-theme-muted">Assign funder to enable</span>
                          <span className="inline-flex items-center text-theme-muted font-medium">
                            Disabled
                            <ChevronRightIcon className="ml-1 w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Overlay to indicate disabled state */}
                    <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg">
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Funder assignment prompt */}
            <div className="text-center py-12 bg-theme-accent rounded-lg border border-theme-border">
              <div className="mx-auto w-16 h-16 bg-theme-secondary rounded-full flex items-center justify-center mb-4">
                <LockClosedIcon className="w-8 h-8 text-theme-primary" />
              </div>
              <h3 className="text-lg font-medium text-theme-foreground mb-2">Funder Assignment Required</h3>
              <p className="text-theme-muted mb-4">
                You need to have a funder assigned to your account to access customization features.
              </p>
              <div className="text-sm text-theme-primary font-medium">
                Contact your administrator to assign a funder to your account
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
