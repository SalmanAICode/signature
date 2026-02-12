'use client';

import { useState, useEffect } from 'react';
import { FundingStatus, UpdateFundingStatusData } from '@/types/fundingStatus';
import { updateFundingStatusOld } from '@/lib/api/fundingStatuses';

interface UpdateFundingStatusFormProps {
  status: FundingStatus;
  onSuccess: (updatedStatus: FundingStatus) => void;
  onCancel: () => void;
}

export default function UpdateFundingStatusForm({ status, onSuccess, onCancel }: UpdateFundingStatusFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UpdateFundingStatusData>({
    name: '',
    bgcolor: '#3B82F6',
    initial: false,
    funded: false,
    performing: false,
    warning: false,
    closed: false,
    defaulted: false,
    inactive: false,
  });

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name,
        bgcolor: status.bgcolor || '#3B82F6',
        initial: status.initial || false,
        funded: status.funded || false,
        performing: status.performing || false,
        warning: status.warning || false,
        closed: status.closed || false,
        defaulted: status.defaulted || false,
        inactive: status.inactive || false,
      });
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // Check for changes and build update data
      const hasNameChange = formData.name !== status.name;
      const hasBgcolorChange = formData.bgcolor !== (status.bgcolor || '#3B82F6');
      const hasInitialChange = formData.initial !== (status.initial || false);
      const hasFundedChange = formData.funded !== (status.funded || false);
      const hasPerformingChange = formData.performing !== (status.performing || false);
      const hasWarningChange = formData.warning !== (status.warning || false);
      const hasClosedChange = formData.closed !== (status.closed || false);
      const hasDefaultedChange = formData.defaulted !== (status.defaulted || false);
      const hasInactiveChange = formData.inactive !== (status.inactive || false);

      // Check if there are any changes
      const hasChanges = hasNameChange || hasBgcolorChange || hasInitialChange || 
                        hasFundedChange || hasPerformingChange || hasWarningChange || 
                        hasClosedChange || hasDefaultedChange || hasInactiveChange;

      if (!hasChanges) {
        setError('No changes detected');
        setLoading(false);
        return;
      }

      // Build update data - only include changed fields, but name is always required
      const updateData: UpdateFundingStatusData = {
        name: formData.name, // name is always required
        ...(hasBgcolorChange && { bgcolor: formData.bgcolor }),
        ...(hasInitialChange && { initial: formData.initial }),
        ...(hasFundedChange && { funded: formData.funded }),
        ...(hasPerformingChange && { performing: formData.performing }),
        ...(hasWarningChange && { warning: formData.warning }),
        ...(hasClosedChange && { closed: formData.closed }),
        ...(hasDefaultedChange && { defaulted: formData.defaulted }),
        ...(hasInactiveChange && { inactive: formData.inactive }),
      };

      const updatedStatus = await updateFundingStatusOld(status._id, updateData);
      onSuccess(updatedStatus);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to update funding status');
      } else {
        setError('Failed to update funding status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateFundingStatusData, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-theme-background p-6 rounded-2xl shadow-theme-xl max-w-lg w-full relative max-h-[95vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-center text-theme-foreground mb-6">
            Edit Funding Status
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
                  id="inactive"
                  name="inactive"
                  checked={formData.inactive}
                  onChange={(e) => handleChange('inactive', e.target.checked)}
                  className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-theme-border rounded"
                />
                <div className="ml-2">
                  <label htmlFor="inactive" className="block text-sm text-theme-foreground">
                    Inactive Status
                  </label>
                  <span className="text-xs text-theme-muted block">Inactive statuses are hidden by default</span>
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
                {loading ? 'Updating...' : 'Update'}
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