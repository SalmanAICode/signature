import { useState, useEffect } from 'react';
import { getMerchants } from '@/lib/api/merchants';
import { Merchant } from '@/types/merchant';

export const useMerchants = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [merchantsError, setMerchantsError] = useState('');

  useEffect(() => {
    setMerchantsLoading(true);
    setMerchantsError('');
    getMerchants({ page: 1, limit: 100 })
      .then(res => {
        setMerchants(res.data);
      })
      .catch(err => {
        setMerchantsError('Failed to load merchants');
      })
      .finally(() => setMerchantsLoading(false));
  }, []);

  return {
    merchants,
    merchantsLoading,
    merchantsError,
    refetchMerchants: () => {
      setMerchantsLoading(true);
      setMerchantsError('');
      getMerchants({ page: 1, limit: 100 })
        .then(res => {
          setMerchants(res.data);
        })
        .catch(err => {
          setMerchantsError('Failed to load merchants');
        })
        .finally(() => setMerchantsLoading(false));
    }
  };
}; 