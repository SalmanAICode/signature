import React from 'react';
import { getPaybacks } from '@/lib/api/paybacks';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';

interface PaybacksProps {
  fundingId: string;
}

export default function Paybacks({ fundingId }: PaybacksProps) {
  const [paybacks, setPaybacks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);


  React.useEffect(() => {
    const fetchPaybacks = async () => {
      try {
        const result = await getPaybacks(fundingId);
        setPaybacks(result.data.docs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch paybacks');
      } finally {
        setLoading(false);
      }
    };
    fetchPaybacks();
  }, [fundingId]);

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading paybacks...</p>
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
              <h3 className="text-red-800 font-medium">Error Loading Paybacks</h3>
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

  if (paybacks.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <div className="max-w-md mx-auto">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">No Paybacks</h3>
          <p className="mt-1 text-gray-500">There are no paybacks associated with this funding.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="bg-white rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payback Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ACH Processor</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Merchant Account</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Funder Account</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reconciled</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Response Message</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Processed Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Responsed Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paybacks.map((payback) => (
              <tr key={payback._id}>
                <td className="px-4 py-2 whitespace-nowrap">{payback.due_date ? format(new Date(payback.due_date), 'MMM dd, yyyy') : payback.submitted_date ? format(new Date(payback.submitted_date), 'MMM dd, yyyy') : '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={payback.status} size="xs" /></td>
                <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(payback.payback_amount ?? payback.amount)}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.payment_method}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.ach_processor}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.merchant?.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.merchant_account?.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.funder_account?.name}</td>
                <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={payback.reconciled ? 'YES' : 'NO'} size="xs" /></td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.note}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.response}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.processed_date ? format(new Date(payback.processed_date), 'MMM dd, yyyy') : '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.responsed_date ? format(new Date(payback.responsed_date), 'MMM dd, yyyy') : '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.created_by_user ? `${payback.created_by_user.first_name} ${payback.created_by_user.last_name}` : '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{payback.createdAt ? format(new Date(payback.createdAt), 'MMM dd, yyyy HH:mm') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 