'use client';

import { formatDate, formatPhone, formatAddress } from '@/lib/utils/format';
import { useFunderIsos } from '@/hooks/useFunderIsos';

const IsoSkeleton = () => (
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

interface FunderIsosTabProps {
  funderId: string;
}

export default function FunderIsosTab({ funderId }: FunderIsosTabProps) {
  const { isos, loading, error } = useFunderIsos(funderId);

  if (loading) return <IsoSkeleton />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-semibold">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const formatIsoAddress = (addressList: any[]) => {
    if (!addressList || addressList.length === 0) return 'N/A';
    const address = addressList[0]; // Use first address
    const parts = [];
    if (address.address_1) parts.push(address.address_1);
    if (address.address_2) parts.push(address.address_2);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zip) parts.push(address.zip);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-300px)] overflow-y-auto">
        {isos.length === 0 ? (
          <p className="text-gray-500">No ISOs associated with this funder.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isos.map((iso) => (
              <div key={iso._id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{iso.name}</h3>
                <div className="space-y-2">
                  <p>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium">{iso.email}</span>
                  </p>
                  {iso.phone && (
                    <p>
                      <span className="text-gray-500">Phone:</span>{' '}
                      <span className="font-medium">{formatPhone(iso.phone)}</span>
                    </p>
                  )}
                  {iso.website && (
                    <p>
                      <span className="text-gray-500">Website:</span>{' '}
                      <a href={iso.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                        {iso.website}
                      </a>
                    </p>
                  )}
                  {iso.primary_representative && (
                    <p>
                      <span className="text-gray-500">Primary Rep:</span>{' '}
                      <span className="font-medium">
                        {iso.primary_representative.first_name} {iso.primary_representative.last_name} ({iso.primary_representative.title})
                      </span>
                    </p>
                  )}
                  {iso.address_list && iso.address_list.length > 0 && (
                    <p>
                      <span className="text-gray-500">Address:</span>{' '}
                      <span className="font-medium">
                        {formatIsoAddress(iso.address_list)}
                      </span>
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">
                        {iso.inactive ? (
                          <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Inactive</span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Active</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Representatives</p>
                      <p className="font-medium">{iso.representative_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Funders</p>
                      <p className="font-medium">{iso.funder_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Merchants</p>
                      <p className="font-medium">{iso.merchant_count || 0}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Created: {formatDate(iso.created_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 