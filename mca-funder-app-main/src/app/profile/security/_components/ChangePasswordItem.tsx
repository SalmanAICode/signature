'use client';

import { useState } from 'react';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { updatePassword } from '@/lib/api/users';
import Key from '@/svg/Key';
import CollapseTransition from '@/components/CollapseTransition';

export default function ChangePasswordItem() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const clearMessages = () => {
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
  };

  const onSubmit = async () => {
    if (!currentPassword || !newPassword) {
      setMessage('');
      setError('Please enter both current and new password');
      clearMessages();
      return;
    }
    setLoading(true);
    updatePassword(currentPassword, newPassword)
      .then((res) => {
        if (res.success) {
          setMessage('Password changed successfully');
          setCurrentPassword('');
          setNewPassword('');
        } else {
          setError(res.message || 'Failed to change password');
        }
      })
      .catch((error) => {
        setError(error.message || 'Request error');
      })
      .finally(() => {
        setLoading(false);
        clearMessages();
      });
  };

  return (
    <li
      className={`bg-theme-secondary border-4 border-theme-primary rounded-xl flex flex-col
        transition-shadow duration-300
        ${open ? 'shadow-theme-lg' : 'shadow-theme-sm'}
        hover:shadow-theme-lg
      `}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-theme-background border border-theme-border rounded-lg shadow-theme-sm hover:shadow-theme-md transition-all duration-300 text-theme-primary"
        aria-expanded={open}
        aria-controls="change-password-panel"
        tabIndex={-1}
      >
        <div className="flex items-center gap-3">
          <Key className="w-5 h-5 text-theme-foreground" />
          <span className="text-base font-medium text-theme-foreground">Change Password</span>
        </div>
        <svg
          className={`w-5 h-5 text-theme-foreground transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <CollapseTransition
        isOpen={open}
        maxHeight="auto"
        expandedPadding="pt-4"
        collapsedPadding="p-0"
        className="overflow-y-auto"
        duration={300}
        easing="ease-linear"
      >
        <div className="px-4 pb-4">
          <div className="max-w-md mx-auto">
            <div className="mb-4 flex flex-col sm:flex-row gap-4 w-full">
              {/* Current password */}
              <div className="relative w-full sm:w-1/2">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-primary" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  className="w-full border border-theme-primary rounded-md pl-10 pr-10 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-theme-primary transition box-border text-theme-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-primary focus:outline-none"
                  tabIndex={-1}
                >
                  {showCurrent ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : (
                    <EyeSlashIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* New password */}
              <div className="relative w-full sm:w-1/2">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-primary" />
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="w-full border border-theme-primary rounded-md pl-10 pr-10 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-theme-primary transition box-border text-theme-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-primary focus:outline-none"
                  tabIndex={-1}
                >
                  {showNew ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : (
                    <EyeSlashIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={onSubmit}
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading && (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Changing...' : 'Change'}
            </button>

            <div className="h-4 mt-3 text-center">
              {message && (
                <p className="text-sm text-green-600 animate-fade-in">{message}</p>
              )}
              {error && (
                <p className="text-sm text-red-600 animate-fade-in">{error}</p>
              )}
              {!error && !message && <span>&nbsp;</span>}
            </div>

            <div className="flex items-center justify-end mt-2">
              <a href="#" className="text-sm text-theme-primary hover:underline">
                Forget Password?
              </a>
            </div>
          </div>
        </div>
      </CollapseTransition>
    </li>
  );
} 