'use client';

import { useState, useEffect } from 'react';
import { ApplicationStatus, CreateApplicationStatus, UpdateApplicationStatusData } from '@/types/applicationStatus';
import { createApplicationStatus, updateApplicationStatus } from '@/lib/api/applicationStatuses';
import useAuthStore from '@/lib/store/auth';

interface ApplicationStatusFormProps {
  status?: ApplicationStatus | null;
  onSuccess: (updatedStatus?: ApplicationStatus) => void;
  onCancel: () => void;
}

export default function ApplicationStatusForm({ status, onSuccess, onCancel }: ApplicationStatusFormProps) {
  const { funder } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateApplicationStatus & { inactive: boolean }>({
    funder: funder?._id || '',
    name: '',
    bgcolor: '#3B82F6',
    initial: false,
    approved: false,
    closed: false,
    inactive: false,
  });

  useEffect(() => {
    if (status) {
      // Safely get funder ID - handle both object and string cases
      const funderId = typeof status.funder === 'object' ? status.funder._id : status.funder;
      
      setFormData({
        funder: funderId,
        name: status.name,
        bgcolor: status.bgcolor || '#3B82F6',
        initial: status.initial,
        approved: status.approved || false,
        closed: status.closed,
        inactive: status.inactive,
      });
    } else if (funder) {
      setFormData(prev => ({
        ...prev,
        funder: funder._id,
      }));
    }
  }, [status, funder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funder) {
      setError('Please select a funder first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (status) {
        // Check for changes and build update data
        const hasNameChange = formData.name !== status.name;
        const hasBgcolorChange = formData.bgcolor !== (status.bgcolor || '#3B82F6');
        const hasInitialChange = formData.initial !== status.initial;
        const hasApprovedChange = formData.approved !== (status.approved || false);
        const hasClosedChange = formData.closed !== status.closed;
        const hasInactiveChange = formData.inactive !== status.inactive;

        // Check if there are any changes
        const hasChanges = hasNameChange || hasBgcolorChange || hasInitialChange || 
                          hasApprovedChange || hasClosedChange || hasInactiveChange;

        if (!hasChanges) {
          setError('No changes detected');
          setLoading(false);
          return;
        }

        // Build update data - only include changed fields, but name is always required
        const updateData: UpdateApplicationStatusData = {
          name: formData.name, // name is always required
          ...(hasBgcolorChange && { bgcolor: formData.bgcolor }),
          ...(hasInitialChange && { initial: formData.initial }),
          ...(hasApprovedChange && { approved: formData.approved }),
          ...(hasClosedChange && { closed: formData.closed }),
          ...(hasInactiveChange && { inactive: formData.inactive }),
        };
        
        const updatedStatus = await updateApplicationStatus(status._id, updateData);
        onSuccess(updatedStatus);
      } else {
        // For creation, exclude the inactive field as it's not supported
        const createData: Omit<CreateApplicationStatus, 'inactive'> = {
          funder: formData.funder,
          name: formData.name,
          bgcolor: formData.bgcolor,
          initial: formData.initial,
          approved: formData.approved,
          closed: formData.closed,
        };
        await createApplicationStatus(createData);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save application status');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof (CreateApplicationStatus & { inactive: boolean }), value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-theme-background p-6 rounded-2xl shadow-theme-xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-center text-theme-foreground mb-6">
            {status ? 'Edit Application Status' : 'Add New Application Status'}
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
                  <span className="text-xs text-theme-muted block">This will be the default status for new applications</span>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="approved"
                  name="approved"
                  checked={formData.approved}
                  onChange={(e) => handleChange('approved', e.target.checked)}
                  className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-theme-border rounded"
                />
                <div className="ml-2">
                  <label htmlFor="approved" className="block text-sm text-theme-foreground">
                    Approved Status
                  </label>
                  <span className="text-xs text-theme-muted block">
                  Is this status represents the application is approved, it might not be accepted by the merchant yet
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
                  <span className="text-xs text-theme-muted block">Applications with this status are considered closed</span>
                </div>
              </div>

              {/* Only show Inactive Status checkbox when editing */}
              {status && (
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
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-evenly gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="w-1/2 px-6 py-2 rounded-lg bg-success text-white text-base font-medium hover:bg-success/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (status ? 'Update' : 'Create')}
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