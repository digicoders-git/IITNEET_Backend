const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Profile = require('./models/Profile');
const Review = require('./models/Review');

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Clear existing data
        await User.deleteMany({});
        await Profile.deleteMany({});
        await Review.deleteMany({});
        console.log('Cleared existing data...');

        // ── ADMIN ──
        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@iitneet.com',
            password: 'admin123',
            role: 'admin',
            isApproved: true,
            subscriptionStatus: 'active'
        });

        // ── DEFAULT FREE PLAN ──
        const SubscriptionPlan = require('./models/SubscriptionPlan');
        const UserSubscription = require('./models/UserSubscription');
        await SubscriptionPlan.deleteMany({});
        await UserSubscription.deleteMany({});
        const defaultPlan = await SubscriptionPlan.create({
            name: 'Free Starter Plan',
            price: 0,
            duration: 365,
            features: ['Listed on platform', 'Contact unlock enabled', 'Basic profile stats', '1 Year validity'],
            forRole: 'both',
            isActive: true,
            isDefault: true
        });
        console.log('Created default free plan (1 year)...');

        // ── TUTORS ──
        const tutorData = [
            {
                user: { name: 'Dr. Rajesh Sharma', email: 'rajesh@iitneet.com', phone: '9876543210', showPhone: false, subscriptionStatus: 'none' },
                profile: { bio: 'IIT Delhi alumnus with 12+ years of experience in IIT-JEE Physics. Taught 500+ students, 80% cleared JEE Mains. Specialized in Mechanics, Electrostatics and Modern Physics.', subjects: ['Physics', 'Mathematics'], experience: 12, fees: 2000, location: 'Kota, Rajasthan', ratings: 4.9 }
            },
            {
                user: { name: 'Priya Verma', email: 'priya@iitneet.com', phone: '9876543211', showPhone: false, subscriptionStatus: 'none' },
                profile: { bio: 'MBBS from AIIMS Delhi. Expert NEET Biology tutor with 8 years experience. My students consistently score 350+ in Biology. Specialization in Genetics, Human Physiology and Plant Biology.', subjects: ['Biology', 'Chemistry'], experience: 8, fees: 1500, location: 'Delhi', ratings: 4.7 }
            },
            {
                user: { name: 'Amit Khanna', email: 'amit@iitneet.com', phone: '9876543212', showPhone: true, subscriptionStatus: 'none' },
                profile: { bio: 'M.Sc Chemistry from IIT Bombay. 10 years of teaching Organic and Physical Chemistry for JEE and NEET. Known for simplifying complex reaction mechanisms.', subjects: ['Chemistry', 'Physics'], experience: 10, fees: 1800, location: 'Mumbai', ratings: 4.8 }
            },
            {
                user: { name: 'Sunita Rao', email: 'sunita@iitneet.com', phone: '9876543213', showPhone: false, subscriptionStatus: 'none' },
                profile: { bio: 'B.Tech from NIT Warangal. Mathematics specialist for JEE with 6 years experience. Expert in Calculus, Coordinate Geometry and Algebra. Online and offline classes available.', subjects: ['Mathematics', 'Physics'], experience: 6, fees: 1200, location: 'Hyderabad', ratings: 4.6 }
            },
            {
                user: { name: 'Vikram Singh', email: 'vikram@iitneet.com', phone: '9876543214', showPhone: false, subscriptionStatus: 'none' },
                profile: { bio: 'Senior faculty at a leading Kota coaching. 15 years of NEET Biology and Chemistry teaching. 200+ students in MBBS colleges including AIIMS. Batch and individual classes.', subjects: ['Biology', 'Chemistry'], experience: 15, fees: 2500, location: 'Jaipur', ratings: 4.9 }
            },
            {
                user: { name: 'Neha Gupta', email: 'neha@iitneet.com', phone: '9876543215', showPhone: true, subscriptionStatus: 'none' },
                profile: { bio: 'M.Sc Mathematics from Delhi University. 5 years of JEE Maths coaching. Friendly teaching style with focus on concept clarity. Flexible timings for working students.', subjects: ['Mathematics'], experience: 5, fees: 1000, location: 'Pune', ratings: 4.5 }
            },
            {
                user: { name: 'Dr. Suresh Nair', email: 'suresh@iitneet.com', phone: '9876543216', showPhone: false, subscriptionStatus: 'none' },
                profile: { bio: 'PhD Physics from IISc Bangalore. 14 years of JEE Advanced coaching. Specializes in Optics, Waves and Thermodynamics. Author of 2 reference books for JEE Physics.', subjects: ['Physics'], experience: 14, fees: 3000, location: 'Bangalore', ratings: 4.9 }
            },
            {
                user: { name: 'Kavita Joshi', email: 'kavita@iitneet.com', phone: '9876543217', showPhone: false, subscriptionStatus: 'none' },
                profile: { bio: 'NEET qualified doctor turned educator. 7 years of NEET coaching experience. Specializes in Inorganic Chemistry and Zoology. Online classes with recorded sessions.', subjects: ['Chemistry', 'Biology'], experience: 7, fees: 1400, location: 'Chennai', ratings: 4.6 }
            },
        ];

        const tutors = [];
        for (const t of tutorData) {
            const u = await User.create({ ...t.user, password: 'tutor123', role: 'tutor', isApproved: true });
            const p = await Profile.create({ user: u._id, ...t.profile });
            // Assign default free plan
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + defaultPlan.duration);
            await UserSubscription.create({ user: u._id, plan: defaultPlan._id, endDate, amountPaid: 0, paymentId: `free_seed_${Date.now()}` });
            await User.findByIdAndUpdate(u._id, { subscriptionStatus: 'active', subscriptionExpiry: endDate });
            tutors.push({ user: u, profile: p });
        }
        console.log(`Created ${tutors.length} tutors...`);

        // ── COACHINGS ──
        const coachingData = [
            {
                user: { name: 'Allen Career Institute', email: 'allen@iitneet.com', phone: '9800000001', subscriptionStatus: 'active' },
                profile: { bio: 'One of India\'s premier coaching institutes for IIT-JEE and NEET. 30+ years of excellence. 10,000+ selections in IITs and medical colleges annually.', courses: ['JEE Mains', 'JEE Advanced', 'NEET UG', 'Foundation Class 9-10'], location: 'Kota, Rajasthan', facultyDetails: '200+ expert faculty including IIT and AIIMS alumni. Average experience 10+ years.', ratings: 4.8 }
            },
            {
                user: { name: 'Aakash Institute', email: 'aakash@iitneet.com', phone: '9800000002', subscriptionStatus: 'active' },
                profile: { bio: 'Leading medical and engineering entrance coaching with 35+ years of experience. Pan-India presence with 200+ centers. Trusted by millions of students.', courses: ['NEET UG', 'JEE Mains', 'JEE Advanced', 'AIIMS Prep'], location: 'Delhi', facultyDetails: '150+ dedicated faculty. Specialized NEET and JEE divisions with separate expert teams.', ratings: 4.7 }
            },
            {
                user: { name: 'Resonance Eduventures', email: 'resonance@iitneet.com', phone: '9800000003', subscriptionStatus: 'none' },
                profile: { bio: 'Top-ranked coaching for IIT-JEE with consistent results. Known for rigorous test series and study material. Classroom and distance learning programs available.', courses: ['JEE Mains', 'JEE Advanced', 'NEET', 'KVPY'], location: 'Kota, Rajasthan', facultyDetails: '100+ faculty members. Regular doubt sessions and mentorship programs.', ratings: 4.6 }
            },
            {
                user: { name: 'FIITJEE Delhi', email: 'fiitjee@iitneet.com', phone: '9800000004', subscriptionStatus: 'active' },
                profile: { bio: 'Pioneer in IIT-JEE coaching since 1992. Unique teaching methodology focused on concept building. Produced thousands of IITians over the years.', courses: ['JEE Mains', 'JEE Advanced', 'Foundation Program'], location: 'Delhi', facultyDetails: 'Highly qualified faculty with IIT background. Regular performance tracking and counseling.', ratings: 4.5 }
            },
            {
                user: { name: 'Narayana Academy', email: 'narayana@iitneet.com', phone: '9800000005', subscriptionStatus: 'none' },
                profile: { bio: 'South India\'s largest coaching chain for medical and engineering entrance exams. Affordable fees with excellent results. Hostel facility available.', courses: ['NEET UG', 'JEE Mains', 'JEE Advanced', 'CET'], location: 'Hyderabad', facultyDetails: '80+ experienced faculty. Special crash courses and revision batches available.', ratings: 4.4 }
            },
        ];

        const coachings = [];
        for (const c of coachingData) {
            const u = await User.create({ ...c.user, password: 'coaching123', role: 'coaching', isApproved: true });
            const p = await Profile.create({ user: u._id, ...c.profile });
            coachings.push({ user: u, profile: p });
        }
        console.log(`Created ${coachings.length} coaching institutes...`);

        // ── STUDENTS ──
        const studentData = [
            { name: 'Aryan Mehta', email: 'aryan@student.com' },
            { name: 'Sneha Patel', email: 'sneha@student.com' },
            { name: 'Rohan Gupta', email: 'rohan@student.com' },
            { name: 'Ananya Singh', email: 'ananya@student.com' },
        ];

        const students = [];
        for (const s of studentData) {
            const u = await User.create({ ...s, password: 'student123', role: 'student', isApproved: true });
            students.push(u);
        }
        console.log(`Created ${students.length} students...`);

        // ── REVIEWS ──
        const reviewData = [
            { tutor: tutors[0].user._id, student: students[0]._id, rating: 5, comment: 'Dr. Rajesh sir is an amazing Physics teacher. His way of explaining Mechanics is unmatched. Cleared JEE Advanced because of him!' },
            { tutor: tutors[0].user._id, student: students[1]._id, rating: 5, comment: 'Best Physics tutor in Kota. Very patient and explains every concept from basics. Highly recommended!' },
            { tutor: tutors[1].user._id, student: students[1]._id, rating: 5, comment: 'Priya ma\'am\'s Biology teaching is exceptional. Got 355/360 in Biology in NEET. Forever grateful!' },
            { tutor: tutors[1].user._id, student: students[2]._id, rating: 4, comment: 'Very knowledgeable and approachable. Makes complex topics like Genetics easy to understand.' },
            { tutor: tutors[2].user._id, student: students[0]._id, rating: 5, comment: 'Amit sir\'s Organic Chemistry notes are gold. Cleared all my doubts about reaction mechanisms.' },
            { tutor: tutors[2].user._id, student: students[3]._id, rating: 4, comment: 'Great teacher. Physical Chemistry explanations are very clear. Would recommend to JEE aspirants.' },
            { tutor: tutors[3].user._id, student: students[2]._id, rating: 5, comment: 'Sunita ma\'am made Calculus so easy! Her shortcut methods saved a lot of time in the exam.' },
            { tutor: tutors[4].user._id, student: students[0]._id, rating: 5, comment: 'Vikram sir has 15 years of experience and it shows. His NEET Biology strategy is perfect.' },
            { tutor: tutors[5].user._id, student: students[3]._id, rating: 4, comment: 'Neha ma\'am is very friendly and explains concepts clearly. Good for beginners in JEE Maths.' },
            { tutor: tutors[6].user._id, student: students[1]._id, rating: 5, comment: 'Dr. Suresh sir is a legend in JEE Physics. His book on Optics is a must-read for JEE Advanced.' },
        ];

        for (const r of reviewData) {
            await Review.create(r);
        }

        // Update ratings on profiles
        for (const t of tutors) {
            const reviews = await Review.find({ tutor: t.user._id });
            if (reviews.length > 0) {
                const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                await Profile.findOneAndUpdate({ user: t.user._id }, { ratings: parseFloat(avg.toFixed(1)) });
            }
        }
        console.log(`Created ${reviewData.length} reviews...`);

        console.log('\n✅ Database seeded successfully!\n');
        console.log('─────────────────────────────────');
        console.log('Admin:    admin@iitneet.com   / admin123');
        console.log('Tutor:    rajesh@iitneet.com  / tutor123');
        console.log('Coaching: allen@iitneet.com   / coaching123');
        console.log('Student:  aryan@student.com   / student123');
        console.log('─────────────────────────────────\n');

        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err.message);
        process.exit(1);
    }
};

seed();
