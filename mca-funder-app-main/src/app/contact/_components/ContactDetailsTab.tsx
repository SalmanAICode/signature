'use client';

import { Contact } from '@/types/contact';
import {
  formatPhone,
  formatDate,
  formatAddress
} from '@/lib/utils/format';
import { EnvelopeIcon, PhoneIcon, UserCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const StatusBadge = ({ label, color }: { label: string; color: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
);

const PermissionBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
    {label}
  </span>
);

interface ContactDetailsTabProps {
  contact: Contact;
}

export default function ContactDetailsTab({ contact }: ContactDetailsTabProps) {
  const router = useRouter();
  return (
    <div className="max-w-3xl mx-auto mt-10 flex flex-col min-h-[70vh]">
      <div className="bg-white shadow-md rounded-2xl p-8 pb-12 flex flex-col flex-1 justify-between">
        {/* Back Button */}
        <button
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6"
          onClick={() => router.push('/contact')}
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>
        {/* Top: Avatar, Name */}
        <div className="flex items-center gap-4 mb-8">
          <UserCircleIcon className="h-14 w-14 text-gray-300" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{contact.first_name} {contact.last_name}</div>
            <div className="text-xs text-gray-400 mt-1">Contact ID: <span className="font-mono">{contact.id || contact._id}</span></div>
          </div>
        </div>
        {/* Main Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Basic Info */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div>
              <div className="text-sm text-gray-400">Full Name</div>
              <div className="text-base font-medium text-gray-900">{contact.first_name} {contact.last_name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Email</div>
              <div className="text-base font-medium text-gray-900 flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4 text-gray-300" />
                {contact.email}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Birthday</div>
              <div className="text-base font-medium text-gray-900">{contact.birthday ? formatDate(contact.birthday) : 'Not provided'}</div>
            </div>
          </div>
          {/* Right: Contact & Status */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div>
              <div className="text-sm text-gray-400">Mobile Phone</div>
              <div className="text-base font-medium text-gray-900 flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-gray-300" />
                {formatPhone(contact.phone_mobile) || 'Not provided'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Work Phone</div>
              <div className="text-base font-medium text-gray-900 flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-gray-300" />
                {formatPhone(contact.phone_work) || 'Not provided'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Home Phone</div>
              <div className="text-base font-medium text-gray-900 flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-gray-300" />
                {formatPhone(contact.phone_home) || 'Not provided'}
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <div>
                <div className="text-sm text-gray-400">Status</div>
                <StatusBadge label={contact.inactive ? 'Inactive' : 'Active'} color={contact.inactive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} />
              </div>
            </div>
          </div>
        </div>
        {/* Address Section */}
        <div className="mt-6 mb-2">
          <div className="text-sm text-gray-400 mb-1">Address</div>
          <div className="text-base font-medium text-gray-900">{formatAddress(contact.address_detail)}</div>
        </div>
        {/* Record Info Footer */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4 text-sm text-gray-600 mt-8 pt-4 border-t pb-6">
          <div>
            <span className="text-gray-400">Created At:</span> <span className="text-gray-700">{formatDate(contact.created_date)}</span>
          </div>
          <div>
            <span className="text-gray-400">Updated At:</span> <span className="text-gray-700">{formatDate(contact.updated_date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 