const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Village = require('../models/Village');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');

// GET /api/analytics/summary - admin/panchayat overview
router.get('/summary', protect, authorize('admin', 'panchayat_officer', 'senior_doctor', 'junior_doctor'), async (req, res, next) => {
    try {
        const villageFilter = req.user.role === 'panchayat_officer' ? { village: req.user.village } : {};

        const [
            totalCases, activeCases, patientCount, userCount,
            casesByStatus, casesBySeverity, casesByMonth,
        ] = await Promise.all([
            Case.countDocuments(villageFilter),
            Case.countDocuments({ ...villageFilter, status: { $in: ['submitted', 'assigned', 'visited'] } }),
            Patient.countDocuments(),
            User.countDocuments({ isActive: true }),
            Case.aggregate([
                { $match: villageFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Case.aggregate([
                { $match: villageFilter },
                { $group: { _id: '$severity', count: { $sum: 1 } } },
            ]),
            Case.aggregate([
                { $match: villageFilter },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                { $limit: 12 },
            ]),
        ]);

        res.json({
            success: true,
            data: {
                totalCases, activeCases, patientCount, userCount,
                casesByStatus, casesBySeverity, casesByMonth,
            },
        });
    } catch (err) { next(err); }
});

// GET /api/analytics/village/:id - per-village analytics
router.get('/village/:id', protect, authorize('admin', 'panchayat_officer', 'senior_doctor'), async (req, res, next) => {
    try {
        const villageId = req.params.id;
        const [cases, patients, casesByStatus, symptomFrequency] = await Promise.all([
            Case.countDocuments({ village: villageId }),
            Patient.countDocuments({ village: villageId }),
            Case.aggregate([
                { $match: { village: require('mongoose').Types.ObjectId.createFromHexString(villageId) } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Case.aggregate([
                { $match: { village: require('mongoose').Types.ObjectId.createFromHexString(villageId) } },
                { $unwind: '$symptoms' },
                { $group: { _id: '$symptoms', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
        ]);
        res.json({ success: true, data: { cases, patients, casesByStatus, symptomFrequency } });
    } catch (err) { next(err); }
});

// GET /api/analytics/disease-trends
router.get('/disease-trends', protect, authorize('admin', 'panchayat_officer'), async (req, res, next) => {
    try {
        const trends = await Case.aggregate([
            { $unwind: '$symptoms' },
            {
                $group: {
                    _id: { symptom: '$symptoms', month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 50 },
        ]);
        res.json({ success: true, data: trends });
    } catch (err) { next(err); }
});

// GET /api/analytics/doctors-performance
router.get('/doctors-performance', protect, authorize('admin', 'senior_doctor'), async (req, res, next) => {
    try {
        const DoctorReport = require('../models/DoctorReport');
        const data = await DoctorReport.aggregate([
            {
                $group: {
                    _id: '$doctor',
                    reportCount: { $sum: 1 },
                    lastReport: { $max: '$createdAt' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'doctor',
                },
            },
            { $unwind: '$doctor' },
            {
                $project: {
                    doctorName: '$doctor.name',
                    doctorRole: '$doctor.role',
                    reportCount: 1,
                    lastReport: 1,
                },
            },
            { $sort: { reportCount: -1 } },
        ]);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

module.exports = router;
