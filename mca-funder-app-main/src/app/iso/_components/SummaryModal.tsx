import { ISO } from "@/types/iso";
import { Funder } from "@/types/funder";
import { Merchant } from "@/types/merchant";
import { Representative } from "@/types/representative";
import { formatTime, getNestedValue, formatPhone, formatCurrency } from "@/lib/utils/format";
import { getFunderISOList } from "@/lib/api/isoFunders";
import { getISOMerchantList } from "@/lib/api/isoMerchants";
import { getISORepresentativeList } from "@/lib/api/isoRepresentatives";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import EditFundersModal from './EditFundersModal';
import EditMerchantsModal from './EditMerchantsModal';
import EditRepresentativesModal from './EditRepresentativesModal';
import DeleteModal from '@/components/DeleteModal';
import { UpdateModal } from './UpdateModal';
import { SummaryModalLayout } from "@/components/SummaryModalLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { IsoFunder } from "@/types/isoFunder";
import { IsoMerchant } from "@/types/isoMerchant";
import useAuthStore from '@/lib/store/auth';

type SummaryModalProps = {
    title: string;
    onClose: () => void;
    data: ISO;
    iso_id: string;
    onSuccess?: () => void;
    funder_name?: string;
    funder_id?: string;
    onUpdate?: (isoId: string, updateData: any) => Promise<{ success: boolean; error?: string }>;
    onDelete?: (iso_id: string) => void;
    isDeleting: boolean;
};

type Message = {
    type: 'success' | 'error';
    text: string;
};

export function SummaryModal({ 
    title, 
    data, 
    onClose, 
    iso_id, 
    onSuccess, 
    funder_name, 
    funder_id, 
    onUpdate,
    onDelete, 
    isDeleting 
}: SummaryModalProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { funder } = useAuthStore();
    const [currentFunders, setCurrentFunders] = useState<Funder[]>([]);
    const [loadingFunders, setLoadingFunders] = useState(false);
    const [currentMerchants, setCurrentMerchants] = useState<Merchant[]>([]);
    const [loadingMerchants, setLoadingMerchants] = useState(false);
    const [currentRepresentatives, setCurrentRepresentatives] = useState<Representative[]>([]);
    const [loadingRepresentatives, setLoadingRepresentatives] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditFundersModal, setShowEditFundersModal] = useState(false);
    const [showEditMerchantsModal, setShowEditMerchantsModal] = useState(false);
    const [showEditRepresentativesModal, setShowEditRepresentativesModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [refreshFunders, setRefreshFunders] = useState(0);
    const [refreshMerchants, setRefreshMerchants] = useState(0);
    const [refreshRepresentatives, setRefreshRepresentatives] = useState(0);
    const [message, setMessage] = useState<Message | null>(null);
    const [currentFunderId, setCurrentFunderId] = useState<string | undefined>(funder_id);

    // Clear message after 5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Fetch current funders for this ISO
    const fetchCurrentFunders = async (id: string) => {
        setLoadingFunders(true);
        try {
            const response = await getFunderISOList(currentFunderId || '', id);
            const funders = response.map((f: IsoFunder) => f.funder as Funder);
            setCurrentFunders(funders || []);
        } catch (err) {
            console.log('No assigned funders found or error fetching:', err);
            setCurrentFunders([]);
        } finally {
            setLoadingFunders(false);
        }
    };

    // Fetch funders when modal opens or refreshFunders changes
    useEffect(() => {
        if (data?._id) {
            fetchCurrentFunders(data._id);
        }
    }, [data?._id, refreshFunders]);

    // Fetch current merchants for this ISO
    const fetchCurrentMerchants = async (id: string) => {
        setLoadingMerchants(true);
        try {
            const response = await getISOMerchantList(id, '');
            const merchants = response.map((m: IsoMerchant) => m.merchant as Merchant);
            setCurrentMerchants(merchants || []);
        } catch (err) {
            console.log('No assigned merchants found or error fetching:', err);
            setCurrentMerchants([]);
        } finally {
            setLoadingMerchants(false);
        }
    };

    // Fetch merchants when modal opens or refreshMerchants changes
    useEffect(() => {
        if (data?._id) {
            fetchCurrentMerchants(data._id);
        }
    }, [data?._id, refreshMerchants]);

    // Fetch current representatives for this ISO
    const fetchCurrentRepresentatives = async (id: string) => {
        setLoadingRepresentatives(true);
        try {
            const response = await getISORepresentativeList(id);
            setCurrentRepresentatives(response || []);
        } catch (err) {
            console.log('No assigned representatives found or error fetching:', err);
            setCurrentRepresentatives([]);
        } finally {
            setLoadingRepresentatives(false);
        }
    };

    // Fetch representatives when modal opens or refreshRepresentatives changes
    useEffect(() => {
        if (data?._id) {
            fetchCurrentRepresentatives(data._id);
        }
    }, [data?._id, refreshRepresentatives]);

    const handleEditFunders = () => {
        setShowEditFundersModal(true);
    };

    const handleEditMerchants = () => {
        setShowEditMerchantsModal(true);
    };

    const handleEditRepresentatives = () => {
        setShowEditRepresentativesModal(true);
    };

    const handleDelete = () => {
        setMessage(null);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        onDelete?.(data._id);
        setShowDeleteModal(false);
    };

    const handleUpdate = () => {
        setShowUpdateModal(true);
    };

    const handleUpdateSuccess = () => {
        if (onSuccess) onSuccess();
        setShowUpdateModal(false);
        onClose();
    };

    const header = (
        <h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
    );

    const content = (
        <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* ISO Basic Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">ISO ID</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, '_id')}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">ISO Name</p>
                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'name')}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <h3 className="text-md font-semibold text-gray-800">
                    <StatusBadge status={data.inactive ? "Inactive" : "Active"} size="sm" />
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Email</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {data?.email ? (
                        <a 
                            href={`mailto:${data.email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {data.email}
                        </a>
                    ) : getNestedValue(data, 'email')}
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Phone</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {data?.phone ? (
                        <a 
                            href={`tel:${data.phone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {formatPhone(data.phone)}
                        </a>
                    ) : getNestedValue(data, 'phone')}
                </h3>
            </div>

            {data?.website && (
                <div className="flex flex-col gap-1 break-words whitespace-normal">
                    <p className="text-xs font-medium text-gray-500">Website</p>
                    <h3 className="text-md font-semibold text-gray-800">
                        <a 
                            href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {data.website}
                        </a>
                    </h3>
                </div>
            )}

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-300" />

            {/* Business Details Section */}
            {data?.business_detail && (
                <>
                    <div className="col-span-2">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Business Details</h4>
                    </div>

                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">EIN</p>
                        <h3 className="text-md font-semibold text-gray-800">{data.business_detail?.ein || '-'}</h3>  
                    </div>

                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">Entity Type</p>
                        <h3 className="text-md font-semibold text-gray-800">{data.business_detail?.entity_type || '-'}</h3>
                    </div>

                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">Incorporation Date</p>
                        <h3 className="text-md font-semibold text-gray-800">{data.business_detail?.incorporation_date || '-'}</h3>
                    </div>

                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">State of Incorporation</p>
                        <h3 className="text-md font-semibold text-gray-800">{data.business_detail?.state_of_incorporation || '-'}</h3>
                    </div>

                    {/* Divider */}
                    <div className="col-span-2 border-b border-gray-300" />
                </>
            )}

            {/* Address Information Section */}
            {data.address_list && data.address_list.length > 0 && (
                <>
                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                        <p className="text-xs font-medium text-gray-500">Address Details</p>
                        <h3 className="text-md font-semibold text-gray-800">
                            {data.address_list[0].address_1}
                            {data.address_list[0].address_2 && `, ${data.address_list[0].address_2}`}
                            {data.address_list[0].city && `, ${data.address_list[0].city}`}
                            {data.address_list[0].state && `, ${data.address_list[0].state}`}
                            {data.address_list[0].zip && ` ${data.address_list[0].zip}`}
                        </h3>
                    </div>

                    {/* Divider */}
                    <div className="col-span-2 border-b border-gray-300" />
                </>
            )}

            {/* Assigned Funders Section */}
            <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Assigned Funders</h4>
                    <button
                        onClick={handleEditFunders}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                        <PencilSquareIcon className="h-3 w-3" />
                        Edit
                    </button>
                </div>
                {loadingFunders ? (
                    <p className="text-xs text-gray-500">Loading funders...</p>
                ) : currentFunders.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {currentFunders.map((funder, index) => (
                            <div key={`funder-${funder._id}-${index}`} className="text-sm text-gray-700" title={`ID: ${funder._id}`}>
                                • {funder.name}
                                {funder.email && (
                                    <span className="text-xs text-gray-500 ml-1">({funder.email})</span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No funders assigned</p>
                )}
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Assigned Merchants Section */}
            <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Assigned Merchants</h4>
                    <button
                        onClick={handleEditMerchants}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                        <PencilSquareIcon className="h-3 w-3" />
                        Edit
                    </button>
                </div>
                {loadingMerchants ? (
                    <p className="text-xs text-gray-500">Loading merchants...</p>
                ) : currentMerchants.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {currentMerchants.map((merchant, index) => (
                            <div key={`merchant-${merchant._id}-${index}`} className="text-sm text-gray-700" title={`ID: ${merchant._id}`}>
                                • {merchant.name}
                                {merchant.email && (
                                    <span className="text-xs text-gray-500 ml-1">({merchant.email})</span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No merchants assigned</p>
                )}
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Assigned Representatives Section */}
            <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Assigned Representatives</h4>
                    <button
                        onClick={handleEditRepresentatives}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                        <PencilSquareIcon className="h-3 w-3" />
                        Edit
                    </button>
                </div>
                {loadingRepresentatives ? (
                    <p className="text-xs text-gray-500">Loading representatives...</p>
                ) : currentRepresentatives.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {currentRepresentatives.map((representative, index) => (
                            <div key={`representative-${representative._id}-${index}`} className="text-sm text-gray-700" title={`ID: ${representative._id}`}>
                                • {representative.first_name} {representative.last_name}
                                {representative.email && (
                                    <span className="text-xs text-gray-500 ml-1">({representative.email})</span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No representatives assigned</p>
                )}
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Statistics */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Representatives</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.representative_count || "-"}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Funders</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.funder_count || "-"}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Merchants</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.merchant_count || "-"}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Accounts</p>
                <h3 className="text-md font-semibold text-gray-800">{data?.account_count || "-"}</h3>
            </div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Financial Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Application Request Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.application_request_amount || 0)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Funding Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.funding_amount || 0)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Commission Amount</p>
                <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.commission_amount || 0)}</h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal"></div>

            {/* Divider */}
            <div className="col-span-2 border-b border-gray-200" />

            {/* Date Information */}
            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Created Date</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {data?.created_date ? formatTime(data.created_date) : '-'}
                </h3>
            </div>

            <div className="flex flex-col gap-1 break-words whitespace-normal">
                <p className="text-xs font-medium text-gray-500">Updated Date</p>
                <h3 className="text-md font-semibold text-gray-800">
                    {data?.updated_date ? formatTime(data.updated_date) : '-'}
                </h3>
            </div>
        </div>
    );

    const actions = (
        <div className="flex justify-evenly gap-2">
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
                onClick={handleUpdate}
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

            {/* Edit Funders Modal */}
            {showEditFundersModal && (
                <EditFundersModal
                    isoId={data._id}
                    isOpen={showEditFundersModal}
                    funderList={funder ? [funder] : []}
                    onClose={() => {
                        setShowEditFundersModal(false);
                        setRefreshFunders(r => r + 1);
                    }}
                    onSuccess={() => {
                        setShowEditFundersModal(false);
                        setRefreshFunders(r => r + 1);
                        if (onSuccess) onSuccess();
                    }}
                />
            )}

            {/* Edit Merchants Modal */}
            {showEditMerchantsModal && (
                <EditMerchantsModal
                    isoId={data._id}
                    isOpen={showEditMerchantsModal}
                    currentMerchants={currentMerchants}
                    onClose={() => {
                        setShowEditMerchantsModal(false);
                    }}
                    onSuccess={(updatedMerchants) => {
                        setShowEditMerchantsModal(false);
                        setCurrentMerchants(updatedMerchants);
                    }}
                />
            )}

            {/* Edit Representatives Modal */}
            {showEditRepresentativesModal && (
                <EditRepresentativesModal
                    isoId={data._id}
                    isOpen={showEditRepresentativesModal}
                    currentRepresentatives={currentRepresentatives}
                    onClose={() => {
                        setShowEditRepresentativesModal(false);
                    }}
                    onSuccess={(updatedRepresentatives: Representative[]) => {
                        setShowEditRepresentativesModal(false);
                        setCurrentRepresentatives(updatedRepresentatives);
                    }}
                />
            )}

            {/* Update Modal */}
            {showUpdateModal && (
                <UpdateModal
                    isOpen={showUpdateModal}
                    onClose={() => setShowUpdateModal(false)}
                    onSuccess={handleUpdateSuccess}
                    iso={data}
                    onUpdate={onUpdate}
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
                    isLoading={isDeleting}
                    title="Delete ISO"
                    message={`Are you sure you want to delete ISO ${data.name}? This action cannot be undone.`}
                />
            )}
        </>
    );
} 