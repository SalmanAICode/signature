import React, { useState, useEffect } from 'react';
import { getPaybacks, deletePayback } from '@/lib/api/paybacks';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import CreatePayback from '@/app/funding/[funding_id]/_components/CreatePayback';
import { SimpleList, Column } from '@/components/SimpleList';
import { Payback } from '@/types/payback';
import EditPayback from './EditPayback';
import FormModalLayout from '@/components/FormModalLayout';
import DeleteModal from '@/components/DeleteModal';

interface PaybacksProps {
  fundingId: string;
}

export default function Paybacks({ fundingId }: PaybacksProps) {
  const [paybacks, setPaybacks] = useState<Payback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;
  const [selectedPayback, setSelectedPayback] = useState<Payback | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchPaybacks();
  }, [fundingId, page]);

  const fetchPaybacks = async () => {
    try {
      setLoading(true);
      const result = await getPaybacks(fundingId, page, itemsPerPage);
      setPaybacks(result.data.docs);
      setTotalPages(result.data.pagination.totalPages);
      setTotalResults(result.data.pagination.totalResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch paybacks');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payback: Payback) => {
    setSelectedPayback(payback);
    setShowEditModal(true);
  };

  const handleDelete = (payback: Payback) => {
    setSelectedPayback(payback);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPayback) return;
    
    try {
      await deletePayback(selectedPayback._id);
      setShowDeleteModal(false);
      setSelectedPayback(null);
      // Refresh the paybacks list
      fetchPaybacks();
    } catch (error) {
      console.error('Failed to delete payback:', error);
      // You might want to show a toast error here
    }
  };

  const columns: Column<Payback>[] = [
    {
      key: 'payback_plan',
      label: 'Payback Plan',
      render: (value: any) => {
        if (!value) return <span className="text-gray-500">Manual</span>;
        if (typeof value === 'object' && value !== null) {
          const frequency = value.frequency || '';
          const startDate = value.start_date ? format(new Date(value.start_date), 'MMM dd, yyyy') : '';
          const endDate = value.end_date ? format(new Date(value.end_date), 'MMM dd, yyyy') : 'Ongoing';
          return (
            <span>
              {frequency} - {startDate} to {endDate}
            </span>
          );
        }
        // If just an ID or unknown, show N/A
        return <span className="text-gray-400">N/A</span>;
      },
      sortable: true,
    },
    {
      key: 'merchant',
      label: 'Merchant',
      render: (value: any) => <span className="font-medium">{typeof value === 'object' && value !== null ? value.name : value || '-'}</span>,
      sortable: true,
    },
    {
      key: 'funder',
      label: 'Funder',
      render: (value: any) => <span className="font-medium">{typeof value === 'object' && value !== null ? value.name : value || '-'}</span>,
      sortable: true,
    },
    {
      key: 'lender',
      label: 'Lender',
      render: (value: any) => {
        if (!value) return '-';
        if (typeof value === 'object' && value !== null) {
          return value.name || '-';
        }
        // If it's a string, only show if not an ObjectId (24 hex chars)
        if (typeof value === 'string' && value.length !== 24) {
          return value;
        }
        return '-';
      },
      sortable: true,
    },
    {
      key: 'merchant_account',
      label: 'Merchant Account',
      render: (value: any) => <span className="font-medium">{value?.name || '-'}</span>,
      sortable: false,
    },
    {
      key: 'funder_account',
      label: 'Funder Account',
      render: (value: any) => <span className="font-medium">{value?.name || '-'}</span>,
      sortable: false,
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (value: any) => value ? format(new Date(value), 'MMM dd, yyyy') : '-',
      sortable: true,
    },
    {
      key: 'submitted_date',
      label: 'Submitted Date',
      render: (value: any) => value ? format(new Date(value), 'MMM dd, yyyy') : '-',
      sortable: true,
    },
    {
      key: 'processed_date',
      label: 'Processed Date',
      render: (value: any) => value ? format(new Date(value), 'MMM dd, yyyy') : '-',
      sortable: true,
    },
    {
      key: 'responsed_date',
      label: 'Response Date',
      render: (value: any) => value ? format(new Date(value), 'MMM dd, yyyy') : '-',
      sortable: true,
    },
    {
      key: 'response',
      label: 'Response',
      render: (value: any) => <div className="max-w-xs truncate" title={value}>{value || '-'}</div>,
      sortable: false,
    },
    {
      key: 'payback_amount',
      label: 'Payback Amount',
      render: (value: any) => <span className="font-medium">{formatCurrency(value)}</span>,
      sortable: true,
    },
    {
      key: 'funded_amount',
      label: 'Funded Amount',
      render: (value: any) => <span className="text-blue-600">{formatCurrency(value)}</span>,
      sortable: true,
    },
    {
      key: 'fee_amount',
      label: 'Fee Amount',
      render: (value: any) => <span className="text-green-600">{formatCurrency(value)}</span>,
      sortable: true,
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      render: (value: any) => value,
      sortable: true,
    },
    {
      key: 'ach_processor',
      label: 'ACH Processor',
      render: (value: any) => value || '-',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any) => <StatusBadge status={value} size="xs" />,
      sortable: true,
    },
    {
      key: 'reconciled',
      label: 'Reconciled',
      render: (value: any) => <StatusBadge status={value ? 'YES' : 'NO'} size="xs" />,
      sortable: true,
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
      key: 'created_by_user',
      label: 'Created By',
      render: (value: any) => {
        if (!value) return '-';
        if (typeof value === 'string') return value;
        return `${value.first_name || ''} ${value.last_name || ''}`.trim() || value.email || '-';
      },
      sortable: true,
    },
    {
      key: 'updated_by_user',
      label: 'Updated By',
      render: (value: any) => {
        if (!value) return '-';
        if (typeof value === 'string') return value;
        return `${value.first_name || ''} ${value.last_name || ''}`.trim() || value.email || '-';
      },
      sortable: true,
    },
    {
      key: 'transaction',
      label: 'Transaction ID',
      render: (value: any) => value ? (
        <span className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
          {typeof value === 'object' ? value._id : value}
        </span>
      ) : '-',
      sortable: false,
    },
    {
      key: 'payout_count',
      label: 'Payout Count',
      render: (value: any) => value !== undefined ? value : '-',
      sortable: true,
    },
    {
      key: 'log_count',
      label: 'Log Count',
      render: (value: any) => value !== undefined ? value : '-',
      sortable: true,
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (value: any) => value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : '-',
      sortable: true,
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      render: (value: any) => value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : '-',
      sortable: true,
    },
  ];

  return (
    <div className="p-4">
      <SimpleList
        data={paybacks}
        columns={columns}
        loading={loading}
        error={error}
        emptyMessage="No paybacks found."
        title="Paybacks"
        onSearch={setSearch}
        searchQuery={search}
        pagination={{
          currentPage: page,
          totalPages,
          totalResults,
          limit: itemsPerPage,
          onPageChange: setPage,
          onLimitChange: () => {},
        }}
        renderHeaderButtons={() => (
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
        )}
        renderActions={(item: Payback) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(item)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      />
      {showCreateModal && (
        <FormModalLayout
          title="Create Payback"
          subtitle="Please fill out the details for the new payback."
          onCancel={() => setShowCreateModal(false)}
          maxWidth={700}
        >
          <CreatePayback
            fundingId={fundingId}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchPaybacks();
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </FormModalLayout>
      )}
      {showEditModal && selectedPayback && (
        <FormModalLayout
          title="Edit Payback"
          subtitle="Update the details for the payback."
          onCancel={() => setShowEditModal(false)}
          maxWidth={700}
        >
          <EditPayback
            payback={selectedPayback}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedPayback(null);
              fetchPaybacks();
            }}
            onCancel={() => setShowEditModal(false)}
          />
        </FormModalLayout>
      )}
      {showDeleteModal && selectedPayback && (
        <DeleteModal
          isOpen={showDeleteModal}
          isLoading={false}
          title="Delete Payback"
          message={`Are you sure you want to delete this payback?`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedPayback(null);
          }}
        />
      )}
    </div>
  );
} 