module.exports = [
    {
        idx: 0,
        bgcolor: '#B31A8D',
        name: 'Submitted',
        initial: true,
        approved: false,
        closed: false,
        system: true,
        inactive: false
    },
    {
        idx: 1,
        bgcolor: '#2B79C2',
        name: 'Reviewing',
        initial: false,
        approved: false,
        closed: false,
        system: true,
        inactive: false
    },
    {
        idx: 2,
        bgcolor: '#1AB394',
        name: 'Offer Sent',
        initial: false,
        approved: true,
        closed: false,
        system: true,
        inactive: false
    },
    {
        idx: 3,
        bgcolor: '#F8AC59',
        name: 'Accepted',
        initial: false,
        approved: true,
        closed: true,
        system: true,
        inactive: false
    },
    {
        idx: 4,
        bgcolor: '#D1DADE',
        name: 'Declined',
        initial: false,
        approved: false,
        closed: true,
        system: true,
        inactive: false
    }
];
