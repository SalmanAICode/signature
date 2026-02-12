const express = require('express');
const {
    getMe,
    updateDetails,
    updatePassword,
    getBookkeepers,
    getBookkeeperList,
    getBookkeeper,
    createBookkeeper,
    updateBookkeeper,
    deleteBookkeeper
} = require('../controllers/bookkeeperController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PORTAL_TYPES } = require('../utils/constants');

// Protect all routes after this middleware
router.use(protect);
router.use(authorize(PORTAL_TYPES.ADMIN, PORTAL_TYPES.BOOKKEEPER));

// For the login bookkeeper
router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);

// For the bookkeeper portal
router
    .route('/')
    .get(getBookkeepers)
    .post(createBookkeeper);

router
    .route('/list')
    .get(getBookkeeperList);

router
    .route('/:id')
    .get(getBookkeeper)
    .put(updateBookkeeper)
    .delete(deleteBookkeeper);

module.exports = router;