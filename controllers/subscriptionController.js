const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');
const User = require('../models/User');
const crypto = require('crypto');

const getRazorpay = () => {
    const Razorpay = require('razorpay');
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// ── ADMIN: Create plan
exports.createPlan = async (req, res) => {
    try {
        const { name, price, duration, features, forRole } = req.body;
        if (!name || !price || !duration) return res.status(400).json({ message: 'Name, price and duration required' });
        const plan = await SubscriptionPlan.create({ name, price, duration, features, forRole });
        res.status(201).json(plan);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── ADMIN: Get all plans
exports.getPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── ADMIN: Update plan
exports.updatePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── ADMIN: Delete plan
exports.deletePlan = async (req, res) => {
    try {
        await SubscriptionPlan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── ADMIN: Get all subscriptions (who bought what)
exports.getAllSubscriptions = async (req, res) => {
    try {
        const subs = await UserSubscription.find()
            .populate('user', 'name email role')
            .populate('plan', 'name price duration')
            .sort({ purchasedAt: -1 });
        res.json(subs);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── PUBLIC: Get active plans (for tutors/coaching to see)
exports.getActivePlans = async (req, res) => {
    try {
        const role = req.user?.role;
        const filter = { isActive: true };
        if (role) filter.$or = [{ forRole: role }, { forRole: 'both' }];
        const plans = await SubscriptionPlan.find(filter).sort({ price: 1 });
        res.json(plans);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── USER: Purchase a plan (simulated)
exports.purchasePlan = async (req, res) => {
    try {
        const { planId, paymentId } = req.body;
        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        // Cancel existing active subscription
        await UserSubscription.updateMany(
            { user: req.user._id, status: 'active' },
            { status: 'cancelled' }
        );

        const sub = await UserSubscription.create({
            user: req.user._id,
            plan: planId,
            endDate,
            amountPaid: plan.price,
            paymentId: paymentId || `sim_${Date.now()}`
        });

        // Update user subscriptionStatus
        await User.findByIdAndUpdate(req.user._id, {
            subscriptionStatus: 'active',
            subscriptionExpiry: endDate
        });

        const populated = await sub.populate('plan', 'name price duration');
        res.status(201).json({ message: 'Subscription activated!', subscription: populated });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── USER: Get my subscription
exports.getMySubscription = async (req, res) => {
    try {
        const sub = await UserSubscription.findOne({ user: req.user._id, status: 'active' })
            .populate('plan', 'name price duration features');
        res.json(sub);
    } catch (err) { res.status(500).json({ message: err.message }); }
};
