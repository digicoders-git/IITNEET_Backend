const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const {
    getTutorListings, getTutorProfile, getCoachingListings,
    getCoachingProfile, updateMyProfile, getMyProfile, getFeaturedTutors
} = require('../controllers/profileController');
const Review = require('../models/Review');
const ContactUnlock = require('../models/ContactUnlock');

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${req.user._id}_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'));
    }
});

router.get('/featured', getFeaturedTutors);
router.get('/tutors', getTutorListings);
router.get('/tutor/:userId', (req, res, next) => {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET, async (err, decoded) => {
            if (!err) req.user = await User.findById(decoded.id).select('-password');
            next();
        });
    } else {
        next();
    }
}, getTutorProfile);
router.get('/coachings', getCoachingListings);
router.get('/coaching/:userId', getCoachingProfile);
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);

// Photo upload
router.post('/upload-photo', protect, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const Profile = require('../models/Profile');
        const imageUrl = `/uploads/${req.file.filename}`;
        await Profile.findOneAndUpdate(
            { user: req.user._id },
            { $set: { profileImage: imageUrl } },
            { upsert: true, new: true }
        );
        res.json({ imageUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Tutor stats
router.get('/my-stats', protect, async (req, res) => {
    try {
        const Profile = require('../models/Profile');
        const profile = await Profile.findOne({ user: req.user._id });
        const reviews = await Review.find({ tutor: req.user._id });
        const unlocks = await ContactUnlock.find({ tutor: req.user._id });
        const avgRating = reviews.length
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;
        res.json({
            profileViews: profile?.profileViews || 0,
            totalReviews: reviews.length,
            avgRating: parseFloat(avgRating),
            totalUnlocks: unlocks.length,
            subjects: profile?.subjects || [],
            fees: profile?.fees || 0,
            experience: profile?.experience || 0,
            location: profile?.location || '',
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
