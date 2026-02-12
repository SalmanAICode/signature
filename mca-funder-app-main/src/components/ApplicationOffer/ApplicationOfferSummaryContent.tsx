'use client';

import { ApplicationOffer } from '@/types/applicationOffer';
import { formatCurrency, formatTime } from "@/lib/utils/format";
import { StatusBadge } from '@/components/StatusBadge';
import { DayNumber } from '@/types/day';
import { getDayShortName } from '@/types/day';
import { EntityPreviewSummary } from '@/components/EntityPreview';

interface ApplicationOfferSummaryContentProps {
  data: ApplicationOffer;
}

export default function ApplicationOfferSummaryContent({ data }: ApplicationOfferSummaryContentProps) {
  return (
    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* Application Offer Basic Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Application Name</p>
        <h3 className="text-md font-semibold text-gray-800">{data.application.name}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Status</p>
        <h3 className="text-md font-semibold text-gray-800">
          <StatusBadge status={data.status} size="sm" />
        </h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-300" />

      {/* Entity Information - All on same line */}
      <div className="col-span-2 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Merchant</p>
          <EntityPreviewSummary entity={data?.merchant} />
        </div>

        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Funder</p>
          <EntityPreviewSummary entity={data?.funder} />
        </div>
      </div>

      {/* Entity Information - All on same line */}
      <div className="col-span-2 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Lender</p>
          <EntityPreviewSummary entity={data?.lender} />
        </div>

        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">ISO</p>
          <EntityPreviewSummary entity={data?.iso} />
        </div>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-300" />
      <div className="col-span-2 grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Offered Amount</p>
          <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.offered_amount)}</h3>
        </div>

        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Payback Amount</p>
          <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.payback_amount)}</h3>
        </div>

        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Commission Amount</p>
          <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.commission_amount || 0)}</h3>
        </div>
      </div>

      <div className="col-span-2 grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Fee Amount</p>
          <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.fee_amount)}</h3>
        </div>

        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Factor Rate</p>
          <h3 className="text-md font-semibold text-gray-800">{data?.factor_rate ? data.factor_rate.toFixed(2) : 'N/A'}</h3>
        </div>

        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Buy Rate</p>
          <h3 className="text-md font-semibold text-gray-800">{data?.buy_rate ? data.buy_rate.toFixed(2) : 'N/A'}</h3>
        </div>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Frequency</p>
        <h3 className="text-md font-semibold text-gray-800"><StatusBadge status={data?.frequency} size="sm" /></h3>
      </div>

      {/* Payday Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Paydays</p>
        <div className="text-md font-semibold text-gray-800">
          {data?.payday_list && data.payday_list.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.payday_list.map((payday, index) => (
                <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {data.frequency === 'MONTHLY' ? `${payday}${payday === 1 ? 'st' : payday === 2 ? 'nd' : payday === 3 ? 'rd' : 'th'}` : getDayShortName(payday as 1 | 2 | 3 | 4 | 5 | 6 | 7)}
                </span>
              ))}
            </div>
          ) : (
            'No paydays specified'
          )}
        </div>
      </div>

      <div className="col-span-2 grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Payback Count</p>
          <h3 className="text-md font-semibold text-gray-800">{data?.payback_count || 'N/A'}</h3>
        </div>

        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Term Length</p>
          <h3 className="text-md font-semibold text-gray-800">{data?.term_length || 'N/A'}</h3>
        </div>

        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Each Payment Amount</p>
          <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.payment_amount)}</h3>
        </div>
      </div>
      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Offered By */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Offered By</p>
        <h3 className="text-md font-semibold text-gray-800">{data?.offered_by_user ? data.offered_by_user.first_name + ' ' + data.offered_by_user.last_name : '-'}</h3>
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Offered Date</p>
        <h3 className="text-md font-semibold text-gray-800">{data?.offered_date ? formatTime(data.offered_date) : 'N/A'}</h3>
      </div>
    </div>
  );
} 