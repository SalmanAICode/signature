const express = require('express');
const {
    getFormulas,
    getFormula,
    getFormulaList,
    createFormula,
    updateFormula,
    deleteFormula,
    calculateFormula
} = require('../controllers/formulaController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

// Some routes that only admins and funders can access
router.route('/')
    .get(authorize(PERMISSIONS.FORMULA.READ), getFormulas)
    .post(authorize(PERMISSIONS.FORMULA.CREATE), createFormula);

// For the login user
router.route('/list')
    .get(authorize(PERMISSIONS.FORMULA.READ), getFormulaList);

// Some Routes that only admins and funders can access
router.route('/:id')
    .get(authorize(PERMISSIONS.FORMULA.READ), getFormula)
    .put(authorize(PERMISSIONS.FORMULA.UPDATE), updateFormula)
    .delete(authorize(PERMISSIONS.FORMULA.DELETE), deleteFormula);

router.route('/:id/calculate')
    .get(authorize(PERMISSIONS.FORMULA.READ), calculateFormula);

module.exports = router; 