import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { ErrorMessage, Field } from 'formik';
import { getLenderList } from '@/lib/api/lenders';

interface Step1Props {
  lenders: any[];
  merchants: any[];
  isos: any[];
  applications: any[];
  offers: any[];
  values: any;
  setFieldValue: (field: string, value: any) => void;
  setFieldTouched: (field: string, touched?: boolean, shouldValidate?: boolean) => void;
  setFieldError: (field: string, message?: string) => void;
  setTouched: (touched: any, shouldValidate?: boolean) => void;
  validateForm: (values?: any) => Promise<any>;
  loadingLists: { merchants: boolean; isos: boolean };
  loadingApps: boolean;
  loadingOffers: boolean;
  handleCreateMerchant: (inputValue: string) => void;
  handleCreateISO: (inputValue: string) => void;
  labelClasses: string;
  errorClasses: string;
  setError: (error: string) => void;
}

const Step1_SelectEntities: React.FC<Step1Props> = ({
  lenders,
  merchants,
  isos,
  applications,
  offers,
  values,
  setFieldValue,
  setFieldTouched,
  setFieldError,
  setTouched,
  validateForm,
  loadingLists,
  loadingApps,
  loadingOffers,
  handleCreateMerchant,
  handleCreateISO,
  labelClasses,
  errorClasses,
  setError,
}) => {
  const [lenderOptions, setLenderOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingLenders, setLoadingLenders] = useState(false);

  useEffect(() => {
    setLoadingLenders(true);
    getLenderList().then((lenders) => {
      setLenderOptions(lenders.map(l => ({ value: l._id, label: l.name })));
      console.log('Available lenders:', lenders);
    }).finally(() => setLoadingLenders(false));
  }, []);


  return (
    <>
      <div>
        <label className={labelClasses}>Lender <span className="text-red-500">*</span></label>
        <Select
          name="lender"
          options={lenderOptions}
          value={lenderOptions.find(option => option.value === values.lender) || null}
          onChange={option => {
            const value = (option as { value: string } | null)?.value || '';
            setFieldValue('lender', value);
            if (typeof setError === 'function') setError('');
          }}
          onBlur={() => setFieldTouched('lender', true, true)}
          className={`min-w-[220px] flex-1 text-sm ${values.lender === '' ? 'border-red-500' : ''}`}
          classNamePrefix="select"
          placeholder="Select a lender"
          isSearchable
          isLoading={loadingLenders}
          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          isClearable
        />
        <ErrorMessage name="lender" component="div" className={errorClasses} />
      </div>
      <div>
        <label className={labelClasses}>Merchant <span className="text-red-500">*</span></label>
        <CreatableSelect
          name="merchant"
          options={merchants.map(m => ({ value: m._id, label: m.name }))}
          value={values.merchant ? { value: values.merchant, label: merchants.find(m => m._id === values.merchant)?.name || '' } : null}
          onChange={option => {
            const value = (option as { value: string } | null)?.value || '';
            setFieldValue('merchant', value);
            setFieldValue('application', '');
            setFieldValue('application_offer', '');
            if (typeof setError === 'function') setError('');
          }}
          onBlur={() => setFieldTouched('merchant', true, true)}
          className={`min-w-[220px] flex-1 text-sm ${values.merchant === '' ? 'border-red-500' : ''}`}
          classNamePrefix="select"
          placeholder="Select or create a merchant"
          isSearchable
          isLoading={loadingLists.merchants}
          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          onCreateOption={handleCreateMerchant}
          isClearable
          formatCreateLabel={(inputValue: string) => `Create new merchant \"${inputValue}\"`}
        />
        <ErrorMessage name="merchant" component="div" className={errorClasses} />
      </div>
      <div>
        <label className={labelClasses}>ISO</label>
        <CreatableSelect
          name="iso"
          options={isos.map(i => ({ value: i._id, label: i.name }))}
          value={values.iso ? { value: values.iso, label: isos.find(i => i._id === values.iso)?.name || '' } : null}
          onChange={option => {
            const value = (option as { value: string } | null)?.value || '';
            setFieldValue('iso', value);
            setFieldValue('application', '');
            setFieldValue('application_offer', '');
          }}
          className="min-w-[220px] flex-1 text-sm"
          classNamePrefix="select"
          placeholder="Select or create an ISO"
          isSearchable
          isLoading={loadingLists.isos}
          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          onCreateOption={handleCreateISO}
          isClearable
          formatCreateLabel={(inputValue: string) => `Create new ISO \"${inputValue}\"`}
        />
        <ErrorMessage name="iso" component="div" className={errorClasses} />
      </div>
      <div>
        <label className={labelClasses}>Application</label>
        <Select
          name="application"
          options={applications.map(app => ({ value: app._id, label: app.name }))}
          value={values.application ? { value: values.application, label: applications.find(app => app._id === values.application)?.name || '' } : null}
          onChange={option => {
            const value = (option as { value: string } | null)?.value || '';
            setFieldValue('application', value);
            setFieldValue('application_offer', '');
          }}
          className="min-w-[220px] flex-1 text-sm"
          classNamePrefix="select"
          placeholder={!values.lender ? "Select a lender first" : !values.merchant ? "Select a merchant first" : !values.iso ? "Select an ISO first" : "Select an application (optional)"}
          isSearchable
          isLoading={loadingApps}
          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          isClearable
          isDisabled={!values.lender || !values.merchant || !values.iso || loadingApps}
        />
        <ErrorMessage name="application" component="div" className={errorClasses} />
      </div>
      <div>
        <label className={labelClasses}>Application Offer</label>
        <Select
          name="application_offer"
          options={offers.map(offer => ({
            value: offer._id,
            label: `Offer $${offer.offered_amount?.toLocaleString()} → $${offer.payback_amount?.toLocaleString()} (${offer.status || 'N/A'})`
          }))}
          value={values.application_offer ? {
            value: values.application_offer,
            label: offers.find(offer => offer._id === values.application_offer) ?
              `Offer $${offers.find(offer => offer._id === values.application_offer)?.offered_amount?.toLocaleString()} → $${offers.find(offer => offer._id === values.application_offer)?.payback_amount?.toLocaleString()} (${offers.find(offer => offer._id === values.application_offer)?.status || 'N/A'})`
              : ''
          } : null}
          onChange={option => {
            const selectedValue = (option as { value: string } | null)?.value || '';
            setFieldValue('application_offer', selectedValue);
            const selectedOffer = offers.find(offer => offer._id === selectedValue);
            if (selectedOffer) {
              setFieldValue('funded_amount', selectedOffer.offered_amount?.toString() || '');
              setFieldValue('payback_amount', selectedOffer.payback_amount?.toString() || '');
            } else {
              setFieldValue('funded_amount', '');
              setFieldValue('payback_amount', '');
            }
          }}
          className="min-w-[220px] flex-1 text-sm"
          classNamePrefix="select"
          placeholder={!values.application ? "Select an application first" : offers.length === 0 ? "No offers available" : "Select an application offer (optional)"}
          isSearchable
          isLoading={loadingOffers}
          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          isClearable
          isDisabled={!values.application || loadingOffers}
        />
        {values.application && offers.length === 0 && !loadingOffers && (
          <div className="text-xs text-red-500 mt-1">
            No offers found
          </div>
        )}
        <ErrorMessage name="application_offer" component="div" className={errorClasses} />
      </div>
    </>
  );
};

export default Step1_SelectEntities; 