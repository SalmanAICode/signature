/**
 * Helper functions for application offer calculations
 */

export interface CalculationParams {
  offeredAmount?: number;
  paybackAmount?: number;
  termLength?: number;
  factorRate?: number;
  buyRate?: number;
  commissionAmount?: number;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  feeList?: { amount: number }[];
  disbursementAmount?: number;
  paymentAmount?: number;
  paybackCount?: number;
  paydayList?: number[];
}



/**
 * Calculate factor rate based on offered amount and payback amount
 * Factor Rate = Payback Amount / Offered Amount
 */
export const calculateFactorRate = (offeredAmount: number, paybackAmount: number): number | undefined => {
  if (!offeredAmount || offeredAmount <= 0 || !paybackAmount || paybackAmount <= 0) return undefined;
  return Number((paybackAmount / offeredAmount).toFixed(2));
};

/**
 * Calculate payment amount based on payback amount and payback length (number of payments)
 * Payment Amount = Payback Amount / Payback Count
 */
export const calculatePaymentAmount = (paybackAmount: number, paybackCount: number): number | undefined => {
  if (!paybackAmount || paybackAmount <= 0 || !paybackCount || paybackCount <= 0) return undefined;
  return Number((paybackAmount / paybackCount).toFixed(2));
};

/**
 * Calculate term length based on installment and frequency
 * For DAILY: Term Length = PaybackCount / Payday_list.length / 4
 * For WEEKLY: Term Length = PaybackCount / 4
 * For MONTHLY: Term Length = PaybackCount
 */
export const calculateTermLength = (paybackCount: number, paydayList: number[], frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'): number | undefined => {
  if (!paybackCount || paybackCount <= 0) return undefined;
  
  switch (frequency) {
    case 'DAILY':
      // Prevent division by zero when no paydays are selected
      if (!paydayList || paydayList.length === 0) return undefined;
      return Number((paybackCount / paydayList.length / 4).toFixed(2));
    case 'WEEKLY':
      return Number((paybackCount / 4).toFixed(2));
    case 'MONTHLY':
      return Number(paybackCount.toFixed(2));
    default:
      return undefined;
  }
};

/**
 * Calculate total fees from fee list
 */
export const calculateTotalFees = (feeList: { amount: number }[]): number => {
  if (!feeList || feeList.length === 0) return 0;
  return Number(feeList.reduce((total, fee) => total + (fee.amount || 0), 0).toFixed(2));
};

/**
 * Calculate disbursement amount
 * Disbursement Amount = Offered Amount - Total Fees - Commission Amount
 */
export const calculateDisbursementAmount = (
  offeredAmount: number, 
  totalFees: number, 
): number | undefined => {
  if (!offeredAmount || offeredAmount <= 0) return undefined;
  // Note: the calculation maybe wrong, we need to check it
  // const disbursement = offeredAmount - (totalFees || 0) - (commissionAmount || 0);
  const disbursement = offeredAmount - (totalFees || 0);
  return Math.max(0, Number(disbursement.toFixed(2))); // Always return number for disbursement, but can be 0
};

/**
 * Calculate buy rate as a percentage
 * Buy Rate = (Payback Amount - Commission Amount) / Offered Amount × 100
 */
export const calculateBuyRate = (paybackAmount: number, commissionAmount: number, offeredAmount: number): number | undefined => {
  if (!paybackAmount || paybackAmount <= 0 || !offeredAmount || offeredAmount <= 0) return undefined;
  // Note: the calculation maybe wrong, we need to check it
  // const buyRate = ((paybackAmount - (commissionAmount || 0)) / offeredAmount) * 100;
  const buyRate = ((paybackAmount - (commissionAmount || 0)) / offeredAmount);
  return Number(buyRate.toFixed(2));
};



/**
 * Validate calculation results
 */
export const validateCalculations = (values: CalculationParams): string[] => {
  const errors: string[] = [];

  // Disbursement amount should not be negative
  if (values.disbursementAmount && values.disbursementAmount < 0) {
    errors.push('Disbursement amount cannot be negative. Please adjust fees or commission.');
  }

  // Factor rate should be reasonable (typically between 1.0 and 2.0)
  if (values.factorRate && (values.factorRate < 1.0 || values.factorRate > 3.0)) {
    errors.push('Factor rate seems unusual. Please verify the calculation.');
  }

  // Buy rate should be reasonable (typically between 0% and 50%)
  if (values.buyRate && (values.buyRate < 0 || values.buyRate > 50)) {
    errors.push('Buy rate seems unusual. Please verify the commission amount.');
  }

  return errors;
}; 