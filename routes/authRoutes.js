const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe, changePassword, createAdmin, createAdminByAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);
router.post('/create-admin', createAdmin);
router.post('/admin/create-admin', protect, authorize('admin'), createAdminByAdmin);

module.exports = router;
