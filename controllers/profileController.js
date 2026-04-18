const User = require('../models/User');
const Profile = require('../models/Profile');
const Review = require('../models/Review');
const ContactUnlock = require('../models/ContactUnlock');

// GET /api/profiles/tutors - public tutor listing with filters
exports.getTutorListings = async (req, res) => {
    try {
        const { subject, location, experience, search, page = 1, limit = 12 } = req.query;

        const profileFilter = {};
        if (subject) profileFilter.subjects = { $regex: subject, $options: 'i' };
        if (location) profileFilter.location = { $regex: location, $options: 'i' };
        if (experience) profileFilter.experience = { $gte: parseInt(experience) };

        let profiles = await Profile.find(profileFilter)
            .populate({
                path: 'user',
                match: { role: 'tutor', isApproved: true, subscriptionStatus: 'active' },
                select: 'name email subscriptionStatus'
            })
            .lean();

        profiles = profiles.filter(p => p.user !== null);

        if (search) {
            const s = search.toLowerCase();
            profiles = profiles.filter(p =>
                p.user.name.toLowerCase().includes(s) ||
                (p.subjects && p.subjects.some(sub => sub.toLowerCase().includes(s))) ||
                (p.bio && p.bio.toLowerCase().includes(s))
            );
        }

        const total = profiles.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginated = profiles.slice(skip, skip + parseInt(limit));

        res.json({ tutors: paginated, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/profiles/tutor/:userId - public tutor profile
exports.getTutorProfile = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.userId, role: 'tutor', isApproved: true, subscriptionStatus: 'active' })
            .select('-password');
        if (!user) return res.status(404).json({ message: 'Tutor not found or subscription inactive' });

        const profile = await Profile.findOne({ user: req.params.userId });
        const reviews = await Review.find({ tutor: req.params.userId })
            .populate('student', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        const avgRating = reviews.length
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        // Check if requesting user has unlocked contact
        let contactUnlocked = false;
        if (req.user) {
            const unlock = await ContactUnlock.findOne({ student: req.user._id, tutor: req.params.userId });
            contactUnlocked = !!unlock;
        }

        const phone = (user.showPhone || contactUnlocked) ? user.phone : null;

        res.json({ user: { ...user.toObject(), phone }, profile, reviews, avgRating, contactUnlocked });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/profiles/coachings - public coaching listing
exports.getCoachingListings = async (req, res) => {
    try {
        const { location, course, search, page = 1, limit = 12 } = req.query;

        const profileFilter = {};
        if (location) profileFilter.location = { $regex: location, $options: 'i' };
        if (course) profileFilter.courses = { $regex: course, $options: 'i' };

        let profiles = await Profile.find(profileFilter)
            .populate({
                path: 'user',
                match: { role: 'coaching', isApproved: true },
                select: 'name subscriptionStatus'
            })
            .lean();

        profiles = profiles.filter(p => p.user !== null);

        if (search) {
            const s = search.toLowerCase();
            profiles = profiles.filter(p =>
                p.user.name.toLowerCase().includes(s) ||
                (p.location && p.location.toLowerCase().includes(s)) ||
                (p.courses && p.courses.some(c => c.toLowerCase().includes(s)))
            );
        }

        const total = profiles.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginated = profiles.slice(skip, skip + parseInt(limit));

        res.json({ coachings: paginated, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/profiles/coaching/:userId - public coaching profile
exports.getCoachingProfile = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.userId, role: 'coaching', isApproved: true })
            .select('-password');
        if (!user) return res.status(404).json({ message: 'Coaching not found' });

        const profile = await Profile.findOne({ user: req.params.userId });
        res.json({ user, profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/profiles/me - tutor/coaching update their own profile
exports.updateMyProfile = async (req, res) => {
    try {
        const { bio, subjects, experience, fees, location, courses, facultyDetails, phone, showPhone } = req.body;

        const updateData = { updatedAt: Date.now() };
        if (bio !== undefined) updateData.bio = bio;
        if (subjects !== undefined) updateData.subjects = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
        if (experience !== undefined) updateData.experience = experience;
        if (fees !== undefined) updateData.fees = fees;
        if (location !== undefined) updateData.location = location;
        if (courses !== undefined) updateData.courses = Array.isArray(courses) ? courses : courses.split(',').map(c => c.trim());
        if (facultyDetails !== undefined) updateData.facultyDetails = facultyDetails;

        const profile = await Profile.findOneAndUpdate(
            { user: req.user._id },
            { $set: updateData },
            { new: true, upsert: true }
        );

        if (phone !== undefined || showPhone !== undefined) {
            const userUpdate = {};
            if (phone !== undefined) userUpdate.phone = phone;
            if (showPhone !== undefined) userUpdate.showPhone = showPhone;
            await User.findByIdAndUpdate(req.user._id, userUpdate);
        }

        res.json({ message: 'Profile updated', profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/profiles/me - get own profile
exports.getMyProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id });
        const user = await User.findById(req.user._id).select('-password');
        res.json({ profile, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/profiles/featured - featured tutors for home page
exports.getFeaturedTutors = async (req, res) => {
    try {
        const profiles = await Profile.find({})
            .populate({
                path: 'user',
                match: { role: 'tutor', isApproved: true, subscriptionStatus: { $in: ['active'] } },
                select: 'name subscriptionStatus'
            })
            .sort({ ratings: -1 })
            .limit(6)
            .lean();

        const featured = profiles.filter(p => p.user !== null);

        // If not enough subscribed tutors, fill with any approved tutors
        if (featured.length < 6) {
            const more = await Profile.find({})
                .populate({
                    path: 'user',
                    match: { role: 'tutor', isApproved: true },
                    select: 'name subscriptionStatus'
                })
                .sort({ ratings: -1 })
                .limit(6)
                .lean();
            const moreFiltered = more.filter(p => p.user !== null);
            const ids = new Set(featured.map(p => p._id.toString()));
            for (const p of moreFiltered) {
                if (!ids.has(p._id.toString())) featured.push(p);
                if (featured.length >= 6) break;
            }
        }

        res.json(featured.slice(0, 6));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
