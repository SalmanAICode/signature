export interface LenderAccount {
    _id: string;
    lender: string;
    name: string;
    bank_name: string;
    routing_number: string;
    account_number: string;
    account_type: string;
    branch: string;
    dda: boolean;
    available_balance: number;
    inactive: boolean;
    transaction_list: string[];
    createdAt: string;
    updatedAt: string;
    __v: number;
}