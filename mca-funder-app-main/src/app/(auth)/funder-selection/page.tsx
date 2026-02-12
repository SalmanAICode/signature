'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/auth';
import FunderSelectionModal from '@/components/FunderSelection/FunderSelectionModal';

export default function FunderSelectionPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!accessToken) {
      router.push('/login');
      return;
    }

    // Show the funder selection when component mounts
    setIsOpen(true);
  }, [accessToken, router]);

  const handleClose = () => {
    setIsOpen(false);
    // Redirect to dashboard when closed
    router.push('/dashboard');
  };

  const handleSuccess = () => {
    // Redirect to dashboard after successful funder selection
    router.push('/dashboard');
  };

  if (!accessToken) {
    return null; // Will redirect to login
  }

  return (
    <FunderSelectionModal
      isOpen={isOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      showAsModal={false}
      title="Select Your Funder"
      description="Choose the funder you want to work with"
    />
  );
} 