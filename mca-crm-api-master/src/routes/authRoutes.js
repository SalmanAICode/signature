const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');

const { 
    precheckLogin, 
    loginAdmin,
    loginBookkeeper,
    loginFunder,
    loginSyndicator,
    loginISO,
    loginMerchant,
    precheckLogout, 
    logoutAdmin,
    logoutBookkeeper,
    logoutFunder,
    logoutSyndicator,
    logoutISO,
    logoutMerchant,
    refreshAccessToken,
    checkPermissions
} = require('../controllers/authController');


router.post('/login/admin', precheckLogin(loginAdmin));
router.post('/login/bookkeeper', precheckLogin(loginBookkeeper));
router.post('/login/funder', precheckLogin(loginFunder));
router.post('/login/syndicator', precheckLogin(loginSyndicator));
router.post('/login/iso', precheckLogin(loginISO));
router.post('/login/merchant', precheckLogin(loginMerchant));
router.post('/refresh', refreshAccessToken);

router.use(protect);

router.post('/check-permissions', checkPermissions);

router.post('/logout/admin', precheckLogout(logoutAdmin));
router.post('/logout/bookkeeper', precheckLogout(logoutBookkeeper));
router.post('/logout/funder', precheckLogout(logoutFunder));
router.post('/logout/syndicator', precheckLogout(logoutSyndicator));
router.post('/logout/iso', precheckLogout(logoutISO));
router.post('/logout/merchant', precheckLogout(logoutMerchant));

module.exports = router;
