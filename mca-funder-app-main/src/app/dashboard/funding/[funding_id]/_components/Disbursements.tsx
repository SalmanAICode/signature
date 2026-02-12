import React from 'react';
import { getDisbursementIntentList } from '@/lib/api/disbursementIntents';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';

export default function Disbursements({ fundingId }: { fundingId: string }) {
  const [disbursements, setDisbursements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDisbursements = async () => {
      try {
        const result = await getDisbursementIntentList();
        // Filter disbursements by fundingId manually
        const filteredDisbursements = result.docs.filter(d => d.funding._id === fundingId);
        setDisbursements(filteredDisbursements);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch disbursements');
      } finally {
        setLoading(false);
      }
    };
    fetchDisbursements();
  }, [fundingId]);

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading disbursements...</p>
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
              <h3 className="text-red-800 font-medium">Error Loading Disbursements</h3>
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

  if (disbursements.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <div className="max-w-md mx-auto">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">No Disbursements</h3>
          <p className="mt-1 text-gray-500">There are no disbursements associated with this funding.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm">
        {disbursements.map((d, idx) => (
          <div key={d._id} className="border-b border-gray-200 last:border-b-0">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Disbursement #{idx + 1}</h3>
                <StatusBadge status={d.status} size="sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Disbursement Date</p>
                      <p className="text-sm font-semibold text-gray-800">{d.disbursement_date ? format(new Date(d.disbursement_date), 'MMM dd, yyyy') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(d.amount)}</p>
                    </div>
                  </div>
                </div>
                {/* Account Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Account Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Disbursement Method</p>
                      <p className="text-sm font-semibold text-gray-800">{d.disbursement_method || d.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ACH Processor</p>
                      <p className="text-sm font-semibold text-gray-800">{d.ach_processor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Funder Account</p>
                      <p className="text-sm font-semibold text-gray-800">{d.funder_account?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Merchant Account</p>
                      <p className="text-sm font-semibold text-gray-800">{d.merchant_account?.name}</p>
                    </div>
                  </div>
                </div>
                {/* Additional Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Disbursement Summary</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Note</p>
                      <p className="text-sm font-semibold text-gray-800">{d.note}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created By</p>
                      <p className="text-sm font-semibold text-gray-800">{d.created_by_user ? `${d.created_by_user.first_name} ${d.created_by_user.last_name}` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Updated At</p>
                      <p className="text-sm font-semibold text-gray-800">{d.updatedAt ? `Last updated on ${format(new Date(d.updatedAt), 'MMM dd, yyyy HH:mm')}` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Remaining Balance</p>
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(d.remaining_balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Processing Amount</p>
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(d.processing_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Failed Amount</p>
                      <p className="text-sm font-semibold text-gray-800">{d.status === 'FAILED' ? formatCurrency(d.failed_amount) : '-'}</p>
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