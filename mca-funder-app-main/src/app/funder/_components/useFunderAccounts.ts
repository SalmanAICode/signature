// import { useState, useEffect } from 'react';
// import { FunderAccount } from '@/types/funder';
// import { getFunderAccounts } from '@/lib/api/funder';
// import useAuthStore from '@/lib/store/auth';

// interface UseFunderAccountsReturn {
//   accounts: FunderAccount[];
//   loading: boolean;
//   error: string | null;
//   refetch: () => void;
// }

// export function useFunderAccounts(funderId: string): UseFunderAccountsReturn {
//   const [accounts, setAccounts] = useState<FunderAccount[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { accessToken } = useAuthStore();

//   const fetchAccounts = async () => {
//     if (!accessToken || !funderId) return;
    
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await getFunderAccounts(funderId);
//       setAccounts(response.data.docs);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAccounts();
//   }, [funderId, accessToken]);

//   return {
//     accounts,
//     loading,
//     error,
//     refetch: fetchAccounts
//   };
// } 