import { getFunderISOList } from '@/lib/api/isoFunders';
import { getFormulaById } from '@/lib/api/formulas';
import { calculateFormula, CalculateFormulaParams, CalculateFormulaResult } from './formulaCalculator';

export interface CalculateISOCommissionParams {
  isoId: string;
  funderId: string;
  fund: number;
  payback: number;
}

export interface CalculateISOCommissionResult {
  commission: number;
  commissionFormula?: {
    id: string;
    name: string;
  };
  calculationDetails: CalculateFormulaResult;
}

/**
 * Calculate the ISO commission amount based on ISO-Funder relationship and commission formula
 * @param params - Parameters containing ISO ID, Funder ID, fund amount, and payback amount
 * @returns Promise<CalculateISOCommissionResult> - Commission calculation result
 */
export const calculateISOCommission = async (
  params: CalculateISOCommissionParams
): Promise<CalculateISOCommissionResult> => {
  const { isoId, funderId, fund, payback } = params;

  // Validate inputs
  if (!isoId || !funderId) {
    throw new Error('ISO ID and Funder ID are required');
  }

  if (fund <= 0 || payback <= 0) {
    throw new Error('Fund and payback amounts must be greater than 0');
  }

  try {
    // Get the ISO-Funder relationship to obtain commission_formula
    const isoFunderList = await getFunderISOList(funderId, isoId);
    
    if (!isoFunderList || isoFunderList.length === 0) {
      throw new Error(`No active relationship found between ISO ${isoId} and Funder ${funderId}`);
    }

    // Find the active ISO-Funder relationship
    const isoFunder = isoFunderList.find(relation => !relation.inactive);
    
    if (!isoFunder) {
      throw new Error(`No active relationship found between ISO ${isoId} and Funder ${funderId}`);
    }

    // Check if commission formula exists
    if (!isoFunder.commission_formula) {
      throw new Error(`No commission formula configured for ISO ${isoId} and Funder ${funderId} relationship`);
    }

    // Get the full formula details
    const formula = await getFormulaById(isoFunder.commission_formula._id);

    // Calculate commission using the formula
    const calculationParams: CalculateFormulaParams = {
      formula,
      fund,
      payback
    };

    const calculationDetails = calculateFormula(calculationParams);

    return {
      commission: calculationDetails.cost,
      commissionFormula: {
        id: formula._id,
        name: formula.name
      },
      calculationDetails
    };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to calculate ISO commission: ${error.message}`);
    }
    throw new Error('Failed to calculate ISO commission due to an unknown error');
  }
};

/**
 * Calculate ISO commission for multiple ISO-Funder relationships
 * @param params - Array of calculation parameters
 * @returns Promise<CalculateISOCommissionResult[]> - Array of commission calculation results
 */
export const calculateMultipleISOCommissions = async (
  params: CalculateISOCommissionParams[]
): Promise<CalculateISOCommissionResult[]> => {
  const results = await Promise.allSettled(
    params.map(param => calculateISOCommission(param))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Return a default error result
      return {
        commission: 0,
        commissionFormula: undefined,
        calculationDetails: {
          cost: 0,
          factorRate: params[index].payback / params[index].fund,
          tierUsed: undefined
        }
      };
    }
  });
};

/**
 * Format the ISO commission as currency
 */
export const formatISOCommission = (commission: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(commission);
};

/**
 * Get a human-readable explanation of how the ISO commission was calculated
 */
export const getISOCommissionExplanation = (
  params: CalculateISOCommissionParams,
  result: CalculateISOCommissionResult
): string => {
  const { fund, payback } = params;
  const { commission, commissionFormula, calculationDetails } = result;

  let explanation = `ISO Commission Calculation:\n`;
  
  if (commissionFormula) {
    explanation += `Formula: ${commissionFormula.name}\n`;
  }
  
  explanation += `Fund Amount: ${formatISOCommission(fund)}\n`;
  explanation += `Payback Amount: ${formatISOCommission(payback)}\n`;
  explanation += `Factor Rate: ${calculationDetails.factorRate.toFixed(2)}\n`;
  
  if (calculationDetails.tierUsed) {
    explanation += `Tier Used: ${JSON.stringify(calculationDetails.tierUsed)}\n`;
  }
  
  explanation += `Commission Amount: ${formatISOCommission(commission)}`;

  return explanation;
}; 