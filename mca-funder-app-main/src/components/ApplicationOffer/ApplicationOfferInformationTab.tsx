'use client';

import { StatusBadge } from '@/components/StatusBadge';
import { ApplicationOffer } from '@/types/applicationOffer';
import { formatNumberFourDecimals, formatNumberTwoDecimals, formatTime, formatCurrency, safeRender } from '@/lib/utils/format';
import { getDayShortName } from '@/types/day';
import EntityCard from '@/components/Cards/EntityCard';

interface ApplicationOfferInformationTabProps {
  data: ApplicationOffer;
}

export default function ApplicationOfferInformationTab({ data }: ApplicationOfferInformationTabProps) {

  return (
    <div className="p-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information Card */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Offer Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Offer ID</p>
                <h3 className="text-md font-semibold text-gray-800">{data._id}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Offered At</p>
                <h3 className="text-md font-semibold text-gray-800">{data.offered_date ? formatTime(data.offered_date) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Offered By</p>
                <h3 className="text-md font-semibold text-gray-800">{data.offered_by_user ? data.offered_by_user.first_name + ' ' + data.offered_by_user.last_name : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <StatusBadge status={data.status} size="sm" />
                </h3>
              </div>
            </div>
          </div>

          {/* Financial Details Card */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Details</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Offered Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{data.offered_amount ? formatCurrency(data.offered_amount) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Payback Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{data.payback_amount ? formatCurrency(data.payback_amount) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Commission Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{data.commission_amount ? formatCurrency(data.commission_amount) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Fee Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{data.fee_amount ? formatCurrency(data.fee_amount) : 'N/A'}</h3>
              </div>

              {/* Fee List */}
              {data.fee_list && data.fee_list.length > 0 && (
                <div className="w-full col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Fees</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {data.fee_list.map((fee, index) => (
                      <li key={index} className="text-md font-semibold text-gray-700">
                        {fee?.name || `No Name Fee`}: {formatCurrency(fee.amount)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expense List */}
              {data.expense_list && data.expense_list.length > 0 && (
                <div className="w-full col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Expenses</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {data.expense_list.map((expense, index) => (
                      <li key={index} className="text-md font-semibold text-gray-700">
                        {expense?.name || `No Name Expense`}: {formatCurrency(expense.amount)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Disbursement Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{data.disbursement_amount ? formatCurrency(data.disbursement_amount) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Factor Rate</p>
                <h3 className="text-md font-semibold text-gray-800">{data.factor_rate ? formatNumberFourDecimals(data.factor_rate) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Buy Rate</p>
                <h3 className="text-md font-semibold text-gray-800">{data.buy_rate ? formatNumberFourDecimals(data.buy_rate) : 'N/A'}</h3>
              </div>
            </div>
          </div>

          {/* Payment Schedule Card Details */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Schedule</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Payback Count</p>
                <h3 className="text-md font-semibold text-gray-800">{data.payback_count ? `${data.payback_count} payments` : '-'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Frequency</p>
                <h3 className="text-md font-semibold text-gray-800"><StatusBadge status={data.frequency} size="sm" /></h3>
              </div>

              {/* Payday List */}
              {data.payday_list && data.payday_list.length > 0 && (
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Paydays</p>
                  <div className="flex flex-wrap gap-2">
                    {data.payday_list.map((payday, index) => (
                      <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {data.frequency === 'MONTHLY' ? `${payday}${payday === 1 ? 'st' : payday === 2 ? 'nd' : payday === 3 ? 'rd' : 'th'}` : getDayShortName(payday as 1 | 2 | 3 | 4 | 5 | 6 | 7)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Term Length</p>
                <h3 className="text-md font-semibold text-gray-800">{formatNumberTwoDecimals(data.term_length) || 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Payment Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{data.payment_amount ? formatCurrency(data.payment_amount) : 'N/A'}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Application Information */}
          {data.application && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Application Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.application.name)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Application ID</p>
                  <h3 className="text-md font-semibold text-gray-800">{data.application._id}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Request Amount</p>
                  <h3 className="text-md font-semibold text-gray-800">{data.application.request_amount ? formatCurrency(data.application.request_amount) : 'N/A'}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Entity Cards */}
          {data.merchant && <EntityCard data={data.merchant} title="Merchant Information" />}
          {data.funder && <EntityCard data={data.funder} title="Funder Information" />}
          {data.lender && <EntityCard data={data.lender} title="Lender Information" />}
          {data.iso && <EntityCard data={data.iso} title="ISO Information" />}
        </div>
      </div>
    </div>
  );
} 