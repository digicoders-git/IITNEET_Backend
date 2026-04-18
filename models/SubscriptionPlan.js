const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // in days
    features: [String],
    forRole: { type: String, enum: ['tutor', 'coaching', 'both'], default: 'both' },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false }, // auto-assigned on registration
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
