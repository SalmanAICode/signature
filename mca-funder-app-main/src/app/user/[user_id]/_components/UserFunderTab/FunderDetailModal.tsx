import { UserFunderItem } from './columnConfig';
import { formatPhone, formatDate, formatAddress, formatCurrency } from '@/lib/utils/format';

interface FunderDetailModalProps {
    funder: UserFunderItem;
    onClose: () => void;
}

export default function FunderDetailModal({ funder, onClose }: FunderDetailModalProps) {

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
                                ) : '-'}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Entity Type</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.business_detail?.entity_type || '-'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">EIN</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.business_detail?.ein || '-'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">State of Incorporation</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{funder.business_detail?.state_of_incorporation || '-'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Incorporation Date</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {funder.business_detail?.incorporation_date ? formatDate(funder.business_detail.incorporation_date) : '-'}
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
                        {funder.role_list && funder.role_list.length > 0 && (
                            <div className="col-span-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">User Roles</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {funder.role_list.map((role, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="col-span-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatAddress(funder.address)}</h3>
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