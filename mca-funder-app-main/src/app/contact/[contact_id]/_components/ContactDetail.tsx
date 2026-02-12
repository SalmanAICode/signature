'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/lib/store/auth';
import { Contact } from '@/types/contact';
import ContactDetailsTab from '../../_components/ContactDetailsTab';
import ContactMerchantsTab from '../../_components/ContactMerchantsTab';
import { getContact } from '@/lib/api/contacts';
import clsx from 'clsx';

const ContactDetailSkeleton = () => (
  <div className="p-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

interface ContactDetailProps {
  id: string;
}

export default function ContactDetail({ id }: ContactDetailProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuthStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'merchants'>('details');

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await getContact(id);
        setContact(response.data as Contact);
      } catch (error) {
        setError('Failed to load contact details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchContact();
    }
  }, [id, accessToken]);

  if (loading) return <ContactDetailSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="mb-6">
        <div className="flex gap-0">
          <button
            className={clsx(
              'px-6 py-2 font-semibold focus:outline-none border border-b-0 rounded-t-lg transition-colors text-base',
              activeTab === 'details'
                ? 'bg-blue-50 border-gray-300 text-black z-10'
                : 'bg-gray-100 border-gray-300 text-black hover:bg-blue-50'
            )}
            style={{ marginRight: '-1px' }}
            onClick={() => setActiveTab('details')}
          >
            Contact Details
          </button>
          <button
            className={clsx(
              'px-6 py-2 font-semibold focus:outline-none border border-b-0 rounded-t-lg transition-colors text-base',
              activeTab === 'merchants'
                ? 'bg-blue-50 border-gray-300 text-black z-10'
                : 'bg-gray-100 border-gray-300 text-black hover:bg-blue-50'
            )}
            style={{ marginRight: '-1px' }}
            onClick={() => setActiveTab('merchants')}
          >
            Contact Merchants
          </button>
        </div>
      </div>
      {activeTab === 'details' ? (
        <ContactDetailsTab contact={contact} />
      ) : (
        <ContactMerchantsTab contactId={contact._id} />
      )}
    </div>
  );
} 