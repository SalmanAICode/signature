import { Lender } from '@/types/lender';
import { formatPhone, formatDate, formatAddress } from '@/lib/utils/format';

interface LenderDetailModalProps {
    lender: Lender;
    onClose: () => void;
}

export default function LenderDetailModal({ lender, onClose }: LenderDetailModalProps) {
    // Helper function to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Lender Details</h2>
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 mb-6">
                    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Company Name</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{lender.name}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{lender.email}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatPhone(lender.phone)}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Website</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {lender.website ? (
                                    <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        {lender.website}
                                    </a>
                                ) : '-'}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Entity Type</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{lender.business_detail?.entity_type || '-'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">EIN</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{lender.business_detail?.ein || '-'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">State of Incorporation</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{lender.business_detail?.state_of_incorporation || '-'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Incorporation Date</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {lender.business_detail?.incorporation_date ? formatDate(lender.business_detail.incorporation_date) : '-'}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {lender.inactive ? (
                                    <span className="inline-block px-2 py-1 rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 text-xs font-bold">Inactive</span>
                                ) : (
                                    <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 text-xs font-bold">Active</span>
                                )}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Available Balance</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(lender.available_balance)}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Users</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{lender.user_count || 0}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Accounts</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{lender.account_count || 0}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created Date</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatDate(lender.createdAt)}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatDate(lender.updatedAt)}</h3>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatAddress(lender.address_detail)}</h3>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="w-1/2 px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
} 