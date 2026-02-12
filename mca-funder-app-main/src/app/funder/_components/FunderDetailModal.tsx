import { Funder } from '@/types/funder';
import { useRouter } from 'next/navigation';
import {
  formatPhone,
  formatDate,
} from '@/lib/utils/format';

interface FunderDetailModalProps {
    funder: Funder;
    onClose: () => void;
}

export default function FunderDetailModal({ funder, onClose }: FunderDetailModalProps) {
    const router = useRouter();

    // Helper function to format address from funder address object
    const formatFunderAddress = (address: any) => {
        if (!address) return 'N/A';
        const parts = [];
        if (address.address_1) parts.push(address.address_1);
        if (address.address_2) parts.push(address.address_2);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.zip) parts.push(address.zip);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    };

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
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Funder Details</h2>
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 mb-6">
                    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Company Name</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.name}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.email}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatPhone(funder.phone)}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Website</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {funder.website ? (
                                    <a href={funder.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        {funder.website}
                                    </a>
                                ) : 'N/A'}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Entity Type</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.business_detail?.entity_type || 'N/A'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">EIN</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.business_detail?.ein || 'N/A'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">State of Incorporation</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.business_detail?.state_of_incorporation || 'N/A'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Incorporation Date</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {funder.business_detail?.incorporation_date ? formatDate(funder.business_detail.incorporation_date) : 'N/A'}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {funder.inactive ? (
                                    <span className="inline-block px-2 py-1 rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 text-xs font-bold">Inactive</span>
                                ) : (
                                    <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 text-xs font-bold">Active</span>
                                )}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Available Balance</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(funder.available_balance)}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Users</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.user_count || 0}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Applications</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.application_count || 0}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pending Apps</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.pending_application_count || 0}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Accounts</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.account_count || 0}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created Date</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatDate(funder.created_date)}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatDate(funder.updated_date)}</h3>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatFunderAddress(funder.address)}</h3>
                        </div>
                    </div>
                </div>
                <div className="flex justify-evenly gap-4">
                    <button
                        className="w-1/3 px-6 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white text-base font-medium hover:bg-blue-700 dark:hover:bg-blue-800 transition"
                        onClick={() => router.push(`/funder/${funder._id}`)}
                    >
                        View Funder Details
                    </button>
                    <button
                        onClick={onClose}
                        className="w-1/3 px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
} 