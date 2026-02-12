import { useState, useEffect } from 'react';
import { getISOAccountsByISOId } from '@/lib/api/isoAccount';
import { ISOAccount } from '@/types/iso';

export function useISOAccountsByISOId(isoId?: string) {
  const [accounts, setAccounts] = useState<ISOAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[DEBUG] useISOAccountsByISOId hook called with ISO ID:', isoId);
    
    if (!isoId) {
      console.log('[DEBUG] No ISO ID provided, clearing accounts');
      setAccounts([]);
      return;
    }

    setLoading(true);
    setError('');
    console.log('[DEBUG] Fetching ISO accounts...');
    
    getISOAccountsByISOId(isoId)
      .then(res => {
        console.log('[DEBUG] ISO accounts fetched successfully:', res.data.docs);
        setAccounts(res.data.docs);
      })
      .catch(err => {
        console.error('[DEBUG] Error in useISOAccountsByISOId:', err);
        setError(err.message || 'Failed to fetch accounts');
      })
      .finally(() => {
        console.log('[DEBUG] ISO accounts fetch completed');
        setLoading(false);
      });
  }, [isoId]);

  return { accounts, loading, error };
} 