import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import useAuthStore from '@/lib/store/auth';

export function useFunderUsers(funderId: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken) {
        setError('Authentication required');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funders/${funderId}/users`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to fetch users');
        }

        const data = await res.json();
        setUsers(data.data.docs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [funderId, accessToken]);

  return { users, loading, error };
} 