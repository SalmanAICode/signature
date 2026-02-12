import { useState, useEffect } from "react";
import Select from 'react-select';
import { DropdownIndicatorProps, GroupBase } from 'react-select';
import { getStatusColors } from "@/lib/utils/statusColors";
import UpdateModal from "@/components/UpdateModal";

type StatusOption<T> = {
    value: T;
    label: string;
    bgcolor?: string;
};

export type StatusSelectorProps<T> = {
    value: T;
    options: T[] | (() => Promise<T[]>);
    onUpdate: (newStatus: T) => Promise<void>;
    width?: string;
    isLoading?: boolean;
    requireConfirmation?: boolean;
    confirmationStatuses?: T[];
    getOptionLabel?: (option: T) => string;
    getOptionColor?: (option: T) => string;
    getOptionClosed?: (option: T) => boolean;
};

// Helper function to darken a hex color
const darkenColor = (hex: string, amount: number = 0.1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const darken = (value: number) => Math.max(0, Math.floor(value * (1 - amount)));
    
    return `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`;
};

// Helper function to get contrast text color
const getContrastTextColor = (bg: string) => {
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export function StatusSelector<T>({
    value,
    options,
    onUpdate,
    width = '200px',
    isLoading = false,
    requireConfirmation = true,
    confirmationStatuses = [],
    getOptionLabel,
    getOptionColor,
    getOptionClosed
}: StatusSelectorProps<T>) {
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<T | null>(null);
    const [availableOptions, setAvailableOptions] = useState<T[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [optionsLoaded, setOptionsLoaded] = useState(false);

    const loadOptions = async () => {
        if (optionsLoaded || isLoadingOptions) return;
        
        setIsLoadingOptions(true);
        try {
            if (Array.isArray(options)) {
                setAvailableOptions(options);
            } else {
                const fetchedOptions = await options();
                setAvailableOptions(fetchedOptions);
            }
            setOptionsLoaded(true);
        } catch (error) {
            console.error('Error loading options:', error);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const handleMenuOpen = () => {
        if (!optionsLoaded && !isLoadingOptions) {
            loadOptions();
        }
    };

    const handleStatusChange = async (newStatus: T) => {
        if (newStatus === value) return;
        setPendingStatus(newStatus);
        
        // Check if confirmation is required
        const isClosedStatus = getOptionClosed ? getOptionClosed(newStatus) : false;
        const requiresConfirmation = requireConfirmation || 
                                   confirmationStatuses.includes(newStatus) || 
                                   isClosedStatus;
        
        if (requiresConfirmation) {
            setShowUpdateModal(true);
        } else {
            try {
                await onUpdate(newStatus);
            } finally {
                setPendingStatus(null);
            }
        }
    };

    const handleConfirmUpdate = async () => {
        if (!pendingStatus) return;
        try {
            await onUpdate(pendingStatus);
        } finally {
            setPendingStatus(null);
            setShowUpdateModal(false);
        }
    };

    const handleCancel = () => {
        setPendingStatus(null);
        setShowUpdateModal(false);
    };

    const selectOptions = availableOptions.map(option => ({
        value: option,
        label: getOptionLabel ? getOptionLabel(option) : String(option),
        bgcolor: getOptionColor ? getOptionColor(option) : undefined
    }));

    // Check if current value exists in loaded options by comparing IDs
    const currentValueExists = value && availableOptions.some(option => 
        (option as any)._id === (value as any)._id || 
        (option as any).id === (value as any).id || 
        option === value
    );

    // Create a fallback option for the current value if it's not in the loaded options
    const currentValueOption = value && !currentValueExists ? { 
        value, 
        label: getOptionLabel ? getOptionLabel(value) : String(value),
        bgcolor: getOptionColor ? getOptionColor(value) : undefined
    } : null;
    
    // Only include fallback option if we haven't loaded options yet AND current value is not in loaded options
    const allOptions = currentValueOption && !optionsLoaded && !currentValueExists
        ? [currentValueOption, ...selectOptions]
        : selectOptions;

    const CustomOption = ({ data, ...props }: any) => {
        const bg = data.bgcolor || getStatusColors(data.label).bg;
        const text = data.bgcolor ? getContrastTextColor(bg) : getStatusColors(data.label).text;
        return (
            <div
                {...props.innerProps}
                className="px-3 py-2 cursor-pointer transition-colors duration-200"
                style={{
                    backgroundColor: props.isFocused ? darkenColor(bg) : bg,
                    color: text,
                    fontWeight: props.isSelected ? 500 : 400,
                    borderRadius: '4px',
                    margin: '2px 4px'
                }}
            >
                {data.label}
            </div>
        );
    };

    const CustomSingleValue = ({ data }: any) => {
        const bg = data.bgcolor || getStatusColors(data.label).bg;
        const text = data.bgcolor ? getContrastTextColor(bg) : getStatusColors(data.label).text;
        return (
            <div
                style={{
                    color: text,
                    fontWeight: 500,
                    lineHeight: '1.25rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 'calc(100% - 24px)'
                }}
            >
                {data.label}
            </div>
        );
    };

    const currentBg = getOptionColor ? getOptionColor(value) : getStatusColors(String(value)).bg;
    const currentText = getOptionColor ? getContrastTextColor(currentBg) : getStatusColors(String(value)).text;

    return (
        <>
            <div className="relative" style={{ width }}>
                <Select<StatusOption<T>>
                    value={allOptions.find(option => option.value === value)}
                    onChange={(option) => option && handleStatusChange(option.value)}
                    options={allOptions}
                    isDisabled={isLoading}
                    isLoading={isLoadingOptions}
                    onMenuOpen={handleMenuOpen}
                    className="w-full"
                    classNamePrefix="status-select"
                    components={{
                        Option: CustomOption,
                        SingleValue: CustomSingleValue
                    }}
                    styles={{
                        control: (base, state) => ({
                            ...base,
                            minHeight: '32px',
                            height: '32px',
                            backgroundColor: currentBg,
                            borderColor: state.isFocused ? '#3B82F6' : 'transparent',
                            boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
                            '&:hover': {
                                borderColor: '#3B82F6'
                            },
                            width: '100%'
                        }),
                        valueContainer: (base) => ({
                            ...base,
                            height: '32px',
                            padding: '0 8px',
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative',
                            width: '100%'
                        }),
                        input: (base) => ({
                            ...base,
                            margin: '0px',
                            padding: '0px',
                            color: 'transparent',
                            position: 'absolute',
                            width: '100%',
                            left: 0,
                            opacity: 0
                        }),
                        indicatorsContainer: (base) => ({
                            ...base,
                            height: '32px',
                            position: 'absolute',
                            right: 0,
                            top: 0
                        }),
                        indicatorSeparator: () => ({
                            display: 'none'
                        }),
                        dropdownIndicator: (base, state: DropdownIndicatorProps<StatusOption<T>, false, GroupBase<StatusOption<T>>>) => ({
                            ...base,
                            padding: '0 8px',
                            color: currentText
                        }),
                        menu: (base) => ({
                            ...base,
                            zIndex: 9999,
                            width
                        }),
                        menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999
                        }),
                        loadingMessage: (base) => ({
                            ...base,
                            color: '#6B7280',
                            padding: '8px 12px',
                            textAlign: 'center'
                        })
                    }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    loadingMessage={() => "Loading statuses..."}
                    noOptionsMessage={() => "No statuses available"}
                />
            </div>
            <UpdateModal
                isOpen={showUpdateModal}
                title="Update"
                message={`Are you sure you want change to "${pendingStatus ? (getOptionLabel ? getOptionLabel(pendingStatus) : String(pendingStatus)) : ''}"?`}
                onConfirm={handleConfirmUpdate}
                onCancel={handleCancel}
                isLoading={isLoading}
            />
        </>
    );
} 