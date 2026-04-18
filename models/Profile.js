const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bio: { type: String },
    subjects: [String],
    experience: { type: Number },
    fees: { type: Number },
    ratings: { type: Number, default: 0 },
    profileImage: { type: String },
    
    // Coaching Specific
    courses: [String],
    facultyDetails: { type: String },
    location: { type: String },
    gallery: [String],

    // Stats
    profileViews: { type: Number, default: 0 },
    
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Profile', profileSchema);
