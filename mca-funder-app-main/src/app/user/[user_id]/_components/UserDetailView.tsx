'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/auth';
import { User } from '@/types/user';
import UserInformation from './UserInformation';
import UserFunderTab from './UserFunderTab';
import UserLenderTab from './UserLenderTab';
import { getUser } from '@/lib/api/users';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton = ({ active, onClick, children }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${active
        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
        : 'bg-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-300'
      }`}
  >
    {children}
  </button>
);

const UserDetailSkeleton = () => (
  <div className="p-6">
    <div className="animate-pulse">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

interface UserDetailProps {
  id: string;
}

export default function UserDetail({ id }: UserDetailProps) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const prevFunderIdRef = useRef<string | undefined>(undefined);
  
  // Get current user's funder from auth store
  const { funder } = useAuthStore();
  const currentFunderId = funder?._id;

  // Watch for funder changes and redirect to /user
  useEffect(() => {
    const prevFunderId = prevFunderIdRef.current;
    
    // Redirect if we had a previous funder and now have a different funder
    if (prevFunderId && currentFunderId && prevFunderId !== currentFunderId) {
      router.push('/user');
    }
    
    // Also redirect if we had a funder and now it's undefined (funder was cleared)
    if (prevFunderId && !currentFunderId) {
      console.log('Redirecting to /user due to funder being cleared');
      router.push('/user');
    }
    
    // Update the ref for next comparison
    prevFunderIdRef.current = currentFunderId;
  }, [currentFunderId, router]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'information' | 'funders' | 'lenders'>('information');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUser(id);
        setUser(response.data as User);
      } catch (error) {
        setError('Failed to load user information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) return <UserDetailSkeleton />;

  if (error) {
    return (
      <div className="w-screen bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1 text-left">
          <h3 className="text-red-800 font-medium text-sm">Unable to Load User Details</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) return <p className="text-left">User not found.</p>;

  return (
    <div className="h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <TabButton active={activeTab === 'information'} onClick={() => setActiveTab('information')}>User Information</TabButton>
        <TabButton active={activeTab === 'funders'} onClick={() => setActiveTab('funders')}>User Funders</TabButton>
        <TabButton active={activeTab === 'lenders'} onClick={() => setActiveTab('lenders')}>User Lenders</TabButton>
      </div>

      {/* Tab Content */}
      <div className="flex justify-center items-center text-left w-full">
        {activeTab === 'information' && <UserInformation data={user} />}
        {activeTab === 'funders' && <UserFunderTab userId={user._id} />}
        {activeTab === 'lenders' && <UserLenderTab userId={user._id} />}
      </div>
    </div>
  );
} 