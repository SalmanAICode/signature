const express = require('express');
const {
    getStipulationTypes,
    createStipulationType,
    getStipulationTypesList,
    updateStipulationType,
    getStipulationTypeById,
    deleteStipulationType
} = require('../controllers/stipulationTypeController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.STIPULATION_TYPE.READ), getStipulationTypes)
    .post(authorize(PERMISSIONS.STIPULATION_TYPE.CREATE), createStipulationType);

router.route('/list')
    .get(authorize(PERMISSIONS.STIPULATION_TYPE.READ), getStipulationTypesList);

router.route('/:id')
    .get(authorize(PERMISSIONS.STIPULATION_TYPE.READ), getStipulationTypeById)
    .put(authorize(PERMISSIONS.STIPULATION_TYPE.UPDATE), updateStipulationType)
    .delete(authorize(PERMISSIONS.STIPULATION_TYPE.DELETE), deleteStipulationType);

module.exports = router;