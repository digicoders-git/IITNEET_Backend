const Review = require('../models/Review');
const Profile = require('../models/Profile');

// POST /api/reviews/:tutorId
exports.addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating || !comment) return res.status(400).json({ message: 'Rating and comment required' });

        const existing = await Review.findOne({ tutor: req.params.tutorId, student: req.user._id });
        if (existing) return res.status(400).json({ message: 'You have already reviewed this tutor' });

        const review = await Review.create({
            tutor: req.params.tutorId,
            student: req.user._id,
            rating,
            comment
        });

        // Update average rating on profile
        const allReviews = await Review.find({ tutor: req.params.tutorId });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await Profile.findOneAndUpdate({ user: req.params.tutorId }, { ratings: parseFloat(avg.toFixed(1)) });

        const populated = await review.populate('student', 'name');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/reviews/:tutorId
exports.getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ tutor: req.params.tutorId })
            .populate('student', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
