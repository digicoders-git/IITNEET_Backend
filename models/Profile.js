const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bio: { type: String },
    subjects: [String],
    experience: { type: Number },
    fees: { type: Number },
    feesType: { type: String, enum: ['3days', '6days', 'discuss'], default: 'discuss' },
    ratings: { type: Number, default: 0 },
    profileImage: { type: String },

    // New fields from PDF
    age: { type: Number },
    sex: { type: String, enum: ['Male', 'Female', 'Other'] },
    teachingClass: { type: String },
    subjectType: { type: String, enum: ['all', 'choose'], default: 'choose' },
    competitiveExpert: { type: Boolean, default: false },
    expertSubject: { type: String },
    qualification: { type: String },
    availability: { type: String, enum: ['offline', 'both', 'online'], default: 'both' },
    schedule: { type: Object, default: {} },
    youtubeChannel: { type: String },
    pincode: { type: String },
    locality: { type: String },
    mobileVisibility: { type: String, enum: ['paid', 'all'], default: 'paid' },

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
