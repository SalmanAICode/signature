import { RedFlag } from "@/svg/RedFlag";
import { getStatusColors } from "@/lib/utils/statusColors";

type StatusBadgeProps = {
  status: string | boolean;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
};

export function StatusBadge({ status, color, size = 'xs' }: StatusBadgeProps) {
  let normalizedStatus: string;

  if (typeof status === 'boolean') {
    normalizedStatus = status ? 'YES' : 'NO';
  } else if (typeof status === 'string') {
    normalizedStatus = status.toUpperCase();
  } else {
    normalizedStatus = 'Unknown';
  }

  // If custom color is provided, use inline styles
  if (color) {
    return (
      <span 
        className={`inline-block px-3 py-1 font-bold rounded-md ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'}`}
        style={{ backgroundColor: color, color: '#F8F8F8' }}
      >
        {normalizedStatus}
      </span>
    );
  }

  // Otherwise use automatic color selection
  const statusStyles: Record<string, string> = {
    CREATED: "text-blue-700 bg-blue-50",
    DISBURSED: "text-green-700 bg-green-50",
    BEFORE_FIRST_PAYBACK: "text-yellow-700 bg-yellow-50",
    ONTIME: "text-green-700 bg-green-50",
    DELAYED: "text-orange-700 bg-orange-50",
    SLOW_PAYBACK: "text-red-700 bg-red-50",
    COMPLETED: "text-purple-700 bg-purple-50",
    DEFAULT: "text-red-700 bg-red-50",
    DECLINED: "text-red-700 bg-red-50",
    PENDING: "text-yellow-700 bg-yellow-50",
    ACCEPTED: "text-green-700 bg-blue-50",
    ACTIVE: "text-green-700 bg-green-50",
    INACTIVE: "text-red-700 bg-red-50",
    YES: "text-green-700 bg-green-50",
    NO: "text-red-700 bg-red-50",
    ADMIN: "text-purple-700 bg-purple-50",
    USER: "text-blue-700 bg-blue-50",
    ONLINE: "text-green-700 bg-green-50",
    OFFLINE: "text-red-700 bg-red-50",
    OFFERED: "text-blue-700 bg-blue-100",
    REJECTED: "text-red-700 bg-red-50",
    HIGH: "text-red-700 bg-red-50",
    LOW: "text-green-700 bg-green-50",
    UNKNOWN: "text-gray-700 bg-gray-100",
    DAILY: "bg-blue-100 text-blue-800",
    WEEKLY: "bg-green-100 text-green-800",
    MONTHLY: "bg-purple-100 text-purple-800",
    RECEIVED: "bg-green-100 text-green-800",
    VERIFIED: "bg-yellow-100 text-yellow-800",
    WAIVED: "bg-gray-100 text-gray-800",
    REQUESTED: "bg-red-100 text-red-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    SUCCEED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    PROCESSING: "text-orange-700 bg-orange-100",
  };

  // Use statusStyles if available, otherwise fall back to getStatusColors
  if (statusStyles[normalizedStatus]) {
    return (
      <span 
        className={`inline-block px-3 py-1 rounded-md font-bold ${statusStyles[normalizedStatus]} ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'}`}
      >
        {normalizedStatus}
      </span>
    );
  }

  // Fallback to getStatusColors for unknown statuses
  const { bg, text } = getStatusColors(normalizedStatus);

  return (
    <span 
      className={`inline-block px-3 py-1 rounded-md font-bold ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {normalizedStatus}
    </span>
  );
}

export function PriorityFlag({ priority }: { priority: string | boolean }) {
  const shouldRender = priority === 'TRUE' || priority === true;
  return shouldRender ? <RedFlag /> : null;
}

// for column rendering
export const renderStatusBadge = (value: string | boolean) => {
  return <StatusBadge status={value} />;
};

export const renderStatusBadgeWithColor = (value: string | boolean, row?: any) => {
  const color = row?.status?.bgcolor;
  return <StatusBadge status={value} color={color} />;
}; 

export const renderPriority = (value: string | boolean) => {
  const shouldRender = value === 'TRUE' || value === true;
  return shouldRender ? <RedFlag /> : null;
};

