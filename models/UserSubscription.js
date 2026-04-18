const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    amountPaid: { type: Number, required: true },
    paymentId: { type: String, default: '' },
    purchasedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
