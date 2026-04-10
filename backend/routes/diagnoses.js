const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generatePrescriptionPDF } = require('../utils/prescriptionPdf');
const { body, validationResult } = require('express-validator');
const Diagnosis = require('../models/Diagnosis');
const Case = require('../models/Case');
const Notification = require('../models/Notification');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { createLog } = require('../utils/logger');

// GET /api/diagnoses
router.get('/', protect, authorize('senior_doctor', 'admin', 'junior_doctor', 'patient'), async (req, res, next) => {
    try {
        const { caseId, page = 1, limit = 20 } = req.query;
        const query = {};
        if (caseId) query.case = caseId;

        // Patient: see only their own diagnoses
        if (req.user.role === 'patient') {
            const Patient = require('../models/Patient');
            const patient = await Patient.findOne({ user: req.user._id });
            if (patient) query.patient = patient._id;
            else return res.json({ success: true, data: [], total: 0 });
        }
        // junior_doctor: see diagnoses they created or for cases assigned to them
        else if (req.user.role === 'junior_doctor') {
            if (!caseId) {
                query.$or = [
                    { doctor: req.user._id },
                ];
            }
        }
        // senior_doctor sees all (no extra filter needed, but can also filter)

        const diagnoses = await Diagnosis.find(query)
            .populate('case', 'caseId chiefComplaint status')
            .populate('doctor', 'name role qualification')
            .populate('patient', 'name age gender')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Diagnosis.countDocuments(query);
        res.json({ success: true, data: diagnoses, total });
    } catch (err) { next(err); }
});

// GET /api/diagnoses/:id/pdf - Download prescription PDF  (MUST be before /:id)
router.get('/:id/pdf', protect, async (req, res, next) => {
    try {
        const diagnosis = await Diagnosis.findById(req.params.id)
            .populate('case')
            .populate('doctor', 'name role qualification')
            .populate('patient');

        if (!diagnosis) return res.status(404).json({ success: false, error: 'Diagnosis not found.' });

        const pdfPath = await generatePrescriptionPDF({
            caseId: diagnosis.case?.caseId || 'N/A',
            patientName: diagnosis.patient?.name || 'Unknown Patient',
            age: diagnosis.patient?.age || 'N/A',
            gender: diagnosis.patient?.gender || 'N/A',
            doctorName: diagnosis.doctor?.name || 'Unknown Doctor',
            doctorRole: diagnosis.doctor?.qualification || diagnosis.doctor?.role || 'Doctor',
            date: new Date(diagnosis.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
            diagnosis: diagnosis.finalDiagnosis,
            prescription: diagnosis.prescription,
            notes: diagnosis.notes,
            treatmentPlan: diagnosis.treatmentPlan,
            dietaryAdvice: diagnosis.dietaryAdvice,
        });

        res.setHeader('Content-Disposition', `attachment; filename="Prescription-${diagnosis.case?.caseId || diagnosis._id}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.download(pdfPath, `Prescription-${diagnosis.case?.caseId || diagnosis._id}.pdf`);
    } catch (err) { next(err); }
});

// GET /api/diagnoses/:id
router.get('/:id', protect, async (req, res, next) => {
    try {
        const diagnosis = await Diagnosis.findById(req.params.id)
            .populate('case')
            .populate('doctor', 'name role qualification phone')
            .populate('patient');
        if (!diagnosis) return res.status(404).json({ success: false, error: 'Diagnosis not found.' });
        res.json({ success: true, data: diagnosis });
    } catch (err) { next(err); }
});

// POST /api/diagnoses - doctor creates diagnosis with prescription
router.post('/', protect, authorize('junior_doctor', 'senior_doctor'), [
    body('case').notEmpty().withMessage('Case ID required'),
    body('patient').notEmpty().withMessage('Patient ID required'),
    body('finalDiagnosis').notEmpty().trim().withMessage('Final diagnosis required'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        // Parse prescription if sent as JSON string
        let prescription = req.body.prescription;
        if (typeof prescription === 'string') {
            try { prescription = JSON.parse(prescription); } catch { prescription = []; }
        }

        const diagnosisData = {
            ...req.body,
            prescription: prescription || [],
            doctor: req.user._id,
        };

        const diagnosis = await Diagnosis.create(diagnosisData);

        // Populate for response
        const populatedDiagnosis = await Diagnosis.findById(diagnosis._id)
            .populate('doctor', 'name role qualification')
            .populate('patient', 'name age gender')
            .populate('case', 'caseId chiefComplaint status');

        // Update case status to DIAGNOSED
        const caseDoc = await Case.findByIdAndUpdate(req.body.case, {
            status: 'DIAGNOSED',
            ...(req.user.role === 'senior_doctor' ? { seniorReviewedBy: req.user._id } : { assignedTo: req.user._id }),
            $push: {
                statusHistory: {
                    status: 'DIAGNOSED',
                    changedBy: req.user._id,
                    note: `Diagnosis: ${req.body.finalDiagnosis}`
                }
            },
        }, { new: true });

        // Notify patient about diagnosis
        if (caseDoc) {
            try {
                const Patient = require('../models/Patient');
                const patient = await Patient.findById(req.body.patient);
                if (patient?.user) {
                    await Notification.create({
                        recipient: patient.user,
                        sender: req.user._id,
                        type: 'diagnosis_added',
                        title: '[PATIENT] Diagnosis Available',
                        targetRole: 'patient',
                        message: `Dr. ${req.user.name} has added a diagnosis and prescription for case ${caseDoc.caseId}.`,
                        relatedCase: caseDoc._id,
                    });
                }
                // Also notify junior doctor if senior diagnosed
                if (req.user.role === 'senior_doctor' && caseDoc.assignedTo) {
                    await Notification.create({
                        recipient: caseDoc.assignedTo,
                        sender: req.user._id,
                        type: 'diagnosis_added',
                        title: '[STAFF] Senior Specialist Diagnosis Added',
                        targetRole: 'junior_doctor',
                        message: `Senior review complete for case ${caseDoc.caseId}.`,
                        relatedCase: caseDoc._id,
                    });
                }
            } catch (notifErr) {
                console.warn('Diagnosis notification failed:', notifErr.message);
            }
        }

        await createLog({ actor: req.user, action: 'CREATE_DIAGNOSIS', module: 'diagnoses', targetId: diagnosis._id, targetModel: 'Diagnosis', ipAddress: req.ip });
        res.status(201).json({ success: true, data: populatedDiagnosis });
    } catch (err) { next(err); }
});

// PUT /api/diagnoses/:id - Update diagnosis (senior doctor or admin)
router.put('/:id', protect, authorize('senior_doctor', 'admin', 'junior_doctor'), async (req, res, next) => {
    try {
        // Parse prescription if sent as JSON string
        let updateData = { ...req.body };
        if (typeof updateData.prescription === 'string') {
            try { updateData.prescription = JSON.parse(updateData.prescription); } catch { delete updateData.prescription; }
        }

        const diagnosis = await Diagnosis.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
            .populate('doctor', 'name role qualification')
            .populate('patient', 'name age gender')
            .populate('case', 'caseId chiefComplaint status');
        if (!diagnosis) return res.status(404).json({ success: false, error: 'Diagnosis not found.' });
        await createLog({ actor: req.user, action: 'UPDATE_DIAGNOSIS', module: 'diagnoses', targetId: diagnosis._id, targetModel: 'Diagnosis', ipAddress: req.ip });
        res.json({ success: true, data: diagnosis });
    } catch (err) { next(err); }
});

module.exports = router;
