import { useState, useEffect } from 'react';
import { Funder } from '@/types/funder';
import { getUserFunders } from '@/lib/api/userFunders';

export function useUserFunders(userId: string) {
  const [funders, setFunders] = useState<Funder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFunders = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getUserFunders(userId);
        setFunders(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load funders');
      } finally {
        setLoading(false);
      }
    };

    fetchFunders();
  }, [userId]);

  return { funders, loading, error };
} 