import { CardSection, CardField } from '@/components/Card';
import { Syndicator } from '@/types/syndicator';
import { SyndicationOffer } from '@/types/syndicationOffer';
import {
  InformationCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Funding } from '@/types/funding';
import { CreateSyndicationData } from '@/types/syndication';

// Status options
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' }
];

// Utility function to map fundings to select options
export const mapFundingsToOptions = (fundings: Funding[]) => {
  return fundings
    .filter((funding) => funding._id && funding._id.trim())
    .filter((funding, index, self) => index === self.findIndex(f => f._id === funding._id))
    .map((funding) => ({
      value: funding._id,
      label: funding.name,
      title: `ID: ${funding._id}`,
      subtitle: `Funder: ${typeof funding.funder === 'object' && funding.funder ? funding.funder.name : ''} | Amount: ${funding.funded_amount || 0}`
    }));
};

// Utility function to map syndicators to select options
export const mapSyndicatorsToOptions = (syndicators: Syndicator[]) => {
  return syndicators
    .filter((syndicator) => syndicator._id && syndicator._id.trim())
    .filter((syndicator, index, self) => index === self.findIndex(s => s._id === syndicator._id))
    .map((syndicator) => ({
      value: syndicator._id,
      label: syndicator.name,
      title: `ID: ${syndicator._id}`,
      subtitle: syndicator.email || ''
    }));
};

// Utility function to map syndication offers to select options
export const mapSyndicationOffersToOptions = (syndicationOffers: SyndicationOffer[]) => {
  return syndicationOffers
    .filter((offer) => offer._id && offer._id.trim())
    .filter((offer, index, self) => index === self.findIndex(o => o._id === offer._id))
    .map((offer) => ({
      value: offer._id,
      label: offer.funding?.name || offer._id,
      title: `ID: ${offer._id}`,
      subtitle: `Amount: ${offer.participate_amount || 0} | Status: ${offer.status}`
    }));
};

// Create Modal Card Sections Configuration
export const getCreateModalCardSections = (
  onChange: (value: any, field: CardField) => void,
  fundings: Funding[],
  syndicators: Syndicator[],
  syndicationOffers: SyndicationOffer[],
  loadingFundings: boolean,
  loadingSyndicators: boolean,
  loadingSyndicationOffers: boolean,
  formData: CreateSyndicationData,
  initialFundingId?: string
): CardSection[] => {
  // Helper function to get max participate amount based on selected funding
  const getMaxParticipateAmount = (fundingId: string) => {
    const funding = fundings.find(f => f._id === fundingId);
    return funding?.funded_amount || 0;
  };

  // Helper functions for array operations
  const addFeeItem = () => {
    const newFee = {
      name: null,
      expense_type: null,
      amount: 0,
      upfront: false
    };
    onChange([...(formData.fee_list || []), newFee], { key: 'fee_list' } as CardField);
  };

  const removeFeeItem = (index: number) => {
    const newList = [...(formData.fee_list || [])];
    newList.splice(index, 1);
    onChange(newList, { key: 'fee_list' } as CardField);
  };

  const addCreditItem = () => {
    const newCredit = {
      name: null,
      fee_type: null,
      amount: 0,
      upfront: false
    };
    onChange([...(formData.credit_list || []), newCredit], { key: 'credit_list' } as CardField);
  };

  const removeCreditItem = (index: number) => {
    const newList = [...(formData.credit_list || [])];
    newList.splice(index, 1);
    onChange(newList, { key: 'credit_list' } as CardField);
  };

  return [
    {
      title: 'Basic Information',
      priority: 'high',
      rows: [
        {
          fields: [
            {
              key: 'funding',
              label: 'Funding',
              type: 'select-input',
              priority: 'high',
              required: true,
              width: 50,
              placeholder: 'Select funding',
              options: initialFundingId
                ? fundings.filter(f => f._id === initialFundingId).map(funding => ({
                    value: funding._id,
                    label: `${funding.name} ($${funding.funded_amount.toLocaleString()})`
                  }))
                : fundings.map(funding => ({
                    value: funding._id,
                    label: `${funding.name} ($${funding.funded_amount.toLocaleString()})`
                  })),
              isLoading: loadingFundings,
              disabled: !!initialFundingId,
              onChange: (value: string, field: CardField) => {
                onChange(value, field);
                // Reset participate amount when funding changes
                onChange(0, { key: 'participate_amount' } as CardField);
              }
            },
            {
              key: 'syndicator',
              label: 'Syndicator',
              type: 'select-input',
              priority: 'high',
              required: true,
              placeholder: 'Select syndicator...',
              searchable: true,
              isLoading: loadingSyndicators,
              disabled: loadingSyndicators,
              options: mapSyndicatorsToOptions(syndicators),
              onChange: onChange,
              width: 50
            }
          ]
        },
        {
          fields: [
            {
              key: 'syndication_offer',
              label: 'Syndication Offer',
              type: 'select-input',
              priority: 'medium',
              placeholder: 'Select syndication offer (optional)...',
              searchable: true,
              isLoading: loadingSyndicationOffers,
              disabled: loadingSyndicationOffers,
              options: mapSyndicationOffersToOptions(syndicationOffers),
              onChange: onChange,
              width: 100
            }
          ]
        }
      ]
    },
    {
      title: 'Financial Information',
      priority: 'high',
      rows: [
        {
          fields: [
            {
              key: 'participate_amount',
              label: 'Participate Amount',
              type: 'number-input',
              priority: 'high',
              required: true,
              placeholder: 'Enter participate amount',
              min: 0,
              max: getMaxParticipateAmount(formData.funding),
              step: 10,
              onChange: (value: number, field: CardField) => {
                
                // Calculate participate percentage
                const funding = fundings.find(f => f._id === formData.funding);
                // Update the current field
                onChange(value, {
                  key: 'participate_amount',
                  label: 'Participate Amount',
                  type: 'number-input',
                  priority: 'high'
                });
                if (funding && funding.funded_amount) {
                  const percentage = Number(((value / funding.funded_amount) * 100).toFixed(2));
                  onChange(percentage, {
                    key: 'participate_percent',
                    label: 'Participate Percentage',
                    type: 'number-input',
                    priority: 'high'
                  });
                }
              },
              width: 50
            },
            {
              key: 'participate_percent',
              label: 'Participate Percentage',
              type: 'number-input',
              priority: 'high',
              required: true,
              placeholder: 'Enter participate percentage',
              min: 0,
              max: 100,
              step: 0.01,
              onChange: (value: number, field: CardField) => {
                
                // Calculate participate amount
                const funding = fundings.find(f => f._id === formData.funding);
                const roundedValue = Math.round(value * 100) / 100;
                // Update the current field
                onChange(roundedValue, {
                  key: 'participate_percent',
                  label: 'Participate Percentage',
                  type: 'number-input',
                  priority: 'high',
                });
                if (funding && funding.funded_amount) {
                  const amount = Number(((roundedValue / 100) * funding.funded_amount).toFixed(2));
                  onChange(amount, {
                    key: 'participate_amount',
                    label: 'Participate Amount',
                    type: 'number-input',
                    priority: 'high'
                  });
                }
              },
              width: 50
            }
          ]
        },
        {
          fields: [
            {
              key: 'payback_amount',
              label: 'Payback Amount',
              type: 'number-input',
              priority: 'high',
              required: true,
              placeholder: 'Enter payback amount',
              min: 0.01,
              step: 0.01,
              onChange: (value: number, field: CardField) => {
                onChange(value, field);
              },
              width: 100
            }
          ]
        }
      ]
    },
    {
      title: 'Fees & Credits',
      priority: 'medium',
      rows: [
        {
          fields: [
            {
              key: 'fee_list',
              label: 'Fee List',
              type: 'array-input',
              priority: 'medium',
              placeholder: 'Add fees (optional)...',
              collapsible: true,
              defaultCollapsed: false,
              arrayData: formData.fee_list || [],
              onAddItem: addFeeItem,
              onRemoveItem: removeFeeItem,
              rows: [
                {
                  fields: [
                    {
                      key: 'name',
                      label: 'Fee Name',
                      type: 'text-input',
                      priority: 'high',
                      required: false,
                      placeholder: 'Enter fee name',
                      width: 50,
                      onChange: (value: any, field: CardField) => {
                        const [index] = field.key.split('.');
                        const newList = [...(formData.fee_list || [])];
                        newList[parseInt(index)] = { ...newList[parseInt(index)], name: value };
                        onChange(newList, { key: 'fee_list' } as CardField);
                      }
                    },
                    {
                      key: 'expense_type',
                      label: 'Expense Type',
                      type: 'select-input',
                      priority: 'high',
                      required: false,
                      placeholder: 'Select expense type',
                      options: [
                        // TODO: Add expense types
                      ],
                      width: 50,
                      onChange: (value: any, field: CardField) => {
                        const [index] = field.key.split('.');
                        const newList = [...(formData.fee_list || [])];
                        newList[parseInt(index)] = { ...newList[parseInt(index)], expense_type: value };
                        onChange(newList, { key: 'fee_list' } as CardField);
                      }
                    }
                  ]
                },
                {
                  fields: [
                    {
                      key: 'amount',
                      label: 'Amount',
                      type: 'number-input',
                      priority: 'high',
                      required: true,
                      placeholder: 'Enter amount',
                      min: 0,
                      step: 0.01,
                      width: 50,
                      onChange: (value: any, field: CardField) => {
                        const [index] = field.key.split('.');
                        const newList = [...(formData.fee_list || [])];
                        newList[parseInt(index)] = { ...newList[parseInt(index)], amount: value };
                        onChange(newList, { key: 'fee_list' } as CardField);
                      }
                    },
                    {
                      key: 'upfront',
                      label: 'Upfront',
                      type: 'boolean-input',
                      priority: 'medium',
                      switchLabel: 'Is upfront fee?',
                      width: 50,
                      onChange: (value: any, field: CardField) => {
                        const [index] = field.key.split('.');
                        const newList = [...(formData.fee_list || [])];
                        newList[parseInt(index)] = { ...newList[parseInt(index)], upfront: value };
                        onChange(newList, { key: 'fee_list' } as CardField);
                      }
                    }
                  ]
                }
              ],
              width: 100
            }
          ]
        },
        {
          fields: [
            {
              key: 'credit_list',
              label: 'Credit List',
              type: 'array-input',
              priority: 'medium',
              placeholder: 'Add credits (optional)...',
              collapsible: true,
              defaultCollapsed: false,
              arrayData: formData.credit_list || [],
              onAddItem: addCreditItem,
              onRemoveItem: removeCreditItem,
              rows: [
                {
                  fields: [
                    {
                      key: 'name',
                      label: 'Credit Name',
                      type: 'text-input',
                      priority: 'high',
                      required: false,
                      placeholder: 'Enter credit name',
                      width: 50,
                      onChange: (value: any, field: CardField) => {
                        const [index] = field.key.split('.');
                        const newList = [...(formData.credit_list || [])];
                        newList[parseInt(index)] = { ...newList[parseInt(index)], name: value };
                        onChange(newList, { key: 'credit_list' } as CardField);
                      }
                    },
                    {
                      key: 'fee_type',
                      label: 'Fee Type',
                      type: 'select-input',
                      priority: 'high',
                      required: false,
                      placeholder: 'Select fee type',
                      options: [
                        // TODO: Add fee types
                      ],
                      width: 50,
                      onChange: (value: any, field: CardField) => {
                        const [index] = field.key.split('.');
                        const newList = [...(formData.credit_list || [])];
                        newList[parseInt(index)] = { ...newList[parseInt(index)], fee_type: value };
                        onChange(newList, { key: 'credit_list' } as CardField);
                      }
                    }
                  ]
                },
                {
                  fields: [
                    {
                      key: 'amount',
                      label: 'Amount',
                      type: 'number-input',
                      priority: 'high',
                      required: true,
                      placeholder: 'Enter amount',
                      min: 0,
                      step: 0.01,
                      width: 50,
                      onChange: (value: any, field: CardField) => {
                        const [index] = field.key.split('.');
                        const newList = [...(formData.credit_list || [])];
                        newList[parseInt(index)] = { ...newList[parseInt(index)], amount: value };
                        onChange(newList, { key: 'credit_list' } as CardField);
                      }
                    },
                    {
                      key: 'upfront',
                      label: 'Upfront',
                      type: 'boolean-input',
                      priority: 'medium',
                      switchLabel: 'Is upfront credit?',
                      width: 50,
                      onChange: (value: any, field: CardField) => {
                        const [index] = field.key.split('.');
                        const newList = [...(formData.credit_list || [])];
                        newList[parseInt(index)] = { ...newList[parseInt(index)], upfront: value };
                        onChange(newList, { key: 'credit_list' } as CardField);
                      }
                    }
                  ]
                }
              ],
              width: 100
            }
          ]
        }
      ]
    },
    {
      title: 'Schedule & Status',
      priority: 'high',
      rows: [
        {
          fields: [
            {
              key: 'start_date',
              label: 'Start Date',
              type: 'date-input',
              priority: 'high',
              required: true,
              onChange: onChange,
              width: 50
            },
            {
              key: 'status',
              label: 'Status',
              type: 'select-input',
              priority: 'medium',
              placeholder: 'Select status...',
              options: STATUS_OPTIONS,
              onChange: onChange,
              width: 50
            }
          ]
        }
      ]
    }
  ];
};

// Summary Modal Card Sections Configuration
export const getSummaryModalCardSections = (): CardSection[] => [
  {
    title: 'Basic Information',
    description: 'Core syndication details',
    priority: 'high',
    icon: InformationCircleIcon,
    collapsible: true,
    defaultCollapsed: false,
    rows: [
      {
        fields: [
          {
            key: 'funding.name',
            label: 'Funding Name',
            type: 'text',
            priority: 'high',
            copyable: true,
            width: 50
          },
          {
            key: 'syndication_offer',
            label: 'Syndication Offer ID',
            type: 'text',
            priority: 'medium',
            copyable: true,
            width: 50
          }
        ]
      },
      {
        fields: [
          {
            key: 'syndicator',
            label: 'Syndicator',
            type: 'syndicator',
            priority: 'medium',
            copyable: true,
            width: 50
          },
          {
            key: 'funder',
            label: 'Funder',
            type: 'funder',
            priority: 'medium',
            copyable: true,
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: 'Financial Information',
    description: 'Financial amounts and calculations',
    priority: 'high',
    icon: CurrencyDollarIcon,
    collapsible: true,
    defaultCollapsed: false,
    rows: [
      {
        fields: [
          {
            key: 'participate_amount',
            label: 'Participate Amount',
            type: 'currency',
            priority: 'high',
            width: 50
          },
          {
            key: 'payback_amount',
            label: 'Payback Amount',
            type: 'currency',
            priority: 'high',
            width: 50
          }
        ]
      },
      {
        fields: [
          {
            key: 'commission_amount',
            label: 'Commission Amount',
            type: 'currency',
            priority: 'high',
            width: 50
          },
          {
            key: 'management_percent',
            label: 'Management Percentage',
            type: 'number',
            priority: 'high',
            width: 50
          }
        ]
      }
    ]
  },
  {
    title: 'Fees & Credits',
    description: 'Fee and credit details',
    priority: 'high',
    icon: CurrencyDollarIcon,
    collapsible: true,
    defaultCollapsed: true,
    rows: [
      {
        fields: [
          {
            key: 'fee_list',
            label: 'Fee List',
            type: 'array',
            priority: 'high',
            width: 100,
            collapsible: true,
            defaultCollapsed: false,
            rows: [
              {
                fields: [
                  {
                    key: 'name',
                    label: 'Fee Name',
                    type: 'text',
                    width: 30,
                    priority: 'medium'
                  },
                  {
                    key: 'fee_type.name',
                    label: 'Fee Type',
                    type: 'text',
                    width: 30,
                    priority: 'medium'
                  },
                  {
                    key: 'amount',
                    label: 'Amount',
                    type: 'currency',
                    width: 20,
                    priority: 'medium'
                  },
                  {
                    key: 'upfront',
                    label: 'Upfront',
                    type: 'boolean',
                    width: 20,
                    priority: 'medium'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        fields: [
          {
            key: 'credit_list',
            label: 'Credit List',
            type: 'array',
            priority: 'high',
            width: 100,
            collapsible: true,
            defaultCollapsed: false,
            rows: [
              {
                fields: [
                  {
                    key: 'name',
                    label: 'Credit Name',
                    type: 'text',
                    width: 30,
                    priority: 'medium'
                  },
                  {
                    key: 'fee_type.name',
                    label: 'Fee Type',
                    type: 'text',
                    width: 30,
                    priority: 'medium'
                  },
                  {
                    key: 'amount',
                    label: 'Amount',
                    type: 'currency',
                    width: 20,
                    priority: 'medium'
                  },
                  {
                    key: 'upfront',
                    label: 'Upfront',
                    type: 'boolean',
                    width: 20,
                    priority: 'medium'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'Schedule & Status',
    description: 'Timeline and current status',
    priority: 'medium',
    icon: CalendarIcon,
    collapsible: true,
    defaultCollapsed: true,
    rows: [
      {
        fields: [
          {
            key: 'start_date',
            label: 'Start Date',
            type: 'date',
            priority: 'high',
            width: 33
          },
          {
            key: 'end_date',
            label: 'End Date',
            type: 'date',
            priority: 'high',
            width: 33
          },
          {
            key: 'status',
            label: 'Status',
            type: 'text',
            priority: 'high',
            width: 34
          }
        ]
      }
    ]
  },
  {
    title: 'System Information',
    description: 'System metadata and timestamps',
    priority: 'low',
    icon: ClockIcon,
    collapsible: true,
    defaultCollapsed: true,
    rows: [
      {
        fields: [
          {
            key: 'createdAt',
            label: 'Created At',
            type: 'datetime',
            priority: 'low',
            width: 50
          },
          {
            key: 'updatedAt',
            label: 'Updated At',
            type: 'datetime',
            priority: 'low',
            width: 50
          }
        ]
      }
    ]
  }
];

// Update Modal Card Sections Configuration  
export const getUpdateModalCardSections = (
  handleInputChange: (value: any, field: CardField) => void,
  fundings: Funding[],
  syndicators: Syndicator[],
  syndicationOffers: SyndicationOffer[],
  loadingFundings: boolean,
  loadingSyndicators: boolean,
  loadingSyndicationOffers: boolean
): CardSection[] => [
    {
      title: 'Schedule & Status',
      priority: 'high',
      rows: [
        {
          fields: [
            {
              key: 'end_date',
              label: 'End Date',
              type: 'date-input',
              priority: 'high',
              required: false,
              onChange: handleInputChange,
              width: 50
            },
            {
              key: 'status',
              label: 'Status',
              type: 'select-input',
              priority: 'medium',
              placeholder: 'Select status...',
              options: STATUS_OPTIONS,
              onChange: handleInputChange,
              width: 50
            }
          ]
        }
      ]
    }
  ];