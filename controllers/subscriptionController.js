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
        const { name, price, duration, features, forRole, isDefault } = req.body;
        if (!name || price === undefined || !duration) return res.status(400).json({ message: 'Name, price and duration required' });
        if (isDefault) await SubscriptionPlan.updateMany({}, { isDefault: false });
        const plan = await SubscriptionPlan.create({ name, price, duration, features, forRole, isDefault: !!isDefault });
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
        if (req.body.isDefault) await SubscriptionPlan.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
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

// ── ADMIN: Get all subscriptions
exports.getAllSubscriptions = async (req, res) => {
    try {
        const subs = await UserSubscription.find()
            .populate('user', 'name email role')
            .populate('plan', 'name price duration')
            .sort({ purchasedAt: -1 });
        res.json(subs);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── PUBLIC: Get active plans
exports.getActivePlans = async (req, res) => {
    try {
        const role = req.user?.role;
        const filter = { isActive: true };
        if (role) filter.$or = [{ forRole: role }, { forRole: 'both' }];
        const plans = await SubscriptionPlan.find(filter).sort({ price: 1 });
        res.json(plans);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── INTERNAL: Auto-assign default free plan on registration
exports.assignDefaultPlan = async (userId) => {
    try {
        const defaultPlan = await SubscriptionPlan.findOne({ isDefault: true, isActive: true });
        if (!defaultPlan) return;

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + defaultPlan.duration);

        await UserSubscription.create({
            user: userId,
            plan: defaultPlan._id,
            endDate,
            amountPaid: 0,
            paymentId: `free_default_${Date.now()}`
        });

        await User.findByIdAndUpdate(userId, {
            subscriptionStatus: 'active',
            subscriptionExpiry: endDate
        });
    } catch (err) {
        console.error('assignDefaultPlan error:', err.message);
    }
};

// ── USER: Purchase a plan via Razorpay order
exports.createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const order = await getRazorpay().orders.create({
            amount: plan.price * 100,
            currency: 'INR',
            receipt: `sub_${Date.now()}`,
            notes: { planId: planId.toString(), userId: req.user._id.toString() }
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            planName: plan.name
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── USER: Verify payment and activate subscription
exports.verifyPurchase = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature)
            return res.status(400).json({ message: 'Payment verification failed' });

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        await UserSubscription.updateMany({ user: req.user._id, status: 'active' }, { status: 'cancelled' });

        const sub = await UserSubscription.create({
            user: req.user._id,
            plan: planId,
            endDate,
            amountPaid: plan.price,
            paymentId: razorpay_payment_id
        });

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
            .populate('plan', 'name price duration features isDefault');
        res.json(sub);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

