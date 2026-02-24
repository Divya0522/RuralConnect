require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Case = require('./models/Case');
const DoctorReport = require('./models/DoctorReport');
const Village = require('./models/Village');
const Notification = require('./models/Notification');
const Diagnosis = require('./models/Diagnosis');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Patient.deleteMany({}),
            Case.deleteMany({}),
            DoctorReport.deleteMany({}),
            Village.deleteMany({}),
            Notification.deleteMany({}),
            Diagnosis.deleteMany({}),
        ]);
        console.log('🗑️  Cleared existing data');

        // Create Villages
        const villages = await Village.insertMany([
            { name: 'Rampur', district: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001', population: 3200, households: 640 },
            { name: 'Sundarpur', district: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', population: 2100, households: 420 },
            { name: 'Nandgaon', district: 'Agra', state: 'Uttar Pradesh', pincode: '282001', population: 1800, households: 360 },
        ]);
        console.log(`🏘️  Created ${villages.length} villages`);

        // Create Users (all roles)
        const usersData = [
            { name: 'Admin User', email: 'admin@rhc.com', password: 'Admin@123', role: 'admin', phone: '9000000001' },
            { name: 'Dr. Priya Sharma', email: 'senior.doctor@rhc.com', password: 'Doctor@123', role: 'senior_doctor', phone: '9000000002', qualification: 'MBBS, MD Medicine', village: villages[0]._id },
            { name: 'Dr. Rahul Verma', email: 'junior.doctor@rhc.com', password: 'Doctor@123', role: 'junior_doctor', phone: '9000000003', qualification: 'MBBS', village: villages[0]._id },
            { name: 'Sonal Gupta', email: 'helpline@rhc.com', password: 'Help@123', role: 'helpline_operator', phone: '9000000004' },
            { name: 'Raju Yadav', email: 'panchayat@rhc.com', password: 'Panch@123', role: 'panchayat_officer', phone: '9000000005', village: villages[0]._id },
            { name: 'Meena Devi', email: 'patient@rhc.com', password: 'Patient@123', role: 'patient', phone: '9000000006', village: villages[0]._id },
            { name: 'Dr. Anjali Singh', email: 'junior.doctor2@rhc.com', password: 'Doctor@123', role: 'junior_doctor', phone: '9000000007', qualification: 'MBBS', village: villages[1]._id },
        ];

        const users = await User.insertMany(usersData.map(u => ({ ...u })));
        // Manually hash passwords since insertMany bypasses pre-save hooks
        for (let i = 0; i < users.length; i++) {
            const hashed = await bcrypt.hash(usersData[i].password, 12);
            await User.findByIdAndUpdate(users[i]._id, { password: hashed });
        }
        console.log(`👤 Created ${users.length} users`);

        const [admin, seniorDoctor, juniorDoctor, helpline, panchayat, patientUser] = users;

        // Update village officers
        await Village.findByIdAndUpdate(villages[0]._id, {
            panchayatOfficer: panchayat._id,
            assignedDoctors: [seniorDoctor._id, juniorDoctor._id],
        });

        // Create Patients
        const patients = await Patient.insertMany([
            {
                user: patientUser._id,
                name: 'Meena Devi',
                age: 42,
                gender: 'female',
                phone: '9000000006',
                address: 'House No. 12, Main Road, Rampur',
                village: villages[0]._id,
                bloodGroup: 'B+',
                chronicConditions: ['Hypertension'],
                registeredBy: helpline._id,
            },
            {
                name: 'Suresh Kumar',
                age: 65,
                gender: 'male',
                phone: '9111111111',
                address: 'Near Temple, Rampur',
                village: villages[0]._id,
                bloodGroup: 'O+',
                allergies: ['Penicillin'],
                registeredBy: helpline._id,
            },
            {
                name: 'Radha Bai',
                age: 28,
                gender: 'female',
                phone: '9222222222',
                address: 'Sundarpur village',
                village: villages[1]._id,
                bloodGroup: 'A+',
                registeredBy: helpline._id,
            },
        ]);
        console.log(`🤒 Created ${patients.length} patients`);

        // Create Cases - create one-at-a-time so caseId counter increments correctly
        const casesData = [
            {
                patient: patients[0]._id,
                reportedBy: patientUser._id,
                village: villages[0]._id,
                chiefComplaint: 'Severe headache and dizziness for 3 days',
                symptoms: ['headache', 'dizziness', 'nausea'],
                severity: 'high',
                status: 'reviewed',
                assignedTo: juniorDoctor._id,
                assignedBy: helpline._id,
                assignedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                seniorReviewRequested: true,
                seniorReviewedBy: seniorDoctor._id,
                statusHistory: [
                    { status: 'submitted', changedBy: patientUser._id },
                    { status: 'assigned', changedBy: helpline._id },
                    { status: 'visited', changedBy: juniorDoctor._id },
                    { status: 'reviewed', changedBy: seniorDoctor._id },
                ],
            },
            {
                patient: patients[1]._id,
                reportedBy: helpline._id,
                village: villages[0]._id,
                chiefComplaint: 'Persistent fever and cough for 5 days',
                symptoms: ['fever', 'cough', 'fatigue', 'body ache'],
                severity: 'medium',
                status: 'assigned',
                assignedTo: juniorDoctor._id,
                assignedBy: helpline._id,
                assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                statusHistory: [
                    { status: 'submitted', changedBy: helpline._id },
                    { status: 'assigned', changedBy: helpline._id },
                ],
            },
            {
                patient: patients[2]._id,
                reportedBy: helpline._id,
                village: villages[1]._id,
                chiefComplaint: 'Abdominal pain and vomiting',
                symptoms: ['stomach pain', 'vomiting', 'loose stools'],
                severity: 'medium',
                status: 'submitted',
                statusHistory: [{ status: 'submitted', changedBy: helpline._id }],
            },
            {
                patient: patients[0]._id,
                reportedBy: patientUser._id,
                village: villages[0]._id,
                chiefComplaint: 'Routine blood pressure checkup',
                symptoms: ['high BP', 'mild headache'],
                severity: 'low',
                status: 'treated',
                assignedTo: juniorDoctor._id,
                statusHistory: [
                    { status: 'submitted', changedBy: patientUser._id },
                    { status: 'assigned', changedBy: helpline._id },
                    { status: 'visited', changedBy: juniorDoctor._id },
                    { status: 'reviewed', changedBy: seniorDoctor._id },
                    { status: 'treated', changedBy: juniorDoctor._id },
                ],
            },
        ];
        const cases = [];
        for (const caseData of casesData) {
            const c = await Case.create(caseData);
            cases.push(c);
        }
        console.log(`📋 Created ${cases.length} cases`);

        // Create Doctor Reports
        await DoctorReport.insertMany([
            {
                case: cases[0]._id,
                doctor: juniorDoctor._id,
                patient: patients[0]._id,
                visitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                vitals: { temperature: 37.8, bloodPressure: '150/95', pulse: 88, oxygenSaturation: 98 },
                clinicalNotes: 'Patient presents with hypertensive urgency. BP elevated significantly.',
                provisionalDiagnosis: 'Hypertensive urgency',
                seniorReviewRequested: true,
                seniorReviewReason: 'BP too high, needs senior opinion',
                medicinesPrescribed: [{ name: 'Amlodipine', dosage: '5mg', duration: '30 days', instructions: 'Once daily morning' }],
            },
            {
                case: cases[3]._id,
                doctor: juniorDoctor._id,
                patient: patients[0]._id,
                visitDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                vitals: { temperature: 37.0, bloodPressure: '140/90', pulse: 78, oxygenSaturation: 99 },
                clinicalNotes: 'Routine follow-up for hypertension. Patient responding well to medication.',
                treatmentGiven: 'Medication compliance counselling',
                medicinesPrescribed: [{ name: 'Amlodipine', dosage: '5mg', duration: '60 days', instructions: 'Once daily morning' }],
            },
        ]);
        console.log('📝 Created doctor reports');

        // Create Diagnoses
        await Diagnosis.create({
            case: cases[0]._id,
            doctor: seniorDoctor._id,
            patient: patients[0]._id,
            finalDiagnosis: 'Primary Hypertension - Stage 2',
            icdCode: 'I10',
            severity: 'moderate',
            prescription: [
                { medicine: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '3 months', route: 'oral' },
                { medicine: 'Losartan', dosage: '50mg', frequency: 'Once daily', duration: '3 months', route: 'oral' },
            ],
            testsRequired: ['CBC', 'Renal function test', 'ECG', 'Fundoscopy'],
            treatmentPlan: 'Lifestyle modification + pharmacotherapy. Reduce salt intake, regular exercise.',
            dietaryAdvice: 'DASH diet. Reduce sodium to <2g/day. Avoid alcohol.',
            referralRequired: false,
            notes: 'Review in 4 weeks. Monitor BP twice daily.',
        });
        console.log('🩺 Created diagnoses');

        // Create Notifications
        await Notification.insertMany([
            {
                recipient: juniorDoctor._id,
                sender: helpline._id,
                type: 'case_assigned',
                title: 'New Case Assigned',
                message: `Case ${cases[0].caseId} has been assigned to you.`,
                relatedCase: cases[0]._id,
                isRead: true,
            },
            {
                recipient: seniorDoctor._id,
                sender: juniorDoctor._id,
                type: 'review_requested',
                title: 'Senior Review Requested',
                message: `Case ${cases[0].caseId} requires your review.`,
                relatedCase: cases[0]._id,
                isRead: false,
            },
            {
                recipient: patientUser._id,
                type: 'case_updated',
                title: 'Case Status Updated',
                message: `Your case ${cases[0].caseId} has been reviewed by senior doctor.`,
                relatedCase: cases[0]._id,
                isRead: false,
            },
        ]);
        console.log('🔔 Created notifications');

        console.log('\n✅ ===== SEED COMPLETE =====');
        console.log('\n📧 Login credentials:');
        console.log('  Admin:            admin@rhc.com       / Admin@123');
        console.log('  Senior Doctor:    senior.doctor@rhc.com / Doctor@123');
        console.log('  Junior Doctor:    junior.doctor@rhc.com / Doctor@123');
        console.log('  Helpline Op:      helpline@rhc.com    / Help@123');
        console.log('  Panchayat Ofcr:   panchayat@rhc.com   / Panch@123');
        console.log('  Patient:          patient@rhc.com     / Patient@123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err);
        process.exit(1);
    }
};

seed();
