const ContactUnlock = require('../models/ContactUnlock');
const User = require('../models/User');
const crypto = require('crypto');

const getRazorpay = () => {
    const Razorpay = require('razorpay');
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// POST /api/payment/create-order
exports.createOrder = async (req, res) => {
    try {
        const { tutorId } = req.body;

        const tutor = await User.findOne({ _id: tutorId, role: 'tutor', isApproved: true });
        if (!tutor) return res.status(404).json({ message: 'Tutor not found' });

        const existing = await ContactUnlock.findOne({ student: req.user._id, tutor: tutorId });
        if (existing) return res.status(400).json({ message: 'Contact already unlocked' });

        const order = await getRazorpay().orders.create({
            amount: 200 * 100,
            currency: 'INR',
            receipt: `unlock_${Date.now()}`,
            notes: { tutorId: tutorId.toString(), studentId: req.user._id.toString() }
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            tutorName: tutor.name,
        });
    } catch (error) {
        console.error('Razorpay createOrder error:', error);
        res.status(500).json({ message: error.error?.description || error.message });
    }
};

// POST /api/payment/verify-unlock
exports.verifyAndUnlock = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tutorId } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed' });
        }

        const tutor = await User.findById(tutorId);
        if (!tutor) return res.status(404).json({ message: 'Tutor not found' });

        const existing = await ContactUnlock.findOne({ student: req.user._id, tutor: tutorId });
        if (existing) return res.status(400).json({ message: 'Contact already unlocked' });

        await ContactUnlock.create({
            student: req.user._id,
            tutor: tutorId,
            amountPaid: 200,
            paymentId: razorpay_payment_id
        });

        res.json({ message: 'Contact unlocked successfully', phone: tutor.phone });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/payment/unlocked
exports.getUnlockedContacts = async (req, res) => {
    try {
        const unlocks = await ContactUnlock.find({ student: req.user._id })
            .populate('tutor', 'name phone');
        res.json(unlocks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/payment/contact-form
exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, phone, message, subject } = req.body;
        if (!name || !email || !message) return res.status(400).json({ message: 'Name, email and message required' });
        console.log('Contact form submission:', { name, email, phone, message, subject });
        res.json({ message: 'Message received. We will get back to you soon!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
