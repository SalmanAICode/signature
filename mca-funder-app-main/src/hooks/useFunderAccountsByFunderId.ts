import { useState, useEffect } from 'react';
import { getFunderAccountsByFunderId } from '@/lib/api/funderAccounts';
import { FunderAccount } from '@/types/funder';

export function useFunderAccountsByFunderId(funderId?: string) {
  const [accounts, setAccounts] = useState<FunderAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!funderId) {
      setAccounts([]);
      return;
    }
    setLoading(true);
    setError('');
    getFunderAccountsByFunderId(funderId)
      .then(res => setAccounts(res.data.docs))
      .catch(err => setError(err.message || 'Failed to fetch accounts'))
      .finally(() => setLoading(false));
  }, [funderId]);

  return { accounts, loading, error };
} 