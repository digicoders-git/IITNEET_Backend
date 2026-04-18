const express = require('express');
const router = express.Router();
const { getUsers, updateApproval, getTutors } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin'), getUsers);
router.put('/:id/approve', protect, authorize('admin'), updateApproval);
router.get('/public/tutors', getTutors);

module.exports = router;
