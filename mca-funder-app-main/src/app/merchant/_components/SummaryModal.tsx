import { Merchant } from '@/types/merchant';
import { useRouter, usePathname } from 'next/navigation';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";

type SummaryModalProps = {
  merchant: Merchant;
  isOpen: boolean;
  onClose: () => void;
};

export function SummaryModal({ merchant, isOpen, onClose }: SummaryModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen) {
    return null;
  }

  const header = (
    <h2 className="text-2xl font-bold text-center text-gray-800">Merchant Summary</h2>
  );

  const content = (
    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Name</p>
        <h3 className="text-md font-semibold text-gray-800">{merchant?.name || 'N/A'}</h3>
      </div>

      {/* Business Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">DBA Name</p>
        <h3 className="text-md font-semibold text-gray-800">{merchant?.dba_name || 'N/A'}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Email</p>
        <h3 className="text-md font-semibold text-gray-800">
          {merchant?.email ? (
            <a 
              href={`mailto:${merchant.email}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {merchant.email}
            </a>
          ) : 'N/A'}
        </h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Phone</p>
        <h3 className="text-md font-semibold text-gray-800">
          {merchant?.phone ? (
            <a 
              href={`tel:${merchant.phone}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {merchant.phone}
            </a>
          ) : 'N/A'}
        </h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Website</p>
        <h3 className="text-md font-semibold text-gray-800">
          {merchant?.website ? (
            <a 
              href={merchant.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {merchant.website}
            </a>
          ) : 'N/A'}
        </h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-300" />

      {/* Business Details */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Entity Type</p>
        <h3 className="text-md font-semibold text-gray-800">{merchant?.business_detail?.entity_type || 'N/A'}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">EIN</p>
        <h3 className="text-md font-semibold text-gray-800">{merchant?.business_detail?.ein || 'N/A'}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Incorporation Date</p>
        <h3 className="text-md font-semibold text-gray-800">
          {merchant?.business_detail?.incorporation_date 
            ? new Date(merchant.business_detail.incorporation_date).toLocaleDateString() 
            : 'N/A'}
        </h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">State of Incorporation</p>
        <h3 className="text-md font-semibold text-gray-800">{merchant?.business_detail?.state_of_incorporation || 'N/A'}</h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Address Information */}
      {merchant?.address_list && merchant.address_list.length > 0 && (
        <>
          <div className="col-span-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Addresses</h4>
            <div className="space-y-2">
              {merchant.address_list.map((address, index) => (
                <div key={index} className="text-sm text-gray-800 p-2 bg-gray-50 rounded">
                  <p>{address.address_1}</p>
                  {address.address_2 && <p>{address.address_2}</p>}
                  <p>{address.city}, {address.state} {address.zip}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Divider */}
          <div className="col-span-2 border-b border-gray-200" />
        </>
      )}

      {/* Primary Contact */}
      {merchant?.primary_contact && (
        <>
          <div className="flex flex-col gap-1 break-words whitespace-normal">
            <p className="text-xs font-medium text-gray-500">Primary Contact Name</p>
            <h3 className="text-md font-semibold text-gray-800">
              {merchant.primary_contact.first_name} {merchant.primary_contact.last_name}
            </h3>
          </div>

          <div className="flex flex-col gap-1 break-words whitespace-normal">
            <p className="text-xs font-medium text-gray-500">Title</p>
            <h3 className="text-md font-semibold text-gray-800">{merchant.primary_contact.title || 'N/A'}</h3>
          </div>

          <div className="flex flex-col gap-1 break-words whitespace-normal">
            <p className="text-xs font-medium text-gray-500">Contact Email</p>
            <h3 className="text-md font-semibold text-gray-800">
              {merchant.primary_contact.email ? (
                <a 
                  href={`mailto:${merchant.primary_contact.email}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {merchant.primary_contact.email}
                </a>
              ) : 'N/A'}
            </h3>
          </div>

          <div className="flex flex-col gap-1 break-words whitespace-normal">
            <p className="text-xs font-medium text-gray-500">Contact Phone</p>
            <h3 className="text-md font-semibold text-gray-800">
              {merchant.primary_contact.phone_mobile ? (
                <a 
                  href={`tel:${merchant.primary_contact.phone_mobile}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {merchant.primary_contact.phone_mobile}
                </a>
              ) : 'N/A'}
            </h3>
          </div>
        </>
      )}
    </div>
  );

  const actions = (
    <div className="flex justify-evenly gap-2">
      <button
        className="flex-1 px-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        onClick={() => {
          router.push(`${pathname}/${merchant._id}`);
        }}
      >
        View
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
    <SummaryModalLayout
      header={header}
      content={content}
      actions={actions}
    />
  );
} 