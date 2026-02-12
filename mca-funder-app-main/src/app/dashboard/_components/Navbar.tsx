'use client';

import { useState, useRef, useEffect } from 'react';
import useAuthStore from '@/lib/store/auth';
import { useRouter } from 'next/navigation';
import { logoutFunder } from '@/lib/api/auth';
import { getApplications } from '@/lib/api/applications';
import { getApplicationOffers } from '@/lib/api/applicationOffers';
import { getFundings } from '@/lib/api/fundings';
import { getFunders } from '@/lib/api/funders';
import { getMerchants } from '@/lib/api/merchants';
import { getISOs } from '@/lib/api/isos';
import { getSyndicators } from '@/lib/api/syndicators';
import { getUsers } from '@/lib/api/users';
import { getContacts } from '@/lib/api/contacts';
import { getRepresentatives } from '@/lib/api/representatives';
import AvatarUser from '@/svg/AvatarUser';
import Profile from '@/svg/Profile';
import Logout from '@/svg/Logout';
import Customization from '@/svg/Customization';
import Dashboard from '@/svg/Dashboard';
import Link from 'next/link';
import CollapseTransition from '@/components/CollapseTransition';
import { Search, Loader2, Phone, Globe } from 'lucide-react';
import { FunderSelectionModal } from '@/components/FunderSelection';
import Funder from '@/svg/Funder';
import { toast } from 'react-hot-toast';

// Define types for search results
interface SearchResult {
  id: string;
  name: string;
  type: string;
  link: string;
}

// Define search type configuration
const searchTypeConfig = {
  'Application': {
    api: getApplications,
    nameField: 'name',
    linkPrefix: '/application'
  },
  'Application Offer': {
    api: getApplicationOffers,
    nameField: 'application.name',
    linkPrefix: '/application-offer'
  },
  'Funding': {
    api: getFundings,
    nameField: 'name',
    linkPrefix: '/funding',
    dataPath: 'data.docs'
  },
  'Funder': {
    api: getFunders,
    nameField: 'name',
    linkPrefix: '/funder'
  },
  'Merchant': {
    api: getMerchants,
    nameField: 'name',
    linkPrefix: '/merchant'
  },
  'ISO': {
    api: getISOs,
    nameField: 'name',
    linkPrefix: '/iso'
  },
  'Syndicator': {
    api: getSyndicators,
    nameField: 'name',
    linkPrefix: '/syndicator'
  },
  'User': {
    api: getUsers,
    nameField: ['first_name', 'last_name'],
    linkPrefix: '/user'
  },
  'Contact': {
    api: getContacts,
    nameField: ['first_name', 'last_name'],
    linkPrefix: '/contact'
  },
  'Representative': {
    api: getRepresentatives,
    nameField: ['first_name', 'last_name'],
    linkPrefix: '/representative'
  }
} as const;

// Helper function to get name from item
const getNameFromItem = (item: any, nameField: string | string[]) => {
  if (Array.isArray(nameField)) {
    return `${item[nameField[0]]} ${item[nameField[1]]}`;
  }
  return nameField.split('.').reduce((obj, key) => obj?.[key], item);
};

// Helper function to get data from response
const getDataFromResponse = (response: any, dataPath?: string) => {
  if (dataPath) {
    return dataPath.split('.').reduce((obj, key) => obj?.[key], response);
  }
  return response.data;
};

export default function Navbar() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFunderDropdownOpen, setIsFunderDropdownOpen] = useState(false);
  const [isFunderModalOpen, setIsFunderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const user = useAuthStore((state) => state.user);
  const funder = useAuthStore((state) => state.funder);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const funderDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchTypes = [
    'All',
    'Application',
    'Application Offer',
    'Funding',
    'Funder',
    'Merchant',
    'ISO',
    'Syndicator',
    'User',
    'Contact',
    'Representative'
  ];

  // Listen for custom event to open funder selection modal
  useEffect(() => {
    const handleOpenFunderSelection = () => {
      setIsFunderModalOpen(true);
    };

    window.addEventListener('openFunderSelection', handleOpenFunderSelection);
    return () => {
      window.removeEventListener('openFunderSelection', handleOpenFunderSelection);
    };
  }, []);

  // Effect to handle search when either type or query changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        let results: SearchResult[] = [];
        
        if (selectedType === 'All') {
          // Search across all types
          const searchPromises = Object.entries(searchTypeConfig).map(([type, config]) => 
            config.api({ search: searchQuery, page: 1, limit: 5 })
              .then(response => {
                const items = getDataFromResponse(response, config.dataPath);
                return items.map((item: any) => ({
                  id: item._id,
                  name: getNameFromItem(item, config.nameField),
                  type,
                  link: `${config.linkPrefix}/${item._id}`
                }));
              })
          );

          const allResults = await Promise.all(searchPromises);
          results = allResults.flat();
        } else {
          // Search in specific type
          const config = searchTypeConfig[selectedType as keyof typeof searchTypeConfig];
          if (config) {
            const response = await config.api({ search: searchQuery, page: 1, limit: 10 });
            const items = getDataFromResponse(response, config.dataPath);
            results = items.map((item: any) => ({
              id: item._id,
              name: getNameFromItem(item, config.nameField),
              type: selectedType,
              link: `${config.linkPrefix}/${item._id}`
            }));
          }
        }

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [selectedType, searchQuery]);

  // Handle search input changes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isFunderDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (funderDropdownRef.current && !funderDropdownRef.current.contains(event.target as Node)) {
        setIsFunderDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFunderDropdownOpen]);

  const handleLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await logoutFunder();
      if (response?.success) {
        localStorage.removeItem('logout-pending');
      } else {
        console.warn('Logout failed, but proceeding to login.');
        localStorage.setItem('logout-pending', 'true');
      }

    } catch (error) {
      // console.error('Logout error:', error);
      localStorage.setItem('logout-pending', 'true');
    } finally {
      clearAuth();
      setIsDropdownOpen(false);
      setIsLoading(false);
      router.push('/login');
    }
  };

  // Check if user is funder_manager
  const isFunderManager = user?.type === 'funder_manager';

  const menuItems = [
    {
      type: 'link',
      href: '/dashboard',
      label: 'Dashboard',
      icon: <Dashboard className="w-5 h-5" />
    },
    // Only show Customization for funder_manager users
    ...(isFunderManager ? [{
      type: 'link',
      href: '/customization',
      label: 'Customization',
      icon: <Customization className="w-5 h-5" />
    }] : []),
    {
      type: 'link',
      href: '/profile',
      label: 'Profile',
      icon: <Profile className="w-5 h-5" />
    },
    {
      type: 'button',
      label: isLoading ? 'Logging out...' : 'Logout',
      onClick: handleLogout,
      disabled: isLoading,
      icon: <Logout className="w-5 h-5" />
    }
  ];

  return (
    <>
      <nav className="w-full bg-[#3A5075] h-[60px] flex items-center px-8 shadow-md">
        {/* Funder Information */}
        <div className="flex items-center mr-8">
          <div className="relative" ref={funderDropdownRef}>
            <button
              onClick={() => setIsFunderDropdownOpen(!isFunderDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#4B628A] focus:outline-none"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <div 
                  className="w-10 h-10 flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: funder?.bgcolor || '#4B628A' }}
                >
                  <span className="text-white font-bold text-lg">
                    {funder?.name?.charAt(0)?.toUpperCase() || 'F'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start ml-2">
                <span className="text-white text-sm font-medium">
                  {funder?.name || 'Unknown Funder'}
                </span>
                <span className="text-gray-300 text-xs">
                  {funder?.email}
                </span>
              </div>
              <svg
                className={`w-4 h-4 ml-1 text-white transition-transform ${isFunderDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <CollapseTransition
              isOpen={isFunderDropdownOpen}
              maxHeight="300px"
              expandedPadding="py-2"
              collapsedPadding="p-0"
              duration={400}
              easing="linear"
              className="absolute left-0 mt-2 w-56 z-50 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 overflow-hidden"
            >
              <ul className="divide-y divide-gray-100 -my-2">
                {/* Current Funder */}
                {funder && (
                  <li className="group">
                    <div className="w-full px-5 py-3 text-sm text-gray-700">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex flex-col min-w-0 w-full">
                          <span className="text-gray-900 font-medium break-words">{funder.name}</span>
                          <span className="text-gray-500 text-xs break-words">{funder.email}</span>
                        </div>
                      </div>
                      
                      {/* Additional funder details */}
                      <div className="space-y-1">
                        {funder.phone && (
                          <div className="flex items-start gap-2 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="break-words min-w-0 flex-1">{funder.phone}</span>
                          </div>
                        )}
                        {funder.website && (
                          <div className="flex items-start gap-2 text-xs text-gray-600">
                            <Globe className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                            <a 
                              href={funder.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline break-words min-w-0 flex-1"
                            >
                              {funder.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                )}
                
                {/* Change Funder Option */}
                <li className="group">
                  <button
                    onClick={() => {
                      setIsFunderDropdownOpen(false);
                      // Open the funder selection modal
                      const event = new CustomEvent('openFunderSelection');
                      window.dispatchEvent(event);
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-400 group-hover:text-teal-500">
                      <Funder className="w-5 h-5" />
                    </span>
                    <span className="text-gray-900">Change Funder</span>
                  </button>
                </li>
              </ul>
            </CollapseTransition>
          </div>
        </div>

        {/* Search Section */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl" ref={searchRef}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#4B628A] text-white border-none focus:ring-2 focus:ring-teal-500"
          >
            {searchTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type at least 2 characters to search..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#4B628A] text-white placeholder-gray-300 border-none focus:ring-2 focus:ring-teal-500"
              />
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {(searchResults.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="px-4 py-3 text-gray-500 text-sm flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-gray-500 text-sm text-center">
                    No results found
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <Link
                      key={result.id}
                      href={result.link}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 block"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">{result.name}</span>
                        <span className="px-2 py-1 text-xs rounded-full bg-teal-100 text-teal-800">
                          {result.type}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Profile Dropdown */}
        <div className="ml-auto flex items-center">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#4B628A] focus:outline-none"
              disabled={isLoading}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <AvatarUser width={40} height={40} />
              </div>
              <div className="flex flex-col items-start ml-2">
                <span className="text-white text-sm font-medium">
                  {user ? `${user.first_name} ${user.last_name}` : 'Name'}
                </span>
                <span className="text-gray-300 text-xs">
                  {user ? (user.type === 'funder_manager' ? 'Manager' : user.type === 'funder_user' ? 'User' : user.type) : 'Admin'}
                </span>
              </div>
              <svg
                className={`w-4 h-4 ml-1 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <CollapseTransition
              isOpen={isDropdownOpen}
              maxHeight="300px"
              expandedPadding="py-2"
              collapsedPadding="p-0"
              duration={400}
              easing="linear"
              className="absolute right-0 mt-2 w-56 z-50 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 overflow-hidden"
            >
              <ul className="divide-y divide-gray-100 -my-2">
                {menuItems.map((item, index) => (
                  <li key={index} className="group">
                    {item.type === 'button' ? (
                      <button
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        {item.icon && (
                          <span className="text-gray-400 group-hover:text-teal-500">{item.icon}</span>
                        )}
                        <span>{item.label}</span>
                      </button>
                    ) : (
                      <Link
                        href={item.href || '#'}
                        className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {item.icon && (
                          <span className="text-gray-400 group-hover:text-teal-500">{item.icon}</span>
                        )}
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </CollapseTransition>
          </div>
        </div>
      </nav>
      
      {/* Funder Selection Modal */}
      <FunderSelectionModal
        isOpen={isFunderModalOpen}
        onClose={() => setIsFunderModalOpen(false)}
        onSuccess={() => {
          setIsFunderModalOpen(false);
          toast.success('Funder selected successfully');
          // The modal already updates the funder in the auth store
          // No need to refresh the page - the UI will update automatically
        }}
        showAsModal={true}
        title="Change Funder"
        description="Select a different funder to work with"
      />
    </>
  );
} 