'use client';

import { useEffect, useState, useRef } from 'react';
import { getFunderList } from '@/lib/api/funders';
import { getSelectedFunder, setSelectedFunder } from '@/lib/api/auth';
import useAuthStore from '@/lib/store/auth';
import { Funder } from '@/types/funder';
import FunderForm from '@/app/funder/_components/funderForm';
import { toast } from 'react-hot-toast';

interface FunderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  showAsModal?: boolean;
}

export default function FunderSelectionModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Select Your Funder",
  description = "Choose the funder you want to work with",
  showAsModal = true
}: FunderSelectionModalProps) {
  const { accessToken } = useAuthStore();
  const [funders, setFunders] = useState<Funder[]>([]);
  const [fundersLoading, setFundersLoading] = useState(false);
  const [fundersError, setFundersError] = useState<string>('');
  const [selectedFunderId, setSelectedFunderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchFunders();
    }
  }, [isOpen]);

  const fetchFunders = async () => {
    setFundersLoading(true);
    setFundersError('');
    
    try {
      const fundersList = await getFunderList();
      setFunders(fundersList);
    } catch (err: any) {
      setFundersError(err.message || 'Failed to load funders');
    } finally {
      setFundersLoading(false);
    }
  };

  const handleFunderSelect = async () => {
    if (!selectedFunderId) {
      setError('Please select a funder');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { accessToken, funder } = await setSelectedFunder(selectedFunderId);
      if (accessToken) {
        useAuthStore.getState().setAuth(accessToken);
      }

      const selectedFunder = await getSelectedFunder();

      if (selectedFunder) {
        useAuthStore.getState().setFunder(selectedFunder);
      }
      setSelectedFunderId('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set selected funder');
      toast.error('Failed to set selected funder');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFunderId('');
    setError('');
    onClose();
  };


  // This is called when the user creates a new funder
  const handleSuccess = async () => {
    setShowForm(false);
    // Refresh the funders list after creating a new funder
    await fetchFunders();
  };

  if (!isOpen) {
    return null;
  }

  // If showing create form, render the FunderForm component
  if (showForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <FunderForm
          initialData={null}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  const content = (
    <div className="w-full max-w-[550px] bg-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center relative shadow-[inset_0px_4px_4px_rgba(0,0,0,0.25)] box-border">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        {title}
      </h1>
      <p className="text-center text-gray-600 mb-8">
        {description}
      </p>

      <div className="space-y-6 w-full max-w-sm">
        {error && (
          <div className="text-red-500 text-sm text-center bg-red-100 p-2 rounded">
            {error}
          </div>
        )}

        {fundersLoading ? (
          <div className="text-center text-gray-600">Loading funders...</div>
        ) : fundersError ? (
          <div className="text-red-500 text-sm text-center bg-red-100 p-2 rounded">
            {fundersError}
          </div>
        ) : !funders || funders.length === 0 ? (
          <div className="text-center text-gray-600">No funders available</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Available Funders
              </label>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Create
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {funders.map((funder: Funder) => (
                <div
                  key={funder._id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFunderId === funder._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedFunderId(funder._id)}
                >
                  <div className="font-medium text-gray-900">{funder.name}</div>
                  <div className="text-sm text-gray-600">{funder.email}</div>
                  {funder.phone && (
                    <div className="text-sm text-gray-500">{funder.phone}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {showAsModal && (
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={loading || !selectedFunderId || fundersLoading || !funders || funders.length === 0}
            onClick={handleFunderSelect}
            className={`flex-1 bg-[#265A88] text-white py-3 rounded-lg hover:bg-[#1e406b] transition-colors duration-200 text-center cursor-pointer ${
              loading || !selectedFunderId || fundersLoading || !funders || funders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Setting Funder...' : showAsModal ? 'Select Funder' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        {content}
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen w-full gap-[32px] justify-center items-center p-4 bg-custom-blue">
      {content}
    </main>
  );
} 