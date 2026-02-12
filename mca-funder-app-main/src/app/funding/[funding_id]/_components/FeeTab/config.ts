import type { Column } from '@/components/SimpleList';
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { renderStatusBadge } from "@/components/StatusBadge";
import { FundingFee } from '@/types/fundingFee';

export const columns: Column<FundingFee>[] = [
    {
        key: 'fee_type.name',
        label: 'Fee Type',
        sortable: true
    },
    {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        render: formatCurrency
    },
    {
        key: 'note',
        label: 'Note',
        sortable: true
    },
    {
        key: 'inactive',
        label: 'Status',
        sortable: true,
        render: renderStatusBadge
    },
    {
        key: 'fee_date',
        label: 'Fee Date',
        sortable: true,
        render: formatDate
    }
    // {
    //     key: 'createdAt',
    //     label: 'Created Date',
    //     sortable: true,
    //     render: formatDate
    // },
    // {
    //     key: 'updatedAt',
    //     label: 'Updated Date',
    //     sortable: true,
    //     render: formatDate
    // }
];