import { CardSection, CardField } from '@/components/Card';
import { Funding } from '@/types/funding';
import { Syndicator } from '@/types/syndicator';
import { syndicationOfferStatusList, SyndicationOffer } from '@/types/syndicationOffer';

export function getCreateModalCardSections(
  handleInputChange: (value: any, field: CardField) => void,
  fundings: Funding[],
  syndicators: Syndicator[],
  loadingFundings: boolean,
  loadingSyndicators: boolean,
  formData: any,
  initialFundingId?: string
): CardSection[] {
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
    handleInputChange([...(formData.fee_list || []), newFee], {
      key: 'fee_list',
      label: 'Fee List',
      type: 'array-input',
      priority: 'medium'
    });
  };

  const removeFeeItem = (index: number) => {
    const newList = [...(formData.fee_list || [])];
    newList.splice(index, 1);
    handleInputChange(newList, {
      key: 'fee_list',
      label: 'Fee List',
      type: 'array-input',
      priority: 'medium'
    });
  };

  const addCreditItem = () => {
    const newCredit = {
      name: null,
      fee_type: null,
      amount: 0,
      upfront: false
    };
    handleInputChange([...(formData.credit_list || []), newCredit], {
      key: 'credit_list',
      label: 'Credit List',
      type: 'array-input',
      priority: 'medium'
    });
  };

  const removeCreditItem = (index: number) => {
    const newList = [...(formData.credit_list || [])];
    newList.splice(index, 1);
    handleInputChange(newList, {
      key: 'credit_list',
      label: 'Credit List',
      type: 'array-input',
      priority: 'medium'
    });
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
              required: true,
              priority: 'high',
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
              onChange: (value: string) => {
                handleInputChange(value, {
                  key: 'funding',
                  label: 'Funding',
                  type: 'select-input',
                  priority: 'high',
                });
                const funding = fundings.find(f => f._id === value);
                const percent = formData.participate_percent || 0;
                if (funding && funding.funded_amount) {
                  const amount = Number(((percent / 100) * funding.funded_amount).toFixed(2));
                  handleInputChange(amount, {
                    key: 'participate_amount',
                    label: 'Participate Amount',
                    type: 'number-input',
                    priority: 'high',
                  });
                } else {
                  handleInputChange(0, {
                    key: 'participate_amount',
                    label: 'Participate Amount',
                    type: 'number-input',
                    priority: 'high',
                  });
                }
              },
              placeholder: 'Select a funding',
              description: 'Select the funding source for this syndication offer'
            },
            {
              key: 'syndicator',
              label: 'Syndicator',
              type: 'select-input',
              required: true,
              priority: 'high',
              options: syndicators.map(syndicator => ({
                value: syndicator._id,
                label: syndicator.name
              })),
              isLoading: loadingSyndicators,
              onChange: (value: string) => handleInputChange(value, {
                key: 'syndicator',
                label: 'Syndicator',
                type: 'select-input',
                priority: 'high'
              }),
              placeholder: 'Select a syndicator',
              description: 'Select the syndicator for this offer'
            }
          ]
        },
        {
          fields: [
            {
              key: 'participate_amount',
              label: 'Participate Amount',
              type: 'number-input',
              required: true,
              priority: 'high',
              min: (() => {
                const funding = fundings.find(f => f._id === formData.funding);
                const percentStep = 0.01;
                const step = funding && funding.funded_amount ? Number((funding.funded_amount * percentStep / 100).toFixed(2)) : 0.01;
                return step;
              })(),
              max: getMaxParticipateAmount(formData.funding),
              step: (() => {
                const funding = fundings.find(f => f._id === formData.funding);
                const percentStep = 0.01;
                return funding && funding.funded_amount ? Number((funding.funded_amount * percentStep / 100).toFixed(2)) : 0.01;
              })(),
              onChange: (value: number) => {
                handleInputChange(value, {
                  key: 'participate_amount',
                  label: 'Participate Amount',
                  type: 'number-input',
                  priority: 'high'
                });

                // Calculate participate percentage
                const funding = fundings.find(f => f._id === formData.funding);
                if (funding && funding.funded_amount) {
                  const percentage = Number(((value / funding.funded_amount) * 100).toFixed(2));
                  handleInputChange(percentage, {
                    key: 'participate_percent',
                    label: 'Participate Percentage',
                    type: 'number-input',
                    priority: 'high'
                  });
                }
              },
              placeholder: 'Enter participate amount',
              description: `Enter the amount to participate in this funding (max: $${getMaxParticipateAmount(formData.funding).toLocaleString()})`
            },
            {
              key: 'participate_percent',
              label: 'Participate Percentage',
              type: 'number-input',
              required: true,
              priority: 'high',
              min: 0,
              max: 100,
              step: 0.01,
              onChange: (value: number) => {
                handleInputChange(value, {
                  key: 'participate_percent',
                  label: 'Participate Percentage',
                  type: 'number-input',
                  priority: 'high',
                });

                // Calculate participate amount
                const funding = fundings.find(f => f._id === formData.funding);
                if (funding && funding.funded_amount) {
                  const amount = Number(((value / 100) * funding.funded_amount).toFixed(2));
                  handleInputChange(amount, {
                    key: 'participate_amount',
                    label: 'Participate Amount',
                    type: 'number-input',
                    priority: 'high',
                  });
                }
              },
              placeholder: 'Calculated automatically',
              description: 'Percentage is calculated based on participate amount and funding total',
            }
          ]
        },
        {
          fields: [
            {
              key: 'payback_amount',
              label: 'Payback Amount',
              type: 'number-input',
              required: true,
              priority: 'high',
              min: 0.01,
              step: 0.01,
              onChange: (value: number) => {
                handleInputChange(value, {
                  key: 'payback_amount',
                  label: 'Payback Amount',
                  type: 'number-input',
                  priority: 'high'
                });
              },
              placeholder: 'Enter payback amount',
              description: 'Enter the amount to be paid back'
            }
          ]
        }
      ]
    },
    {
      title: 'Fees and Credits',
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
                        handleInputChange(newList, { key: 'fee_list' } as CardField);
                      }
                    },
                    {
                      key: 'expense_type',
                      label: 'Expense Type',
                      type: 'select-input',
                      priority: 'high',
                      required: true,
                      placeholder: 'Select expense type',
                      options: [
                        // TODO: Add expense types
                      ],
                      width: 50,
                      onChange: (value: any, field: CardField) => {
                        const [index] = field.key.split('.');
                        const newList = [...(formData.fee_list || [])];
                        newList[parseInt(index)] = { ...newList[parseInt(index)], expense_type: value };
                        handleInputChange(newList, { key: 'fee_list' } as CardField);
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
                        handleInputChange(newList, { key: 'fee_list' } as CardField);
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
                        handleInputChange(newList, { key: 'fee_list' } as CardField);
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
                        handleInputChange(newList, { key: 'credit_list' } as CardField);
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
                        handleInputChange(newList, { key: 'credit_list' } as CardField);
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
                        handleInputChange(newList, { key: 'credit_list' } as CardField);
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
                        handleInputChange(newList, { key: 'credit_list' } as CardField);
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
      title: 'Other Information',
      priority: 'low',
      rows: [
        {
          fields: [
            {
              key: 'offered_date',
              label: 'Offered Date',
              type: 'date-input',
              required: true,
              priority: 'low',
              onChange: (value: string) => handleInputChange(value, {
                key: 'offered_date',
                label: 'Offered Date',
                type: 'date-input',
                priority: 'low'
              }),
              placeholder: 'Select offered date',
              description: 'Select the date when this offer was made'
            },
            {
              key: 'expired_date',
              label: 'Expired Date',
              type: 'date-input',
              required: false,
              priority: 'low',
              onChange: (value: string) => handleInputChange(value, {
                key: 'expired_date',
                label: 'Expired Date',
                type: 'date-input',
                priority: 'low'
              }),
              placeholder: 'Select expired date',
              description: 'Select the date when this offer expires'
            }
          ]
        },
        {
          fields: [
            {
              key: 'status',
              label: 'Status',
              type: 'select-input',
              required: true,
              priority: 'low',
              options: syndicationOfferStatusList.map(status => ({
                value: status,
                label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
              })),
              onChange: (value: string) => handleInputChange(value, {
                key: 'status',
                label: 'Status',
                type: 'select-input',
                priority: 'low'
              }),
              placeholder: 'Select status',
              description: 'Select the current status of this offer'
            }
          ]
        }
      ]
    }
  ];
}

export function getUpdateModalCardSections(
  handleFieldChange: (value: any, field: CardField) => void,
  syndicationOffer: SyndicationOffer,
  formData: any
): CardSection[] {
  // Helper function to get max participate amount based on funding
  const getMaxParticipateAmount = () => {
    return syndicationOffer.funding?.funded_amount || 0;
  };

  // Helper functions for array operations
  const addFeeItem = () => {
    const newFee = {
      name: null,
      expense_type: null,
      amount: 0,
      upfront: false
    };
    handleFieldChange([...(formData.fee_list || []), newFee], {
      key: 'fee_list',
      label: 'Fee List',
      type: 'array-input',
      priority: 'medium'
    });
  };

  const removeFeeItem = (index: number) => {
    const newList = [...(formData.fee_list || [])];
    newList.splice(index, 1);
    handleFieldChange(newList, {
      key: 'fee_list',
      label: 'Fee List',
      type: 'array-input',
      priority: 'medium'
    });
  };

  const addCreditItem = () => {
    const newCredit = {
      name: null,
      fee_type: null,
      amount: 0,
      upfront: false
    };
    handleFieldChange([...(formData.credit_list || []), newCredit], {
      key: 'credit_list',
      label: 'Credit List',
      type: 'array-input',
      priority: 'medium'
    });
  };

  const removeCreditItem = (index: number) => {
    const newList = [...(formData.credit_list || [])];
    newList.splice(index, 1);
    handleFieldChange(newList, {
      key: 'credit_list',
      label: 'Credit List',
      type: 'array-input',
      priority: 'medium'
    });
  };

  return [
    {
      title: 'Basic Information',
      priority: 'high',
      rows: [
        {
          fields: [
            {
              key: 'funding_name',
              label: 'Funding',
              type: 'text',
              priority: 'high',
              disabled: true,
              width: 50
            },
            {
              key: 'syndicator_name',
              label: 'Syndicator',
              type: 'text',
              priority: 'high',
              disabled: true,
              width: 50
            }
          ]
        }
      ]
    },
    {
      title: 'Financial Details',
      priority: 'high',
      rows: [
        {
          fields: [
            {
              key: 'participate_amount',
              label: 'Participate Amount ($)',
              type: 'number-input',
              priority: 'high',
              required: true,
              min: 0,
              max: getMaxParticipateAmount(),
              step: 10,
              onChange: (value: number) => {
                // Update the current field
                handleFieldChange(value, {
                  key: 'participate_amount',
                  label: 'Participate Amount',
                  type: 'number-input',
                  priority: 'high'
                });

                // Calculate participate percentage based on funding amount
                const funding = syndicationOffer.funding;
                if (funding && funding.funded_amount) {
                  const percentage = Number(((value / funding.funded_amount) * 100).toFixed(2));
                  handleFieldChange(percentage, {
                    key: 'participate_percent',
                    label: 'Participate Percentage',
                    type: 'number-input',
                    priority: 'high'
                  });
                }
              },
              placeholder: 'Enter participate amount',
              description: `Enter the amount to participate in this funding (max: $${getMaxParticipateAmount().toLocaleString()})`,
              width: 33
            },
            {
              key: 'participate_percent',
              label: 'Participate Percent (%)',
              type: 'number-input',
              priority: 'high',
              required: true,
              min: 0,
              max: 100,
              step: 0.01,
              onChange: (value: number) => {
                const roundedValue = Math.round(value * 100) / 100;
                // Update the current field
                handleFieldChange(roundedValue, {
                  key: 'participate_percent',
                  label: 'Participate Percentage',
                  type: 'number-input',
                  priority: 'high',
                });

                // Calculate participate amount based on funding amount
                const funding = syndicationOffer.funding;
                if (funding && funding.funded_amount) {
                  const amount = Number(((roundedValue / 100) * funding.funded_amount).toFixed(2));
                  handleFieldChange(amount, {
                    key: 'participate_amount',
                    label: 'Participate Amount',
                    type: 'number-input',
                    priority: 'high'
                  });
                }
              },
              placeholder: 'Calculated automatically',
              description: 'Percentage is calculated based on participate amount and funding total',
              width: 33
            },
            {
              key: 'payback_amount',
              label: 'Payback Amount ($)',
              type: 'number-input',
              priority: 'high',
              required: true,
              min: 0.01,
              step: 0.01,
              onChange: (value: number, field: CardField) => {
                handleFieldChange(value, field);
              },
              placeholder: 'Enter payback amount',
              description: 'Enter the amount to be paid back',
              width: 34
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
                        handleFieldChange(newList, { key: 'fee_list' } as CardField);
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
                        handleFieldChange(newList, { key: 'fee_list' } as CardField);
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
                        handleFieldChange(newList, { key: 'fee_list' } as CardField);
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
                        handleFieldChange(newList, { key: 'fee_list' } as CardField);
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
                        handleFieldChange(newList, { key: 'credit_list' } as CardField);
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
                        handleFieldChange(newList, { key: 'credit_list' } as CardField);
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
                        handleFieldChange(newList, { key: 'credit_list' } as CardField);
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
                        handleFieldChange(newList, { key: 'credit_list' } as CardField);
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
      title: 'Dates & Status',
      priority: 'medium',
      rows: [
        {
          fields: [
            {
              key: 'offered_date',
              label: 'Offered Date',
              type: 'date-input',
              priority: 'medium',
              onChange: handleFieldChange,
              width: 33
            },
            {
              key: 'expired_date',
              label: 'Expired Date',
              type: 'date-input',
              priority: 'medium',
              onChange: handleFieldChange,
              width: 33
            },
            {
              key: 'status',
              label: 'Status',
              type: 'select-input',
              priority: 'medium',
              options: syndicationOfferStatusList.map(status => ({
                value: status,
                label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
              })),
              onChange: handleFieldChange,
              width: 34
            }
          ]
        },
        {
          fields: [
            {
              key: 'inactive',
              label: 'Status',
              type: 'boolean-input',
              priority: 'medium',
              switchLabel: 'Mark as Inactive',
              description: 'When enabled, this offer will be marked as inactive',
              onChange: handleFieldChange,
              width: 100
            }
          ]
        }
      ]
    }
  ];
} 