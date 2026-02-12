import { Formula } from '@/types/formula';

export interface CalculateFormulaParams {
  formula: Formula;
  fund: number;
  payback: number;
}

export interface CalculateFormulaResult {
  cost: number;
  tierUsed?: any;
  factorRate: number;
}

/**
 * Calculate the cost based on a formula, fund amount, and payback amount
 * This mirrors the backend calculateFormula function
 */
export const calculateFormula = (params: CalculateFormulaParams): CalculateFormulaResult => {
  const { formula, fund, payback } = params;

  // Validate inputs
  if (fund <= 0 || payback <= 0) {
    throw new Error('Fund and payback must be greater than 0');
  }

  if (!formula.tier_list || formula.tier_list.length === 0) {
    throw new Error('Formula is not valid - no tier list');
  }

  const factorRate = payback / fund;
  
  // Find the appropriate tier based on tier_type
  let tier;
  
  switch (formula.tier_type) {
    case 'FUND':
      tier = formula.tier_list.find(t => 
        t.min_number <= fund && t.max_number >= fund
      );
      break;
    case 'PAYBACK':
      tier = formula.tier_list.find(t => 
        t.min_number <= payback && t.max_number >= payback
      );
      break;
    case 'FACTOR_RATE':
      tier = formula.tier_list.find(t => 
        t.min_number <= factorRate && t.max_number >= factorRate
      );
      break;
    case null:
    case undefined:
      // NONE case - use first tier
      tier = formula.tier_list[0];
      break;
    default:
      throw new Error(`Invalid tier type: ${formula.tier_type}`);
  }

  // If no tier found, use the first tier as fallback
  if (!tier) {
    tier = formula.tier_list[0];
  }

  // Calculate cost based on calculate_type
  if (formula.calculate_type === 'AMOUNT') {
    return {
      cost: tier.amount,
      tierUsed: tier,
      factorRate
    };
  }

  // For PERCENT calculate_type, need base_item
  if (formula.calculate_type === 'PERCENT') {
    let cost: number;
    
    switch (formula.base_item) {
      case 'FUND':
        cost = fund * (tier.percent / 100);
        break;
      case 'PAYBACK':
        cost = payback * (tier.percent / 100);
        break;
      default:
        throw new Error(`Invalid base item: ${formula.base_item}`);
    }
    
    return {
      cost,
      tierUsed: tier,
      factorRate
    };
  }

  throw new Error(`Invalid calculate type: ${formula.calculate_type}`);
};

/**
 * Format the calculated cost as currency
 */
export const formatFormulaCost = (cost: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cost);
};

/**
 * Get a human-readable explanation of how the formula was calculated
 */
export const getFormulaCalculationExplanation = (
  params: CalculateFormulaParams,
  result: CalculateFormulaResult
): string => {
  const { formula, fund, payback } = params;
  const { cost, tierUsed, factorRate } = result;

  let explanation = '';

  // Add tier selection explanation
  if (formula.tier_type === 'FUND') {
    explanation += `Using tier for fund amount $${fund.toLocaleString()}. `;
  } else if (formula.tier_type === 'PAYBACK') {
    explanation += `Using tier for payback amount $${payback.toLocaleString()}. `;
  } else if (formula.tier_type === 'FACTOR_RATE') {
    explanation += `Using tier for factor rate ${factorRate.toFixed(2)} (${payback}/${fund}). `;
  } else {
    explanation += `Using default tier (no tier type specified). `;
  }

  // Add calculation explanation
  if (formula.calculate_type === 'AMOUNT') {
    explanation += `Fixed amount: ${formatFormulaCost(cost)}`;
  } else if (formula.calculate_type === 'PERCENT') {
    const baseAmount = formula.base_item === 'FUND' ? fund : payback;
    const baseLabel = formula.base_item === 'FUND' ? 'fund' : 'payback';
    explanation += `${tierUsed?.percent}% of ${baseLabel} (${formatFormulaCost(baseAmount)}) = ${formatFormulaCost(cost)}`;
  }

  return explanation;
}; 