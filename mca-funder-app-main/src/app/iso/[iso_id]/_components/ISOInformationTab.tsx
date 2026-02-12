'use client';

import { ISO } from '@/types/iso';

interface ISOInformationTabProps {
  data: ISO;
}

export default function ISOInformationTab({ data }: ISOInformationTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>

            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">ISO Name</p>
                <h3 className="text-md font-semibold text-gray-800">{data.name}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">ISO ID</p>
                <h3 className="text-md font-semibold text-gray-800">{data._id}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Website</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {data.website ? (
                    <a 
                      href={data.website.startsWith('http') ? data.website : `https://${data.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {data.website}
                    </a>
                  ) : 'N/A'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    data.inactive 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {data.inactive ? 'Inactive' : 'Active'}
                  </span>
                </h3>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Email</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <a 
                    href={`mailto:${data.email}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {data.email}
                  </a>
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {data.primary_representative?.phone_mobile ? (
                    <div className="space-y-1">
                      <a 
                        href={`tel:${data.primary_representative.phone_mobile}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline block"
                      >
                        {data.primary_representative.phone_mobile} (Mobile)
                      </a>
                      {data.primary_representative.phone_work && (
                        <a 
                          href={`tel:${data.primary_representative.phone_work}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline block"
                        >
                          {data.primary_representative.phone_work} (Work)
                        </a>
                      )}
                    </div>
                  ) : 'N/A'}
                </h3>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
            
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Representatives</p>
                <h3 className="text-md font-semibold text-gray-800">{data.representative_count || 0}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Funders</p>
                <h3 className="text-md font-semibold text-gray-800">{data.funder_count || 0}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Merchants</p>
                <h3 className="text-md font-semibold text-gray-800">{data.merchant_count || 0}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Accounts</p>
                <h3 className="text-md font-semibold text-gray-800">{data.account_count || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Address Information Section */}
          {data.address_list && data.address_list.length > 0 && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
              
              {data.address_list.map((address, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  {(data.address_list?.length ?? 0) > 1 && (
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Address {index + 1}</h4>
                  )}
                  <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                      <p className="text-xs font-medium text-gray-500">Street Address</p>
                      <h3 className="text-md font-semibold text-gray-800">
                        {address.address_1}
                        {address.address_2 && <><br />{address.address_2}</>}
                      </h3>
                    </div>

                    <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                      <p className="text-xs font-medium text-gray-500">City, State, ZIP</p>
                      <h3 className="text-md font-semibold text-gray-800">
                        {address.city}, {address.state} {address.zip}
                      </h3>
                    </div>
                  </div>
                  {index < (data.address_list?.length ?? 0) - 1 && (
                    <div className="col-span-2 border-b border-gray-200 mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Primary Representative Section */}
          {data.primary_representative && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Primary Representative</h3>

              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Name</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.primary_representative.first_name} {data.primary_representative.last_name}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.primary_representative.email ? (
                      <a 
                        href={`mailto:${data.primary_representative.email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {data.primary_representative.email}
                      </a>
                    ) : 'N/A'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.primary_representative.phone_mobile ? (
                      <div className="space-y-1">
                        <a 
                          href={`tel:${data.primary_representative.phone_mobile}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline block"
                        >
                          {data.primary_representative.phone_mobile} (Mobile)
                        </a>
                        {data.primary_representative.phone_work && (
                          <a 
                            href={`tel:${data.primary_representative.phone_work}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline block"
                          >
                            {data.primary_representative.phone_work} (Work)
                          </a>
                        )}
                      </div>
                    ) : 'N/A'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Title</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {data.primary_representative.title || 'N/A'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps Section */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Information</h3>
            
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Created Date</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {formatDate(data.created_date)}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Last Updated</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {formatDate(data.updated_date)}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 