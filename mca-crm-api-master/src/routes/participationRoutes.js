const express = require('express');
const {
    getParticipations,
    getParticipation,
    getParticipationList,
    createParticipation,
    updateParticipation,
} = require('../controllers/participationController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.PARTICIPATION.READ), getParticipations)
    .post(authorize(PERMISSIONS.PARTICIPATION.CREATE), createParticipation);

router.route('/list')
    .get(authorize(PERMISSIONS.PARTICIPATION.READ), getParticipationList);

router.route('/:id')
    .get(authorize(PERMISSIONS.PARTICIPATION.READ), getParticipation)
    .put(authorize(PERMISSIONS.PARTICIPATION.UPDATE), updateParticipation);

module.exports = router; 