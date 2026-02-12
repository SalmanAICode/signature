// Define the default application statuses
const defaultApplicationStatuses = [
    {
        name: 'Submitted',
        bgcolor: '#3498db', // Blue
        idx: 0,
        initial: true,
        closed: false,
        system: true,
        inactive: false
    },
    {
        name: 'Approved',
        bgcolor: '#2ecc71', // Green
        idx: 1,
        initial: false,
        closed: true,
        system: true,
        inactive: false
    },
    {
        name: 'Declined',
        bgcolor: '#e74c3c', // Red
        idx: 2,
        initial: false,
        closed: true,
        system: true,
        inactive: false
    }
];

module.exports = {
    defaultApplicationStatuses
};
