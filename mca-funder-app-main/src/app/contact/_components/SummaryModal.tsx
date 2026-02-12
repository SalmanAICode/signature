import { Contact } from '@/types/contact';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import DeleteModal from '@/components/DeleteModal';
import { deleteContact } from '@/lib/api/contacts';
import { useContactMerchants } from '@/hooks/useContactMerchants';
import {
  formatPhone,
  formatDate,
  formatAddress
} from '@/lib/utils/format';
import ContactForm from './ContactForm';
import EditContactMerchantsModal from './EditContactMerchantsModal';

type SummaryModalProps = {
  contact: Contact;
  onClose: () => void;
  onDeleteSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onMerchantChange?: () => void;
};

export default function SummaryModal({ 
  contact, 
  onClose, 
  onDeleteSuccess, 
  onUpdateSuccess,
  onMerchantChange 
}: SummaryModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { merchants, loading, error } = useContactMerchants(contact._id);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showEditMerchantsModal, setShowEditMerchantsModal] = useState(false);
  const [refreshMerchants, setRefreshMerchants] = useState(0);

  const handleDeleteContact = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await deleteContact(contact._id);
      if (res.success) {
        setShowDeleteModal(false);
        onClose();
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } else {
        setDeleteError(res.message || 'Failed to delete contact');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete contact');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateSuccess = () => {
    setShowEditModal(false);
    if (onUpdateSuccess) {
      onUpdateSuccess();
    }
  };

  const header = (
    <h2 className="text-2xl font-bold text-center text-gray-800">Contact Summary</h2>
  );

  const content = (
    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* Contact Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Contact ID</p>
        <h3 className="text-md font-semibold text-gray-800">{contact._id}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Name</p>
        <h3 className="text-md font-semibold text-gray-800">{contact.first_name} {contact.last_name}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Email</p>
        <h3 className="text-md font-semibold text-gray-800">
          {contact.email ? (
            <a 
              href={`mailto:${contact.email}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {contact.email}
            </a>
          ) : '-'}
        </h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Mobile Phone</p>
        <h3 className="text-md font-semibold text-gray-800">
          {contact.phone_mobile ? (
            <a 
              href={`tel:${contact.phone_mobile}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {formatPhone(contact.phone_mobile)}
            </a>
          ) : '-'}
        </h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Work Phone</p>
        <h3 className="text-md font-semibold text-gray-800">
          {contact.phone_work ? (
            <a 
              href={`tel:${contact.phone_work}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {formatPhone(contact.phone_work)}
            </a>
          ) : '-'}
        </h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Address and Status */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Address</p>
        <h3 className="text-md font-semibold text-gray-800">{formatAddress(contact.address_detail)}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Status</p>
        <h3 className="text-md font-semibold">
          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${contact.inactive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {contact.inactive ? 'Inactive' : 'Active'}
          </span>
        </h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Assigned Merchants Section */}
      <div className="col-span-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Assigned Merchants</h3>
          <button
            type="button"
            className="px-2 py-1 text-blue-600 text-xs font-semibold rounded hover:underline hover:bg-blue-50 transition"
            title="Edit Assigned Merchants"
            onClick={() => setShowEditMerchantsModal(true)}
          >
            Edit
          </button>
        </div>
        {loading ? (
          <p className="text-xs text-gray-500">Loading merchants...</p>
        ) : error ? (
          <p className="text-xs text-red-500">{error.message}</p>
        ) : merchants.length > 0 ? (
          <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
            {merchants.map((merchant) => (
              <div key={merchant._id} className="text-sm text-gray-700" title={`ID: ${merchant._id}`}>
                • {merchant.merchant.name}
                {merchant.email && (
                  <span className="text-xs text-gray-500 ml-1">({merchant.email})</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No merchants assigned</p>
        )}
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Date Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Created Date</p>
        <h3 className="text-md font-semibold text-gray-800">{contact.created_date ? formatDate(contact.created_date) : 'N/A'}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Updated Date</p>
        <h3 className="text-md font-semibold text-gray-800">{contact.updated_date ? formatDate(contact.updated_date) : 'N/A'}</h3>
      </div>
    </div>
  );

  const actions = (
    <div className="flex justify-evenly gap-2">
      <button
        className="flex-1 px-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        onClick={() => router.push(`/contact/${contact._id}`)}
      >
        View
      </button>
      <button
        onClick={() => setShowEditModal(true)}
        className="flex-1 px-2 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
      >
        Update
      </button>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="flex-1 px-2 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
      >
        Remove
      </button>
      <button
        onClick={onClose}
        className="flex-1 px-2 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
      >
        Close
      </button>
    </div>
  );

  return (
    <>
      <SummaryModalLayout
        header={header}
        content={content}
        actions={actions}
        error={deleteError}
      />

      {/* Update Modal */}
      {showEditModal && (
        <ContactForm
          initialData={contact}
          onCancel={() => setShowEditModal(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Edit Merchants Modal */}
      {showEditMerchantsModal && (
        <EditContactMerchantsModal
          contactId={contact._id}
          isOpen={showEditMerchantsModal}
          onClose={() => {
            setShowEditMerchantsModal(false);
            setRefreshMerchants(prev => prev + 1);
          }}
          onSuccess={() => {
            setShowEditMerchantsModal(false);
            if (onMerchantChange) {
              onMerchantChange();
            }
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeleteError('');
          }}
          onConfirm={handleDeleteContact}
          isLoading={deleting}
          title="Delete Contact"
          message={`Are you sure you want to delete Contact ${contact.first_name} ${contact.last_name}? This action cannot be undone.`}
        />
      )}
    </>
  );
} 