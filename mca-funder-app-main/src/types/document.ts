import { Funder } from "./funder";
import { ISO } from "./iso";
import { Merchant } from "./merchant";
import { Portal } from "./portal";
import { Syndicator } from "./syndicator";
import { Contact } from "./contact";
import { Admin } from "./admin";
import { User } from "./user";
import { Representative } from "./representative";
import { Bookkeeper } from "./bookkeeper";


// Main Document interface
export interface Document {
    merchant: Merchant;
    funder: Funder;
    iso: ISO;
    syndicator: Syndicator;

    created_date: string;
    updated_date: string;
    __v: number;

    file: string;
    file_name: string;
    file_type: string;
    file_size: number;
    fileHtml: {
        value: string
    };

    portal: Portal;
    upload_contact: Contact;
    upload_representative: Representative;
    upload_syndicator: Syndicator;
    upload_admin: Admin;
    upload_user: User;
    upload_bookkeeper: Bookkeeper;
    archived: boolean;

    upload_count: number;
    upload_history_list?: Document[];

    last_modified: string;

    createdAt: string;
    updatedAt: string;
    
    _id: string;
    id: string;

    //  application history
    document?: string;

    // Signature data
    signature_data?: {
        signature_request_id?: string;
        folder_id?: string;
        signature_status?: 'not_initiated' | 'pending' | 'completed' | 'declined';
        signers?: Array<{
            email: string;
            name: string;
            role: 'seller' | 'guarantor' | 'buyer' | 'signer';
            status: 'pending' | 'completed' | 'declined';
            signed_at?: string | Date;
        }>;
        last_event?: string;
        last_event_at?: string | Date;
        /** Signed PDF URL (from signing page data-file or RabbitSign API) */
        download_url?: string | null;
    };
}

// CreateDocumentData type - omits auto-generated and optional fields
export type CreateDocumentData = Omit<Document, '_id' | 'id' | 'created_date' | 'updated_date' | '__v' | 'file' | 'file_name' | 'file_type' | 'file_size' | 'upload_count' | 'portal' | 'upload_contact' | 'upload_representative' | 'upload_syndicator' | 'upload_admin' | 'upload_user' | 'upload_bookkeeper' | 'archived'>;

