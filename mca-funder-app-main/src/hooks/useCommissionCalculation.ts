import { useCallback } from 'react';
import { getISOFunders } from '@/lib/api/isoFunders';
import { calculateFormula } from '@/lib/api/formulas';

export const useCommissionCalculation = () => {
  return useCallback(async (
    isoId: string,
    funderId: string,
    fundedAmount: number,
    paybackAmount: number
  ) => {
    try {
      const isoFunders = await getISOFunders();
      const match = isoFunders.find(
        (item) => item.iso?._id === isoId && item.funder?._id === funderId
      ) as (typeof isoFunders[number] & { commission_formula?: { _id: string } });
      if (!match || !match.commission_formula || !match.commission_formula._id) return 0;
      const formulaId = match.commission_formula._id;
      return await calculateFormula({ formulaId, fund: fundedAmount, payback: paybackAmount });
    } catch {
      return 0;
    }
  }, []);
}; 