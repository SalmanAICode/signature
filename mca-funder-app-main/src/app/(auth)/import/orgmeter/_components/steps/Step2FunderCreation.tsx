'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, ClockIcon, UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Funder, CreateFunderData } from '@/types/funder';
import { ExistingFundersResponse, ExistingFunderDetails } from '@/lib/api/orgmeterImport';

interface ImportState {
  selectedFunder?: Funder;
  funderCreated?: boolean;
  apiKey?: string;
  [key: string]: unknown;
}

interface Step2Props {
  importState: ImportState;
  updateImportState: (updates: Partial<ImportState>) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export default function Step2FunderCreation({ importState, updateImportState, nextStep }: Step2Props) {
  const [selectedFunder, setSelectedFunder] = useState<Funder | null>(importState.selectedFunder || null);
  const [showExpandedDetails, setShowExpandedDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingFunders, setExistingFunders] = useState<ExistingFundersResponse | null>(null);
  const [loadingExistingFunders, setLoadingExistingFunders] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Sync local selectedFunder with import state
  useEffect(() => {
    if (importState.selectedFunder && !selectedFunder) {
      setSelectedFunder(importState.selectedFunder);
    }
  }, [importState.selectedFunder, selectedFunder]);

  // Fetch existing funders when component mounts and API key is available
  useEffect(() => {
    if (importState.apiKey && !selectedFunder) {
      fetchExistingFunders();
    }
  }, [importState.apiKey, selectedFunder]);

  const fetchExistingFunders = async () => {
    if (!importState.apiKey) return;

    setLoadingExistingFunders(true);
    setError(null);

    try {
      const { getExistingFunders } = await import('@/lib/api/orgmeterImport');
      const result = await getExistingFunders({ apiKey: importState.apiKey as string });
      setExistingFunders(result);
      
      // If no funders found, show create form by default
      if (result.data.funders.length === 0) {
        setShowCreateForm(true);
      }
    } catch (error) {
      console.error('Failed to fetch existing funders:', error);
      setError('Failed to check for existing funders. You can still create a new funder.');
      setShowCreateForm(true); // Show create form on error
    } finally {
      setLoadingExistingFunders(false);
    }
  };

  const selectExistingFunder = (funderDetails: ExistingFunderDetails) => {
    // Convert existing funder details to Funder object
    const funder: Funder = {
      _id: funderDetails.funderId,
      name: funderDetails.funderName,
      email: funderDetails.funderEmail || undefined,
      website: funderDetails.funderWebsite || undefined,
      // Add other required fields with defaults if needed
    } as Funder;
    
    setSelectedFunder(funder);
    updateImportState({ 
      selectedFunder: funder, 
      funderCreated: false // This is an existing funder, not newly created
    });
  };

  const cancelFunderSelection = () => {
    setSelectedFunder(null);
    updateImportState({ 
      selectedFunder: null as any, 
      funderCreated: false 
    });
  };

  // New funder form state
  const [newFunder, setNewFunder] = useState<CreateFunderData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    business_detail: {
      ein: '',
      entity_type: '',
      incorporation_date: '',
      state_of_incorporation: ''
    },
    address_detail: {
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      zip: ''
    },
    bgcolor: '#3B82F6', // Default blue color
    import: {
      source: 'OrgMeter',
      api_key: (importState.apiKey as string) || ''
    }
  });

  const createFunder = async () => {
    if (!newFunder.name.trim()) {
      setError('Funder name is required');
      return;
    }

    if (!importState.apiKey) {
      setError('API key is missing. Please go back and validate your API key first.');
      return;
    }

    setLoading(true);
    setError(null); // Clear any previous errors
    
    try {
              // Ensure import information is always included and all required fields have values
        const funderDataWithImport = {
          name: newFunder.name,
          email: newFunder.email || undefined,
          phone: newFunder.phone || undefined,
          website: newFunder.website || undefined,
          business_detail: {
            ein: newFunder.business_detail?.ein || undefined,
            entity_type: newFunder.business_detail?.entity_type || undefined,
            incorporation_date: newFunder.business_detail?.incorporation_date || undefined,
            state_of_incorporation: newFunder.business_detail?.state_of_incorporation || undefined
          },
          address_detail: {
            address_1: newFunder.address_detail?.address_1 || undefined,
            address_2: newFunder.address_detail?.address_2 || undefined,
            city: newFunder.address_detail?.city || undefined,
            state: newFunder.address_detail?.state || undefined,
            zip: newFunder.address_detail?.zip || undefined
          },
          bgcolor: newFunder.bgcolor || undefined,
          import: {
            api_key: (importState.apiKey as string)
          }
        };

      const { createFunder } = await import('@/lib/api/orgmeterImport');
      const result = await createFunder(funderDataWithImport);
      
      // Handle different possible response structures
      const createdFunder = result.data || result;
      
      if (!createdFunder) {
        throw new Error('No funder data returned from API');
      }
      
      setSelectedFunder(createdFunder);
      
      // Show success toast with fallback for funder name
      const funderName = createdFunder.name || newFunder.name || 'Funder';
      toast.success(`Funder "${funderName}" created successfully!`, {
        duration: 3000,
        position: 'top-right',
      });
      
      // Update import state to indicate funder was created and selected
      updateImportState({ 
        selectedFunder: createdFunder, 
        funderCreated: true 
      });

      // Automatically move to next step after successful creation
      setTimeout(() => {
        nextStep();
      }, 2500); // Increased delay to show notification

      // Reset form
      setNewFunder({
        name: '',
        email: '',
        phone: '',
        website: '',
        business_detail: {
          ein: '',
          entity_type: '',
          incorporation_date: '',
          state_of_incorporation: ''
        },
        address_detail: {
          address_1: '',
          address_2: '',
          city: '',
          state: '',
          zip: ''
        },
        bgcolor: '#3B82F6', // Default blue color
        import: {
          api_key: (importState.apiKey as string) || ''
        }
      });
    } catch (error: unknown) {
      console.error('Failed to create funder:', error);
      
      // Extract error message from different error formats
      let errorMessage = 'Failed to create funder. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      
      // Handle specific error cases
      if (errorMessage.includes('apiKey')) {
        errorMessage = 'API key validation failed. Please check your API key and try again.';
      } else if (errorMessage.includes('required')) {
        errorMessage = errorMessage;
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        errorMessage = 'A funder with this name already exists. Please choose a different name.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedFunder) {
      // Ensure the import state is properly updated before proceeding
      updateImportState({ 
        selectedFunder: selectedFunder, 
        funderCreated: true 
      });
      nextStep();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Funder
        </h2>
        <p className="text-gray-600">
          Create a new funder to associate with the imported OrgMeter data.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {selectedFunder ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Funder Selected Successfully</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">{selectedFunder?.name}</h4>
                  {selectedFunder?.email && (
                    <p className="text-sm text-green-800">{selectedFunder.email}</p>
                  )}
                  {selectedFunder?.phone && (
                    <p className="text-sm text-green-800">{selectedFunder.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleNext}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue with Selected Funder
              </button>
              <button
                onClick={cancelFunderSelection}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Change Funder
              </button>
            </div>
          </div>
        ) : loadingExistingFunders ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking for existing funders...</p>
          </div>
        ) : existingFunders && existingFunders.data.funders.length > 0 && !showCreateForm ? (
          <div className="space-y-6">
            <div className="text-center">
              <UserGroupIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Existing Funders Found</h3>
              <p className="text-gray-600">
                We found {existingFunders.data.funders.length} existing funder{existingFunders.data.funders.length > 1 ? 's' : ''} with import history for this API key.
              </p>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{existingFunders.data.summary.totalFunders}</div>
                <div className="text-sm text-blue-800">Total Funders</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{existingFunders.data.summary.fundersWithActiveJobs}</div>
                <div className="text-sm text-orange-800">With Active Jobs</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{existingFunders.data.summary.totalActiveJobs}</div>
                <div className="text-sm text-green-800">Active Jobs</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{existingFunders.data.summary.totalCompletedJobs}</div>
                <div className="text-sm text-gray-800">Completed Jobs</div>
              </div>
            </div>

            {/* Existing Funders List */}
            <div className="space-y-4">
              {existingFunders.data.funders.map((funder) => (
                <div
                  key={funder.funderId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{funder.funderName}</h4>
                        {funder.hasActiveJobs && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                            <ClockIcon className="w-3 h-3" />
                            Active Jobs
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          {funder.funderEmail && (
                            <p className="text-sm text-gray-600">📧 {funder.funderEmail}</p>
                          )}
                          {funder.funderWebsite && (
                            <p className="text-sm text-gray-600">🌐 {funder.funderWebsite}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            Created: {new Date(funder.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>📊 Jobs: {funder.importStats.totalJobs} total, {funder.importStats.activeJobs} active</p>
                          <p>✅ Completed: {funder.importStats.completedJobs}</p>
                          <p>📋 Entity Types: {funder.importStats.entityTypes.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => selectExistingFunder(funder)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select Funder
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Create New Funder Option */}
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Create New Funder Instead
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {existingFunders && existingFunders.data.funders.length > 0 ? 'Create New Funder' : 'Funder Information'}
              </h3>
              {existingFunders && existingFunders.data.funders.length > 0 && showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Back to Existing Funders
                </button>
              )}
            </div>

            {/* No existing funders message */}
            {existingFunders && existingFunders.data.funders.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <UserGroupIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">No Existing Funders Found</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      No funders were found with import history for this API key. Create a new funder to get started.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error Creating Funder
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => setError(null)}
                        className="text-sm text-red-600 hover:text-red-500 font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funder Name *
                </label>
                <input
                  type="text"
                  value={newFunder.name}
                  onChange={(e) => {
                    setNewFunder(prev => ({ ...prev, name: e.target.value }));
                    if (error) setError(null); // Clear error when user starts typing
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter funder name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newFunder.email}
                  onChange={(e) => setNewFunder(prev => ({ ...prev, email: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newFunder.phone}
                  onChange={(e) => setNewFunder(prev => ({ ...prev, phone: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funder Color
                </label>
                
                {/* Color Palette */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      '#3B82F6', // Blue
                      '#10B981', // Green
                      '#F59E0B', // Amber
                      '#EF4444', // Red
                      '#8B5CF6', // Purple
                      '#EC4899', // Pink
                      '#06B6D4', // Cyan
                      '#84CC16', // Lime
                      '#F97316', // Orange
                      '#6B7280', // Gray
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewFunder(prev => ({ ...prev, bgcolor: color }))}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          newFunder.bgcolor === color 
                            ? 'border-gray-900 ring-2 ring-gray-400' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newFunder.bgcolor || '#3B82F6'}
                    onChange={(e) => setNewFunder(prev => ({ ...prev, bgcolor: e.target.value }))}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newFunder.bgcolor || '#3B82F6'}
                      onChange={(e) => setNewFunder(prev => ({ ...prev, bgcolor: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a preset color or enter a custom hex color
                </p>
              </div>

              {/* Expandable details */}
              <div>
                <button
                  onClick={() => setShowExpandedDetails(!showExpandedDetails)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {showExpandedDetails ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  {showExpandedDetails ? 'Hide' : 'Show'} Additional Details
                </button>

                {showExpandedDetails && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={newFunder.website}
                        onChange={(e) => setNewFunder(prev => ({ ...prev, website: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          EIN
                        </label>
                        <input
                          type="text"
                          value={newFunder.business_detail?.ein || ''}
                          onChange={(e) => setNewFunder(prev => ({ 
                            ...prev, 
                            business_detail: { ...prev.business_detail!, ein: e.target.value }
                          }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Employee ID Number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Entity Type
                        </label>
                        <select
                          value={newFunder.business_detail?.entity_type || ''}
                          onChange={(e) => setNewFunder(prev => ({ 
                            ...prev, 
                            business_detail: { ...prev.business_detail!, entity_type: e.target.value }
                          }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Entity Type</option>
                          <option value="LLC">LLC</option>
                          <option value="Corporation">Corporation</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Incorporation Date
                        </label>
                        <input
                          type="date"
                          value={newFunder.business_detail?.incorporation_date || ''}
                          onChange={(e) => setNewFunder(prev => ({ 
                            ...prev, 
                            business_detail: { ...prev.business_detail!, incorporation_date: e.target.value }
                          }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State of Incorporation
                        </label>
                        <input
                          type="text"
                          value={newFunder.business_detail?.state_of_incorporation || ''}
                          onChange={(e) => setNewFunder(prev => ({ 
                            ...prev, 
                            business_detail: { ...prev.business_detail!, state_of_incorporation: e.target.value }
                          }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="State"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={newFunder.address_detail?.address_1 || ''}
                        onChange={(e) => setNewFunder(prev => ({ 
                          ...prev, 
                          address_detail: { ...prev.address_detail!, address_1: e.target.value }
                        }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={newFunder.address_detail?.city || ''}
                          onChange={(e) => setNewFunder(prev => ({ 
                            ...prev, 
                            address_detail: { ...prev.address_detail!, city: e.target.value }
                          }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={newFunder.address_detail?.state || ''}
                          onChange={(e) => setNewFunder(prev => ({ 
                            ...prev, 
                            address_detail: { ...prev.address_detail!, state: e.target.value }
                          }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="State"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={newFunder.address_detail?.zip || ''}
                        onChange={(e) => setNewFunder(prev => ({ 
                          ...prev, 
                          address_detail: { ...prev.address_detail!, zip: e.target.value }
                        }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={createFunder}
                disabled={!newFunder.name.trim() || loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Funder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 