import { useState, useEffect } from 'react';
import { getISOAccounts } from '@/lib/api/isoAccount';
import { ISOAccount } from '@/types/iso';

export function useISOAccounts() {
  const [accounts, setAccounts] = useState<ISOAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getISOAccounts()
      .then(res => setAccounts(res.data.docs))
      .catch(err => setError(err.message || 'Failed to fetch ISO accounts'))
      .finally(() => setLoading(false));
  }, []);

  return { accounts, loading, error };
} 