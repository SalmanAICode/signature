// Define the columns for the Syndication table
import { ColumnConfig } from "@/components/GenericList/types";
import { Syndication } from "@/types/syndication";
import { formatCurrency, renderStatusBadge } from "@/components/GenericList/utils";
import { formatDate } from "@/lib/utils/format";
import { renderEntity } from "@/components/EntityPreview";
import { renderSyndicator } from "@/components/SyndicatorPreview";

const renderPercentage = (value: number) => `${value}%`;

// Default columns in specified order
export const columns: ColumnConfig<Syndication>[] = [
  // Basic Information (Default visible columns)
  { key: "funder", label: "Funder", render: (value) => renderEntity(value), visible: true },
  { key: "lender", label: "Lender", render: (value) => renderEntity(value), visible: true },
  { key: "syndicator", label: "Syndicator", render: (value) => renderSyndicator(value), visible: true },
  { key: "participate_amount", label: "Participate Amount", render: formatCurrency, visible: true },
  { key: "participate_percent", label: "Participate (%)", render: renderPercentage, visible: true },
  { key: "payback_amount", label: "Payback Amount", render: formatCurrency, visible: true },
  { key: "payout_amount", label: "Payout Amount", render: formatCurrency, visible: true },
  { key: "factor_rate", label: "Factor Rate", render: (value: number) => value?.toFixed(2) || '-', visible: true },
  { key: "buy_rate", label: "Buy Rate", render: (value: number) => value?.toFixed(2) || '-', visible: true },
  { key: "start_date", label: "Start Date", render: formatDate, visible: true },
  { key: "status", label: "Status", render: (value: string) => renderStatusBadge(value || 'pending'), visible: true },
  
  // Additional columns (hidden by default)
  { key: "syndicated_amount", label: "Syndicated Amount", render: formatCurrency, visible: false },
  { key: "total_funded_amount", label: "Total Funded", render: formatCurrency, visible: false },
  { key: "total_payback_amount", label: "Total Payback", render: formatCurrency, visible: false },
  { key: "end_date", label: "End Date", render: formatDate, visible: false },
  
  // System Fields (hidden by default)
  { key: "createdAt", label: "Created Date", render: formatDate, visible: false },
  { key: "updatedAt", label: "Updated Date", render: formatDate, visible: false },
]; 