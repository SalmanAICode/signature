import { env } from '@/config/env';
import { authFetch } from '@/lib/api/authFetch';
import { DashboardStatsResponse, FunderDashboardStats } from '@/types/dashboard';

export const getFunderDashboardStats = async (funderId: string): Promise<DashboardStatsResponse> => {
  try {
    const response = await authFetch(`${env.api.baseUrl}/dashboard/funder/${funderId}/stats`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch dashboard stats');
    return result;
  } catch (error) {
    // Return mock data for development/testing
    console.warn('Dashboard API not available, using mock data:', error);
    return getMockDashboardStats();
  }
};

// Mock data for development/testing
const getMockDashboardStats = (): DashboardStatsResponse => {
  const mockData: FunderDashboardStats = {
    overview: {
      totalFundedAmount: 2500000,
      totalPaybackAmount: 2875000,
      averageFactorRate: 1.15,
      paidBackAmount: 1725000,
      paidBackPercentage: 60.0,
      outstandingBalance: 1150000,
      syndicationAmount: 500000,
      syndicationPercentage: 20.0,
    },
    monthlyData: [
      {
        month: '2024-01',
        fundingCreated: 12,
        fundedAmount: 300000,
        paybackAmount: 345000,
      },
      {
        month: '2024-02',
        fundingCreated: 15,
        fundedAmount: 400000,
        paybackAmount: 460000,
      },
      {
        month: '2024-03',
        fundingCreated: 18,
        fundedAmount: 500000,
        paybackAmount: 575000,
      },
      {
        month: '2024-04',
        fundingCreated: 14,
        fundedAmount: 350000,
        paybackAmount: 402500,
      },
      {
        month: '2024-05',
        fundingCreated: 20,
        fundedAmount: 550000,
        paybackAmount: 632500,
      },
      {
        month: '2024-06',
        fundingCreated: 16,
        fundedAmount: 400000,
        paybackAmount: 460000,
      },
    ],
  };

  return {
    success: true,
    data: mockData,
  };
}; 