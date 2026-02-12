'use client';

import { useRouter } from 'next/navigation';
import { formatDate, formatFullAddress } from '@/lib/utils/format';
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, GlobeAltIcon, IdentificationIcon, BuildingOffice2Icon, CalendarIcon, MapPinIcon, UsersIcon, DocumentTextIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useContactMerchants } from '@/hooks/useContactMerchants';

const MerchantSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface ContactMerchantsTabProps {
  contactId: string;
}

export default function ContactMerchantsTab({ contactId }: ContactMerchantsTabProps) {
  const { merchants, loading, error } = useContactMerchants(contactId);
  const router = useRouter();

  if (loading) return <MerchantSkeleton />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-semibold">Error</h2>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 h-[calc(100vh-300px)] overflow-y-auto">
      <button
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6"
        onClick={() => router.push('/contact')}
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span className="font-medium">Back</span>
      </button>
      {merchants.length === 0 ? (
        <p className="text-gray-500">No merchants associated with this contact.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {merchants.map((merchant) => (
            <div key={merchant._id} className="bg-gray-50 rounded-xl p-6 shadow-sm flex flex-col h-full">
              <div className="mb-2 flex items-center gap-2">
                <BuildingOffice2Icon className="h-6 w-6 text-blue-400" />
                <h3 className="font-bold text-lg text-gray-900">{merchant.name}</h3>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wide mt-2 mb-1">Contact Information</div>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4 text-gray-300" />
                  <span className="text-base font-medium text-gray-900">{merchant.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-gray-300" />
                  <span className="text-base font-medium text-gray-900">{merchant.phone}</span>
                </div>
                {merchant.website && (
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="h-4 w-4 text-gray-300" />
                    <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-600 hover:underline">
                      {merchant.website}
                    </a>
                  </div>
                )}
              </div>
              <div className="border-t my-3" />
              {merchant.business_detail && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold uppercase tracking-wide mt-2 mb-1">Business Information</div>
                  <div className="flex items-center gap-2">
                    <IdentificationIcon className="h-4 w-4 text-gray-300" />
                    <span className="text-xs text-gray-400">Employer Identification Number (EIN):</span>
                    <span className="text-base font-medium text-gray-900">{merchant.business_detail.ein}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BuildingOffice2Icon className="h-4 w-4 text-gray-300" />
                    <span className="text-xs text-gray-400">Business Entity Type:</span>
                    <span className="text-base font-medium text-gray-900">{merchant.business_detail.entity_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-300" />
                    <span className="text-xs text-gray-400">Incorporation Date:</span>
                    <span className="text-base font-medium text-gray-900">{formatDate(merchant.business_detail.incorporation_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-300" />
                    <span className="text-xs text-gray-400">State of Incorporation:</span>
                    <span className="text-base font-medium text-gray-900">{merchant.business_detail.state_of_incorporation}</span>
                  </div>
                </div>
              )}
              {merchant.address && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Business Address</div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-300" />
                    <span className="text-xs text-gray-400">Address:</span>
                    <span className="text-base font-medium text-gray-900">
                      {formatFullAddress({
                        address_1: merchant.address?.address_1 ?? '',
                        address_2: merchant.address?.address_2 ?? '',
                        city: merchant.address?.city ?? '',
                        state: merchant.address?.state ?? '',
                        zip: merchant.address?.zip ?? '',
                      })}
                    </span>
                  </div>
                </div>
              )}
              <div className="border-t my-3" />
              <div className="flex flex-wrap gap-6 justify-between text-center mb-2">
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-400 text-xs"><UsersIcon className="h-4 w-4" />Total Users</div>
                  <div className="font-bold text-lg text-gray-900">{merchant.user_count}</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-400 text-xs"><DocumentTextIcon className="h-4 w-4" />Total Applications</div>
                  <div className="font-bold text-lg text-gray-900">{merchant.application_count}</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-400 text-xs"><ClockIcon className="h-4 w-4" />Pending Applications</div>
                  <div className="font-bold text-lg text-gray-900">{merchant.pending_application_count}</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-400 text-xs"><CurrencyDollarIcon className="h-4 w-4" />Available Balance</div>
                  <div className="font-bold text-lg text-gray-900">${(merchant.available_balance ?? 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">Merchant Created Date: {formatDate(merchant.created_date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 