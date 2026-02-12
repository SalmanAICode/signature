import React, { useState, useEffect } from 'react';
import { getDisbursementIntentList } from '@/lib/api/disbursementIntents';
import { getDisbursementsByDisbursementIntent } from '@/lib/api/disbursements';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, ChevronUpIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { renderEntity } from '@/components/EntityPreview';
import { Disbursement } from '@/types/disbursement';
import { DisbursementIntent } from '@/lib/api/disbursementIntents';
import CreateDisbursementIntent from './CreateDisbursementIntent';
import UpdateDisbursementIntent from './UpdateDisbursementIntent';
import CreateDisbursement from './CreateDisbursement';
import UpdateDisbursement from './UpdateDisbursement';
import FormModalLayout from '@/components/FormModalLayout';
import { SimpleList, Column } from '@/components/SimpleList';
import { Pagination } from '@/types/pagination';

type SortField = 'disbursement_date' | 'status' | 'amount' | 'payment_method' | 'submitted_amount' | 'processing_amount' | 'succeed_amount' | 'failed_amount' | 'remaining_balance';
type SortDirection = 'asc' | 'desc';
type SortOrder = 'asc' | 'desc';

interface SortHeaderProps {
  field: SortField;
  label: string;
  currentSort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}

interface QueryParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: SortOrder;
  search?: string;
}

function SortHeader({ field, label, currentSort, direction, onSort, className }: SortHeaderProps) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>
        <span>
          {currentSort === field ? (
            direction === 'asc' ? (
              <ChevronUpIcon className="w-4 h-4 text-blue-500" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-blue-500" />
            )
          ) : (
            <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
          )}
        </span>
      </div>
    </th>
  );
}

// Helper functions to calculate summary values
const calculateSummary = (disbursements: Disbursement[]) => {
  return {
    submitted_count: disbursements.filter(d => d.status === 'SUBMITTED').length,
    processing_count: disbursements.filter(d => d.status === 'PROCESSING').length,
    succeed_count: disbursements.filter(d => d.status === 'SUCCEED').length,
    failed_count: disbursements.filter(d => d.status === 'FAILED').length,
    submitted_amount: disbursements
      .filter(d => d.status === 'SUBMITTED')
      .reduce((sum, d) => sum + d.amount, 0),
    processing_amount: disbursements
      .filter(d => d.status === 'PROCESSING')
      .reduce((sum, d) => sum + d.amount, 0),
    succeed_amount: disbursements
      .filter(d => d.status === 'SUCCEED')
      .reduce((sum, d) => sum + d.amount, 0),
    failed_amount: disbursements
      .filter(d => d.status === 'FAILED')
      .reduce((sum, d) => sum + d.amount, 0),
  };
};

const calculateDerivedValues = (summary: ReturnType<typeof calculateSummary>, totalAmount: number) => {
  const pending_amount = summary.submitted_amount + summary.processing_amount;
  const pending_count = summary.submitted_count + summary.processing_count;
  const paid_amount = summary.succeed_amount;
  const remaining_balance = totalAmount - paid_amount - pending_amount;

  return {
    pending_amount,
    pending_count,
    paid_amount,
    remaining_balance,
  };
};

// Columns for DisbursementIntent table
const columns: Column<DisbursementIntent>[] = [
  {
    key: 'funder',
    label: 'Funder',
    render: (_value: any, row: any) => renderEntity(row.funder),
    sortable: false,
  },
  {
    key: 'lender',
    label: 'Lender',
    render: (_value: any, row: any) => renderEntity(row.lender),
    sortable: false,
  },
  {
    key: 'merchant',
    label: 'Merchant',
    render: (_value: any, row: any) => renderEntity(row.merchant),
    sortable: false,
  },
  {
    key: 'disbursement_date',
    label: 'Disbursement Date',
    render: (value: any) => value ? format(new Date(value), 'MMM dd, yyyy') : '-',
    sortable: true,
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (value: any) => <span className="block text-left font-medium">{formatCurrency(value)}</span>,
    sortable: true,
  },
  {
    key: 'payment_method',
    label: 'Payment Method',
    render: (value: any) => <span className="block text-left">{value}</span>,
    sortable: true,
  },
  {
    key: 'ach_processor',
    label: 'ACH Processor',
    render: (value: any) => <span className="block text-left">{value}</span>,
    sortable: true,
  },
  {
    key: 'funder_account',
    label: 'Funder Account',
    render: (value: any) => value ? value.name : '-',
    sortable: false,
  },
  {
    key: 'merchant_account',
    label: 'Merchant Account',
    render: (value: any) => value ? value.name : '-',
    sortable: false,
  },
  {
    key: 'created_by_user',
    label: 'Created By',
    render: (value: any) => value ? `${value.first_name} ${value.last_name}` : '-',
    sortable: false,
  },
  {
    key: 'updated_by_user',
    label: 'Updated By',
    render: (value: any) => value ? `${value.first_name} ${value.last_name}` : '-',
    sortable: false,
  },
  {
    key: 'note',
    label: 'Note',
    render: (value: any) => (
      <span className="block text-left whitespace-pre-line break-words">
        {value || '-'}
      </span>
    ),
    sortable: false,
  },
  {
    key: 'status',
    label: 'Status',
    render: (value: any) => <span className="block text-left"><StatusBadge status={value} size="xs" /></span>,
    sortable: true,
  },
  {
    key: 'createdAt',
    label: 'Created At',
    render: (value: any) => value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : '-',
    sortable: true,
  },
];

export default function Disbursements({ fundingId }: { fundingId: string }) {
  const [disbursements, setDisbursements] = useState<DisbursementIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDisbursement, setEditingDisbursement] = useState<DisbursementIntent | null>(null);
  const [showCreateDisbursementModal, setShowCreateDisbursementModal] = useState<DisbursementIntent | null>(null);
  const [editingLinkedDisbursement, setEditingLinkedDisbursement] = useState<Disbursement | null>(null);
  const [linkedDisbursements, setLinkedDisbursements] = useState<Record<string, Disbursement[]>>({});
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'disbursement_date',
    sortOrder: 'desc',
    search: '',
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalResults: 0,
    totalPages: 1,
  });

  useEffect(() => {
    fetchDisbursementsAndLinked();
  }, [fundingId, queryParams]);

  // Fetch both intents and all linked disbursements up front
  const fetchDisbursementsAndLinked = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDisbursementIntentList({ funding: fundingId });
      let filteredDisbursements = result.docs;
      if (queryParams.search) {
        const searchLower = queryParams.search.toLowerCase();
        filteredDisbursements = filteredDisbursements.filter(d => 
          d.note?.toLowerCase().includes(searchLower) ||
          d.status.toLowerCase().includes(searchLower) ||
          d.payment_method.toLowerCase().includes(searchLower) ||
          d.ach_processor?.toLowerCase().includes(searchLower) ||
          d.amount.toString().includes(searchLower)
        );
      }
      filteredDisbursements.sort((a, b) => {
        let comparison = 0;
        switch (queryParams.sortBy) {
          case 'disbursement_date':
            comparison = new Date(a.disbursement_date).getTime() - new Date(b.disbursement_date).getTime();
            break;
          case 'status':
            comparison = (a.status || '').localeCompare(b.status || '');
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'payment_method':
            comparison = (a.payment_method || '').localeCompare(b.payment_method || '');
            break;
          default:
            comparison = new Date(a.disbursement_date).getTime() - new Date(b.disbursement_date).getTime();
            break;
        }
        return queryParams.sortOrder === 'asc' ? comparison : -comparison;
      });
      const startIndex = (queryParams.page - 1) * queryParams.limit;
      const endIndex = startIndex + queryParams.limit;
      const paginatedDisbursements = filteredDisbursements.slice(startIndex, endIndex);
      setDisbursements(paginatedDisbursements);
      setPagination({
        page: queryParams.page,
        limit: queryParams.limit,
        totalResults: filteredDisbursements.length,
        totalPages: Math.ceil(filteredDisbursements.length / queryParams.limit),
      });
      // Fetch all linked disbursements in parallel
      const allLinked = await Promise.all(
        paginatedDisbursements.map(async (intent) => {
          const disbs = await getDisbursementsByDisbursementIntent(intent._id);
          return [intent._id, disbs];
        })
      );
      setLinkedDisbursements(Object.fromEntries(allLinked));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch disbursements');
      setDisbursements([]);
      setLinkedDisbursements({});
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setQueryParams(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc' | null) => {
    if (sortOrder === null) return;
    setQueryParams(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  const handleSearch = async (search: string): Promise<void> => {
    setQueryParams(prev => ({ ...prev, search, page: 1 }));
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchDisbursementsAndLinked();
  };

  const handleUpdateSuccess = () => {
    setEditingDisbursement(null);
    fetchDisbursementsAndLinked();
  };

  const handleCreateDisbursementSuccess = () => {
    const disbursementIntentId = showCreateDisbursementModal?._id;
    setShowCreateDisbursementModal(null);
    if (disbursementIntentId) {
      fetchDisbursementsAndLinked();
    }
  };

  const handleUpdateLinkedDisbursementSuccess = () => {
    const disbursementIntentId = editingLinkedDisbursement?.disbursement_intent?._id;
    setEditingLinkedDisbursement(null);
    if (disbursementIntentId) {
      fetchDisbursementsAndLinked();
    }
  };

  // Render the summary section with calculated values
  const renderSummarySection = (d: any, disbursementsArray?: Disbursement[]) => {
    return (
      <div className="space-y-4">
        {/* Summary Table */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Summary</h4>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Count</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-center">Submitted</td>
                  <td className="px-4 py-2 text-sm text-center">{d.submitted_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(d.submitted_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-center">Processing</td>
                  <td className="px-4 py-2 text-sm text-center">{d.processing_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(d.processing_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-center">Succeeded</td>
                  <td className="px-4 py-2 text-sm text-center">{d.succeed_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(d.succeed_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-center">Failed</td>
                  <td className="px-4 py-2 text-sm text-center">{d.failed_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(d.failed_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-center">Pending Total</td>
                  <td className="px-4 py-2 text-sm text-center">{d.pending_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(d.pending_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center">(Submitted + Processing)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-center align-middle">Payment Summary</td>
                  <td className="px-4 py-2 text-sm text-center align-middle">-</td>
                  <td className="px-4 py-2 text-sm text-center align-middle">
                    <div className="flex flex-col items-center justify-center h-full">
                      <div>Total: {formatCurrency(d.amount)}</div>
                      <div>Paid: {formatCurrency(d.paid_amount || 0)}</div>
                      <div className="font-medium">Remaining: {formatCurrency(d.remaining_balance || 0)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center align-middle">(Total - Paid - Pending)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h4>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Created By</div>
                  <div className="text-sm font-medium">
                    {d.created_by_user ? `${d.created_by_user.first_name} ${d.created_by_user.last_name}` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Created At</div>
                  <div className="text-sm font-medium">
                    {d.createdAt ? format(new Date(d.createdAt), 'MMM dd, yyyy HH:mm') : '-'}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Updated By</div>
                  <div className="text-sm font-medium">
                    {d.updated_by_user ? `${d.updated_by_user.first_name} ${d.updated_by_user.last_name}` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Updated At</div>
                  <div className="text-sm font-medium">
                    {d.updatedAt ? format(new Date(d.updatedAt), 'MMM dd, yyyy HH:mm') : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Disbursements */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-500">Linked Disbursements</h4>
            <button
              onClick={() => setShowCreateDisbursementModal(d)}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Disbursement
            </button>
          </div>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading linked disbursements...</p>
            </div>
          ) : disbursementsArray && disbursementsArray.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Payment Method</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Processor</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Created By</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {disbursementsArray.map((disbursement: Disbursement) => (
                    <tr key={disbursement._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        <StatusBadge status={disbursement.status} size="xs" />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm">
                        {disbursement.submitted_date ? format(new Date(disbursement.submitted_date), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                        {formatCurrency(disbursement.amount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm">
                        {disbursement.payment_method}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm">
                        {disbursement.ach_processor}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm">
                        {disbursement.created_by_user ? 
                          `${disbursement.created_by_user.first_name} ${disbursement.created_by_user.last_name}` : 
                          '-'
                        }
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        <button
                          onClick={() => setEditingLinkedDisbursement(disbursement)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <PencilIcon className="w-4 h-4 mr-1.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 text-center text-gray-500 text-sm">
              No linked disbursements found
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExpandedContent = (item: DisbursementIntent) => {
    const linked = linkedDisbursements[item._id] || [];
    return (
      <div className="p-4 bg-white">
        <div className="mb-2 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 text-left">
            Linked Disbursements
          </h3>
          <button
            onClick={() => setShowCreateDisbursementModal(item)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Disbursement
          </button>
        </div>
        {linked.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Funder Account</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Merchant Account</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Amount</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Payment Method</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">ACH Processor</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Submitted Date</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Processed Date</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Responsed Date</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Reconciled</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Created By</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Updated By</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Transaction</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {linked.map((disbursement) => (
                <tr key={disbursement._id} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-left">{disbursement.funder_account?.name || '-'}</td>
                  <td className="px-3 py-2 text-left">{disbursement.merchant_account?.name || '-'}</td>
                  <td className="px-3 py-2 text-left font-medium">{formatCurrency(disbursement.amount)}</td>
                  <td className="px-3 py-2 text-left">{disbursement.payment_method || '-'}</td>
                  <td className="px-3 py-2 text-left">{disbursement.ach_processor || '-'}</td>
                  <td className="px-3 py-2 text-left"><StatusBadge status={disbursement.status} size="xs" /></td>
                  <td className="px-3 py-2 text-left">{disbursement.submitted_date ? format(new Date(disbursement.submitted_date), 'MMM dd, yyyy') : '-'}</td>
                  <td className="px-3 py-2 text-left">{disbursement.processed_date ? format(new Date(disbursement.processed_date), 'MMM dd, yyyy') : '-'}</td>
                  <td className="px-3 py-2 text-left">{disbursement.responsed_date ? format(new Date(disbursement.responsed_date), 'MMM dd, yyyy') : '-'}</td>
                  <td className="px-3 py-2 text-center">{disbursement.reconciled ? '✔️' : '❌'}</td>
                  <td className="px-3 py-2 text-left">{disbursement.created_by_user ? (disbursement.created_by_user.first_name || '') + ' ' + (disbursement.created_by_user.last_name || '') : '-'}</td>
                  <td className="px-3 py-2 text-left">{disbursement.updated_by_user ? (disbursement.updated_by_user.first_name || '') + ' ' + (disbursement.updated_by_user.last_name || '') : '-'}</td>
                  <td className="px-3 py-2 text-left">{disbursement.transaction || '-'}</td>
                  <td className="px-3 py-2 text-left">
                    <button
                      onClick={() => setEditingLinkedDisbursement(disbursement)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <PencilIcon className="w-4 h-4 mr-1.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="bg-white rounded-lg p-4 text-center text-gray-500 text-sm">
            No linked disbursements found
          </div>
        )}
      </div>
    );
  };

  // Move these inside the component to access state setters
  const renderActions = (item: DisbursementIntent) => (
    <div className="flex space-x-2">
      <button
        onClick={() => setEditingDisbursement(item)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <PencilIcon className="w-4 h-4 mr-1.5" />
        Edit
      </button>
    </div>
  );

  const renderHeaderButtons = () => (
    <div className="flex space-x-2">
      <button
        onClick={() => setShowCreateModal(true)}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create
        </span>
      </button>
    </div>
  );

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

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <SimpleList
          title="Disbursements"
          data={disbursements}
          columns={columns}
          loading={loading}
          error={error}
          emptyMessage="No disbursements found"
          renderActions={renderActions}
          renderHeaderButtons={renderHeaderButtons}
          onSearch={handleSearch}
          onSort={handleSort}
          searchQuery={queryParams.search}
          initialSortBy={queryParams.sortBy}
          initialSortOrder={queryParams.sortOrder}
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            totalResults: pagination.totalResults,
            limit: pagination.limit,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange
          }}
          renderExpandedContent={renderExpandedContent}
        />
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <FormModalLayout
          title="Create Disbursement Intent"
          subtitle="Please fill out the details for the new disbursement intent."
          onCancel={() => setShowCreateModal(false)}
          maxWidth={700}
        >
          <CreateDisbursementIntent
            fundingId={fundingId}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </FormModalLayout>
      )}

      {/* Edit Modal */}
      {editingDisbursement && (
        <FormModalLayout
          title="Update Disbursement Intent"
          subtitle="Please update the details for the disbursement intent."
          onCancel={() => setEditingDisbursement(null)}
          maxWidth={700}
        >
          <UpdateDisbursementIntent
            disbursementIntent={editingDisbursement}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setEditingDisbursement(null)}
          />
        </FormModalLayout>
      )}

      {/* Create Disbursement Modal */}
      {showCreateDisbursementModal && (
        <FormModalLayout
          title="Create New Disbursement"
          subtitle={`For Disbursement Intent: ${showCreateDisbursementModal.note || showCreateDisbursementModal._id}`}
          onCancel={() => setShowCreateDisbursementModal(null)}
          maxWidth={700}
        >
          <CreateDisbursement
            disbursementIntent={showCreateDisbursementModal}
            onSuccess={handleCreateDisbursementSuccess}
            onCancel={() => setShowCreateDisbursementModal(null)}
          />
        </FormModalLayout>
      )}

      {/* Update Disbursement Modal */}
      {editingLinkedDisbursement && (
        <FormModalLayout
          title="Update Disbursement"
          subtitle={`For Disbursement Intent: ${editingLinkedDisbursement.disbursement_intent?.note || editingLinkedDisbursement.disbursement_intent?._id}`}
          onCancel={() => setEditingLinkedDisbursement(null)}
          maxWidth={700}
        >
          <UpdateDisbursement
            disbursement={editingLinkedDisbursement}
            onSuccess={handleUpdateLinkedDisbursementSuccess}
            onCancel={() => setEditingLinkedDisbursement(null)}
          />
        </FormModalLayout>
      )}
    </div>
  );
} 