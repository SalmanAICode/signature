import { useState, useEffect } from 'react';
import { getFunderAccounts } from '@/lib/api/funderAccounts';
import { FunderAccount } from '@/types/funder';

export function useFunderAccounts() {
  const [accounts, setAccounts] = useState<FunderAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getFunderAccounts()
      .then(res => setAccounts(res.data.docs))
      .catch(err => setError(err.message || 'Failed to fetch funder accounts'))
      .finally(() => setLoading(false));
  }, []);

  return { accounts, loading, error };
} 