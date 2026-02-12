import { useEffect } from 'react';

interface ApplicationCreateStep4Props {
  onFinish: () => void;
  onViewApplication: () => void;
  loading?: boolean;
  documentsUploaded: boolean;
}

export default function ApplicationCreateStep4({ onFinish, onViewApplication, loading, documentsUploaded }: ApplicationCreateStep4Props) {
  return (
    <div className="space-y-6">
      <div>

        <div className="border border-gray-200 rounded mt-1 p-8">
          <div className="text-center">

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Application Created Successfully!
            </h2>
            

            <div className="max-w-sm mx-auto space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {documentsUploaded ? (
                  <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={documentsUploaded ? 'text-gray-600' : 'text-red-600'}>
                  {documentsUploaded ? 'Documents Uploaded and Linked' : 'Documents Not Uploaded'}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Stipulations Assigned</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Application Details Saved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          onClick={onFinish}
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
          disabled={loading}
        >
          Close
        </button>
        <button
          type="button"
          onClick={onViewApplication}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
          disabled={loading}
        >
          View Application
        </button>
      </div>
    </div>
  );
} 