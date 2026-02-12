"use client";

import { Representative } from '@/types/representative';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { formatTime, formatPhone } from '@/lib/utils/format';

interface RepresentativeDetailModalProps {
  representative: Representative;
  isOpen: boolean;
  onClose: () => void;
}

export default function RepresentativeDetailModal({ 
  representative, 
  isOpen, 
  onClose 
}: RepresentativeDetailModalProps) {
  if (!isOpen) return null;

  const header = (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-800">
        Representative Details
      </h2>
      <button
        onClick={onClose}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const content = (
    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* Basic Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">First Name</p>
        <h3 className="text-md font-semibold text-gray-800">{representative.first_name || '-'}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Last Name</p>
        <h3 className="text-md font-semibold text-gray-800">{representative.last_name || '-'}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Email</p>
        <h3 className="text-md font-semibold text-gray-800">{representative.email || '-'}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Mobile Phone</p>
        <h3 className="text-md font-semibold text-gray-800">{formatPhone(representative.phone_mobile) || '-'}</h3>
      </div>

      {representative.phone_work && (
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Work Phone</p>
          <h3 className="text-md font-semibold text-gray-800">{formatPhone(representative.phone_work)}</h3>
        </div>
      )}

      {representative.phone_home && (
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Home Phone</p>
          <h3 className="text-md font-semibold text-gray-800">{formatPhone(representative.phone_home)}</h3>
        </div>
      )}

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-300" />

      {/* Additional Information */}
      {representative.title && (
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Title</p>
          <h3 className="text-md font-semibold text-gray-800">{representative.title}</h3>
        </div>
      )}

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Type</p>
        <h3 className="text-md font-semibold text-gray-800">{representative.type || '-'}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Status</p>
        <h3 className="text-md font-semibold text-gray-800">
          {representative.inactive ? 'Inactive' : 'Active'}
        </h3>
      </div>

      {representative.birthday && (
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Birthday</p>
          <h3 className="text-md font-semibold text-gray-800">{formatTime(representative.birthday)}</h3>
        </div>
      )}

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Address Information */}
      {representative.address_detail && (
        <>
          <div className="flex flex-col gap-1 break-words whitespace-normal">
            <p className="text-xs font-medium text-gray-500">Address 1</p>
            <h3 className="text-md font-semibold text-gray-800">{representative.address_detail.address_1 || '-'}</h3>
          </div>

          {representative.address_detail.address_2 && (
            <div className="flex flex-col gap-1 break-words whitespace-normal">
              <p className="text-xs font-medium text-gray-500">Address 2</p>
              <h3 className="text-md font-semibold text-gray-800">{representative.address_detail.address_2}</h3>
            </div>
          )}

          <div className="flex flex-col gap-1 break-words whitespace-normal">
            <p className="text-xs font-medium text-gray-500">City</p>
            <h3 className="text-md font-semibold text-gray-800">{representative.address_detail.city || '-'}</h3>
          </div>

          <div className="flex flex-col gap-1 break-words whitespace-normal">
            <p className="text-xs font-medium text-gray-500">State</p>
            <h3 className="text-md font-semibold text-gray-800">{representative.address_detail.state || '-'}</h3>
          </div>

          <div className="flex flex-col gap-1 break-words whitespace-normal">
            <p className="text-xs font-medium text-gray-500">ZIP</p>
            <h3 className="text-md font-semibold text-gray-800">{representative.address_detail.zip || '-'}</h3>
          </div>

          {/* Divider */}
          <div className="col-span-2 border-b border-gray-200" />
        </>
      )}

      {/* Dates */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Created Date</p>
        <h3 className="text-md font-semibold text-gray-800">{formatTime(representative.createdAt)}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Updated Date</p>
        <h3 className="text-md font-semibold text-gray-800">{formatTime(representative.updatedAt)}</h3>
      </div>

      {representative.last_login && (
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Last Login</p>
          <h3 className="text-md font-semibold text-gray-800">{formatTime(representative.last_login)}</h3>
        </div>
      )}
    </div>
  );

  const actions = (
    <div className="flex justify-end">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
      >
        Close
      </button>
    </div>
  );

  return (
    <SummaryModalLayout
      header={header}
      content={content}
      actions={actions}
    />
  );
} 