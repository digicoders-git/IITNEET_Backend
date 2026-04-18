const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'tutor', 'coaching', 'student'], 
        default: 'student' 
    },
    isApproved: { type: Boolean, default: false }, // Only for tutors and coaching
    subscriptionStatus: {
        type: String,
        enum: ['none', 'pending', 'active', 'expired'],
        default: 'none'
    },
    subscriptionExpiry: { type: Date },
    phone: { type: String },
    showPhone: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Hash password
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
