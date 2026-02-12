'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/store/auth';
import { FunderDashboardStats } from '@/types/dashboard';
import { getFunderDashboardStats } from '@/lib/api/dashboard';
import DashboardOverview from './_components/DashboardOverview';
import FinancialReport from './_components/FinancialReport';

export default function DashboardPage() {
  const { funder } = useAuthStore();
  const [stats, setStats] = useState<FunderDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!funder) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await getFunderDashboardStats(funder._id);
        setStats(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [funder]);

  if (loading) {
    return (
      <div className="h-full">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">Dashboard statistics will appear here once you have funding data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      {/* Overview Statistics */}
      <DashboardOverview stats={stats} />

      {/* Financial Report (replaces MonthlyChart) */}
      <FinancialReport />
    </div>
  );
} 