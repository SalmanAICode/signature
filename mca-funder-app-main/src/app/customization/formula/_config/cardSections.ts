import { CardSection, CardField } from '@/components/Card';
import { Calculate } from '@/types/calculate';
import { BaseItem } from '@/types/baseItem';
import { Tier } from '@/types/tier';
import { 
  InformationCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

// Calculate Type options
const CALCULATE_TYPE_OPTIONS = [
  { value: 'AMOUNT', label: 'Amount' },
  { value: 'PERCENT', label: 'Percent (%)' }
];

// Base Item options  
const BASE_ITEM_OPTIONS = [
  { value: 'FUND', label: 'Fund' },
  { value: 'PAYBACK', label: 'Payback' }
];

// Tier Type options
const TIER_TYPE_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'FACTOR_RATE', label: 'Factor Rate' },
  { value: 'FUND', label: 'Fund' },
  { value: 'PAYBACK', label: 'Payback' }
];

// Interface for form data  
export interface FormulaFormData {
  name: string;
  calculate_type: Calculate;
  base_item?: BaseItem | null;
  tier_type?: Tier | null;
  tier_list: Array<{
    min_number: number;
    max_number: number;
    amount: number;
    percent: number;
  }>;
  shared: boolean;
}

// Create Modal Card Sections Configuration (Dynamic based on form state)
export const getCreateModalCardSections = (
  formData: FormulaFormData,
  handleInputChange: (value: any, field: CardField) => void,
  handleTierChange: (index: number, tierField: string, value: any) => void,
  addTier: () => void,
  removeTier: (index: number) => void
): CardSection[] => {
  const sections: CardSection[] = [
    {
      title: 'Formula Configuration',
      priority: 'high',
      icon: InformationCircleIcon,
      rows: [
        {
          fields: [
            {
              key: 'name',
              label: 'Formula Name',
              type: 'text-input' as const,
              priority: 'high' as const,
              required: true,
              placeholder: 'Enter formula name',
              onChange: handleInputChange,
              width: 50
            },
            {
              key: 'calculate_type',
              label: 'Calculate Type',
              type: 'select-input' as const,
              priority: 'high' as const,
              required: true,
              placeholder: 'Select calculate type',
              options: CALCULATE_TYPE_OPTIONS,
              onChange: handleInputChange,
              width: 50
            }
          ]
        },
        // Add Base Item row only when Calculate Type is PERCENT
        ...(formData.calculate_type === 'PERCENT' ? [{
          fields: [
            {
              key: 'base_item',
              label: 'Base Item',
              type: 'select-input' as const,
              priority: 'high' as const,
              required: true,
              placeholder: 'Select base item',
              options: BASE_ITEM_OPTIONS,
              onChange: handleInputChange,
              width: 50
            },
            {
              key: 'tier_type',
              label: 'Tier Type',
              type: 'select-input' as const,
              priority: 'medium' as const,
              placeholder: 'Select tier type',
              options: TIER_TYPE_OPTIONS,
              onChange: handleInputChange,
              width: 50
            }
          ]
        }] : [{
          fields: [
            {
              key: 'tier_type',
              label: 'Tier Type',
              type: 'select-input' as const,
              priority: 'medium' as const,
              placeholder: 'Select tier type',
              options: TIER_TYPE_OPTIONS,
              onChange: handleInputChange,
              width: 100
            }
          ]
        }])
      ]
    }
  ];

  // Add value configuration section
  if (formData.tier_type === null || formData.tier_type === 'NONE') {
    // When tier_type is None, show a single input for Amount or Percent
    sections.push({
      title: 'Value Configuration',
      priority: 'medium',
      icon: CurrencyDollarIcon,
      rows: [
        {
          fields: [
            {
              key: formData.calculate_type === 'AMOUNT' ? 'single_amount' : 'single_percent',
              label: formData.calculate_type === 'AMOUNT' ? 'Amount' : 'Percent (%)',
              type: 'number-input' as const,
              priority: 'medium' as const,
              placeholder: formData.calculate_type === 'AMOUNT' ? '0.00' : '0.00',
              ...(formData.calculate_type === 'PERCENT' && {
                min: 0,
                max: 100,
                step: 0.01
              }),
              ...(formData.calculate_type === 'AMOUNT' && {
                min: 0,
                step: 0.01,
                max: Number.MAX_SAFE_INTEGER
              }),
              onChange: (value: any) => {
                // Store the value in the first tier of tier_list
                if (formData.calculate_type === 'AMOUNT') {
                  handleTierChange(0, 'amount', value);
                } else {
                  handleTierChange(0, 'percent', value);
                }
              },
              width: 100
            }
          ]
        }
      ]
    });
  } else {
    // When tier_type is not None, show tier list with array-input
    sections.push({
      title: 'Tier Configuration',
      priority: 'high',
      icon: ChartBarIcon,
      rows: [
        {
          fields: [
            {
              key: 'tier_list',
              label: 'Tier List',
              type: 'array-input' as const,
              priority: 'high' as const,
              collapsible: true,
              defaultCollapsed: false,
              arrayData: formData.tier_list,
              onAddItem: addTier,
              onRemoveItem: removeTier,
              arrayItemFields: [
                {
                  key: 'min_number',
                  label: 'Min Number',
                  type: 'number-input' as const,
                  priority: 'medium' as const,
                  placeholder: '0.00',
                  min: 0,
                  step: 0.01,
                  max: Number.MAX_SAFE_INTEGER,
                  onChange: (value: any, field: CardField) => {
                    const [index] = field.key.split('.');
                    handleTierChange(parseInt(index), 'min_number', value);
                  },
                  width: 25
                },
                {
                  key: 'max_number',
                  label: 'Max Number',
                  type: 'number-input' as const,
                  priority: 'medium' as const,
                  placeholder: '0.00',
                  min: 0,
                  step: 0.01,
                  max: Number.MAX_SAFE_INTEGER,
                  onChange: (value: any, field: CardField) => {
                    const [index] = field.key.split('.');
                    handleTierChange(parseInt(index), 'max_number', value);
                  },
                  width: 25
                },
                ...(formData.calculate_type === 'AMOUNT' ? [{
                  key: 'amount',
                  label: 'Amount',
                  type: 'number-input' as const,
                  priority: 'medium' as const,
                  placeholder: '0.00',
                  min: 0,
                  max: Number.MAX_SAFE_INTEGER,
                  step: 0.01,
                  onChange: (value: any, field: CardField) => {
                    const [index] = field.key.split('.');
                    handleTierChange(parseInt(index), 'amount', value);
                  },
                  width: 50
                }] : [{
                  key: 'percent',
                  label: 'Percent (%)',
                  type: 'number-input' as const,
                  priority: 'medium' as const,
                  placeholder: '0.00',
                  min: 0,
                  max: 100,
                  step: 0.001,
                  onChange: (value: any, field: CardField) => {
                    const [index] = field.key.split('.');
                    handleTierChange(parseInt(index), 'percent', value);
                  },
                  width: 50
                }])
              ],
              width: 100
            }
          ]
        }
      ]
    });
  }

  // Add Settings section for shared field
  // Since we removed shared field from main configuration, always add Settings section
  {
    sections.push({
      title: 'Settings',
      priority: 'low',
      icon: Cog6ToothIcon,
      rows: [
        {
          fields: [
            {
              key: 'shared',
              label: 'Shared Formula',
              type: 'boolean-input' as const,
              priority: 'low' as const,
              switchLabel: 'Available to other functions',
              description: 'When enabled, other functions can use this formula',
              onChange: handleInputChange,
              width: 100
            }
          ]
        }
      ]
    });
  }

      return sections;
}

// Update Modal Card Sections Configuration
export const getUpdateModalCardSections = (
    formData: FormulaFormData & { inactive?: boolean },
    handleInputChange: (value: any, field: CardField) => void,
    handleTierChange: (index: number, tierField: string, value: any) => void,
    addTier: () => void,
    removeTier: (index: number) => void
): CardSection[] => {
    const sections: CardSection[] = [
        {
            title: 'Formula Configuration',
            priority: 'high',
            icon: InformationCircleIcon,
            rows: [
                {
                    fields: [
                        {
                            key: 'name',
                            label: 'Formula Name',
                            type: 'text-input' as const,
                            priority: 'high' as const,
                            required: true,
                            placeholder: 'Enter formula name',
                            onChange: handleInputChange,
                            width: 50
                        },
                        {
                            key: 'calculate_type',
                            label: 'Calculate Type',
                            type: 'select-input' as const,
                            priority: 'high' as const,
                            required: true,
                            placeholder: 'Select calculate type',
                            options: CALCULATE_TYPE_OPTIONS,
                            onChange: handleInputChange,
                            width: 50
                        }
                    ]
                },
                // Add Base Item row only when Calculate Type is PERCENT
                ...(formData.calculate_type === 'PERCENT' ? [{
                    fields: [
                        {
                            key: 'base_item',
                            label: 'Base Item',
                            type: 'select-input' as const,
                            priority: 'high' as const,
                            required: true,
                            placeholder: 'Select base item',
                            options: BASE_ITEM_OPTIONS,
                            onChange: handleInputChange,
                            width: 50
                        },
                        {
                            key: 'tier_type',
                            label: 'Tier Type',
                            type: 'select-input' as const,
                            priority: 'medium' as const,
                            placeholder: 'Select tier type',
                            options: TIER_TYPE_OPTIONS,
                            onChange: handleInputChange,
                            width: 50
                        }
                    ]
                }] : [{
                    fields: [
                        {
                            key: 'tier_type',
                            label: 'Tier Type',
                            type: 'select-input' as const,
                            priority: 'medium' as const,
                            placeholder: 'Select tier type',
                            options: TIER_TYPE_OPTIONS,
                            onChange: handleInputChange,
                            width: 100
                        }
                    ]
                }])
            ]
        }
    ];

    // Add value configuration section
    if (formData.tier_type === null || formData.tier_type === 'NONE') {
        // When tier_type is None, show a single input for Amount or Percent
        sections.push({
            title: 'Value Configuration',
            priority: 'medium',
            icon: CurrencyDollarIcon,
            rows: [
                {
                    fields: [
                        {
                            key: formData.calculate_type === 'AMOUNT' ? 'single_amount' : 'single_percent',
                            label: formData.calculate_type === 'AMOUNT' ? 'Amount' : 'Percent (%)',
                            type: 'number-input' as const,
                            priority: 'medium' as const,
                            placeholder: formData.calculate_type === 'AMOUNT' ? '0.00' : '0.00',
                            ...(formData.calculate_type === 'PERCENT' && {
                                min: 0,
                                max: 100,
                                step: 0.001
                            }),
                            onChange: (value: any) => {
                                // Store the value in the first tier of tier_list
                                if (formData.calculate_type === 'AMOUNT') {
                                    handleTierChange(0, 'amount', value);
                                } else {
                                    handleTierChange(0, 'percent', value);
                                }
                            },
                            width: 100
                        }
                    ]
                }
            ]
        });
    }

    // Add Tier Configuration for non-None tier types
    if (formData.tier_type && formData.tier_type !== 'NONE') {
        sections.push({
            title: 'Tier Configuration',
            priority: 'high',
            icon: ChartBarIcon,
            rows: [
                {
                    fields: [
                        {
                            key: 'tier_list',
                            label: 'Tier List',
                            type: 'array-input' as const,
                            priority: 'high' as const,
                            collapsible: true,
                            defaultCollapsed: false,
                            arrayData: formData.tier_list,
                            onAddItem: addTier,
                            onRemoveItem: removeTier,
                            arrayItemFields: [
                                {
                                    key: 'min_number',
                                    label: 'Min Number',
                                    type: 'number-input' as const,
                                    priority: 'medium' as const,
                                    placeholder: '0.00',
                                    min: 0,
                                    step: 0.01,
                                    max: Number.MAX_SAFE_INTEGER,
                                    onChange: (value: any, field: CardField) => {
                                        const [index] = field.key.split('.');
                                        handleTierChange(parseInt(index), 'min_number', value);
                                    },
                                    width: 25
                                },
                                {
                                    key: 'max_number',
                                    label: 'Max Number',
                                    type: 'number-input' as const,
                                    priority: 'medium' as const,
                                    placeholder: '0.00',
                                    min: 0,
                                    step: 0.01,
                                    max: Number.MAX_SAFE_INTEGER,
                                    onChange: (value: any, field: CardField) => {
                                        const [index] = field.key.split('.');
                                        handleTierChange(parseInt(index), 'max_number', value);
                                    },
                                    width: 25
                                },
                                ...(formData.calculate_type === 'AMOUNT' ? [{
                                    key: 'amount',
                                    label: 'Amount',
                                    type: 'number-input' as const,
                                    priority: 'medium' as const,
                                    placeholder: '0.00',
                                    min: 0,
                                    max: Number.MAX_SAFE_INTEGER,
                                    step: 0.01,
                                    onChange: (value: any, field: CardField) => {
                                        const [index] = field.key.split('.');
                                        handleTierChange(parseInt(index), 'amount', value);
                                    },
                                    width: 50
                                }] : [{
                                    key: 'percent',
                                    label: 'Percent (%)',
                                    type: 'number-input' as const,
                                    priority: 'medium' as const,
                                    placeholder: '0.00',
                                    min: 0,
                                    max: 100,
                                    step: 0.001,
                                    onChange: (value: any, field: CardField) => {
                                        const [index] = field.key.split('.');
                                        handleTierChange(parseInt(index), 'percent', value);
                                    },
                                    width: 50
                                }])
                            ],
                            width: 100
                        }
                    ]
                }
            ]
        });
    }

    // Add Settings section
    sections.push({
        title: 'Settings',
        priority: 'low',
        icon: Cog6ToothIcon,
        rows: [
            {
                fields: [
                    {
                        key: 'shared',
                        label: 'Shared Formula',
                        type: 'boolean-input' as const,
                        priority: 'low' as const,
                        switchLabel: 'Available to other functions',
                        description: 'When enabled, other functions can use this formula',
                        onChange: handleInputChange,
                        width: 50
                    },
                    {
                        key: 'inactive',
                        label: 'Inactive',
                        type: 'boolean-input' as const,
                        priority: 'low' as const,
                        switchLabel: 'Mark as inactive',
                        description: 'When enabled, this formula will be hidden from selection',
                        onChange: handleInputChange,
                        width: 50
                    }
                ]
            }
        ]
    });

    return sections;
}