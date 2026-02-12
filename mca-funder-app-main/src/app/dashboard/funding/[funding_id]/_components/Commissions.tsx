import React from 'react';
import { getCommissionIntentList } from '@/lib/api/commissionIntents';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';

interface CommissionsProps {
  fundingId: string;
}

export default function Commissions({ fundingId }: CommissionsProps) {
  const [commissions, setCommissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const result = await getCommissionIntentList();
        // Filter commissions by fundingId manually
        const filtered = result.docs.filter((c: any) => c.funding?._id === fundingId);
        setCommissions(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch commissions');
      } finally {
        setLoading(false);
      }
    };
    fetchCommissions();
  }, [fundingId]);

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading commissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Commissions</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (commissions.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <div className="max-w-md mx-auto">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">No Commissions</h3>
          <p className="mt-1 text-gray-500">There are no commissions associated with this funding.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm">
        {commissions.map((c, idx) => (
          <div key={c._id} className="border-b border-gray-200 last:border-b-0">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Commission #{idx + 1}</h3>
                <StatusBadge status={c.status} size="sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Commission Date</p>
                      <p className="text-sm font-semibold text-gray-800">{c.commission_date ? format(new Date(c.commission_date), 'MMM dd, yyyy') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(c.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ISO Name</p>
                      <p className="text-sm font-semibold text-gray-800">{c.iso?.name}</p>
                    </div>
                  </div>
                </div>
                {/* Account Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Account Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="text-sm font-semibold text-gray-800">{c.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ACH Processor</p>
                      <p className="text-sm font-semibold text-gray-800">{c.ach_processor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ISO Account</p>
                      <p className="text-sm font-semibold text-gray-800">{c.iso_account?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Funder Account</p>
                      <p className="text-sm font-semibold text-gray-800">{c.funder_account?.name}</p>
                    </div>
                  </div>
                </div>
                {/* Additional Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Commission Summary	</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Note</p>
                      <p className="text-sm font-semibold text-gray-800">{c.note}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Remaining Balance</p>
                      <p className="text-sm font-semibold text-gray-800">{c.remaining_balance != null ? formatCurrency(c.remaining_balance) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created By</p>
                      <p className="text-sm font-semibold text-gray-800">{c.created_by_user ? `${c.created_by_user.first_name} ${c.created_by_user.last_name}` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created At</p>
                      <p className="text-sm font-semibold text-gray-800">{c.createdAt ? format(new Date(c.createdAt), 'MMM dd, yyyy HH:mm') : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 