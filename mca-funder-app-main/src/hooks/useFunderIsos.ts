import { useState, useEffect } from 'react';
import { ISO } from '@/types/iso';
import useAuthStore from '@/lib/store/auth';

export function useFunderIsos(funderId: string) {
  const [isos, setIsos] = useState<ISO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchIsos = async () => {
      if (!accessToken) {
        setError('Authentication required');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funders/${funderId}/isos`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to fetch ISOs');
        }

        const data = await res.json();
        setIsos(data.data.docs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ISOs');
      } finally {
        setLoading(false);
      }
    };

    fetchIsos();
  }, [funderId, accessToken]);

  return { isos, loading, error };
} 