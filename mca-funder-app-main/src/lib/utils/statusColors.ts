export const getStatusColors = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
        REQUESTED: {
            bg: '#FEF3C7', // yellow-100
            text: '#92400E' // yellow-800
        },
        RECEIVED: {
            bg: '#DBEAFE', // blue-100
            text: '#1E40AF' // blue-800
        },
        VERIFIED: {
            bg: '#D1FAE5', // green-100
            text: '#065F46' // green-800
        },
        WAIVED: {
            bg: '#F3F4F6', // gray-100
            text: '#374151' // gray-700
        },
        CREATED: {
            bg: '#EFF6FF', // blue-50
            text: '#1D4ED8' // blue-700
        },
        SUBMITTED: {
            bg: '#059669', // green-600
            text: '#FFFFFF' // white
        },
        DECLINED: {
            bg: '#FEE2E2', // red-50
            text: '#B91C1C' // red-700
        },
        PENDING: {
            bg: '#FEF3C7', // yellow-50
            text: '#B45309' // yellow-700
        },
        ACCEPTED: {
            bg: '#EFF6FF', // blue-50
            text: '#15803D' // green-700
        },
        ACTIVE: {
            bg: '#ECFDF5', // green-50
            text: '#15803D' // green-700
        },
        INACTIVE: {
            bg: '#FEE2E2', // red-50
            text: '#B91C1C' // red-700
        },
        YES: {
            bg: '#ECFDF5', // green-50
            text: '#15803D' // green-700
        },
        TRUE: {
            bg: '#ECFDF5', // green-50
            text: '#15803D' // green-700
        },
        NO: {
            bg: '#FEE2E2', // red-50
            text: '#B91C1C' // red-700
        },
        FALSE: {
            bg: '#FEE2E2', // red-50
            text: '#B91C1C' // red-700
        },
        ADMIN: {
            bg: '#F3E8FF', // purple-50
            text: '#7E22CE' // purple-700
        },
        USER: {
            bg: '#EFF6FF', // blue-50
            text: '#1D4ED8' // blue-700
        },
        ONLINE: {
            bg: '#ECFDF5', // green-50
            text: '#15803D' // green-700
        },
        OFFLINE: {
            bg: '#FEE2E2', // red-50
            text: '#B91C1C' // red-700
        },
        OFFERED: {
            bg: '#EFF6FF', // blue-50
            text: '#1D4ED8' // blue-700
        },
        REJECTED: {
            bg: '#FEE2E2', // red-50
            text: '#B91C1C' // red-700
        },
        HIGH: {
            bg: '#FEE2E2', // red-50
            text: '#B91C1C' // red-700
        },
        LOW: {
            bg: '#ECFDF5', // green-50
            text: '#15803D' // green-700
        },
        UNKNOWN: {
            bg: '#F3F4F6', // gray-100
            text: '#374151' // gray-700
        },
        DAILY: {
            bg: '#DBEAFE', // blue-100
            text: '#1E40AF' // blue-800
        },
        WEEKLY: {
            bg: '#D1FAE5', // green-100
            text: '#065F46' // green-800
        },
        MONTHLY: {
            bg: '#F3E8FF', // purple-100
            text: '#6B21A8' // purple-800
        },
        NEW: {
            bg: '#DBEAFE', // blue-100
            text: '#1E40AF' // blue-800
        },
        APPROVED: {
            bg: '#D1FAE5', // green-100
            text: '#065F46' // green-800
        },
        COMPLETED: {
            bg: '#D1FAE5', // green-100
            text: '#065F46' // green-800
        },
        CANCELLED: {
            bg: '#FEE2E2', // red-100
            text: '#991B1B' // red-800
        }
    };

    return statusMap[status.toUpperCase()] || statusMap.UNKNOWN;
}; 