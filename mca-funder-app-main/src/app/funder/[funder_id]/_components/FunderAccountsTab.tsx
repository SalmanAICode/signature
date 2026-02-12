'use client';

import { useFunderAccounts } from '../../_components/useFunderAccounts';

interface FunderAccountsTabProps {
  funderId: string;
}

const AccountSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function FunderAccountsTab({ funderId }: FunderAccountsTabProps) {
  const { accounts, loading, error } = useFunderAccounts(funderId);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-300px)] overflow-y-auto">
        <AccountSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-300px)] overflow-y-auto">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Accounts</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-300px)] overflow-y-auto">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Accounts</h3>
          <p className="text-gray-500">This funder doesn't have any accounts set up yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-300px)] overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-900">
        Funder Accounts ({accounts.length})
      </h2>
      
      <div className="space-y-6">
        {accounts.map((account, index) => (
          <div 
            key={account._id} 
            className="border border-gray-200 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {account.name}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  account.inactive 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {account.inactive ? 'Inactive' : 'Active'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">Available Balance</p>
                <p className="text-xl font-bold text-green-600">
                  ${(account.available_balance || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Bank Name</p>
                <p className="text-gray-900 font-medium">{account.bank_name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Account Type</p>
                <p className="text-gray-900 font-medium">{account.account_type}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Branch</p>
                <p className="text-gray-900 font-medium">{account.branch}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Routing Number</p>
                <p className="text-gray-900 font-mono">{account.routing_number}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Account Number</p>
                <p className="text-gray-900 font-mono">
                  ****{account.account_number.slice(-4)}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">DDA</p>
                <p className="text-gray-900 font-mono">{account.dda}</p>
              </div>
            </div>

            {/* Additional account details */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Account ID: {account._id}</span>
                {account.transaction_list && Object.keys(account.transaction_list).length > 0 && (
                  <span>Has transaction history</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Account Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700">Total Accounts:</p>
            <p className="font-semibold text-blue-900">{accounts.length}</p>
          </div>
          <div>
            <p className="text-blue-700">Total Balance:</p>
            <p className="font-semibold text-blue-900">
              ${accounts.reduce((sum, account) => sum + (account.available_balance || 0), 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-blue-700">Active Accounts:</p>
            <p className="font-semibold text-blue-900">
              {accounts.filter(account => !account.inactive).length}
            </p>
          </div>
          <div>
            <p className="text-blue-700">Inactive Accounts:</p>
            <p className="font-semibold text-blue-900">
              {accounts.filter(account => account.inactive).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 