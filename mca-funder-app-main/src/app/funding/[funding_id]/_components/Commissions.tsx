import React, { useState, useEffect } from 'react';
import { getCommissionIntentList } from '@/lib/api/commissionIntents';
import { getCommissionsByCommissionIntent } from '@/lib/api/commissions';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, ChevronUpIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { renderEntity } from '@/components/EntityPreview';
import { Commission } from '@/types/commission';
import { CommissionIntent } from '@/types/commissionIntent';
import CreateCommissionIntent from './CreateCommissionIntent';
import UpdateCommissionIntent from './UpdateCommissionIntent';
import CreateCommission from './CreateCommission';
import UpdateCommission from './UpdateCommission';
import FormModalLayout from '@/components/FormModalLayout';
import { SimpleList, Column } from '@/components/SimpleList';
import { Pagination } from '@/types/pagination';

type SortField = 'commission_date' | 'status' | 'amount' | 'payment_method' | 'ach_processor' | 'paid_amount' | 'pending_amount' | 'remaining_balance' | 'createdAt';

interface QueryParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
}

// Columns for CommissionIntent table
const columns: Column<CommissionIntent>[] = [
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
    key: 'iso',
    label: 'ISO',
    render: (_value: any, row: any) => renderEntity(row.iso),
    sortable: false,
  },
  {
    key: 'commission_date',
    label: 'Commission Date',
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
    render: (value: any) => <span className="block text-left">{value || '-'}</span>,
    sortable: true,
  },
  {
    key: 'ach_processor',
    label: 'ACH Processor',
    render: (value: any) => <span className="block text-left">{value || '-'}</span>,
    sortable: true,
  },
  {
    key: 'funder_account',
    label: 'Funder Account',
    render: (_value: any, row: any) =>
      row.funder_account && typeof row.funder_account === 'object' && row.funder_account.name
        ? row.funder_account.name
        : '-',
    sortable: false,
  },
  {
    key: 'iso_account',
    label: 'ISO Account',
    render: (_value: any, row: any) =>
      row.iso_account && typeof row.iso_account === 'object' && row.iso_account.name
        ? row.iso_account.name
        : '-',
    sortable: false,
  },
  {
    key: 'created_by_user',
    label: 'Created By',
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
    render: (value: any) => value ? format(new Date(value), 'MMM dd, yyyy') : '-',
    sortable: true,
  },
];

interface CommissionsProps {
  fundingId: string;
}

export default function Commissions({ fundingId }: CommissionsProps) {
  const [commissions, setCommissions] = useState<CommissionIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCommission, setEditingCommission] = useState<CommissionIntent | null>(null);
  const [showCreateCommissionModal, setShowCreateCommissionModal] = useState<CommissionIntent | null>(null);
  const [editingLinkedCommission, setEditingLinkedCommission] = useState<Commission | null>(null);
  const [linkedCommissions, setLinkedCommissions] = useState<Record<string, Commission[]>>({});
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'commission_date',
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
    fetchCommissionsAndLinked();
  }, [fundingId, queryParams]);

  // Fetch both intents and all linked commissions up front
  const fetchCommissionsAndLinked = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCommissionIntentList();
      let filteredCommissions = result.docs.filter((c: any) => c.funding?._id === fundingId);
      if (queryParams.search) {
        const searchLower = queryParams.search.toLowerCase();
        filteredCommissions = filteredCommissions.filter(c => 
          c.note?.toLowerCase().includes(searchLower) ||
          c.status.toLowerCase().includes(searchLower) ||
          (c.payment_method?.toLowerCase() || '').includes(searchLower) ||
          (c.ach_processor?.toLowerCase() || '').includes(searchLower) ||
          c.amount.toString().includes(searchLower)
        );
      }
      filteredCommissions.sort((a, b) => {
        let comparison = 0;
        switch (queryParams.sortBy) {
          case 'commission_date':
            comparison = new Date(a.commission_date).getTime() - new Date(b.commission_date).getTime();
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
          case 'ach_processor':
            comparison = (a.ach_processor || '').localeCompare(b.ach_processor || '');
            break;
          case 'paid_amount':
            comparison = (a.paid_amount || 0) - (b.paid_amount || 0);
            break;
          case 'pending_amount':
            comparison = (a.pending_amount || 0) - (b.pending_amount || 0);
            break;
          case 'remaining_balance':
            comparison = (a.remaining_balance || 0) - (b.remaining_balance || 0);
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          default:
            comparison = new Date(a.commission_date).getTime() - new Date(b.commission_date).getTime();
            break;
        }
        return queryParams.sortOrder === 'asc' ? comparison : -comparison;
      });
      const startIndex = (queryParams.page - 1) * queryParams.limit;
      const endIndex = startIndex + queryParams.limit;
      const paginatedCommissions = filteredCommissions.slice(startIndex, endIndex);
      setCommissions(paginatedCommissions);
      setPagination({
        page: queryParams.page,
        limit: queryParams.limit,
        totalResults: filteredCommissions.length,
        totalPages: Math.ceil(filteredCommissions.length / queryParams.limit),
      });
      // Fetch all linked commissions in parallel
      const allLinked = await Promise.all(
        paginatedCommissions.map(async (intent) => {
          const comms = await getCommissionsByCommissionIntent(intent._id);
          return [intent._id, comms.data];
        })
      );
      setLinkedCommissions(Object.fromEntries(allLinked));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commissions');
      setCommissions([]);
      setLinkedCommissions({});
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
    fetchCommissionsAndLinked();
  };

  const handleUpdateSuccess = () => {
    setEditingCommission(null);
    fetchCommissionsAndLinked();
  };

  const handleCreateCommissionSuccess = () => {
    const commissionIntentId = showCreateCommissionModal?._id;
    setShowCreateCommissionModal(null);
    if (commissionIntentId) {
      fetchCommissionsAndLinked();
    }
  };

  const handleUpdateLinkedCommissionSuccess = () => {
    const commissionIntentId = editingLinkedCommission?.commission_intent?._id;
    setEditingLinkedCommission(null);
    if (commissionIntentId) {
      fetchCommissionsAndLinked();
    }
  };

  // Render the summary section with calculated values
  const renderSummarySection = (c: any, commissionsArray?: Commission[]) => {
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
                  <td className="px-4 py-2 text-sm text-center">{c.submitted_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(c.submitted_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-center">Processing</td>
                  <td className="px-4 py-2 text-sm text-center">{c.processing_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(c.processing_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-center">Succeeded</td>
                  <td className="px-4 py-2 text-sm text-center">{c.succeed_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(c.succeed_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-center">Failed</td>
                  <td className="px-4 py-2 text-sm text-center">{c.failed_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(c.failed_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-center">Pending Total</td>
                  <td className="px-4 py-2 text-sm text-center">{c.pending_count || 0}</td>
                  <td className="px-4 py-2 text-sm text-center">{formatCurrency(c.pending_amount || 0)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-center">(Submitted + Processing)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-center align-middle">Payment Summary</td>
                  <td className="px-4 py-2 text-sm text-center align-middle">-</td>
                  <td className="px-4 py-2 text-sm text-center align-middle">
                    <div className="flex flex-col items-center justify-center h-full">
                      <div>Total: {formatCurrency(c.amount)}</div>
                      <div>Paid: {formatCurrency(c.paid_amount || 0)}</div>
                      <div className="font-medium">Remaining: {formatCurrency(c.remaining_balance || 0)}</div>
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
                    {c.created_by_user ? `${c.created_by_user.first_name} ${c.created_by_user.last_name}` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Created At</div>
                  <div className="text-sm font-medium">
                    {c.createdAt ? format(new Date(c.createdAt), 'MMM dd, yyyy HH:mm') : '-'}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Updated By</div>
                  <div className="text-sm font-medium">
                    {c.updated_by_user ? `${c.updated_by_user.first_name} ${c.updated_by_user.last_name}` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Updated At</div>
                  <div className="text-sm font-medium">
                    {c.updatedAt ? format(new Date(c.updatedAt), 'MMM dd, yyyy HH:mm') : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Commissions */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-500">Linked Commissions</h4>
            <button
              onClick={() => setShowCreateCommissionModal(c)}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Commission
            </button>
          </div>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading linked commissions...</p>
            </div>
          ) : commissionsArray && commissionsArray.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Submitted Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Payment Method</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">ACH Processor</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Funder Account</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">ISO Account</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Processed Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Response Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Created By</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Created Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Reconciled</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionsArray.map((commission: Commission) => (
                    <tr key={commission._id} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-left">{commission.submitted_date ? format(new Date(commission.submitted_date), 'MMM dd, yyyy') : '-'}</td>
                      <td className="px-3 py-2 text-left font-medium">{formatCurrency(commission.amount)}</td>
                      <td className="px-3 py-2 text-left"><StatusBadge status={commission.status} size="xs" /></td>
                      <td className="px-3 py-2 text-left">{commission.payment_method || '-'}</td>
                      <td className="px-3 py-2 text-left">{commission.ach_processor || '-'}</td>
                      <td className="px-3 py-2 text-left">{commission.funder_account && typeof commission.funder_account === 'object' && (commission.funder_account as any).name ? (commission.funder_account as any).name : '-'}</td>
                      <td className="px-3 py-2 text-left">{commission.iso_account && typeof commission.iso_account === 'object' && (commission.iso_account as any).name ? (commission.iso_account as any).name : '-'}</td>
                      <td className="px-3 py-2 text-left">{commission.processed_date ? format(new Date(commission.processed_date), 'MMM dd, yyyy') : '-'}</td>
                      <td className="px-3 py-2 text-left">{commission.responsed_date ? format(new Date(commission.responsed_date), 'MMM dd, yyyy') : '-'}</td>
                      <td className="px-3 py-2 text-left">{commission.created_by_user ? `${commission.created_by_user.first_name} ${commission.created_by_user.last_name}` : '-'}</td>
                      <td className="px-3 py-2 text-left">{commission.createdAt ? format(new Date(commission.createdAt), 'MMM dd, yyyy') : '-'}</td>
                      <td className="px-3 py-2 text-left">{commission.reconciled ? '✔️' : '❌'}</td>
                      <td className="px-3 py-2 text-left">
                        <button
                          onClick={() => setEditingLinkedCommission(commission)}
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
              No linked commissions found
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExpandedContent = (item: CommissionIntent) => {
    const linked = linkedCommissions[item._id] || [];
    return (
      <div className="p-4 bg-white">
        <div className="mb-2 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 text-left">
            Linked Commissions
          </h3>
          <button
            onClick={() => setShowCreateCommissionModal(item)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Commission
          </button>
        </div>
        {linked.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Submitted Date</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Amount</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Payment Method</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">ACH Processor</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Funder Account</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">ISO Account</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Processed Date</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Response Date</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Created By</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Created Date</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Reconciled</th>
                <th className="px-3 py-2 text-left font-semibold text-xs text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {linked.map((commission) => (
                <tr key={commission._id} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-left">{commission.submitted_date ? format(new Date(commission.submitted_date), 'MMM dd, yyyy') : '-'}</td>
                  <td className="px-3 py-2 text-left font-medium">{formatCurrency(commission.amount)}</td>
                  <td className="px-3 py-2 text-left"><StatusBadge status={commission.status} size="xs" /></td>
                  <td className="px-3 py-2 text-left">{commission.payment_method || '-'}</td>
                  <td className="px-3 py-2 text-left">{commission.ach_processor || '-'}</td>
                  <td className="px-3 py-2 text-left">{commission.funder_account && typeof commission.funder_account === 'object' && (commission.funder_account as any).name ? (commission.funder_account as any).name : '-'}</td>
                  <td className="px-3 py-2 text-left">{commission.iso_account && typeof commission.iso_account === 'object' && (commission.iso_account as any).name ? (commission.iso_account as any).name : '-'}</td>
                  <td className="px-3 py-2 text-left">{commission.processed_date ? format(new Date(commission.processed_date), 'MMM dd, yyyy') : '-'}</td>
                  <td className="px-3 py-2 text-left">{commission.responsed_date ? format(new Date(commission.responsed_date), 'MMM dd, yyyy') : '-'}</td>
                  <td className="px-3 py-2 text-left">{commission.created_by_user ? `${commission.created_by_user.first_name} ${commission.created_by_user.last_name}` : '-'}</td>
                  <td className="px-3 py-2 text-left">{commission.createdAt ? format(new Date(commission.createdAt), 'MMM dd, yyyy') : '-'}</td>
                  <td className="px-3 py-2 text-left">{commission.reconciled ? '✔️' : '❌'}</td>
                  <td className="px-3 py-2 text-left">
                    <button
                      onClick={() => setEditingLinkedCommission(commission)}
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
            No linked commissions found
          </div>
        )}
      </div>
    );
  };

  // Move these inside the component to access state setters
  const renderActions = (item: CommissionIntent) => (
    <div className="flex space-x-2">
      <button
        onClick={() => setEditingCommission(item)}
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

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <SimpleList
          title="Commissions"
          data={commissions}
          columns={columns}
          loading={loading}
          error={error}
          emptyMessage="No commissions found"
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
          title="Create Commission Intent"
          subtitle="Please fill out the details for the new commission intent."
          onCancel={() => setShowCreateModal(false)}
          maxWidth={700}
        >
          <CreateCommissionIntent
            fundingId={fundingId}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </FormModalLayout>
      )}

      {/* Edit Modal */}
      {editingCommission && (
        <FormModalLayout
          title="Update Commission Intent"
          subtitle="Please update the details for the commission intent."
          onCancel={() => setEditingCommission(null)}
          maxWidth={700}
        >
          <UpdateCommissionIntent
            commissionIntent={editingCommission}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setEditingCommission(null)}
          />
        </FormModalLayout>
      )}

      {/* Create Commission Modal */}
      {showCreateCommissionModal && (
        <FormModalLayout
          title="Create New Commission"
          subtitle={`For Commission Intent: ${showCreateCommissionModal.note || showCreateCommissionModal._id}`}
          onCancel={() => setShowCreateCommissionModal(null)}
          maxWidth={700}
        >
          <CreateCommission
            commissionIntent={showCreateCommissionModal}
            onSuccess={handleCreateCommissionSuccess}
            onCancel={() => setShowCreateCommissionModal(null)}
          />
        </FormModalLayout>
      )}

      {/* Update Commission Modal */}
      {editingLinkedCommission && (
        <FormModalLayout
          title="Update Commission"
          subtitle={`For Commission Intent: ${editingLinkedCommission.commission_intent?.note || editingLinkedCommission.commission_intent?._id}`}
          onCancel={() => setEditingLinkedCommission(null)}
          maxWidth={700}
        >
          <UpdateCommission
            commission={editingLinkedCommission}
            onSuccess={handleUpdateLinkedCommissionSuccess}
            onCancel={() => setEditingLinkedCommission(null)}
          />
        </FormModalLayout>
      )}
    </div>
  );
} 