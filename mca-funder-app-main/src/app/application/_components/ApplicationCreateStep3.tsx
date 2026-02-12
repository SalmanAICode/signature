import { useEffect, useState, useCallback, useRef } from 'react';
import { ErrorMessage } from 'formik';
import Select from 'react-select';
import { getDocumentList, createDocument } from '@/lib/api/documents';
import { Document } from '@/types/document';
import { ApplicationStipulation } from '@/types/applicationStipulation';
import { getApplicationStipulationList } from '@/lib/api/applicationStipulations';
import { createApplicationDocument } from '@/lib/api/applicationDocuments';

interface DocumentLink {
  document: string;
  stipulation?: string;
}

interface ApplicationCreateStep3Props {
  values: {
    document_list: DocumentLink[];
    merchant: string;
    funder: string;
    iso: string;
  };
  setFieldValue: (field: string, value: any) => void;
  loading: boolean;
  applicationId: string | null;
  onNext: () => void;
  setDocumentsUploaded: (documentsUploaded: boolean) => void;
}

const errorClasses = 'text-red-500 text-xs';

export default function ApplicationCreateStep3({
  values,
  setFieldValue,
  loading,
  onNext,
  applicationId,
  setDocumentsUploaded,
}: ApplicationCreateStep3Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [applicationStipulations, setApplicationStipulations] = useState<ApplicationStipulation[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const documentsData = await getDocumentList({
          merchant: values.merchant,
          funder: values.funder,
          sort: 'file_name',
        });
        setDocuments(documentsData);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    const fetchApplicationStipulations = async () => {
      if (!applicationId) {
        setError('No application ID available');
        return;
      }
      const stipulationsData = await getApplicationStipulationList(applicationId);
      setApplicationStipulations(stipulationsData);
    };

    fetchApplicationStipulations();
  }, []);

  const addDocumentLink = () => {
    const newDocumentList = [...values.document_list, { document: '', stipulation: '' }];
    setFieldValue('document_list', newDocumentList);
  };

  const removeDocumentLink = (index: number) => {
    const newDocumentList = values.document_list.filter((_, i) => i !== index);
    setFieldValue('document_list', newDocumentList);
  };

  const updateDocumentLink = (index: number, field: 'document' | 'stipulation', value: string) => {
    const newDocumentList = [...values.document_list];
    newDocumentList[index] = {
      ...newDocumentList[index],
      [field]: value,
    };
    setFieldValue('document_list', newDocumentList);
  };
  
  // Refresh documents list after upload
  const handleUploadSuccess = async () => {
    try {
      setLoadingDocuments(true);
      const documentsData = await getDocumentList({
        merchant: values.merchant,
        funder: values.funder,
        sort: 'file_name',
      });
      setDocuments(documentsData);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error refreshing documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Handle updating documents (save document links to application)
  const handleUpdateDocuments = async () => {
    if (!applicationId) {
      console.error('No application ID available');
      return;
    }

    try {
      setLoadingDocuments(true);
      setError(null);

      // check if document_list is empty
      if (values.document_list.length === 0) {
        setError('Please add at least one document');
        return;
      }

      // check if document_list has any empty document
      const emptyDocument = values.document_list.find(doc => doc.document === '');
      if (emptyDocument) {
        setError('Please select a document');
        return;
      }

      // check if document_list has any empty stipulation ( if stipulation is not required, it can be empty )
      // const emptyStipulation = values.document_list.find(doc => doc.stipulation === '');
      // if (emptyStipulation) {
      //   setError('Please select a stipulation');
      //   return;
      // }

      // Create application document links for each document
      for (const doc of values.document_list) {
        await createApplicationDocument(
          applicationId,
          doc.document,
          doc.stipulation
        );
      }
      
      setShowSuccess(true);
      setDocumentsUploaded(true);
      
      // Keep loading state until navigation completes
      await new Promise(resolve => setTimeout(resolve, 1000));
      onNext(); // Move to next step
    } catch (error: any) {
      console.error('Error updating documents:', error);
      setError(error?.message || 'Failed to update document links');
      setLoadingDocuments(false);
    }
  };

  const handleFiles = useCallback(async (files: File[]) => {
    try {
      setLoadingDocuments(true);
      setError(null);

      for (const file of files) {
        // Create document
        const document = await createDocument({
          file,
          file_name: file.name,
          merchant: values.merchant,
          funder: values.funder,
          ...(values.iso ? { iso: values.iso } : {}) // include iso only if exists
        });

        // Add the new document to the document list
        setFieldValue('document_list', [
          ...values.document_list,
          { document: document._id, stipulation: '' }
        ]);
      }

      // Show success message and refresh documents list
      setShowSuccess(true);
      await handleUploadSuccess();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      setError(error?.message || 'Failed to upload files');
    } finally {
      setLoadingDocuments(false);
    }
  }, [values.merchant, values.funder, values.iso, values.document_list, setFieldValue, handleUploadSuccess]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only set dragging if files are being dragged
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only reset dragging if leaving the element
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await handleFiles(Array.from(files));
      // Clear the input for future selections
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="rounded-md bg-green-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Files updated successfully!
              </p>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Document Management</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addDocumentLink}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Document
            </button>
          </div>
        </div>

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white'
          }`}
        >
          {loadingDocuments ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                Uploading documents...
              </p>
            </div>
          ) : values.document_list.length === 0 ? (
            <div className="text-center py-12">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.bmp"
              />
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" 
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                Drag and drop files here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, BMP (max 10MB)
              </p>
            </div>
          ) : (
            <>
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-2 items-center bg-gray-50 px-3 py-2">
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-700">Document</label>
                </div>
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-gray-700">Stipulation</label>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700">Action</label>
                </div>
              </div>

              {/* Document Entries */}
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {values.document_list.map((docLink, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center px-3 py-3">
                    <div className="col-span-5">
                      <Select
                        options={documents.map(d => ({
                          value: d._id,
                          label: d.file_name,
                        }))}
                        onChange={(selected) => {
                          updateDocumentLink(index, 'document', selected?.value || '');
                        }}
                        value={docLink.document ? {
                          value: docLink.document,
                          label: documents.find(d => d._id === docLink.document)?.file_name || ''
                        } : null}
                        className="text-sm"
                        classNamePrefix="select"
                        placeholder="Select document..."
                        isSearchable
                        isLoading={loadingDocuments}
                        styles={{
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 99999
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 99999
                          })
                        }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      <ErrorMessage name={`document_list[${index}].document`} component="div" className={errorClasses} />
                    </div>

                    <div className="col-span-6">
                      <Select
                        options={applicationStipulations.map(s => ({
                          value: s._id,
                          label: s.stipulation_type?.name || '',
                        }))}
                        onChange={(selected) => {
                          updateDocumentLink(index, 'stipulation', selected?.value || '');
                        }}
                          value={docLink.stipulation
                        ? {
                            value: docLink.stipulation,
                            label:
                              applicationStipulations.find(s => s._id === docLink.stipulation)
                                ?.stipulation_type?.name || '',
                          }
                        : null}
                        className="text-sm"
                        classNamePrefix="select"
                        placeholder="Select stipulation..."
                        isClearable
                        styles={{
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 99999
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 99999
                          })
                        }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      <ErrorMessage name={`document_list[${index}].stipulation`} component="div" className={errorClasses} />
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeDocumentLink(index)}
                        className="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Remove document"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Upload hint at bottom */}
          <div className="border-t border-gray-200">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Drag file here to upload or click to browse
            </button>
          </div>
        </div>

        <ErrorMessage name="document_list" component="div" className={errorClasses} />
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          onClick={handleUpdateDocuments}
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
          disabled={loading || !applicationId}
        >
          Update Documents
        </button>
        <button
          type="button"
          onClick={onNext}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-2 sm:text-sm"
          disabled={loading}
        >
          Skip to Next Step
        </button>
      </div>
    </div>
  );
} 