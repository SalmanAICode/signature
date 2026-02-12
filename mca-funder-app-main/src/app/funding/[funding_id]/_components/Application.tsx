import React from 'react';
import { Funding } from '@/types/funding';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Application as ApplicationType } from '@/types/application';
import { StatusBadge } from '@/components/StatusBadge';

interface ApplicationProps {
  data: Funding;
}

export default function Application({ data }: ApplicationProps) {
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object' && value.name) return String(value.name);
    return 'N/A';
  };

  // Add getUserName helper
  const getUserName = (user: any): string => {
    if (!user) return 'N/A';
    if (typeof user === 'object') {
      if ('name' in user && user.name) return user.name;
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
      if (user.email) return user.email;
      if (user.id) return user.id;
    }
    return 'N/A';
  };

  if (!data.application) {
    return <div className="p-4 w-full text-center text-gray-500">No application information available.</div>;
  }

  const application = data.application as ApplicationType;
  if (!application) {
    return <div className="p-4 w-full text-center text-gray-500">No application information available.</div>;
  }

  // We might need to fetch the application data here if it is a string

  return (
    <div className="p-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Application ID</p>
                <h3 className="text-md font-semibold text-gray-800">{data._id}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Name</p>
                <h3 className="text-md font-semibold text-gray-800">{safeRender(application.name)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Type</p>
                <h3 className="text-md font-semibold text-gray-800">{safeRender(application.type)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Priority</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={application.priority ? 'High' : 'Normal'} size="xs" />
                </h3>
              </div>

              {/* Assigned Manager */}
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Assigned Manager</p>
                <h3 className="text-md font-semibold text-gray-800">{getUserName(application.assigned_manager)}</h3>
              </div>

              {/* Assigned User */}
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Assigned User</p>
                <h3 className="text-md font-semibold text-gray-800">{getUserName(application.assigned_user)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Request Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatCurrency(application.request_amount)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Request Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(application.request_date)}</h3>
              </div>




              {/* Application Status Section */}
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Application Status</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={application.status?.name} color={application.status?.bgcolor} size="xs" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(application.status_date)}</h3>
              </div>




              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Internal</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={application.internal ? 'YES' : 'NO'} size="xs" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Closed</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={application.closed ? 'YES' : 'NO'} size="xs" />
                </h3>
              </div>
            </div>
          </div>

          {/* Merchant Information */}
          {application.merchant && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Merchant Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Business Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(application.merchant.name)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {application.merchant.email ? (
                      <a href={`mailto:${application.merchant.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.merchant.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {application.merchant.phone ? (
                      <a href={`tel:${application.merchant.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.merchant.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}


          {/* Record Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Created Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(application.createdAt)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Updated Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(application.updatedAt)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={application.inactive ? 'Inactive' : 'Active'} size="xs" />
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Funder Information */}
          {application.funder && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Funder Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Funder Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(application.funder.name)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {application.funder.email ? (
                      <a href={`mailto:${application.funder.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.funder.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {application.funder.phone ? (
                      <a href={`tel:${application.funder.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.funder.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* ISO Information */}
          {application.iso && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ISO Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">ISO Name</p>
                  <h3 className="text-md font-semibold text-gray-800">{safeRender(application.iso.name)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {application.iso.email ? (
                      <a href={`mailto:${application.iso.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.iso.email}
                      </a>
                    ) : 'N/A'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {application.iso.phone ? (
                      <a href={`tel:${application.iso.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.iso.phone}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Assigned User */}
          {application.assigned_user && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Assigned User</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Name</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {safeRender(application.assigned_user.first_name)} {safeRender(application.assigned_user.last_name)}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {application.assigned_user.email ? (
                      <a href={`mailto:${application.assigned_user.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.assigned_user.email}
                      </a>
                    ) : '-'}
                  </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <h3 className="text-md font-semibold text-gray-800">
                    {application.assigned_user.phone_mobile ? (
                      <a href={`tel:${application.assigned_user.phone_mobile}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.assigned_user.phone_mobile}
                      </a>
                    ) : application.assigned_user.phone_work ? (
                      <a href={`tel:${application.assigned_user.phone_work}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.assigned_user.phone_work}
                      </a>
                    ) : application.assigned_user.phone_home ? (
                      <a href={`tel:${application.assigned_user.phone_home}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {application.assigned_user.phone_home}
                      </a>
                    ) : '-'}
                  </h3>
                </div>
              </div>
            </div>
          )}



          {/* Stipulations */}
          {application.stipulation_list && application.stipulation_list.length > 0 && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Stipulations</h3>
              <ul className="list-disc list-inside space-y-1">
                {application.stipulation_list.map((stipulation, index) => (
                  <li key={index} className="text-sm text-gray-700">{safeRender(stipulation)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 