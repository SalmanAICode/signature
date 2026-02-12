'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Dashboard from '@/svg/Dashboard';
import User from '@/svg/User';
import Iso from '@/svg/Iso';
import Syndicator from '@/svg/Syndicator';
import Funder from '@/svg/Funder';
import Merchant from '@/svg/Merchant';
import Funding from '@/svg/Funding';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <Dashboard className="w-5 h-5" />, href: '/dashboard' },
  {
    id: 'funder', label: 'Funder', icon: <Funder className="w-5 h-5" />, href: '/funder',
    submenu: [
      { label: 'Lender', href: '/lender' },
      // { label: 'Funder', icon: <Funder className="w-5 h-5" />, href: '/funder' },
      { label: 'User', icon: <User className="w-5 h-5" />, href: '/user' },
    ]
  },

  {
    id: 'funding', label: 'Funding', icon: <Funding className="w-5 h-5" />, href: '/funding',
    submenu: [
      { label: 'Application', href: '/application' },
      { label: 'Application Offer', href: '/application-offer' },
      { label: 'Funding', icon: <Funding className="w-5 h-5" />, href: '/funding' },
      { label: 'Syndication Offer', href: '/syndication-offer' },
      { label: 'Syndication', href: '/syndication' },
    ]
  },


  {
    id: 'iso',
    label: 'ISO',
    icon: <Iso className="w-5 h-5" />,
    href: '/iso',
    submenu: [
      { label: 'ISO', href: '/iso' },
      { label: 'Representative', href: '/representative' },
    ]
  },

  {
    id: 'merchant', label: 'Merchant', icon: <Merchant className="w-5 h-5" />, href: '/merchant',
    submenu: [
      { label: 'Merchant', href: '/merchant' },
      { label: 'Contact', icon: <User className="w-5 h-5" />, href: '/contact' },
    ]
  },
  { id: 'syndicator', label: 'Syndicator', icon: <Syndicator className="w-5 h-5" />, href: '/syndicator' },
  { id: 'document', label: 'Document', icon: <DocumentTextIcon className="w-5 h-5" />, href: '/document' },
];

export default function Subnav() {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const isPathActive = (href: string | undefined, submenu?: any[]) => {
    if (submenu) {
      // Check if current path starts with any submenu item path
      return submenu.some(item => pathname.startsWith(item.href));
    }
    if (!href) return false;
    // For non-submenu items, check if current path starts with the href
    return pathname.startsWith(href) && href !== '/dashboard' ? true : pathname === href;
  };

  return (
    <>
      <div className="w-full h-px bg-gray-200" />
      <div className="w-full bg-[#3A5075] border-b border-[#2B3A55] flex items-center px-8 h-[54px]">
        <div className="flex-1 flex justify-center">
          <div className="flex gap-2">
            {navItems.map(({ id, label, icon, href, submenu }) => {
              const isActive = isPathActive(href, submenu);
              const hasSubmenu = submenu && submenu.length > 0;

              return (
                <div
                  key={id}
                  className="relative"
                  onMouseEnter={() => hasSubmenu && setOpenSubmenu(label)}
                  onMouseLeave={() => hasSubmenu && setOpenSubmenu(null)}
                >
                  {hasSubmenu ? (
                    <div
                      className={`group flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer
                        ${isActive ? 'border-b-4 border-[#14B8A6] font-bold' : 'hover:border-b-4 hover:border-[#14B8A6]'}
                      `}
                      style={{ color: isActive ? '#14B8A6' : '#fff', background: 'transparent' }}
                    >
                      <span className={`transition-colors duration-200 ${isActive ? 'text-[#14B8A6]' : 'group-hover:text-[#14B8A6] text-white'}`}>{icon}</span>
                      <span className={`text-base transition-colors duration-200 ${isActive ? 'text-[#14B8A6]' : 'group-hover:text-[#14B8A6] text-white'}`}>{label}</span>
                      <svg className={`w-4 h-4 ml-1 transition-colors duration-200 ${isActive ? 'text-[#14B8A6]' : 'group-hover:text-[#14B8A6] text-white'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : href ? (
                    <Link
                      href={href}
                      className={`group flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200
                        ${isActive ? 'border-b-4 border-[#14B8A6] font-bold' : 'hover:border-b-4 hover:border-[#14B8A6]'}
                      `}
                      style={{ color: isActive ? '#14B8A6' : '#fff', background: 'transparent' }}
                    >
                      <span className={`transition-colors duration-200 ${isActive ? 'text-[#14B8A6]' : 'group-hover:text-[#14B8A6] text-white'}`}>{icon}</span>
                      <span className={`text-base transition-colors duration-200 ${isActive ? 'text-[#14B8A6]' : 'group-hover:text-[#14B8A6] text-white'}`}>{label}</span>
                    </Link>
                  ) : null}

                  {/* Submenu */}
                  {hasSubmenu && openSubmenu === label && (
                    <div className="absolute top-full left-0 bg-[#3A5075] border border-[#2B3A55] rounded-md shadow-lg z-50 min-w-[180px]">
                      {submenu.map((subItem) => {
                        const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-4 py-2 text-sm transition-colors duration-200 hover:bg-[#2B3A55]
                              ${isSubActive ? 'bg-[#14B8A6] text-white font-medium' : 'text-white hover:text-[#14B8A6]'}
                            `}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
} 