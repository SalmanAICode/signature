'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowUpTrayIcon,
  XMarkIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  getUploadJobs, 
  cancelUploadJob, 
  createUploadJob,
  UploadJob as ApiUploadJob
} from '@/lib/api/orgmeterUpload';

interface Step5Props {
  importState: {
    selectedFunder: {
      _id: string;
      name: string;
    } | null;
  };
  updateImportState: (updates: unknown) => void;
  nextStep: () => void;
  previousStep: () => void;
}

const DATA_TYPES = [
  {
    value: 'payment',
    label: 'Payment',
    fields: [
      { key: 'paymentId', label: 'Payment ID', required: true },
      { key: 'advanceId', label: 'Advance ID', required: true },
      { key: 'from', label: 'From', required: true },
      { key: 'to', label: 'To', required: true },
      { key: 'type', label: 'Type', required: true },
      { key: 'amount', label: 'Amount', required: true },
      { key: 'dueAt', label: 'Due At', required: true },
      { key: 'paid', label: 'Paid', required: true },
      { key: 'paidDate', label: 'Paid Date', required: true },
    ]
  }
];

export default function Step5ExtraData({ importState, nextStep, previousStep }: Step5Props) {
  const [jobs, setJobs] = useState<ApiUploadJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedFunder } = importState;

  useEffect(() => {
    if (selectedFunder) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [selectedFunder]);

  const fetchJobs = async () => {
    if (!selectedFunder) return;
    
    setLoading(true);
    try {
      const response = await getUploadJobs({
        funder: selectedFunder._id,
        page: 1,
        limit: 20
      });
      
      if (response.success) {
        setJobs(response.data.jobs || []);
      } else {
        console.error('Failed to fetch jobs:', response.message);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      const response = await cancelUploadJob(jobId);
      if (response.success) {
        await fetchJobs();
      } else {
        console.error('Failed to cancel job:', response.message);
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Parse CSV to get column headers
    const text = await file.text();
    const lines = text.split('\n');
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setCsvColumns(headers);
      setFieldMappings({});
    }
  };

  const handleDataTypeChange = (dataType: string) => {
    setSelectedDataType(dataType);
    setFieldMappings({});
  };

  const handleFieldMapping = (fieldKey: string, columnName: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldKey]: columnName
    }));
  };

  const validateMappings = () => {
    if (!selectedDataType) return false;
    
    const dataType = DATA_TYPES.find(dt => dt.value === selectedDataType);
    if (!dataType) return false;

    const requiredFields = dataType.fields.filter(f => f.required);
    const mappedFields = Object.keys(fieldMappings).filter(key => fieldMappings[key]);
    
    // Check if all required fields are mapped
    const allRequiredMapped = requiredFields.every(field => 
      mappedFields.includes(field.key) && fieldMappings[field.key]
    );

    // Check for duplicate column assignments
    const mappedColumns = Object.values(fieldMappings).filter(col => col);
    const uniqueColumns = new Set(mappedColumns);
    const noDuplicates = mappedColumns.length === uniqueColumns.size;

    return allRequiredMapped && noDuplicates;
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDataType || !validateMappings() || !selectedFunder) {
      setError('Please complete all required field mappings');
      return;
    }

    // Check for duplicate column assignments
    const mappedColumns = Object.values(fieldMappings).filter(col => col);
    const uniqueColumns = new Set(mappedColumns);
    if (mappedColumns.length !== uniqueColumns.size) {
      setError('Each column can only be mapped to one field');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await createUploadJob(selectedDataType, {
        csvFile: selectedFile,
        funder: selectedFunder._id,
        fieldMappings,
        skipFirstRow: true
      });

      if (response.success) {
        // Close modal and refresh jobs
        setShowUploadModal(false);
        resetUploadState();
        await fetchJobs();
      } else {
        throw new Error(response.message || 'Upload failed');
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadState = () => {
    setSelectedDataType('');
    setSelectedFile(null);
    setCsvColumns([]);
    setFieldMappings({});
    setError(null);
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <ClockIcon className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XMarkIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedDataTypeObj = DATA_TYPES.find(dt => dt.value === selectedDataType);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Extra Data Import
        </h2>
        <p className="text-gray-600">
          Upload additional CSV files to import extra data after the main sync process
        </p>
      </div>

      {/* Upload Jobs Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Jobs</h3>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            New Upload
          </button>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No upload jobs yet</p>
            <p className="text-sm">Click &ldquo;New Upload&rdquo; to start importing extra data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.jobId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getJobStatusIcon(job.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{job.fileName || job.parameters?.fileName || 'Unknown File'}</h4>
                      <p className="text-sm text-gray-600">
                        Data Type: {job.entityType} • Created: {new Date(job.createdAt || job.startedAt || '').toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getJobStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    {job.status === 'running' && (
                      <button
                        onClick={() => handleCancelJob(job.jobId)}
                        className="flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-700 text-sm"
                      >
                        <StopIcon className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                {job.progress && job.status === 'running' && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{job.progress.percentage}% complete</div>
                  </div>
                )}
                {job.error && job.status === 'failed' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                    {job.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Extra Data</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadState();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                {error}
              </div>
            )}

            {/* Data Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Type *
              </label>
              <select
                value={selectedDataType}
                onChange={(e) => handleDataTypeChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select data type...</option>
                {DATA_TYPES.map((dataType) => (
                  <option key={dataType.value} value={dataType.value}>
                    {dataType.label}
                  </option>
                ))}
              </select>
            </div>


            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File *
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {selectedFile.name} ({csvColumns.length} columns detected)
                </p>
              )}
            </div>

            {/* Field Mapping */}
            {selectedDataTypeObj && csvColumns.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Field Mapping</h4>
                <div className="space-y-3">
                  {selectedDataTypeObj.fields.map((field) => (
                    <div key={field.key} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-600 ml-1">*</span>}
                      </div>
                      <select
                        value={fieldMappings[field.key] || ''}
                        onChange={(e) => handleFieldMapping(field.key, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select column...</option>
                        {csvColumns.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadState();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!validateMappings() || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={previousStep}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
} 