'use client';

import { createApplicationOffer } from '@/lib/api/applicationOffers';
import { getCurrentDateForInput } from '@/utils/dateUtils';
import { Application } from '@/types/application';
import { ApplicationOfferFormValues } from './ApplicationOfferForm';
import { ApplicationOfferStatusList } from '@/types/applicationOffer';
import { ApplicationOfferDataProvider } from './ApplicationOfferDataProvider';

interface CreateModalProps {
    onClose: () => void;
    onCreate: (values: ApplicationOfferFormValues) => void;
    application?: Application;
}

const DEFAULT_INITIAL_VALUES: ApplicationOfferFormValues = {
    application: '',
    lender: '',
    offered_amount: '',
    payback_amount: '',
    fee_list: [],
    frequency: 'DAILY',
    payday_list: [],
    commission_amount: 0,
    payback_count: '',
    offered_date: getCurrentDateForInput(),
    offered_by_user: '',
    disbursement_amount: 0,
    payment_amount: 0,
    term_length: 0,
    factor_rate: 0,
    buy_rate: 0,
    total_fees: 0,
    status: ApplicationOfferStatusList[0],  // OFFERED status
    avoid_holiday: false,
    expense_list: [],
    loading: false,
};

export function CreateModal({ onClose, onCreate, application }: CreateModalProps) {
    const handleSubmit = async (values: ApplicationOfferFormValues) => {
        await onCreate(values);
    };

    return (
        <ApplicationOfferDataProvider
            onClose={onClose}
            onSubmit={handleSubmit}
            application={application}
            mode="create"
            initialValues={DEFAULT_INITIAL_VALUES}
            title="Create Application Offer"
            subtitle="Please enter application offer details below."
            includeExpenseTypes={true}
        />
    );
} 