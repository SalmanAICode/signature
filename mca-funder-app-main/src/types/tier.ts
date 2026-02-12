export type Tier = 'FACTOR_RATE' | 'FUND' | 'PAYBACK' | 'NONE';
export type TierList = {
    min_number: number;
    max_number: number;
    amount: number;
    percent: number;
}