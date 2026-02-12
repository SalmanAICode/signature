import type { Column } from '@/components/SimpleList';
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { renderStatusBadge } from "@/components/StatusBadge";
import { FundingCredit } from '@/types/fundingCredit';

export const columns: Column<FundingCredit>[] = [
    {
        key: 'credit_date',
        label: 'Credit Date',
        render: formatDate,
        sortable: true
    },
    {
        key: 'amount',
        label: 'Amount',
        render: formatCurrency,
        sortable: true
    },
    {
        key: 'note',
        label: 'Note',
        render: (value: string) => value || '-',
        sortable: true
    },

    {
        key: 'inactive',
        label: 'Status',
        render: (value: boolean) => renderStatusBadge(value ? 'Inactive' : 'Active'),
        sortable: true
    },

    // {
    //     key: 'createdAt',
    //     label: 'Created Date',
    //     render: formatDate
    // },
    // {
    //     key: 'updatedAt',
    //     label: 'Updated Date',
    //     render: formatDate
    // }
];