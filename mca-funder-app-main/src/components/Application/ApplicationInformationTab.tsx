'use client';

import { Application } from '@/types/application';
import { formatCurrency, formatDate, safeRender } from '@/lib/utils/format';
import { PriorityFlag, StatusBadge } from '@/components/StatusBadge';
import UserCard from '@/components/Cards/UserCard';
import EntityCard from '@/components/Cards/EntityCard';

interface ApplicationInformationTabProps {
  data: Application;
}

export default function ApplicationInformationTab({ data }: ApplicationInformationTabProps) {

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
                <h3 className="text-md font-semibold text-gray-800">{safeRender(data.name)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Type</p>
                <h3 className="text-md font-semibold text-gray-800"><StatusBadge status={data.type} size="xs" /></h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Priority</p>
                <h3 className="text-md font-semibold">
                  <PriorityFlag priority={data.priority} />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Request Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data.request_amount)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Request Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(data.request_date)}</h3>
              </div>

              {/* Application Status Section */}
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Application Status</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={data.status?.name} color={data.status?.bgcolor} size="xs" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(data.status_date)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Internal</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={data.internal ? 'YES' : 'NO'} size="xs" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Closed</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={data.closed ? 'YES' : 'NO'} size="xs" />
                </h3>
              </div>
            </div>
          </div>

          {/* Application Statistics */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Documents Card */}
              <div className="border rounded-lg p-4 border-gray-200 bg-gray-50 overflow-x-auto">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Documents</h4>
                <div className="flex flex-row flex-wrap gap-4 md:gap-8">
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Total</p>
                    <h3 className="text-md font-semibold text-gray-800">{data.document_count || 0}</h3>
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Uploaded</p>
                    <h3 className="text-md font-semibold text-gray-800">{data.uploaded_document_count || 0}</h3>
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Generated</p>
                    <h3 className="text-md font-semibold text-gray-800">{data.generated_document_count || 0}</h3>
                  </div>
                </div>
              </div>
              {/* Stipulations Card */}
              <div className="border rounded-lg p-4 border-gray-200 bg-gray-50 overflow-x-auto">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Stipulations</h4>
                <div className="flex flex-row flex-wrap gap-4 md:gap-8">
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Total</p>
                    <h3 className="text-md font-semibold text-gray-800">{data.stipulation_count || 0}</h3>
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Requested</p>
                    <h3 className="text-md font-semibold text-gray-800">{data.requested_stipulation_count || 0}</h3>
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Received</p>
                    <h3 className="text-md font-semibold text-gray-800">{data.received_stipulation_count || 0}</h3>
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="text-xs font-medium text-gray-500">Checked</p>
                    <h3 className="text-md font-semibold text-gray-800">{data.checked_stipulation_count || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Merchant Information */}
            {data.merchant && <EntityCard data={data.merchant} title="Merchant Information" />}

            {/* Contact Information */}
            {data.contact && <UserCard data={data.contact} title="Contact Information" />}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* ISO Information */}
            {data.iso && <EntityCard data={data.iso} title="ISO Information" />}

            {/* Representative Information */}
            {data.representative && <UserCard data={data.representative} title="Representative Information" />}
          </div>

          {/* Funder Information */}
          {data.funder && <EntityCard data={data.funder} title="Funder Information" />}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Assigned User */}
            {data.assigned_user && <UserCard data={data.assigned_user} title="Assigned User" />}

            {/* Assigned Manager */}
            {data.assigned_manager && <UserCard data={data.assigned_manager} title="Assigned Manager" />}
          </div>

          {/* Stipulations */}
          {data.stipulation_list && data.stipulation_list.length > 0 && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Stipulations</h3>
              <ul className="list-disc list-inside space-y-1">
                {data.stipulation_list.map((stipulation, index) => (
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