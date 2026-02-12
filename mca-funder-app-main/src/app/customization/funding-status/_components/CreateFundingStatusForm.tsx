'use client';

import { useState, useEffect } from 'react';
import { CreateFundingStatus } from '@/types/fundingStatus';
import { createFundingStatusOld } from '@/lib/api/fundingStatuses';
import useAuthStore from '@/lib/store/auth';

interface CreateFundingStatusFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateFundingStatusForm({ onSuccess, onCancel }: CreateFundingStatusFormProps) {
  const { funder } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateFundingStatus>({
    funder: funder?._id || '',
    name: '',
    bgcolor: '#3B82F6',
    initial: false,
    funded: false,
    performing: false,
    warning: false,
    closed: false,
    defaulted: false,
    system: false,
  });

  useEffect(() => {
    if (funder) {
      setFormData(prev => ({
        ...prev,
        funder: funder._id,
      }));
    }
  }, [funder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funder) {
      setError('Please select a funder first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createFundingStatusOld(formData);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to create funding status');
      } else {
        setError('Failed to create funding status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateFundingStatus, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-theme-background p-6 rounded-2xl shadow-theme-xl max-w-lg w-full relative max-h-[95vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-center text-theme-foreground mb-6">
            Add New Funding Status
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-theme-muted mb-1">
                Status Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-theme-border rounded-lg focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary text-sm bg-theme-background text-theme-foreground placeholder-theme-muted"
                placeholder="Enter status name"
              />
            </div>

            {/* Background Color */}
            <div>
              <label htmlFor="bgcolor" className="block text-xs font-medium text-theme-muted mb-1">
                Background Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="bgcolor"
                  name="bgcolor"
                  value={formData.bgcolor}
                  onChange={(e) => handleChange('bgcolor', e.target.value)}
                  className="h-10 w-16 border border-theme-border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.bgcolor}
                  onChange={(e) => handleChange('bgcolor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-theme-border rounded-lg focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary text-sm bg-theme-background text-theme-foreground placeholder-theme-muted"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="initial"
                  name="initial"
                  checked={formData.initial}
                  onChange={(e) => handleChange('initial', e.target.checked)}
                  className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-theme-border rounded"
                />
                <div className="ml-2">
                  <label htmlFor="initial" className="block text-sm text-theme-foreground">
                    Initial Status
                  </label>
                  <span className="text-xs text-theme-muted block">This will be the default status for new funding applications</span>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="funded"
                  name="funded"
                  checked={formData.funded}
                  onChange={(e) => handleChange('funded', e.target.checked)}
                  className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-theme-border rounded"
                />
                <div className="ml-2">
                  <label htmlFor="funded" className="block text-sm text-theme-foreground">
                    Funded Status
                  </label>
                  <span className="text-xs text-theme-muted block">
                    Mark this status as funded - funds have been disbursed
                  </span>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="performing"
                  name="performing"
                  checked={formData.performing}
                  onChange={(e) => handleChange('performing', e.target.checked)}
                  className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-theme-border rounded"
                />
                <div className="ml-2">
                  <label htmlFor="performing" className="block text-sm text-theme-foreground">
                    Performing Status
                  </label>
                  <span className="text-xs text-theme-muted block">
                    The funding is actively performing and payments are being made
                  </span>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="warning"
                  name="warning"
                  checked={formData.warning}
                  onChange={(e) => handleChange('warning', e.target.checked)}
                  className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-theme-border rounded"
                />
                <div className="ml-2">
                  <label htmlFor="warning" className="block text-sm text-theme-foreground">
                    Warning Status
                  </label>
                  <span className="text-xs text-theme-muted block">
                    This status indicates a warning condition that needs attention
                  </span>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="closed"
                  name="closed"
                  checked={formData.closed}
                  onChange={(e) => handleChange('closed', e.target.checked)}
                  className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-theme-border rounded"
                />
                <div className="ml-2">
                  <label htmlFor="closed" className="block text-sm text-theme-foreground">
                    Closed Status
                  </label>
                  <span className="text-xs text-theme-muted block">Funding with this status are considered closed</span>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="defaulted"
                  name="defaulted"
                  checked={formData.defaulted}
                  onChange={(e) => handleChange('defaulted', e.target.checked)}
                  className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-theme-border rounded"
                />
                <div className="ml-2">
                  <label htmlFor="defaulted" className="block text-sm text-theme-foreground">
                    Defaulted Status
                  </label>
                  <span className="text-xs text-theme-muted block">
                    This status indicates the funding has defaulted
                  </span>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="system"
                  name="system"
                  checked={formData.system}
                  onChange={(e) => handleChange('system', e.target.checked)}
                  className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-theme-border rounded"
                />
                <div className="ml-2">
                  <label htmlFor="system" className="block text-sm text-theme-foreground">
                    System Status
                  </label>
                  <span className="text-xs text-theme-muted block">
                    This status is managed by the system and may have special behavior
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-evenly gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="w-1/2 px-6 py-2 rounded-lg bg-success text-white text-base font-medium hover:bg-success/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-1/2 px-6 py-2 rounded-lg border border-theme-border text-theme-foreground text-base font-medium hover:bg-theme-secondary transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 