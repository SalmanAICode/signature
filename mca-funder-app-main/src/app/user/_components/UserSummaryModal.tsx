import { User } from '@/types/user';
import { useRouter } from 'next/navigation';
import {
  formatPhone,
  formatDate,
  formatAddress,
  getUserTypeLabel
} from '@/lib/utils/format';
import { getUserFunderList } from '@/lib/api/userFunders';
import { getUserLenderList } from '@/lib/api/userLenders';
import UserForm from './userForm';
import { useState, useEffect } from 'react';
import DeleteModal from '@/components/DeleteModal';
import EditUserFundersModal from './EditUserFundersModal';
import EditUserLenderModal from './EditUserLenderModal';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { Lender } from '@/types/lender';
import { Funder } from '@/types/funder';
import { toast } from 'react-hot-toast';

interface UserSummaryProps {
    user: User;
    onClose: () => void;
    onDelete: (userId: string) => Promise<void>;
    onCreate: (values: any) => Promise<{ success: boolean; error?: string }>;
    onUpdate: (userId: string, values: any) => Promise<{ success: boolean; error?: string }>;
    isDeleting?: boolean;
    error?: string | null;
}

type Message = {
    type: 'success' | 'error';
    text: string;
};

export default function UserSummaryModal({ user, onClose, onDelete, onCreate, onUpdate, isDeleting = false, error }: UserSummaryProps) {
    const router = useRouter();
    const [funders, setFunders] = useState<Funder[]>([]);
    const [fundersLoading, setFundersLoading] = useState(false);
    const [fundersError, setFundersError] = useState<string | null>(null);
    const [lenders, setLenders] = useState<Lender[]>([]);
    const [lendersLoading, setLendersLoading] = useState(false);
    const [lendersError, setLendersError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditFundersModal, setShowEditFundersModal] = useState(false);
    const [showEditLendersModal, setShowEditLendersModal] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    // Fetch funders when component mounts
    useEffect(() => {
        const fetchFunders = async () => {
            setFundersLoading(true);
            setFundersError(null);
            try {
                const fundersData = await getUserFunderList(user._id);
                setFunders(fundersData);
            } catch (error) {
                console.error('Error fetching user funders:', error);
                setFundersError('Failed to load funders');
            } finally {
                setFundersLoading(false);
            }
        };

        fetchFunders();
    }, [user._id]);

    // Fetch lenders when component mounts
    useEffect(() => {
        const fetchLenders = async () => {
            setLendersLoading(true);
            setLendersError(null);
            try {
                const lendersData = await getUserLenderList(user._id);
                setLenders(lendersData || []);
            } catch (err: any) {
                console.error('Failed to fetch user lenders:', err);
                setLendersError(err.message || 'Failed to fetch user lenders');
                setLenders([]);
            } finally {
                setLendersLoading(false);
            }
        };

        fetchLenders();
    }, [user._id]);

    const handleDeleteUser = async () => {
        try {
            await onDelete(user._id);
            setShowDeleteModal(false);
            onClose();
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to delete user';
            setMessage({ type: 'error', text: errorMessage });
        }
    };

    const handleDelete = () => {
        setMessage(null);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        handleDeleteUser();
        setShowDeleteModal(false);
    };

    const header = (
        <h2 className="text-2xl font-bold text-center text-gray-800">User Summary</h2>
    );

    const content = (
        <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* User Basic Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">User ID</p>
                <h3 className="text-md font-semibold text-gray-800">{user._id}</h3>
            </div>
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Name</p>
                <h3 className="text-md font-semibold text-gray-800">{user.first_name} {user.last_name}</h3>
            </div>
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Email</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {user.email ? (
                        <a 
                            href={`mailto:${user.email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {user.email}
                        </a>
                    ) : '-'}
                </h3>
            </div>
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Mobile Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {user.phone_mobile ? (
                        <a 
                            href={`tel:${user.phone_mobile}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {formatPhone(user.phone_mobile)}
                        </a>
                    ) : '-'}
                </h3>
            </div>
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Work Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {user.phone_work ? (
                        <a 
                            href={`tel:${user.phone_work}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {formatPhone(user.phone_work)}
                        </a>
                    ) : '-'}
                </h3>
            </div>
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Home Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {user.phone_home ? (
                        <a 
                            href={`tel:${user.phone_home}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {formatPhone(user.phone_home)}
                        </a>
                    ) : '-'}
                </h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-300" />

            {/* Address and Status */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Address</p>
                <h3 className="text-md font-semibold text-gray-800">{formatAddress(user.address_detail)}</h3>
            </div>
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${user.inactive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.inactive ? 'Inactive' : 'Active'}
                    </span>
                </h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Assigned Funders Section */}
            <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Assigned Funders</h4>
                    <button
                        onClick={() => setShowEditFundersModal(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                        <PencilSquareIcon className="h-3 w-3" />
                        Edit
                    </button>
                </div>
                {fundersLoading ? (
                    <p className="text-xs text-gray-500">Loading funders...</p>
                ) : fundersError ? (
                    <p className="text-xs text-red-500">{fundersError}</p>
                ) : funders.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {funders.map((funder: any) => (
                            <div key={funder._id || funder.name} className="text-sm text-gray-700" title={`ID: ${funder._id}`}>• {funder.name}{funder.email && (<span className="text-xs text-gray-500 ml-1">({funder.email})</span>)}</div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No funders assigned</p>
                )}
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Assigned Lenders Section */}
            <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Assigned Lenders</h4>
                    <button
                        onClick={() => setShowEditLendersModal(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                        <PencilSquareIcon className="h-3 w-3" />
                        Edit
                    </button>
                </div>
                {lendersLoading ? (
                    <p className="text-xs text-gray-500">Loading lenders...</p>
                ) : lendersError ? (
                    <p className="text-xs text-red-500">{lendersError}</p>
                ) : lenders.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {lenders.map((lender: any) => (
                            <div key={lender._id || lender.name} className="text-sm text-gray-700" title={`ID: ${lender._id}`}>• {lender.name}{lender.email && (<span className="text-xs text-gray-500 ml-1">({lender.email})</span>)}</div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No lenders assigned</p>
                )}
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Date Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Created Date</p>
                <h3 className="text-md font-semibold text-gray-800">{user.createdAt ? formatDate(user.createdAt) : '-'}</h3>
            </div>
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Updated Date</p>
                <h3 className="text-md font-semibold text-gray-800">{user.updatedAt ? formatDate(user.updatedAt) : '-'}</h3>
            </div>
        </div>
    );

    const actions = (
        <div className="flex justify-evenly gap-2">
            <button
                className="flex-1 px-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                onClick={() => router.push(`/user/${user._id}`)}
            >
                View
            </button>
            <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 px-2 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
            >
                Update
            </button>
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-2 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
                onClick={onClose}
                className="flex-1 px-2 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
            >
                Close
            </button>
        </div>
    );

    return (
        <>
            <SummaryModalLayout
                header={header}
                content={content}
                actions={actions}
                error={error || message?.text}
            />

            {showEditModal && (
                <UserForm
                    initialData={user}
                    onCancel={() => setShowEditModal(false)}
                    onUpdate={onUpdate}
                />
            )}
            {showDeleteModal && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setMessage(null);
                    }}
                    onConfirm={handleConfirmDelete}
                    title="Delete User"
                    message={`Are you sure you want to delete user ${user.first_name} ${user.last_name}? This action cannot be undone.`}
                />
            )}
            {showEditFundersModal && (
                <EditUserFundersModal
                    userId={user._id}
                    isOpen={showEditFundersModal}
                    onClose={() => {
                        setShowEditFundersModal(false);
                    }}
                    onSuccess={(changes) => {
                        setShowEditFundersModal(false);
                        // Update funders list locally based on changes
                        const updatedFunders = funders.filter(f => !changes.removed.includes(f._id));
                        // Add new funders with their full details
                        setFunders([...updatedFunders, ...changes.added]);
                        toast.success('Funders updated successfully');
                    }}
                    currentFunders={funders}
                />
            )}
            {showEditLendersModal && (
                <EditUserLenderModal
                    userId={user._id}
                    isOpen={showEditLendersModal}
                    onClose={() => {
                        setShowEditLendersModal(false);
                    }}
                    onSuccess={(changes) => {
                        setShowEditLendersModal(false);
                        // Update lenders list locally based on changes
                        const updatedLenders = lenders.filter(l => !changes.removed.includes(l._id));
                        // Add new lenders with their full details
                        setLenders([...updatedLenders, ...changes.added]);
                        toast.success('Lenders updated successfully');
                    }}
                    currentLenders={lenders}
                />
            )}
        </>
    );
} 