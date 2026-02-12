import { useState, useEffect } from 'react';
import { getMerchantAccountsByMerchantId } from '@/lib/api/merchantAccounts';
import { MerchantAccount } from '@/types/merchant';

export function useMerchantAccountsByMerchantId(merchantId?: string) {
  const [accounts, setAccounts] = useState<MerchantAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!merchantId) {
      setAccounts([]);
      return;
    }
    setLoading(true);
    setError('');
    getMerchantAccountsByMerchantId(merchantId)
      .then(res => {
        setAccounts(res.data.docs);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch accounts');
      })
      .finally(() => setLoading(false));
  }, [merchantId]);

  return { accounts, loading, error };
} 