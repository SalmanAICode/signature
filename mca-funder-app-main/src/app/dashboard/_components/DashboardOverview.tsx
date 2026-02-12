'use client';

import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { FunderDashboardStats } from '@/types/dashboard';

interface DashboardOverviewProps {
  stats: FunderDashboardStats;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const formatFactorRate = (rate: number): string => {
  return rate.toFixed(4);
};

export default function DashboardOverview({ stats }: DashboardOverviewProps) {
  const { overview } = stats;

  const statCards = [
    {
      title: 'Total Funded Amount',
      value: formatCurrency(overview.totalFundedAmount),
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
      description: 'Total amount funded to merchants'
    },
    {
      title: 'Total Payback Amount',
      value: formatCurrency(overview.totalPaybackAmount),
      icon: BanknotesIcon,
      color: 'bg-green-500',
      description: 'Total amount merchants need to pay back'
    },
    {
      title: 'Average Factor Rate',
      value: formatFactorRate(overview.averageFactorRate),
      icon: ArrowTrendingUpIcon,
      color: 'bg-purple-500',
      description: 'Average factor rate across all fundings'
    },
    {
      title: 'Paid Back Amount',
      value: formatCurrency(overview.paidBackAmount),
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      description: 'Amount already paid back by merchants'
    },
    {
      title: 'Paid Back Percentage',
      value: formatPercentage(overview.paidBackPercentage),
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
      description: 'Percentage of total payback amount received'
    },
    {
      title: 'Outstanding Balance',
      value: formatCurrency(overview.outstandingBalance),
      icon: ClockIcon,
      color: 'bg-orange-500',
      description: 'Remaining amount to be paid back'
    },
    {
      title: 'Syndication Amount',
      value: formatCurrency(overview.syndicationAmount),
      icon: BanknotesIcon,
      color: 'bg-teal-500',
      description: 'Total amount syndicated to other funders'
    },
    {
      title: 'Syndication Percentage',
      value: formatPercentage(overview.syndicationPercentage),
      icon: ChartBarIcon,
      color: 'bg-cyan-500',
      description: 'Percentage of funding amount syndicated'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview Statistics</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ClockIcon className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-2">{card.value}</p>
                <p className="text-xs text-gray-500">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 