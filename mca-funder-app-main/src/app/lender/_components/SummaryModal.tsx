import { Signature } from "lucide-react";
import { Lender } from "@/types/lender";
import { formatCurrency, formatTime } from "@/components/GenericList/utils";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from "react";
import DeleteModal from '@/components/DeleteModal';
import { StatusBadge } from "@/components/StatusBadge";
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { UpdateModal } from "./UpdateModal";
import EditLenderUsersModal from "./EditLenderUsersModal";
import { getLenderUserList } from "@/lib/api/lenderUsers";
import { User } from "@/types/user";
import { PencilSquareIcon } from '@heroicons/react/24/outline';

type SummaryModalProps = {
    title: string;
    data: Lender;
    onClose: () => void;
    onUpdate: (values: Partial<Lender>) => Promise<{ success: boolean; error?: string }>;
    onDelete: (id: string) => void;
    error?: string | null;
};

type Message = {
    type: 'success' | 'error';
    text: string;
};

export function SummaryModal({
    title,
    data,
    onClose,
    onUpdate,
    onDelete,
    error
}: SummaryModalProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showEditUsersModal, setShowEditUsersModal] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);

    // Set initial error from props if provided
    useEffect(() => {
        if (error) {
            setMessage({ type: 'error', text: error });
        }
    }, [error]);

    // Clear message after 5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Fetch users when component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            setUsersLoading(true);
            setUsersError(null);
            try {
                const usersData = await getLenderUserList(data._id);
                setUsers(usersData || []);
            } catch (err: any) {
                console.error('Failed to fetch lender users:', err);
                setUsersError(err.message || 'Failed to fetch lender users');
                setUsers([]);
            } finally {
                setUsersLoading(false);
            }
        };

        fetchUsers();
    }, [data._id]);

    const handleDelete = () => {
        setMessage(null);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        onDelete(data._id);
        setShowDeleteModal(false);
    };

    const header = (
        <h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
    );

    const content = (
        <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Lender Basic Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Lender Name</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.name}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Type</p>
                <h3 className="text-md font-semibold text-gray-800">
                    <StatusBadge status={data?.type} size="sm" />
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold text-gray-800">
                    <StatusBadge status={data.inactive ? "Inactive" : "Active"} size="sm" />
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Email</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.email}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Phone</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.phone}</h3>
            </div>

            {data?.website && (
                <div className="flex flex-col gap-1 break-words whitespace-normal">
                    <p className="text-xs font-medium text-gray-500">Website</p>
                    <h3 className="text-md font-semibold text-gray-800">{data?.website}</h3>
                </div>
            )}

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-300" />

            {/* Business Details */}
            {data?.business_detail && (
                <>
                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">EIN</p>
                        <h3 className="text-md font-semibold text-gray-800">{data.business_detail.ein || '-'}</h3>
                    </div>

                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">Entity Type</p>
                        <h3 className="text-md font-semibold text-gray-800">{data.business_detail.entity_type || '-'}</h3>
                    </div>

                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">Incorporation Date</p>
                        <h3 className="text-md font-semibold text-gray-800">{data.business_detail.incorporation_date || '-'}</h3>
                    </div>

                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">Incorporation State</p>
                        <h3 className="text-md font-semibold text-gray-800">{data.business_detail.incorporation_state || '-'}</h3>
                    </div>

                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">State of Incorporation</p>
                        <h3 className="text-md font-semibold text-gray-800">{data.business_detail.state_of_incorporation || '-'}</h3>
                    </div>

                    {/* Divider */}
                    <div className="col-span-2 border-b border-gray-200" />
                </>
            )}

            {/* Address Details */}
            {data?.address_detail && (
                <>
                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">Address Details</p>
                        <h3 className="text-md font-semibold text-gray-800">
                            {data.address_detail.address_1}
                            {data.address_detail.address_2 && `, ${data.address_detail.address_2}`}
                            {data.address_detail.city && `, ${data.address_detail.city}`}
                            {data.address_detail.state && `, ${data.address_detail.state}`}
                            {data.address_detail.zip && ` ${data.address_detail.zip}`}
                        </h3>
                    </div>

                    {/* Divider */}
                    <div className="col-span-2 border-b border-gray-200" />
                </>
            )}

            {/* Assigned Users Section */}
            <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Assigned Users</h4>
                    <button
                        onClick={() => setShowEditUsersModal(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                        <PencilSquareIcon className="h-3 w-3" />
                        Edit
                    </button>
                </div>
                {usersLoading ? (
                    <p className="text-xs text-gray-500">Loading users...</p>
                ) : usersError ? (
                    <p className="text-xs text-red-500">{usersError}</p>
                ) : users.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {users.map((user: User) => (
                            <div key={user._id} className="text-sm text-gray-700" title={`ID: ${user._id}`}>
                                • {user.first_name} {user.last_name}
                                {user.email && (<span className="text-xs text-gray-500 ml-1">({user.email})</span>)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No users assigned</p>
                )}
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Statistics */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Users</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.user_count || "-"}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Accounts</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.account_count || "-"}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Application Offers</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.application_offer_count || "-"}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Fundings</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.funding_count || "-"}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Financial Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Available Balance</p>
                <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.available_balance)}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Dates */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Created</p>
                <h3 className="text-md font-semibold text-gray-800">{formatTime(data.createdAt)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Last Updated</p>
                <h3 className="text-md font-semibold text-gray-800">{formatTime(data.updatedAt)}</h3>
            </div>
        </div>
    );

    const actions = (
        <div className="flex justify-evenly gap-2">
            {/* <button
                className="flex-1 px-2 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition"
                onClick={() => {
                    router.push(`${pathname}/document`);
                }}
            >
                Document
            </button> */}
            <button
                className="flex-1 px-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                onClick={() => {
                    router.push(`${pathname}/${data._id}`);
                }}
            >
                View
            </button>
            <button
                className="flex-1 px-2 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
                onClick={() => setShowUpdateModal(true)}
            >
                Update
            </button>
            <button
                onClick={handleDelete}
                className="flex-1 px-2 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
            >
                Delete
            </button>
            <button
                onClick={onClose}
                className="flex-1 px-2 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
            >
                Close
            </button>
            {/* <button
                title="Sign"
                onClick={() => {
                    window.open("https://www.rabbitsign.com/", "_blank", "noopener,noreferrer");
                }}
                className="px-2 py-2 rounded-lg border border-gray-300 text-gray-700
               hover:bg-gray-300 transition flex items-center justify-center"
            >
                <Signature size={16} />
            </button> */}
        </div>
    );

    return (
        <>
            <SummaryModalLayout
                header={header}
                content={content}
                actions={actions}
                error={message?.text}
            />

            {/* Update Modal */}
            {showUpdateModal && (
                <UpdateModal
                    isOpen={showUpdateModal}
                    onClose={() => setShowUpdateModal(false)}
                    onUpdate={onUpdate}
                    lender={data}
                />
            )}

            {/* Edit Users Modal */}
            {showEditUsersModal && (
                <EditLenderUsersModal
                    lenderId={data._id}
                    isOpen={showEditUsersModal}
                    onClose={() => {
                        setShowEditUsersModal(false);
                    }}
                    onSuccess={(updatedUsers) => {
                        setShowEditUsersModal(false);
                        setUsers(updatedUsers);
                    }}
                    currentUsers={users}
                />
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setMessage(null);
                    }}
                    onConfirm={handleConfirmDelete}
                    title="Delete Lender"
                    message={`Are you sure you want to delete Lender ${data._id}? This action cannot be undone.`}
                />
            )}
        </>
    );
}