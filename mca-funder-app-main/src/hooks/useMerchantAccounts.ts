import { useState, useEffect } from 'react';
import { getAllMerchantAccounts } from '@/lib/api/merchantAccounts';
import { MerchantAccount } from '@/types/merchant';

export function useMerchantAccounts() {
  const [accounts, setAccounts] = useState<MerchantAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    getAllMerchantAccounts()
      .then(res => setAccounts(res.data.docs))
      .catch(err => setError(err.message || 'Failed to fetch accounts'))
      .finally(() => setLoading(false));
  }, []);

  return { accounts, loading, error };
} 