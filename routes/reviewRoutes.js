const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { addReview, getReviews } = require('../controllers/reviewController');

router.get('/:tutorId', getReviews);
router.post('/:tutorId', protect, authorize('student'), addReview);

module.exports = router;
