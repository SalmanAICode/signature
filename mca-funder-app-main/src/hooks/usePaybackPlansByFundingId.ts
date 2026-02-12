import { useState, useEffect } from 'react';
import { getPaybackPlans } from '@/lib/api/paybackPlans';
import { PaybackPlan } from '@/types/paybackPlan';

interface UsePaybackPlansByFundingIdReturn {
  paybackPlans: PaybackPlan[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePaybackPlansByFundingId(fundingId?: string): UsePaybackPlansByFundingIdReturn {
  const [paybackPlans, setPaybackPlans] = useState<PaybackPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaybackPlans = async () => {
    if (!fundingId) {
      setPaybackPlans([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getPaybackPlans({ funding: fundingId });
      setPaybackPlans(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payback plans');
      setPaybackPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaybackPlans();
  }, [fundingId]);

  return {
    paybackPlans,
    loading,
    error,
    refetch: fetchPaybackPlans,
  };
} 