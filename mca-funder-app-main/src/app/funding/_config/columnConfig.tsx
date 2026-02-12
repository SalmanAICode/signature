// Updated: Removed duplicate keys to fix React duplicate key error
import { ColumnConfig } from "@/components/GenericList/types";
import { Funding, UpdateFundingData } from "@/types/funding";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/format";
import { renderStatusBadge, renderStatusBadgeWithColor } from "@/components/StatusBadge";
import { renderEntity } from "@/components/EntityPreview";
import { renderUser } from "@/components/UserPreview";
import { toast } from "react-hot-toast";
import { User } from "@/types/user";
import { renderFollowerControl } from "@/components/FollowerControl";
import { updateFunding } from "@/lib/api/fundings";
import { getFundingStatusList } from "@/lib/api/fundingStatuses";
import { useState } from "react";
import { StaticSelector } from '@/components/StatusSelector/StaticSelector';
import UpdateModal from '@/components/UpdateModal';
import { StatusBadge } from '@/components/StatusBadge';

const createFollowerListRenderer = (onUpdateData: (id: string, newData: Funding) => void) => {
  return (value: any, row?: Funding) => {
    if (!row) return null;
    const followers = row?.follower_list || [];
    const assignedUser = (row?.assigned_user && typeof row.assigned_user === 'object' && row.assigned_user._id) ? row.assigned_user._id : '';
    const assignedManager = (row?.assigned_manager && typeof row.assigned_manager === 'object' && row.assigned_manager._id) ? row.assigned_manager._id : '';
    return renderFollowerControl({ 
      followers, 
      assignedUser, 
      assignedManager, 
      onClick: async (newFollowers) => {
        if (row?._id) {
          try {
            const updatedData = await updateFunding(row._id, { follower_list: newFollowers } as any);
            onUpdateData(row._id, updatedData);
            if (newFollowers.length > 0) {
              toast.success('Followed successfully');
            } else {
              toast.success('Unfollowed successfully');
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update followers');
          }
        }
      } 
    });
  }
};

// Wrapper component to handle funding status updates
const FundingStatusSelectorWrapper = ({ item, onUpdateData, statusOptions }: { 
  item: Funding; 
  onUpdateData: (id: string, newData: Funding) => void;
  statusOptions: any[];
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<any>(null);

    // Find the current status object from options
    let statusValue = statusOptions.find(opt => {
        if (!item.status) return false;
        if (opt._id && typeof item.status === 'object' && '_id' in item.status) return String(opt._id) === String(item.status._id);
        if (opt._id && typeof item.status === 'object' && 'id' in item.status) return String(opt._id) === String(item.status.id);
        if (opt._id && typeof item.status === 'string') return String(opt._id) === String(item.status);
        return opt === item.status;
    }) || null;

    // If not found, but item.status exists, create a fallback option
    let selectOptions = statusOptions;
    if (!statusValue && item.status) {
        statusValue = item.status;
        selectOptions = [item.status, ...statusOptions];
    }

    const handleStatusUpdate = (newStatus: any) => {
        setPendingStatus(newStatus);
        if (newStatus && newStatus.closed === true) {
            setShowModal(true);
        } else {
            doUpdate(newStatus);
        }
    };

    const doUpdate = async (newStatus: any) => {
        setIsLoading(true);
        try {
            const response = await updateFunding(item._id, {
                status: newStatus._id,
            });
            // The response has a data property containing the Funding
            onUpdateData(item._id, response.data);
            toast.success('Status updated successfully');
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (pendingStatus) {
            await doUpdate(pendingStatus);
        }
        setShowModal(false);
        setPendingStatus(null);
    };

    const handleCancel = () => {
        setShowModal(false);
        setPendingStatus(null);
    };

    const getOptionLabel = (status: any) => status.name;
    const getOptionColor = (status: any) => status.bgcolor;
    const getOptionClosed = (status: any) => status.closed === true;

    return (
        <>
            <div onClick={(e) => e.stopPropagation()}>
                <StaticSelector<any>
                    value={statusValue}
                    options={selectOptions}
                    onUpdate={handleStatusUpdate}
                    width="150px"
                    isLoading={isLoading}
                    getOptionLabel={getOptionLabel}
                    getOptionColor={getOptionColor}
                    getOptionClosed={getOptionClosed}
                />
            </div>
            <UpdateModal
                isOpen={showModal}
                title="Confirm Status Change"
                message={`Are you sure you want to change status to "${pendingStatus ? getOptionLabel(pendingStatus) : ''}"?`}
                confirmButtonText="Confirm"
                cancelButtonText="Cancel"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isLoading={isLoading}
            />
        </>
    );
};

export const columns = (onUpdateData?: (id: string, newData: Funding) => void, statusOptions: any[] = []): ColumnConfig<Funding>[] => [
  { key: "_id", label: "Funding ID", visible: false },
  {
    key: "name",
    label: "Funding Name",
    visible: true,
    render: (value, row) => {
      if (value) return value;
      
      const merchantName = row?.merchant?.name || '';
      const date = row?.createdAt ? new Date(row.createdAt) : new Date();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      const amount = row?.funded_amount ? formatCurrency(row.funded_amount / 100) : '';
      return `${merchantName} | ${month} '${year}${amount ? ` | ${amount}` : ''}`;
    }
  },
  {
    key: "lender",
    label: "Lender",
    render: renderEntity,
    visible: true
  },
  {
    key: "funder",
    label: "Funder",
    render: renderEntity,
    visible: true
  },
  {
    key: "merchant",
    label: "Merchant",
    render: renderEntity,
  },
  {  
    key: "iso", 
    label: "ISO", 
    render: renderEntity, 
    visible: true 
  },
  {
    key: "assigned_manager",
    label: "Assigned Manager",
    render: (_value, row) => row?.assigned_manager ? require('@/components/UserPreview').renderUser(row.assigned_manager, row) : '-',
    visible: true
  },
  {
    key: "assigned_user",
    label: "Assigned User",
    render: (_value, row) => row?.assigned_user ? require('@/components/UserPreview').renderUser(row.assigned_user, row) : '-',
    visible: true
  },
  { key: "follower_list", label: "Follow", render: createFollowerListRenderer(onUpdateData || (() => {})) },
  { 
    key: "type", 
    label: "Type", 
    render: renderStatusBadge 
  },
  { 
    key: "funded_amount", 
    label: "Funded Amount", 
    render: (value: number | undefined) => formatCurrency(value ?? 0) 
  },
  { 
    key: "payback_amount", 
    label: "Payback Amount", 
    render: (value: number | undefined) => formatCurrency(value ?? 0) 
  },
  { 
    key: "factor_rate", 
    label: "Factor Rate", 
    render: (value) => value?.toFixed ? value.toFixed(4) : value
   },
  { 
    key: "buy_rate", 
    label: "Buy Rate", 
    render: (value) => value?.toFixed ? value.toFixed(4) : value 
  },
  { 
    key: "syndication_percent", 
    label: "Syndication %", 
    render: (value) => value?.toFixed ? value.toFixed(2) + '%' : value, 
    visible: true 
  },
  { 
    key: "paid_amount", 
    label: "Paid Amount", 
    render: (value: number | undefined) => formatCurrency(value ?? 0), 
    visible: true
  },
  { 
    key: "succeed_rate", 
    label: "Success Rate", 
    render: (value) => value?.toFixed ? value.toFixed(2) + '%' : value 
  },
  {
    key: 'status.name',
    label: 'Status',
    visible: true,
    render: (_value, row) => {
      if (!row || !onUpdateData) {
        if (typeof row?.status === 'object' && row?.status !== null) return row.status.name || '-';
        if (typeof row?.status === 'string') return row.status;
        return '-';
      }
      return <FundingStatusSelectorWrapper item={row} onUpdateData={onUpdateData} statusOptions={statusOptions} />;
    }
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    visible: true,
    render: (value) => value ? formatDate(value) : '-',
  },
  {
    key: 'updatedAt',
    label: 'Last Updated',
    visible: true,
    render: (value) => value ? formatDate(value) : '-',
  },
  {
    key: 'syndicator_list',
    label: 'Syndicators',
    visible: true,
    render: (_value, row) => Array.isArray(row?.syndicator_list) ? row.syndicator_list.map(s => s.name || s.email).join(', ') : '-',
  },
  {
    key: 'net_amount',
    label: 'Net Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'upfront_fee_amount',
    label: 'Upfront Fees',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'residual_fee_amount',
    label: 'Residual Fees',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'total_fee_amount',
    label: 'Total Fees',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'commission_amount',
    label: 'Commission Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'total_expense_amount',
    label: 'Total Expenses',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'credit_amount',
    label: 'Credit Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'remaining_balance',
    label: 'Remaining Balance',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'remaining_payback_amount',
    label: 'Remaining Payback',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'remaining_fee_amount',
    label: 'Remaining Fees',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'payout_amount',
    label: 'Payout Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'management_amount',
    label: 'Management Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'created_by_user',
    label: 'Created By',
    visible: true,
    render: (_value, row) => {
      const user = row?.created_by_user;
      if (user && typeof user === 'object') {
        if ('name' in user && typeof user.name === 'string') return user.name;
        if ('email' in user && typeof user.email === 'string') return user.email;
      }
      return typeof user === 'string' ? user : '-';
    }
  },
  {
    key: 'updated_by_user',
    label: 'Updated By',
    visible: true,
    render: (_value, row) => {
      const user = row?.updated_by_user;
      if (user && typeof user === 'object') {
        if ('name' in user && typeof user.name === 'string') return user.name;
        if ('email' in user && typeof user.email === 'string') return user.email;
      }
      return typeof user === 'string' ? user : '-';
    }
  },
  {
    key: 'status.initial',
    label: 'Is Initial',
    visible: true,
    render: (_value, row) => typeof row?.status === 'object' && 'initial' in row.status && row.status.initial ? '✔️' : '',
  },
  {
    key: 'status.funded',
    label: 'Is Funded',
    visible: true,
    render: (_value, row) => typeof row?.status === 'object' && 'funded' in row.status && row.status.funded ? '✔️' : '',
  },
  {
    key: 'status.performing',
    label: 'Is Performing',
    visible: true,
    render: (_value, row) => typeof row?.status === 'object' && 'performing' in row.status && row.status.performing ? '✔️' : '',
  },
  {
    key: 'status.warning',
    label: 'Is Warning',
    visible: true,
    render: (_value, row) => typeof row?.status === 'object' && 'warning' in row.status && row.status.warning ? '✔️' : '',
  },
  {
    key: 'status.closed',
    label: 'Is Closed',
    visible: true,
    render: (_value, row) => typeof row?.status === 'object' && 'closed' in row.status && row.status.closed ? '✔️' : '',
  },
  {
    key: 'status.defaulted',
    label: 'Is Defaulted',
    visible: true,
    render: (_value, row) => typeof row?.status === 'object' && 'defaulted' in row.status && row.status.defaulted ? '✔️' : '',
  },
  {
    key: 'payback_plan_count',
    label: 'Payback Plan Count',
    visible: true,
  },
  {
    key: 'payback_succeed_count',
    label: 'Payback Succeed Count',
    visible: true,
  },
  {
    key: 'payback_failed_count',
    label: 'Payback Failed Count',
    visible: true,
  },
  {
    key: 'payback_bounced_count',
    label: 'Payback Bounced Count',
    visible: true,
  },
  {
    key: 'payback_disputed_count',
    label: 'Payback Disputed Count',
    visible: true,
  },
  {
    key: 'payback_plan_amount',
    label: 'Payback Plan Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'payback_succeed_amount',
    label: 'Payback Succeed Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'payback_failed_amount',
    label: 'Payback Failed Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'payback_bounced_amount',
    label: 'Payback Bounced Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'payback_disputed_amount',
    label: 'Payback Disputed Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'disbursement_intent_count',
    label: 'Disbursement Intent Count',
    visible: true,
  },
  {
    key: 'disbursement_succeed_count',
    label: 'Disbursement Succeed Count',
    visible: true,
  },
  {
    key: 'disbursement_scheduled_amount',
    label: 'Disbursement Scheduled Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'disbursement_paid_amount',
    label: 'Disbursement Paid Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'disbursement_unscheduled_amount',
    label: 'Disbursement Unscheduled Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'disbursement_remaining_amount',
    label: 'Disbursement Remaining Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'syndication_offer_count',
    label: 'Syndication Offer Count',
    visible: true,
  },
  {
    key: 'syndication_count',
    label: 'Syndication Count',
    visible: true,
  },
  {
    key: 'syndication_amount',
    label: 'Syndication Amount',
    visible: true,
    render: (value) => formatCurrency(value ?? 0),
  },
  {
    key: 'active_syndication_count',
    label: 'Active Syndication Count',
    visible: true,
  },
  {
    key: 'internal',
    label: 'Internal',
    visible: true,
    render: (value) => <StatusBadge status={value ? 'YES' : 'NO'} size="xs" />,
  },
  {
    key: 'inactive',
    label: 'Inactive',
    visible: false,
    render: (value) => value ? '✔️' : '',
  },
  {
    key: 'position',
    label: 'Position/Order',
    visible: true,
  },
]; 