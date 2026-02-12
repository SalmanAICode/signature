module.exports = [
    {
        name: 'Commission',
        formula: {
            name: 'Commission Formula',
            calculate_type: 'PERCENT',
            base_item: 'FUND',
            tier_list: [
                {
                    percent: 0.1,
                }
            ],
            shared: false,
            inactive: false
        },
        commission: true,
        syndication: true,
        default: true,
        inactive: false
    }
];