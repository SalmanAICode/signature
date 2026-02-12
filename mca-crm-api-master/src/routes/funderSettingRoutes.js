const express = require('express');
const {
    getFunderSettings,
    createFunderSetting,
    getFunderSettingsList,
    updateFunderSetting,
    getFunderSettingById,
    generateSequenceId
} = require('../controllers/funderSettingController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.FUNDER_SETTING.READ), getFunderSettings)
    .post(authorize(PERMISSIONS.FUNDER_SETTING.CREATE), createFunderSetting);

router.route('/list')
    .get(authorize(PERMISSIONS.FUNDER_SETTING.READ), getFunderSettingsList);

router.route('/generate-sequence-id')
    .get(authorize(PERMISSIONS.FUNDER_SETTING.CREATE), generateSequenceId);

router.route('/:id')
    .get(authorize(PERMISSIONS.FUNDER_SETTING.READ), getFunderSettingById)
    .put(authorize(PERMISSIONS.FUNDER_SETTING.UPDATE), updateFunderSetting);

module.exports = router;
