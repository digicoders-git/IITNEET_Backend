const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createPlan, getPlans, updatePlan, deletePlan,
    getAllSubscriptions, getActivePlans, purchasePlan, getMySubscription
} = require('../controllers/subscriptionController');

// Admin routes
router.post('/plans', protect, authorize('admin'), createPlan);
router.get('/plans/all', protect, authorize('admin'), getPlans);
router.put('/plans/:id', protect, authorize('admin'), updatePlan);
router.delete('/plans/:id', protect, authorize('admin'), deletePlan);
router.get('/all', protect, authorize('admin'), getAllSubscriptions);

// Tutor/Coaching routes
router.get('/plans', protect, getActivePlans);
router.post('/purchase', protect, authorize('tutor', 'coaching'), purchasePlan);
router.get('/mine', protect, getMySubscription);

module.exports = router;
