'use client';

import React from 'react';
import { User } from '@/types/user';
import { formatPhone, formatDate, getUserTypeLabel, formatAddress } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { EnvelopeIcon, PhoneIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface UserInformationProps {
  data: User;
}

export default function UserInformation({ data }: UserInformationProps) {
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object' && value.name) return String(value.name);
    return '-';
  };

  return (
    <div className="p-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">User ID</p>
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
                  ) : '-'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Type</p>
                <h3 className="text-md font-semibold text-gray-800">{getUserTypeLabel(data.type)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={data.inactive ? 'Inactive' : 'Active'} size="sm" />
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Online Status</p>
                <h3 className="text-md font-semibold">
                  <StatusBadge status={data.online ? 'Online' : 'Offline'} size="sm" />
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
                  ) : '-'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Work Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {data.phone_work ? (
                    <a href={`tel:${data.phone_work}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {formatPhone(data.phone_work)}
                    </a>
                  ) : '-'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Home Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                  {data.phone_home ? (
                    <a href={`tel:${data.phone_home}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {formatPhone(data.phone_home)}
                    </a>
                  ) : '-'}
                </h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Birthday</p>
                <h3 className="text-md font-semibold text-gray-800">{data.birthday ? formatDate(data.birthday) : 'Not provided'}</h3>
              </div>
            </div>
          </div>

          {/* Address Information */}
          {data.address_detail && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
              <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="col-span-2 flex flex-col gap-1 break-words whitespace-normal text-left">
                  <p className="text-xs font-medium text-gray-500">Full Address</p>
                  <h3 className="text-md font-semibold text-gray-800">{formatAddress(data.address_detail)}</h3>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Account Information */}
          <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Last Login</p>
                <h3 className="text-md font-semibold text-gray-800">{data.last_login ? formatDate(data.last_login) : '-'}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Funder Count</p>
                <h3 className="text-md font-semibold text-gray-800">{data.funder_count ?? 0}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Created Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(data.createdAt)}</h3>
              </div>

              <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                <p className="text-xs font-medium text-gray-500">Updated Date</p>
                <h3 className="text-md font-semibold text-gray-800">{formatDate(data.updatedAt)}</h3>
              </div>
            </div>
          </div>

          {/* Permissions */}
          {data.permission_list && data.permission_list.length > 0 && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {data.permission_list.map((permission, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Funder List */}
          {data.funder_list && data.funder_list.length > 0 && (
            <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Assigned Funders</h3>
              <div className="space-y-3">
                {data.funder_list.map((funderItem, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{funderItem.funder.name}</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {funderItem.role_list.map((role, roleIndex) => (
                            <span
                              key={roleIndex}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <StatusBadge status={funderItem.inactive ? 'Inactive' : 'Active'} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
