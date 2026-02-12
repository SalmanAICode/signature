'use client';

import { formatDateForInput } from '@/utils/dateUtils';
import { Application } from '@/types/application';
import { ApplicationOffer, ApplicationOfferStatusList } from '@/types/applicationOffer';
import { DayNumber } from '@/types/day';
import { ApplicationOfferFormValues } from './ApplicationOfferForm';
import { ApplicationOfferDataProvider } from './ApplicationOfferDataProvider';

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (values: ApplicationOfferFormValues) => void;
    applicationOffer: ApplicationOffer;
}

export function UpdateModal({ isOpen, onClose, onSuccess, applicationOffer }: UpdateModalProps) {

    // Create application object from applicationOffer
    const application: Partial<Application> = {
        _id: applicationOffer.application._id,
        name: applicationOffer.application.name,
        request_amount: applicationOffer.application.request_amount,
        funder: applicationOffer.funder,
        merchant: applicationOffer.merchant,
        iso: applicationOffer.iso
    };

    const formInitialValues: ApplicationOfferFormValues = {
        application: applicationOffer.application._id || applicationOffer.application.id  || '',
        lender: applicationOffer.lender?.id || '',
        offered_amount: applicationOffer.offered_amount || 0,
        payback_amount: applicationOffer.payback_amount || 0,
        fee_list: (applicationOffer.fee_list || []).map((fee: any) => ({
            name: fee?.name || '',
            fee_type: fee?.fee_type || '',
            amount: fee.amount
        })),
        frequency: applicationOffer.frequency || 'DAILY',
        payday_list: applicationOffer.payday_list as DayNumber[] || [],
        commission_amount: applicationOffer.commission_amount || 0,
        payback_count: applicationOffer.payback_count || 0,
        offered_date: formatDateForInput(applicationOffer.offered_date),
        offered_by_user: applicationOffer.offered_by_user?._id || '',
        disbursement_amount: applicationOffer.disbursement_amount || 0,
        payment_amount: applicationOffer.payment_amount || 0,
        term_length: applicationOffer.term_length || 0,
        factor_rate: applicationOffer.factor_rate || 0,
        buy_rate: applicationOffer.buy_rate || 0,
        total_fees: (applicationOffer.fee_list || []).reduce((sum, fee) => sum + (fee.amount || 0), 0),
        loading: false,
        status: applicationOffer.status || ApplicationOfferStatusList[0],
        avoid_holiday: applicationOffer.avoid_holiday || false,
        expense_list: (applicationOffer.expense_list || []).map((expense: any) => ({
            name: expense?.name || '',
            expense_type: expense?.expense_type,
            amount: expense.amount,
            syndication: true
        }))
    };

    if (!isOpen) return null;

    return (
        <ApplicationOfferDataProvider
            onClose={onClose}
            onSubmit={onSuccess}
            application={application as Application}
            mode="update"
            initialValues={formInitialValues}
            title="Update Application Offer"
            subtitle="Update application offer details below."
            includeExpenseTypes={true}
            offeredByUser={applicationOffer.offered_by_user}
            lender={applicationOffer.lender}
        />
    );
} 