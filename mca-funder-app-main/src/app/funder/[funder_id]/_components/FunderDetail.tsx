'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/lib/store/auth';
import { Funder } from '@/types/funder';
import FunderDetailsTab from './FunderDetailsTab';
import FunderAccountsTab from './FunderAccountsTab';
import FunderUsersTab from '../../_components/FunderUsersTab';
import FunderIsosTab from '../../_components/FunderIsosTab';
import { getFunder } from '@/lib/api/funders';
import clsx from 'clsx';

const FunderDetailSkeleton = () => (
  <div className="p-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
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

interface FunderDetailProps {
  id: string;
}

export default function FunderDetail({ id }: FunderDetailProps) {
  const [funder, setFunder] = useState<Funder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuthStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'users' | 'isos' | 'accounts'>('details');

  useEffect(() => {
    const fetchFunder = async () => {
      try {
        const response = await getFunder(id);
        setFunder(response.data as Funder);
      } catch (error) {
        setError('Failed to load funder details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchFunder();
    }
  }, [id, accessToken]);

  if (loading) return <FunderDetailSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!funder) {
    return null;
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="mb-6">
        <div className="flex gap-0">
          <button
            className={clsx(
              'px-6 py-2 font-semibold focus:outline-none border border-b-0 rounded-t-lg transition-colors text-base',
              activeTab === 'details'
                ? 'bg-blue-50 border-gray-300 text-black z-10'
                : 'bg-gray-100 border-gray-300 text-black hover:bg-blue-50'
            )}
            style={{ marginRight: '-1px' }}
            onClick={() => setActiveTab('details')}
          >
            Funder Details
          </button>
          <button
            className={clsx(
              'px-6 py-2 font-semibold focus:outline-none border border-b-0 rounded-t-lg transition-colors text-base',
              activeTab === 'users'
                ? 'bg-blue-50 border-gray-300 text-black z-10'
                : 'bg-gray-100 border-gray-300 text-black hover:bg-blue-50'
            )}
            style={{ marginRight: '-1px' }}
            onClick={() => setActiveTab('users')}
          >
            Funder Users
          </button>
          <button
            className={clsx(
              'px-6 py-2 font-semibold focus:outline-none border border-b-0 rounded-t-lg transition-colors text-base',
              activeTab === 'isos'
                ? 'bg-blue-50 border-gray-300 text-black z-10'
                : 'bg-gray-100 border-gray-300 text-black hover:bg-blue-50'
            )}
            style={{ marginRight: '-1px' }}
            onClick={() => setActiveTab('isos')}
          >
            Funder ISOs
          </button>
          {/* Accounts tab temporarily disabled - need boss approval */}
          {/* 
          <button
            className={clsx(
              'px-6 py-2 font-semibold focus:outline-none border border-b-0 rounded-t-lg transition-colors text-base',
              activeTab === 'accounts'
                ? 'bg-blue-50 border-gray-300 text-black z-10'
                : 'bg-gray-100 border-gray-300 text-black hover:bg-blue-50'
            )}
            style={{ marginRight: '-1px' }}
            onClick={() => setActiveTab('accounts')}
          >
            Funder Accounts
          </button>
          */}
        </div>
      </div>
      {activeTab === 'details' ? (
        <FunderDetailsTab funder={funder} />
      ) : activeTab === 'users' ? (
        <FunderUsersTab funderId={funder._id} />
      ) : activeTab === 'isos' ? (
        <FunderIsosTab funderId={funder._id} />
      ) : (
        <FunderDetailsTab funder={funder} />
      )}
      {/* Accounts tab content temporarily disabled - need boss approval */}
      {/* 
      {activeTab === 'details' ? (
        <FunderDetailsTab funder={funder} />
      ) : activeTab === 'users' ? (
        <FunderUsersTab funderId={funder._id} />
      ) : activeTab === 'isos' ? (
        <FunderIsosTab funderId={funder._id} />
      ) : activeTab === 'accounts' ? (
        <FunderAccountsTab funderId={funder._id} />
      ) : (
        <FunderDetailsTab funder={funder} />
      )}
      */}
    </div>
  );
}
