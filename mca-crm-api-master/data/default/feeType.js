module.exports = [
    {
        name: 'Bank Fee',
        formula: {
            name: 'Bank Fee Formula',
            calculate_type: 'AMOUNT',
            tier_list: [
                {
                    amount: 500,
                }
            ],
            shared: false,
            inactive: false
        },
        upfront: true,
        default: true,
        inactive: false
    },
    {
        name: 'Origination Fee',
        formula: {
            name: 'Origination Fee Formula',
            calculate_type: 'AMOUNT',
            tier_list: [
                {
                    amount: 1000,
                }
            ],
            shared: false,
            inactive: false
        },
        upfront: true,
        default: true,
        inactive: false
    }
];