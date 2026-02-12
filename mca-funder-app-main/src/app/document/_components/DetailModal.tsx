import { Document } from "@/types/document";
import { formatTime } from "@/components/GenericList/utils";
import { deleteDocument, formatFileSize, getSignatureStatus } from "@/lib/api/documents";
import { useRouter, usePathname } from 'next/navigation';
import { useState } from "react";

type DetailModalProps = {
    title: string;
    onClose: () => void;
    data: Document;
    onSuccess?: () => void;
};

const SIGNATURE_STATUS_LABELS: Record<string, { label: string; className: string }> = {
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
    declined: { label: "Declined", className: "bg-red-100 text-red-800" },
    not_initiated: { label: "Not initiated", className: "bg-gray-100 text-gray-600" },
};

export function DetailModal({ title, data, onClose, onSuccess }: DetailModalProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const signatureStatus = data?.signature_data?.signature_status || "not_initiated";
    const isCompleted = signatureStatus === "completed";
    const signedPdfUrl = data?.signature_data?.download_url;

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            await deleteDocument(data._id);
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(
                typeof err === 'object' && err !== null && 'message' in err
                    ? String((err as Error).message)
                    : 'Failed to delete Document'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const getDownloadFileName = (): string => {
        const merchantName = (data.merchant as { name?: string })?.name?.trim() || "Merchant";
        const funderName = (data.funder as { name?: string })?.name?.trim() || "Funder";
        const safe = (s: string) => s.replace(/[^\w\s-]/g, "").replace(/\s+/g, " ").trim();
        return `${safe(merchantName)} vs ${safe(funderName)}.pdf`;
    };

    const handleDownload = async () => {
        if (!isCompleted) return;
        setIsDownloading(true);
        setError(null);

        try {
            let pdfUrl = signedPdfUrl;
            if (!pdfUrl && data._id) {
                const status = await getSignatureStatus(data._id);
                pdfUrl = status.download_url ?? undefined;
            }
            if (pdfUrl) {
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = getDownloadFileName();
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                setError("Signed PDF is not available. The document may not be fully processed yet.");
            }
        } catch (err) {
            setError(
                typeof err === "object" && err !== null && "message" in err
                    ? String((err as Error).message)
                    : "Failed to download document"
            );
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            {/* Delete Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this Document? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    handleDelete();
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Modal */}
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                <div className="bg-gray-100 p-6 rounded-2xl shadow-xl max-w-xl w-full relative max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{title}</h2>

                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {/* Only explicit document details */}
                    <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-4 border-gray-200 bg-gray-50 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Document ID</p>
                                <p className="text-sm font-semibold text-gray-800">{data._id ?? "—"}</p>
                            </div>
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">File Name</p>
                                <p className="text-sm font-semibold text-gray-800">{data.file_name ?? "—"}</p>
                            </div>
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">File Type</p>
                                <p className="text-sm font-semibold text-gray-800">{data.file_type ?? "—"}</p>
                            </div>
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">File Size</p>
                                <p className="text-sm font-semibold text-gray-800">{data.file_size != null ? formatFileSize(data.file_size) : "—"}</p>
                            </div>
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Merchant</p>
                                <p className="text-sm font-semibold text-gray-800">{(data.merchant as { name?: string })?.name ?? "—"}</p>
                            </div>
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Funder</p>
                                <p className="text-sm font-semibold text-gray-800">{(data.funder as { name?: string })?.name ?? "—"}</p>
                            </div>
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Signature Status</p>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium w-fit ${SIGNATURE_STATUS_LABELS[signatureStatus]?.className ?? "bg-gray-100 text-gray-600"}`}>
                                    {SIGNATURE_STATUS_LABELS[signatureStatus]?.label ?? signatureStatus}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Last Updated</p>
                                <p className="text-sm font-semibold text-gray-800">{data.updatedAt ?? data.createdAt ? formatTime(data.updatedAt ?? data.createdAt) : "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Button Row: Download only when status is completed */}
                    <div className="flex justify-evenly gap-4 flex-wrap">
                        {isCompleted && (
                            <button
                                className="px-6 py-2 rounded-lg bg-green-600 text-white text-base font-medium hover:bg-green-700 transition disabled:opacity-50"
                                onClick={handleDownload}
                                disabled={isDownloading}
                            >
                                {isDownloading ? "Downloading..." : "Download"}
                            </button>
                        )}
                        <button
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-base font-medium hover:bg-blue-700 transition"
                            onClick={() => router.push(`${pathname}/${data._id}`)}
                        >
                            View
                        </button>
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="px-6 py-2 rounded-lg bg-red-600 text-white text-base font-medium hover:bg-red-700 transition"
                        >
                            Delete
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 text-base font-medium hover:bg-gray-50 hover:text-gray-800 transition"
                        >
                            Close
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
} 