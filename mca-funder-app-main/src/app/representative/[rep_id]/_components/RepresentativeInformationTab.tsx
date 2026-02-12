'use client';

import { Representative } from '@/types/representative';

interface RepresentativeInformationTabProps {
  data: Representative;
}

export default function RepresentativeInformationTab({ data }: RepresentativeInformationTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object' && value.name) return String(value.name);
    return 'N/A';
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'N/A';
    return phone;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'iso_manager':
        return 'ISO Manager';
      case 'iso_sales':
        return 'ISO Sales';
      default:
        return type || 'N/A';
    }
  };

  return (
    <div className="p-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Representative ID</p>
                <h3 className="text-md font-semibold text-gray-800">{data._id}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Full Name</p>
                <h3 className="text-md font-semibold text-gray-800">{data.first_name} {data.last_name}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Email</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {data.email ? (
                    <a href={`mailto:${data.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {data.email}
                    </a>
                  ) : 'N/A'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Title</p>
                <h3 className="text-md font-semibold text-gray-800">{safeRender(data.title)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Type</p>
                <h3 className="text-md font-semibold text-gray-800">
                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                    {getTypeLabel(data.type)}
                  </span>
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Birthday</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {data.birthday ? formatDateOnly(data.birthday) : 'N/A'}
                </h3>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Mobile Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {data.phone_mobile ? (
                    <a href={`tel:${data.phone_mobile}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {formatPhone(data.phone_mobile)}
                    </a>
                  ) : 'N/A'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Work Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {data.phone_work ? (
                    <a href={`tel:${data.phone_work}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {formatPhone(data.phone_work)}
                    </a>
                  ) : 'N/A'}
                </h3>
              </div>
            </div>
          </div>

          {/* Address Information */}
          {data.address_detail && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Address 1</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.address_detail.address_1)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Address 2</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.address_detail.address_2)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">City</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.address_detail.city)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">State</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.address_detail.state)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">ZIP Code</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(data.address_detail.zip)}</h3>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
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

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Online</p>
                <h3 className="text-md font-semibold">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    data.online 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {data.online ? 'Online' : 'Offline'}
                  </span>
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Last Login</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {data.last_login ? formatDate(data.last_login) : 'Never'}
                </h3>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">ISOs</p>
                <h3 className="text-md font-semibold text-gray-800">{data.iso_count || 0}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Access Logs</p>
                <h3 className="text-md font-semibold text-gray-800">{data.access_log_count || 0}</h3>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Timestamps</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Created Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(data.created_date)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Updated Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(data.updated_date)}</h3>
              </div>
            </div>
          </div>

          {/* ISO List */}
          {data.iso_list && data.iso_list.length > 0 && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Associated ISOs</h3>
              <div className="flex flex-wrap gap-2">
                {data.iso_list.map((isoId, index) => (
                  <span key={index} className="inline-block px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">
                    {isoId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 