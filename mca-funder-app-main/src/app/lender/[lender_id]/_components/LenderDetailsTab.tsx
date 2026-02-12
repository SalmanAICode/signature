'use client';

import { Lender } from '@/types/lender';
import { formatDate, formatPhone, formatCurrency, formatAddress } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';

interface LenderDetailsTabProps {
  lender: Lender;
}

export default function LenderDetailsTab({ lender }: LenderDetailsTabProps) {
  return (
    <div className="p-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Lender ID</p>
                <h3 className="text-md font-semibold text-gray-800">{lender._id}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Name</p>
                <h3 className="text-md font-semibold text-gray-800">{lender.name}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Type</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <StatusBadge status={lender.type} size="xs" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <StatusBadge status={lender.inactive ? "Inactive" : "Active"} size="xs" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Email</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {lender.email ? (
                    <a 
                      href={`mailto:${lender.email}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {lender.email}
                    </a>
                  ) : '-'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {lender.phone ? (
                    <a 
                      href={`tel:${lender.phone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {formatPhone(lender.phone)}
                    </a>
                  ) : '-'}
                </h3>
              </div>

              {lender.website && (
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Website</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    <a 
                      href={lender.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {lender.website}
                    </a>
                  </h3>
                </div>
              )}
            </div>
          </div>

          {/* Business Details */}
          {lender.business_detail && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Details</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">EIN</p>
                  <h3 className="text-md font-semibold text-gray-800">{lender.business_detail.ein || '-'}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Entity Type</p>
                  <h3 className="text-md font-semibold text-gray-800">{lender.business_detail.entity_type || '-'}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Incorporation Date</p>
                  <h3 className="text-md font-semibold text-gray-800">{lender.business_detail.incorporation_date || '-'}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Incorporation State</p>
                  <h3 className="text-md font-semibold text-gray-800">{lender.business_detail.incorporation_state || '-'}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">State of Incorporation</p>
                  <h3 className="text-md font-semibold text-gray-800">{lender.business_detail.state_of_incorporation || '-'}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Address Details */}
          {lender.address_detail && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Details</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left col-span-2">
                  <p className="text-xs font-medium text-gray-500">Full Address</p>
                  <h3 className="text-md font-semibold text-gray-800">{formatAddress(lender.address_detail)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Street Address</p>
                  <h3 className="text-md font-semibold text-gray-800">{lender.address_detail.address_1}</h3>
                </div>

                {lender.address_detail.address_2 && (
                  <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                    <p className="text-xs font-medium text-gray-500">Address Line 2</p>
                    <h3 className="text-md font-semibold text-gray-800">{lender.address_detail.address_2}</h3>
                  </div>
                )}

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">City</p>
                  <h3 className="text-md font-semibold text-gray-800">{lender.address_detail.city}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">State</p>
                  <h3 className="text-md font-semibold text-gray-800">{lender.address_detail.state}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">ZIP Code</p>
                  <h3 className="text-md font-semibold text-gray-800">{lender.address_detail.zip}</h3>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4 border-gray-200 bg-gray-50 overflow-x-auto">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Users & Accounts</h4>
                <div className="flex flex-row flex-wrap gap-4 md:gap-8">
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Users</p>
                    <h3 className="text-md font-semibold text-gray-800">{lender.user_count || 0}</h3>
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Accounts</p>
                    <h3 className="text-md font-semibold text-gray-800">{lender.account_count || 0}</h3>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4 border-gray-200 bg-gray-50 overflow-x-auto">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Applications & Fundings</h4>
                <div className="flex flex-row flex-wrap gap-4 md:gap-8">
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Application Offers</p>
                    <h3 className="text-md font-semibold text-gray-800">{lender.application_offer_count || 0}</h3>
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Fundings</p>
                    <h3 className="text-md font-semibold text-gray-800">{lender.funding_count || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Available Balance</p>
                <h3 className="text-md font-semibold text-gray-800">{formatCurrency(lender.available_balance)}</h3>
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Date Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Created Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(lender.createdAt)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Updated Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(lender.updatedAt)}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 