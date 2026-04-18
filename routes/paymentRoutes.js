const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createOrder, verifyAndUnlock, getUnlockedContacts, submitContactForm } = require('../controllers/paymentController');

router.post('/create-order', protect, authorize('student'), createOrder);
router.post('/verify-unlock', protect, authorize('student'), verifyAndUnlock);
router.get('/unlocked', protect, authorize('student'), getUnlockedContacts);
router.post('/contact-form', submitContactForm);

module.exports = router;
