import { useEffect, useRef, useState } from 'react';
import { Field, ErrorMessage } from 'formik';
import Select from 'react-select';
import { Funder } from '@/types/funder';
import { getFunderISOList } from '@/lib/api/isoFunders';
import { IsoFunder } from '@/types/isoFunder';
import { getFunderMerchantList } from '@/lib/api/merchantFunders';
import { FunderMerchant } from '@/types/merchantFunder';
import { getContactList } from '@/lib/api/contacts';
import { Contact } from '@/types/contact';
import { getRepresentativeList } from '@/lib/api/representatives';
import { Representative } from '@/types/representative';
import CreatableSelect from 'react-select/creatable';

interface ApplicationCreateStep1Props {
  values: {
    funder: string;
    merchant: string;
    contact: string;
    representative: string;
    iso: string;
    newMerchantName: string;
    newISOName: string;
  };
  setFieldValue: (field: string, value: any) => void;
  onNext: () => void;
  onCancel: () => void;
  funder: Funder | null;
  funderISOs: IsoFunder[];
  funderMerchants: FunderMerchant[];
  loadingData: boolean;
  loading: boolean;
  onMerchantChange: (funderMerchant: FunderMerchant | null) => void;
}

const labelClasses = 'block text-xs font-medium text-gray-700';
const errorClasses = 'text-red-500 text-xs';

export default function ApplicationCreateStep1({
  values,
  setFieldValue,
  onNext,
  onCancel,
  loading,
  onMerchantChange,
  funder,
  funderISOs,
  funderMerchants,
  loadingData,
}: ApplicationCreateStep1Props) {

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);

  const [loadingLists, setLoadingLists] = useState({
    contacts: false,
    representatives: false,
  });

  const fetchContacts = async () => {
    if (!values.merchant) {
      setContacts([]);
      return;
    }
    
    try {
      setLoadingLists(prev => ({ ...prev, contacts: true }));
      const contacts = await getContactList({
        merchant: values.merchant,
      });
      setContacts(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingLists(prev => ({ ...prev, contacts: false }));
    }
  }

  const fetchRepresentatives = async () => {
    if (!values.iso) {
      setRepresentatives([]);
      return;
    }
    
    try {
      setLoadingLists(prev => ({ ...prev, representatives: true }));
      const representativesData = await getRepresentativeList({
        iso: values.iso,
      });
      setRepresentatives(representativesData);
    } catch (error) {
      console.error('Error fetching representatives:', error);
    } finally {
      setLoadingLists(prev => ({ ...prev, representatives: false }));
    }
  }

  // Fetch contacts when merchant changes
  useEffect(() => {
    fetchContacts();
  }, [values.merchant]);

  // Fetch representatives when ISO changes
  useEffect(() => {
    fetchRepresentatives();
  }, [values.iso]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className={labelClasses}>Funder *</label>
        </div>
        <div className="relative">
          <input
            type="text"
            value={funder?.name || 'No funder selected'}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Funder is automatically set from your account
        </div>

      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={labelClasses}>Merchant *</label>
          </div>
          <CreatableSelect
            name="merchant"
            options={funderMerchants
              .filter(item => item.merchant)
              .map(m => ({ value: m.merchant?._id || '', label: m.merchant?.name || '' }))}
            value={
              values.merchant
                ? {
                  value: values.merchant,
                  label:
                    funderMerchants.find(m => m.merchant?._id === values.merchant)
                      ?.merchant?.name || '',
                }
                : values.newMerchantName
                  ? { value: `__new__-${values.newMerchantName}`, label: values.newMerchantName }
                  : null
            }
            onChange={(selected, actionMeta) => {
              const isNew = selected?.value?.startsWith('__new__');
              if (isNew) {
                const name = selected?.label || '';
                setFieldValue('merchant', ''); // clear merchant id when new typed merchant
                setFieldValue('newMerchantName', name); // set newMerchantName in Formik
                onMerchantChange(null); // if you need this
              } else {
                setFieldValue('merchant', selected?.value || '');
                setFieldValue('newMerchantName', ''); // clear newMerchantName when existing merchant selected
                const selectedMerchant =
                  funderMerchants.find(m => m.merchant && m.merchant._id === selected?.value) || null;
                onMerchantChange(selectedMerchant);
              }
            }}
            onInputChange={(input, { action }) => {
              if (action === 'input-change') {
                setFieldValue('newMerchantName', input);
                setFieldValue('merchant', ''); // clear selected merchant id on typing
                onMerchantChange(null);
              }
            }}
            className="text-sm"
            classNamePrefix="select"
            placeholder="Select or type a new merchant..."
            isSearchable
            isClearable
            isLoading={loadingData}
            styles={{
              menuPortal: base => ({ ...base, zIndex: 99999 }),
              menu: base => ({ ...base, zIndex: 99999 }),
            }}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
          <ErrorMessage name="merchant" component="div" className={errorClasses} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={labelClasses}>Contact</label>
          </div>
          <Select
            name="contact"
            options={contacts.map(c => ({ 
              value: c._id, 
              label: `${c.first_name} ${c.last_name}` 
            }))}
            value={values.contact ? {
              value: values.contact,
              label: contacts.find(c => c._id === values.contact) 
                ? `${contacts.find(c => c._id === values.contact)?.first_name} ${contacts.find(c => c._id === values.contact)?.last_name}`
                : ''
            } : null}
            onChange={(selected) => {
              setFieldValue('contact', selected?.value || '');
            }}
            className="text-sm"
            classNamePrefix="select"
            placeholder={!values.merchant ? "Select a merchant first..." : "Select a contact..."}
            isClearable
            isSearchable
            isLoading={loadingLists.contacts}
            isDisabled={!values.merchant}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 99999
              }),
              menu: (base) => ({
                ...base,
                zIndex: 99999
              }),
              control: (base, state) => ({
                ...base,
                backgroundColor: !values.merchant ? '#f9fafb' : base.backgroundColor,
                cursor: !values.merchant ? 'not-allowed' : base.cursor,
              }),
              singleValue: (base) => ({
                ...base,
                color: !values.merchant ? '#9ca3af' : base.color,
              }),
              placeholder: (base) => ({
                ...base,
                color: !values.merchant ? '#9ca3af' : base.color,
              }),
            }}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
          <ErrorMessage name="contact" component="div" className={errorClasses} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={labelClasses}>ISO</label>
          </div>
          <CreatableSelect
            name="iso"
            options={funderISOs
              .filter(item => item.iso && typeof item.iso === 'object')
              .map(i => ({ value: (i.iso as any)._id || '', label: (i.iso as any).name || '' }))}
            value={
              values.iso
                ? { 
                    value: values.iso, 
                    label: (() => {
                      const foundISO = funderISOs.find(i => i.iso && typeof i.iso === 'object' && (i.iso as any)._id === values.iso);
                      return foundISO && typeof foundISO.iso === 'object' ? (foundISO.iso as any).name : '';
                    })()
                  }
                : values.newISOName
                  ? { value: `__new__-${values.newISOName}`, label: values.newISOName }
                  : null
            }
            onChange={(selected, actionMeta) => {
              const isNew = selected?.value?.startsWith('__new__');
              if (isNew) {
                // User typed a new ISO name
                const name = selected?.label || '';
                setFieldValue('iso', ''); // Clear ISO ID
                setFieldValue('newISOName', name); // Save new ISO name in form state
              } else {
                // Existing ISO selected
                setFieldValue('iso', selected?.value || '');
                setFieldValue('newISOName', ''); // Clear new ISO name
              }
            }}
            onInputChange={(input, { action }) => {
              if (action === 'input-change') {
                setFieldValue('newISOName', input); // Update new ISO name as user types
                setFieldValue('iso', ''); // Clear ISO ID while typing new
              }
            }}
            className="text-sm"
            classNamePrefix="select"
            placeholder="Select or type a new ISO..."
            isSearchable
            isClearable
            isLoading={loadingData}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 99999,
              }),
              menu: (base) => ({
                ...base,
                zIndex: 99999,
              }),
            }}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
          <ErrorMessage name="iso" component="div" className={errorClasses} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={labelClasses}>Representative</label>
          </div>
          <Select
            name="representative"
            options={representatives.map(r => ({ 
              value: r._id, 
              label: `${r.first_name} ${r.last_name}` 
            }))}
            value={values.representative ? {
              value: values.representative,
              label: representatives.find(r => r._id === values.representative) 
                ? `${representatives.find(r => r._id === values.representative)?.first_name} ${representatives.find(r => r._id === values.representative)?.last_name}`
                : ''
            } : null}
            onChange={(selected) => {
              setFieldValue('representative', selected?.value || '');
            }}
            className="text-sm"
            classNamePrefix="select"
            placeholder={!values.iso ? "Select an ISO first..." : "Select a representative..."}
            isClearable
            isSearchable
            isLoading={loadingLists.representatives}
            isDisabled={!values.iso}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 99999
              }),
              menu: (base) => ({
                ...base,
                zIndex: 99999
              }),
              control: (base, state) => ({
                ...base,
                backgroundColor: !values.iso ? '#f9fafb' : base.backgroundColor,
                cursor: !values.iso ? 'not-allowed' : base.cursor,
              }),
              singleValue: (base) => ({
                ...base,
                color: !values.iso ? '#9ca3af' : base.color,
              }),
              placeholder: (base) => ({
                ...base,
                color: !values.iso ? '#9ca3af' : base.color,
              }),
            }}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
          <ErrorMessage name="representative" component="div" className={errorClasses} />
        </div>
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          onClick={onNext}
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
          disabled={loading}
        >
          Next
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-2 sm:text-sm"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 