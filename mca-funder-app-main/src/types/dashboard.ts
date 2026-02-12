export interface MonthlyData {
  month: string;
  fundingCreated: number;
  fundedAmount: number;
  paybackAmount: number;
}

export interface FunderDashboardStats {
  overview: {
    totalFundedAmount: number;
    totalPaybackAmount: number;
    averageFactorRate: number;
    paidBackAmount: number;
    paidBackPercentage: number;
    outstandingBalance: number;
    syndicationAmount: number;
    syndicationPercentage: number;
  };
  monthlyData: MonthlyData[];
}

export interface DashboardStatsResponse {
  success: boolean;
  data: FunderDashboardStats;
} 