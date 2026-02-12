import React, { useState, useEffect } from 'react';
import { Funding } from '@/types/funding';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { formatPaydayList } from '@/lib/utils/paydayUtils';
import { DayNumber } from '@/types/day';
import { ApplicationOffer as ApplicationOfferType } from '@/types/applicationOffer';
// import { getApplicationOfferById } from '@/lib/api/applicationOffer';

export default function ApplicationOffer({ data }: { data: Funding }) {
  /* we might need to fetch the application offer data here if it is a string */
  // const [offer, setOffer] = useState<ApplicationOfferType | null>(null);
  // const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   async function fetchOffer() {
  //     if (!data.application_offer) return;

  //     if (typeof data.application_offer === 'string') {
  //       setLoading(true);
  //       try {
  //         const response = await getApplicationOfferById(data.application_offer);
  //         setOffer(response);
  //       } catch (error) {
  //         console.error('Error fetching application offer:', error);
  //         setOffer(null);
  //       } finally {
  //         setLoading(false);
  //       }
  //     } else {
  //       setOffer(data.application_offer as ApplicationOfferType);
  //     }
  //   }

  //   fetchOffer();
  // }, [data.application_offer]);

  // if (loading) {
  //   return <div className="p-4 w-full text-center text-gray-500">Loading application offer information...</div>;
  // }

  // if (!offer) {
  //   return <div className="p-4 w-full text-center text-gray-500">No application offer information available.</div>;
  // }

  if (!data.application_offer) {
    return <div className="p-4 w-full text-center text-gray-500">No application offer information available.</div>;
  }

  const offer = data.application_offer as ApplicationOfferType;

  if (!offer) {
    return <div className="p-4 w-full text-center text-gray-500">No application offer information available.</div>;
  }


  return (
    <div className="p-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Offer Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Offer ID</p>
                <h3 className="text-md font-semibold text-gray-800">{offer._id}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={offer.status} size="sm" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Inactive</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={offer.inactive} size="sm" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Offered Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.offered_amount ? formatCurrency(offer.offered_amount) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Payback Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.payback_amount ? formatCurrency(offer.payback_amount) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Installment</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.installment ?? 'N/A'}</h3>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Details</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Commission Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.commission_amount ? formatCurrency(offer.commission_amount) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Disbursement Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.disbursement_amount != null ? formatCurrency(offer.disbursement_amount) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Payment Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.payment_amount != null ? formatCurrency(offer.payment_amount) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Factor Rate</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.factor_rate != null ? offer.factor_rate.toFixed(2) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Buy Rate</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.buy_rate != null ? offer.buy_rate.toFixed(2) : 'N/A'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Transmission Method</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.transmission_method ?? 'N/A'}</h3>
              </div>
            </div>
          </div>

          {/* Terms Details */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Terms</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Payback Count</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {offer.payback_count != null ? `${offer.payback_count} payments` : offer.payback_length != null ? `${offer.payback_length} days` : 'N/A'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Term Length</p>
                <h3 className="text-md font-semibold text-gray-800">{offer.term_length != null ? offer.term_length.toFixed(2) : 'N/A'}</h3>
              </div>
            </div>
          </div>

          {/* Payment Schedule */}
          {offer.payday_list && offer.payday_list.length > 0 && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Schedule</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Frequency Section */}
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Frequency</p>
                  <div className="mt-1">
                    <StatusBadge status={offer.frequency} size="xs" />
                  </div>
                </div>

                {/* Payment Days Section */}
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Payment Days</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {offer.payday_list.map((payday, index) => (
                      <span key={index} className="inline-block">
                        <StatusBadge status={formatPaydayList([payday as DayNumber], offer.frequency)} size="xs" />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Funder Information */}
          {offer.funder && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Funder Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Funder Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{offer.funder.name ?? 'N/A'}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {offer.funder.email ? (
                      <a href={`mailto:${offer.funder.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {offer.funder.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {offer.funder.phone ? (
                      <a href={`tel:${offer.funder.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {offer.funder.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}


          {/* Merchant Information */}
          {offer.merchant && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Merchant Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Business Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{offer.merchant.name ?? 'N/A'}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {offer.merchant.email ? (
                      <a href={`mailto:${offer.merchant.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {offer.merchant.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {offer.merchant.phone ? (
                      <a href={`tel:${offer.merchant.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {offer.merchant.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* ISO Information */}
          {offer.iso && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ISO Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">ISO Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{offer.iso.name ?? '-'}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {offer.iso.email ? (
                      <a href={`mailto:${offer.iso.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {offer.iso.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {offer.iso.phone ? (
                      <a href={`tel:${offer.iso.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {offer.iso.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Fee List */}
          {offer.fee_list && offer.fee_list.length > 0 && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Fees</h3>
              <ul className="list-disc list-inside space-y-1">
                {offer.fee_list.map((fee, index) => (
                  <li key={index} className="text-md font-medium text-black">
                    Fee - {fee.fee_type.name}: {formatCurrency(fee.amount)}
                  </li>
                ))}
              </ul>
            </div>
          )}


          {/* Record Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Created Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(offer.createdAt)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Updated Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(offer.updatedAt)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={offer.inactive ? 'Inactive' : 'Active'} size="xs" />
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 