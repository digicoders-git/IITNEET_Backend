const mongoose = require('mongoose');

const contactUnlockSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountPaid: { type: Number, default: 200 },
    paymentId: { type: String },
    unlockedAt: { type: Date, default: Date.now }
});

contactUnlockSchema.index({ student: 1, tutor: 1 }, { unique: true });

module.exports = mongoose.model('ContactUnlock', contactUnlockSchema);
