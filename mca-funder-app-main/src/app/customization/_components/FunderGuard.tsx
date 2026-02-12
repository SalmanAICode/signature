'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/store/auth';

interface FunderGuardProps {
  children: ReactNode;
}

export default function FunderGuard({ children }: FunderGuardProps) {
  const { funder } = useAuthStore();

  if (!funder) {
    return (
      <div className="h-full">
        <div className="bg-theme-background rounded-lg shadow-theme-sm p-6">
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-theme-secondary rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-theme-foreground mb-3">Funder Selection Required</h3>
            <p className="text-theme-muted mb-6 max-w-md mx-auto">
              You need to have a funder assigned to your account to access this page. Please contact your administrator to assign a funder to your account.
            </p>
            
            <div className="space-y-4">
              <Link
                href="/customization"
                className="inline-flex items-center px-4 py-2 bg-theme-primary text-theme-primary-foreground rounded-md hover:bg-theme-primary/80 transition-colors font-medium"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Go to Customization Home
              </Link>
              
              <div className="text-sm text-theme-muted bg-theme-accent p-4 rounded-lg border border-theme-border">
                <p className="font-medium mb-2 text-theme-foreground">How to get a funder assigned:</p>
                <ol className="text-left space-y-1 max-w-xs mx-auto">
                  <li>1. Contact your system administrator</li>
                  <li>2. Request funder assignment for your account</li>
                  <li>3. Wait for approval and assignment</li>
                  <li>4. Refresh this page after assignment</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 