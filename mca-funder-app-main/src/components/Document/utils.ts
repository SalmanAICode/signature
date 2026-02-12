import { downloadDocument as downloadDocumentApi } from '@/lib/api/documents';
import { Document } from '@/types/document';

/** Download signed document when signature_data.download_url exists, otherwise download from API */
export const downloadDocument = async (document: Document): Promise<void> => {
    if (!document) return;

    const signedUrl = (document as any)?.signature_data?.download_url;
    let blob: Blob;

    if (signedUrl) {
        const res = await fetch(signedUrl);
        blob = await res.blob();
    } else {
        blob = await downloadDocumentApi(document.id || document._id);
    }

    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = signedUrl
        ? (document.file_name?.replace(/\.[^.]+$/, '-signed.pdf') || 'document-signed.pdf')
        : document.file_name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}; 


export const downloadDocumentById = async (documentId: string, fileName: string): Promise<void> => {
    if (!documentId) return;
    
    const blob = await downloadDocumentApi(documentId);
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}; 