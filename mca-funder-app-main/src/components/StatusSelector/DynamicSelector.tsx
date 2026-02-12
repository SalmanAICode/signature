import React, { useState, useCallback } from 'react';
import Select, { DropdownIndicatorProps, GroupBase } from 'react-select';
import { getStatusColors } from '@/lib/utils/statusColors';

export type DynamicSelectorProps<T> = {
  value: T;
  options: () => Promise<T[]>;
  onUpdate: (newStatus: T) => void;
  width?: string;
  isLoading?: boolean;
  getOptionLabel?: (option: T) => string;
  getOptionColor?: (option: T) => string;
  getOptionClosed?: (option: T) => boolean;
};

const darkenColor = (hex: string, amount: number = 0.1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const darken = (value: number) => Math.max(0, Math.floor(value * (1 - amount)));
  return `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`;
};

const getContrastTextColor = (bg: string) => {
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const isSame = <T,>(a: T, b: T) => {
  if (!a || !b) return false;
  const aid = (a as any)?._id ?? (a as any)?.id;
  const bid = (b as any)?._id ?? (b as any)?.id;
  return aid !== undefined && bid !== undefined ? aid === bid : a === b;
};

export function DynamicSelector<T>({
  value,
  options,
  onUpdate,
  width = '200px',
  isLoading = false,
  getOptionLabel,
  getOptionColor,
  getOptionClosed
}: DynamicSelectorProps<T>) {
  const [loadedOptions, setLoadedOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const loadOptions = useCallback(async () => {
    if (optionsLoaded || loading) return;
    setLoading(true);
    try {
      const opts = await options();
      setLoadedOptions(opts);
      setOptionsLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [options, optionsLoaded, loading]);

  // Ensure value is always rendered even before options load
  const selectOptions = [
    ...(value
      ? [{
          value,
          label: getOptionLabel ? getOptionLabel(value) : String(value),
          bgcolor: getOptionColor ? getOptionColor(value) : undefined,
        }]
      : []),
    ...loadedOptions
      .filter(opt => !isSame(opt, value))
      .map(option => ({
        value: option,
        label: getOptionLabel ? getOptionLabel(option) : String(option),
        bgcolor: getOptionColor ? getOptionColor(option) : undefined,
      })),
  ];

  const selectValue =
    selectOptions.find(opt => isSame(opt.value, value)) ?? null;

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
    <div className="relative" style={{ width }}>
      <Select<any>
        value={selectValue}
        onChange={option => option && onUpdate(option.value)}
        options={selectOptions}
        isDisabled={isLoading}
        isLoading={loading || isLoading}
        onMenuOpen={loadOptions}
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
          dropdownIndicator: (base, state: DropdownIndicatorProps<any, false, GroupBase<any>>) => ({
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
          })
        }}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        loadingMessage={() => "Loading statuses..."}
        noOptionsMessage={() => "No statuses available"}
      />
    </div>
  );
}