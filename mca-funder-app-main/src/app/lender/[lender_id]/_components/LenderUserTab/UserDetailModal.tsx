import { LenderUserItem } from './columnConfig';
import { formatPhone, formatDate } from '@/lib/utils/format';

interface UserDetailModalProps {
    user: LenderUserItem;
    onClose: () => void;
}

export default function UserDetailModal({ user, onClose }: UserDetailModalProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">User Details</h2>
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 mb-6">
                    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">First Name</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{user.first_name}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Name</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{user.last_name}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{user.email}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Mobile Phone</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatPhone(user.phone_mobile)}</h3>
                        </div>
                        {user.phone_work && (
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Work Phone</p>
                                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatPhone(user.phone_work)}</h3>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {user.inactive ? (
                                    <span className="inline-block px-2 py-1 rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 text-xs font-bold">Inactive</span>
                                ) : (
                                    <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 text-xs font-bold">Active</span>
                                )}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Online Status</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {user.online ? (
                                    <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 text-xs font-bold">Online</span>
                                ) : (
                                    <span className="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 text-xs font-bold">Offline</span>
                                )}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">User Type</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{user.type || '-'}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                {user.last_login ? formatDate(user.last_login) : 'Never'}
                            </h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created Date</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatDate(user.createdAt)}</h3>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{formatDate(user.updatedAt)}</h3>
                        </div>
                        {user.role_list && user.role_list.length > 0 && (
                            <div className="col-span-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">User Roles</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {user.role_list.map((role, index) => (
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
                        {user.permission_list && user.permission_list.length > 0 && (
                            <div className="col-span-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Permissions</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {user.permission_list.map((permission, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-sm bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200"
                                        >
                                            {permission}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
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