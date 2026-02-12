'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/lib/store/auth';
import { 
  LockClosedIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CheckCircleIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import MathOperators from '@/svg/MathOperators';

const navItems = [
  { label: 'Formula', href: '/customization/formula', icon: MathOperators },
  { label: 'Fee Type', href: '/customization/fee-type', icon: CurrencyDollarIcon },
  { label: 'Expense Type', href: '/customization/expense-type', icon: CreditCardIcon },
  { label: 'Stipulation Type', href: '/customization/stipulation-type', icon: DocumentTextIcon },
  { label: 'Application Status', href: '/customization/application-status', icon: CheckCircleIcon },
  { label: 'Funding Status', href: '/customization/funding-status', icon: BanknotesIcon },
];

export default function Subnav() {
  const pathname = usePathname();
  const { funder } = useAuthStore();

  return (
    <>
      <div className="w-full h-px bg-gray-200" />
      <div className="w-full bg-[#3A5075] border-b border-[#2B3A55] flex items-center px-8 h-[54px]">
        <div className="flex-1 flex justify-center">
          <div className="flex gap-2 items-center">
            {/* Navigation Items */}
            {navItems.map(({ label, href, icon }) => {
              const isActive = pathname === href;
              const isDisabled = !funder;
              const IconComponent = icon;
              
              return (
                <div key={href} className="relative">
                  {isDisabled ? (
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-md cursor-not-allowed opacity-50"
                      title="Funder assignment required"
                    >
                      <IconComponent className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                      <span className="text-base text-gray-400 dark:text-slate-500">{label}</span>
                      <LockClosedIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    </div>
                  ) : (
                    <Link
                      href={href}
                      className={`group flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200
                        ${isActive ? 'border-b-4 border-[#14B8A6] font-bold' : 'hover:border-b-4 hover:border-[#14B8A6]'}
                      `}
                      style={{ color: isActive ? '#14B8A6' : '#fff', background: 'transparent' }}
                    >
                      <IconComponent className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-[#14B8A6]' : 'group-hover:text-[#14B8A6] text-white'}`} />
                      <span className={`text-base transition-colors duration-200 ${isActive ? 'text-[#14B8A6]' : 'group-hover:text-[#14B8A6] text-white dark:text-slate-100'}`}>{label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
            
            {/* Funder assignment indicator */}
            {!funder && (
              <div className="ml-4 px-3 py-1 bg-yellow-500 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 text-xs font-medium rounded-full">
                Funder Assignment Required
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 