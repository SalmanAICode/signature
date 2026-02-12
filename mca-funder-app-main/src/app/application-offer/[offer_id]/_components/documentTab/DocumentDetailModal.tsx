// This component is the document detail modal for the application->document tab
// It allows the user to view the details of a document and send for sign (with draggable fields for all offer members)

import { ApplicationDocument } from '@/types/applicationDocument';
import { formatTime } from '@/components/GenericList/utils';
import { formatFileSize } from '@/lib/api/applicationDocuments';
import { downloadDocument } from '@/components/Document/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getDocumentById, downloadDocument as downloadDocumentApi, initiateSignature, Signer } from '@/lib/api/documents';
import { Document } from '@/types/document';
import { ApplicationOffer } from '@/types/applicationOffer';
import { useRouter } from 'next/navigation';

const PAGE_WIDTH_POINTS = 595;
const PAGE_HEIGHT_POINTS = 842;

function isPdfDocument(doc: Document | null): boolean {
    if (!doc) return false;
    const t = (doc.file_type || '').toLowerCase();
    return t === 'application/pdf' || t.includes('pdf');
}

interface OfferSignerOption {
    key: string;
    email: string;
    name: string;
    role: 'seller' | 'guarantor' | 'buyer' | 'signer';
    order: number;
    label: string;
}

function buildOfferSigners(offer: ApplicationOffer | null): OfferSignerOption[] {
    if (!offer) return [];
    const list: OfferSignerOption[] = [];
    let order = 1;
    const m = offer.merchant as any;
    if (m?.primary_contact?.email || m?.email) {
        const name = m.primary_contact ? `${m.primary_contact.first_name || ''} ${m.primary_contact.last_name || ''}`.trim() || m.name : m.name;
        list.push({ key: 'seller', email: m.primary_contact?.email || m.email, name: name || 'Merchant', role: 'seller', order: order++, label: 'Merchant' });
    }
    const f = offer.funder as any;
    if (f?.email) {
        list.push({ key: 'buyer', email: f.email, name: f.name || 'Funder', role: 'buyer', order: order++, label: 'Funder' });
    }
    const iso = offer.iso as any;
    if (iso?.primary_representative?.email || iso?.email) {
        const email = iso.primary_representative?.email || iso.email;
        const name = (iso.primary_representative ? `${(iso.primary_representative as any).first_name || ''} ${(iso.primary_representative as any).last_name || ''}`.trim() : null) || iso.name || 'ISO';
        list.push({ key: 'signer_iso', email, name, role: 'signer', order: order++, label: 'ISO' });
    }
    const offeredBy = offer.offered_by_user as any;
    if (offeredBy?.email) {
        const name = `${offeredBy.first_name || ''} ${offeredBy.last_name || ''}`.trim() || 'Offered by';
        list.push({ key: 'signer_offered', email: offeredBy.email, name, role: 'signer', order: order++, label: 'Offered by' });
    }
    const decidedBy = offer.decided_by_contact as any;
    if (decidedBy?.email) {
        const name = `${decidedBy.first_name || ''} ${decidedBy.last_name || ''}`.trim() || 'Decided by';
        list.push({ key: 'signer_decided', email: decidedBy.email, name, role: 'signer', order: order++, label: 'Decided by' });
    }
    return list;
}

interface DocDetailModalProps {
    document: ApplicationDocument;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    onDownload?: (document: ApplicationDocument) => Promise<void>;
    applicationOffer?: ApplicationOffer | null;
}

export default function DocumentDetailModal({ document, isOpen, onClose, onRefresh, onDownload, applicationOffer }: DocDetailModalProps) {
    const router = useRouter();
    const [isDownloading, setIsDownloading] = useState(false);
    const [viewMode, setViewMode] = useState<'detail' | 'sign'>('detail');
    const [fullDoc, setFullDoc] = useState<Document | null>(null);
    const [signLoading, setSignLoading] = useState(false);
    const [signatureBoxPositions, setSignatureBoxPositions] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
    const [draggingKey, setDraggingKey] = useState<string | null>(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const documentContainerRef = useRef<HTMLDivElement>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const pdfPreviewUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setViewMode('detail');
        }
    }, [isOpen]);

    const offerSigners = buildOfferSigners(applicationOffer ?? null);
    const docId = typeof document.document === 'string' ? document.document : document.document?._id ?? (document.document as any)?.id;

    useEffect(() => {
        if (!isOpen || viewMode !== 'sign' || !docId) return;
        const signers = buildOfferSigners(applicationOffer ?? null);
        const fetchFull = async () => {
            setSignLoading(true);
            try {
                const doc = await getDocumentById(docId);
                setFullDoc(doc);
                const defaults: Record<string, { x: number; y: number; width: number; height: number }> = {};
                signers.forEach((s, i) => {
                    defaults[s.key] = { x: 50 + (i % 2) * 280, y: 700 + Math.floor(i / 2) * 60, width: 200, height: 50 };
                });
                setSignatureBoxPositions(defaults);
            } catch (e) {
                toast.error('Failed to load document for signing');
                setViewMode('detail');
            } finally {
                setSignLoading(false);
            }
        };
        fetchFull();
    }, [isOpen, viewMode, docId, applicationOffer]);

    // Load PDF blob for sign view when document is PDF and has no HTML
    useEffect(() => {
        if (viewMode !== 'sign' || !fullDoc || fullDoc.fileHtml?.value || !isPdfDocument(fullDoc) || !docId) {
            if (pdfPreviewUrlRef.current) {
                window.URL.revokeObjectURL(pdfPreviewUrlRef.current);
                pdfPreviewUrlRef.current = null;
                setPdfPreviewUrl(null);
            }
            return;
        }
        let cancelled = false;
        downloadDocumentApi(docId)
            .then((blob) => {
                if (cancelled) return;
                const url = window.URL.createObjectURL(blob);
                pdfPreviewUrlRef.current = url;
                setPdfPreviewUrl(url);
            })
            .catch(() => {
                if (!cancelled) setPdfPreviewUrl(null);
            });
        return () => {
            cancelled = true;
            if (pdfPreviewUrlRef.current) {
                window.URL.revokeObjectURL(pdfPreviewUrlRef.current);
                pdfPreviewUrlRef.current = null;
                setPdfPreviewUrl(null);
            }
        };
    }, [viewMode, fullDoc, docId]);

    useEffect(() => {
        if (!draggingKey || !documentContainerRef.current) return;
        const container = documentContainerRef.current;
        const onMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            setSignatureBoxPositions((prev) => {
                const cur = prev[draggingKey];
                if (!cur) return prev;
                return {
                    ...prev,
                    [draggingKey]: {
                        ...cur,
                        x: e.clientX - rect.left - dragOffsetRef.current.x,
                        y: e.clientY - rect.top - dragOffsetRef.current.y,
                    },
                };
            });
        };
        const onUp = () => setDraggingKey(null);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [draggingKey]);

    const canSendForSign = fullDoc && (fullDoc.fileHtml?.value || isPdfDocument(fullDoc)) && offerSigners.length > 0;

    const handleSendForSign = useCallback(async () => {
        if (!canSendForSign || !docId) {
            toast.error('Document content or signers missing');
            return;
        }
        setSignLoading(true);
        try {
            const container = documentContainerRef.current;
            const containerRect = container?.getBoundingClientRect();
            const pageHeightPx = containerRect ? containerRect.width * (PAGE_HEIGHT_POINTS / PAGE_WIDTH_POINTS) : PAGE_HEIGHT_POINTS;
            const pxToPointsX = containerRect ? PAGE_WIDTH_POINTS / containerRect.width : 1;
            const pxToPointsY = containerRect ? PAGE_HEIGHT_POINTS / pageHeightPx : 1;

            const signers: Signer[] = offerSigners.map((s, idx) => {
                const pos = signatureBoxPositions[s.key] ?? { x: 50, y: 700 + idx * 60, width: 200, height: 50 };
                let pageIndex = 0;
                let yOnPage = pos.y;
                if (containerRect) {
                    pageIndex = Math.floor(pos.y / pageHeightPx);
                    yOnPage = (pos.y % pageHeightPx) * pxToPointsY;
                }
                const x = Math.round(pos.x * pxToPointsX);
                const w = Math.round(Math.max(pos.width * pxToPointsX, 200));
                const h = Math.round(Math.max(pos.height * pxToPointsY, 50));
                return {
                    email: s.email,
                    name: s.name,
                    role: s.role,
                    order: s.order,
                    fields: [{
                        id: idx + 1,
                        type: 'SIGNATURE' as const,
                        currentValue: '',
                        position: { docNumber: 0, pageIndex, x, y: Math.round(yOnPage), width: w, height: h },
                    }],
                };
            });
            const fileContent = fullDoc?.fileHtml?.value;
            await initiateSignature(docId, signers, fileContent, 'Please review and sign this document.');
            toast.success('Signature request sent. Status will update automatically.');
            setViewMode('detail');
            onRefresh(); // Refresh the document list to show updated status
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to send for signature');
        } finally {
            setSignLoading(false);
        }
    }, [canSendForSign, fullDoc, docId, offerSigners, signatureBoxPositions, onRefresh]);

    const alreadySent = typeof document.document !== 'string' && (document.document as any)?.signature_data?.signature_request_id;
    const showSendForSign = applicationOffer && !alreadySent && offerSigners.length > 0;

    if (!isOpen) return null;

    const documentInfo = typeof document.document === 'string'
        ? { id: document.document, file_name: 'Unknown', file_type: 'Unknown', file_size: 0 }
        : document.document;

    const handleDownload = async () => {
        if (typeof document.document === 'string') return;

        setIsDownloading(true);
        try {
            if (onDownload) {
                await onDownload(document);
            } else {
                await downloadDocument(document.document);
            }
            toast.success('Document downloaded successfully');
        } catch (error) {
            toast.error('Failed to download document');
        } finally {
            setIsDownloading(false);
        }
    };

    const signedUrl = (documentInfo as any)?.signature_data?.download_url;

    if (viewMode === 'sign') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{documentInfo.file_name}</h3>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setViewMode('detail')}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Back
                            </button>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                        Drag each signer box to the desired position on the document, then click Send for signature.
                    </div>
                    <div className="flex-1 overflow-auto min-h-0 p-4">
                        {signLoading && !fullDoc ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                            </div>
                        ) : fullDoc && isPdfDocument(fullDoc) && !fullDoc.fileHtml?.value && !pdfPreviewUrl ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                                <p className="text-sm text-gray-500">Loading file...</p>
                            </div>
                        ) : fullDoc?.fileHtml?.value ? (
                            <div className="relative inline-block w-full" style={{ maxWidth: '210mm' }}>
                                <div
                                    ref={documentContainerRef}
                                    className="a4 bg-white shadow-lg mx-auto"
                                    style={{ width: '210mm' }}
                                    dangerouslySetInnerHTML={{ __html: fullDoc.fileHtml.value }}
                                />
                                {offerSigners.map((s) => {
                                    const pos = signatureBoxPositions[s.key];
                                    if (!pos) return null;
                                    return (
                                        <button
                                            key={s.key}
                                            type="button"
                                            aria-label={`Drag to position ${s.label} signature`}
                                            className="absolute border-2 border-dashed border-blue-500 bg-blue-50/90 cursor-grab active:cursor-grabbing rounded flex items-center justify-center text-xs font-medium text-blue-700 pointer-events-auto"
                                            style={{
                                                left: pos.x,
                                                top: pos.y,
                                                width: pos.width,
                                                height: pos.height,
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                                                setDraggingKey(s.key);
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : pdfPreviewUrl ? (
                            <div className="relative inline-block w-full" style={{ maxWidth: '210mm' }}>
                                <div
                                    ref={documentContainerRef}
                                    className="bg-white shadow-lg mx-auto overflow-hidden flex flex-col"
                                    style={{ width: '210mm', minHeight: '297mm' }}
                                >
                                    <iframe
                                        title="PDF preview"
                                        src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                                        className="w-full border-0 flex-1 min-h-[80vh]"
                                    />
                                </div>
                                {offerSigners.map((s) => {
                                    const pos = signatureBoxPositions[s.key];
                                    if (!pos) return null;
                                    return (
                                        <button
                                            key={s.key}
                                            type="button"
                                            aria-label={`Drag to position ${s.label} signature`}
                                            className="absolute border-2 border-dashed border-blue-500 bg-blue-50/90 cursor-grab active:cursor-grabbing rounded flex items-center justify-center text-xs font-medium text-blue-700 pointer-events-auto"
                                            style={{
                                                left: pos.x,
                                                top: pos.y,
                                                width: pos.width,
                                                height: pos.height,
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                                                setDraggingKey(s.key);
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500">This document cannot be sent for signature from here (no HTML content and not a PDF).</div>
                        )}
                    </div>
                    {canSendForSign && (
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setViewMode('detail')}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSendForSign}
                                disabled={signLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {signLoading ? 'Sending...' : 'Send for signature'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-6 overflow-y-auto">
                    {/* Document Information */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <span className="text-gray-500">Document ID</span>
                            <p className="mt-1">{document._id}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">File Name</span>
                            <p className="mt-1">{documentInfo.file_name}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">File Type</span>
                            <p className="mt-1">{documentInfo.file_type}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">File Size</span>
                            <p className="mt-1">{formatFileSize(documentInfo.file_size)}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Created At</span>
                            <p className="mt-1">{document.createdAt ? formatTime(document.createdAt) : '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Updated At</span>
                            <p className="mt-1">{document.updatedAt ? formatTime(document.updatedAt) : '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Stipulation</span>
                            <p className="mt-1">{document.application_stipulation?.stipulation_type?.name || document.document_type || '-'}</p>
                        </div>
                    </div>

                    {/* Signature history - who signed + actions, from webhook */}
                    {(((documentInfo as any)?.signature_data?.signers?.length ?? 0) > 0 || (documentInfo as any)?.signature_data?.last_event) && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Signature History</h4>
                            {((documentInfo as any)?.signature_data?.signers?.length ?? 0) > 0 && (
                                <ul className="space-y-2">
                                    {((documentInfo as any).signature_data.signers as Array<{ email: string; name: string; role: string; status: string; signed_at?: string | Date }>).map((s, i) => (
                                        <li key={i} className="flex items-center justify-between text-sm py-1">
                                            <span className="text-gray-700">{s.name || s.email}</span>
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                                s.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                s.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                s.status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {s.status === 'completed' && s.signed_at ? formatTime(s.signed_at) : s.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {(documentInfo as any)?.signature_data?.last_event && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">Actions</p>
                                    <p className="text-sm text-gray-700 mt-0.5">
                                        {(documentInfo as any).signature_data.last_event}
                                        {(documentInfo as any)?.signature_data?.last_event_at && (
                                            <span className="text-gray-500 ml-2">
                                                — {formatTime((documentInfo as any).signature_data.last_event_at)}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with Actions */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end items-center space-x-3 flex-shrink-0">
                    {signedUrl && (
                        <a
                            href={signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 inline-flex items-center shadow-sm transition-colors duration-150"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View signed document
                        </a>
                    )}
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading || typeof document.document === 'string'}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 inline-flex items-center shadow-sm transition-colors duration-150"
                    >
                        {isDownloading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </>
                        )}
                    </button>

                    {showSendForSign && (
                        <button
                            type="button"
                            onClick={() => {
                                const offerId = (applicationOffer as any)?.id ?? (applicationOffer as any)?._id;
                                const docIdForSign = typeof document.document === 'string' ? document.document : (document.document as any)?._id ?? (document.document as any)?.id;
                                if (offerId && docIdForSign) {
                                    router.push(`/application-offer/${offerId}/documents/${docIdForSign}/sign`);
                                } else {
                                    toast.error('Missing offer or document');
                                }
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center shadow-sm"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Send for sign
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center shadow-sm transition-colors duration-150"
                    >
                        <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
