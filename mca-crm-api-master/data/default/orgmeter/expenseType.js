module.exports = [
    {
        name: 'ISO Commission',
        formula: {
            name: 'ISO Commission Formula',
            calculate_type: 'PERCENT',
            base_item: 'FUND',
            tier_list: [
                {
                    percent: 0.12,
                }
            ],
            shared: false,
            inactive: false
        },
        commission: true,
        syndication: true,
        default: true,
        inactive: false
    },
    {
        name: 'ISO Application Fee',
        formula: {
            name: 'ISO Application Fee Formula',
            calculate_type: 'PERCENT',
            base_item: 'PAYBACK',
            tier_list: [
                {
                    percent: 0.03,
                }
            ],
            shared: false,
            inactive: false
        },
        commission: false,
        syndication: true,
        default: true,
        inactive: false
    }
];