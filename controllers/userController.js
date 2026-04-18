const User = require('../models/User');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateApproval = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isApproved = req.body.isApproved;
            await user.save();
            res.json({ message: `User ${user.isApproved ? 'approved' : 'approval revoked'}` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTutors = async (req, res) => {
    try {
        const tutors = await User.find({ role: 'tutor', isApproved: true }).select('-password');
        res.json(tutors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
