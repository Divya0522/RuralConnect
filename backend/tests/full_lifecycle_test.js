/**
 * tests/full_lifecycle_test.js
 * 
 * Integration test for Rural Health Connect — COMPLETE LIFECYCLE
 * 1. Register users (Admin, Helpline, Junior Dr, Senior Dr, Patient)
 * 2. Helpline: Register Village, Patient & Case
 * 3. Helpline: Assign Case to Junior Dr → status: ASSIGNED
 * 4. Junior Dr: Submit Diagnosis → status: DIAGNOSED
 * 5. Junior Dr: Schedule Follow-up → status: FOLLOWUP
 * 6. Junior Dr: Escalate to Senior → status: ESCALATED
 * 7. Senior Dr: Final Diagnosis → status: DIAGNOSED
 * 8. Senior Dr: Resolve Case → status: RESOLVED
 * 9. Senior Dr: Close Case → status: CLOSED
 * 10. Verification: PDF, Case Status, Notifications
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';
const timestamp = Date.now();

const users = {
    admin: { name: 'Test Admin', email: `admin_${timestamp}@test.com`, password: 'Admin@123!', role: 'admin' },
    helpline: { name: 'Test Helpline', email: `helpline_${timestamp}@test.com`, password: 'Admin@123!', role: 'helpline_operator' },
    junior: { name: 'Dr Junior', email: `junior_${timestamp}@test.com`, password: 'Admin@123!', role: 'junior_doctor' },
    senior: { name: 'Dr Senior', email: `senior_${timestamp}@test.com`, password: 'Admin@123!', role: 'senior_doctor' },
    patient: { name: 'Test Patient', email: `patient_${timestamp}@test.com`, password: 'Admin@123!', role: 'patient' },
};

let tokens = {};
let ids = { villageId: null, patientId: null, caseId: null, diagnosisId: null, followupId: null };
let juniorUser = null, seniorUser = null;

const check = (condition, label) => {
    if (condition) console.log(`  ✅ ${label}`);
    else { console.error(`  ❌ ${label}`); process.exitCode = 1; }
};

async function api(method, url, data, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
        const res = await axios({ method, url: `${API_URL}${url}`, data, headers });
        return res.data;
    } catch (err) {
        const msg = err.response?.data?.error || err.message;
        throw new Error(`[${method.toUpperCase()} ${url}] ${msg}`);
    }
}

async function run() {
    console.log('🚀 Rural Health Connect — Full Lifecycle Integration Test\n');

    // ─── STEP 1: Register Users ───────────────────────────────────────────────
    console.log('━━━ STEP 1: Register Users ━━━');
    for (const [key, u] of Object.entries(users)) {
        const res = await api('post', '/auth/register', u);
        tokens[key] = res.data.accessToken;
        console.log(`  ✅ Registered ${key} (${u.role})`);
    }

    juniorUser = (await api('get', '/auth/me', null, tokens.junior)).data;
    seniorUser = (await api('get', '/auth/me', null, tokens.senior)).data;
    console.log(`  ℹ Junior Dr ID: ${juniorUser._id}`);
    console.log(`  ℹ Senior Dr ID: ${seniorUser._id}`);

    // ─── STEP 2: Setup Village, Patient, Case ─────────────────────────────────
    console.log('\n━━━ STEP 2: Village, Patient & Case (Helpline) ━━━');
    const vRes = await api('post', '/villages', { name: `TestVillage_${timestamp}`, district: 'TestDistrict', population: 1000 }, tokens.admin);
    ids.villageId = vRes.data._id;
    console.log(`  ✅ Village Created: ${ids.villageId}`);

    const pRes = await api('post', '/patients', { name: 'Ramesh Kumar', age: 52, gender: 'male', phone: '9876543210', village: ids.villageId }, tokens.helpline);
    ids.patientId = pRes.data._id;
    console.log(`  ✅ Patient Created: ${ids.patientId}`);

    const cRes = await api('post', '/cases', { patient: ids.patientId, chiefComplaint: 'Severe chest pain and shortness of breath', severity: 'high', village: ids.villageId }, tokens.helpline);
    ids.caseId = cRes.data._id;
    console.log(`  ✅ Case Created: ${cRes.data.caseId} (${ids.caseId})`);
    check(cRes.data.status === 'NEW', `Status = NEW`);

    // ─── STEP 3: Assign to Junior Doctor ──────────────────────────────────────
    console.log('\n━━━ STEP 3: Assign Case (Helpline → Junior Dr) ━━━');
    const assignRes = await api('patch', `/cases/${ids.caseId}/assign`, { assignedTo: juniorUser._id, note: 'Assigned via test' }, tokens.helpline);
    check(assignRes.data.status === 'ASSIGNED', `Status = ASSIGNED`);

    // ─── STEP 4: Junior Doctor Submits Diagnosis ───────────────────────────────
    console.log('\n━━━ STEP 4: Junior Doctor — Initial Diagnosis ━━━');
    const jDiagRes = await api('post', '/diagnoses', {
        case: ids.caseId, patient: ids.patientId,
        finalDiagnosis: 'Provisional: Angina Pectoris',
        prescription: [{ medicine: 'Nitroglycerin', dosage: '0.5mg', frequency: 'PRN chest pain', duration: '3 days', route: 'Sublingual' }],
        treatmentPlan: 'Rest, avoid exertion. Await senior review.', notes: 'High risk patient - escalation recommended'
    }, tokens.junior);
    ids.diagnosisId = jDiagRes.data._id;
    console.log(`  ✅ Junior Diagnosis Created: ${ids.diagnosisId}`);

    // Check case updated to DIAGNOSED
    const afterJDiag = (await api('get', `/cases/${ids.caseId}`, null, tokens.junior)).data;
    check(afterJDiag.status === 'DIAGNOSED', `Status → DIAGNOSED after junior diagnosis`);

    // ─── STEP 5: Schedule Follow-up ────────────────────────────────────────────
    console.log('\n━━━ STEP 5: Junior Doctor — Schedule Follow-up ━━━');
    const followDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const fuRes = await api('post', '/followups', {
        case: ids.caseId, patient: ids.patientId,
        scheduledDate: followDate, type: 'telephonic', notes: 'Weekly blood pressure check', assignedDoctor: juniorUser._id
    }, tokens.junior);
    ids.followupId = fuRes.data._id;
    console.log(`  ✅ Follow-up Scheduled: ${ids.followupId}`);

    const afterFU = (await api('get', `/cases/${ids.caseId}`, null, tokens.junior)).data;
    check(afterFU.status === 'FOLLOWUP', `Status → FOLLOWUP after scheduling`);

    // ─── STEP 6: Junior Escalates to Senior ────────────────────────────────────
    console.log('\n━━━ STEP 6: Junior Doctor — Escalate to Senior ━━━');
    const escalRes = await api('patch', `/cases/${ids.caseId}/request-senior-review`, { reason: 'High cardiac risk — needs expert opinion', seniorId: seniorUser._id }, tokens.junior);
    check(escalRes.data.status === 'ESCALATED', `Status → ESCALATED`);
    check(escalRes.data.seniorReviewRequested === true, `seniorReviewRequested = true`);

    // ─── STEP 7: Senior Doctor — Final Diagnosis ───────────────────────────────
    console.log('\n━━━ STEP 7: Senior Doctor — Final Diagnosis ━━━');
    const sDiagRes = await api('post', '/diagnoses', {
        case: ids.caseId, patient: ids.patientId,
        finalDiagnosis: 'Acute Myocardial Infarction (STEMI)',
        prescription: [
            { medicine: 'Aspirin', dosage: '300mg', frequency: 'Immediately once', duration: '1 day', route: 'Oral' },
            { medicine: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily', duration: '30 days', route: 'Oral' },
            { medicine: 'Atorvastatin', dosage: '40mg', frequency: 'Nightly', duration: '90 days', route: 'Oral' },
        ],
        treatmentPlan: 'Emergency hospitalization required. Cardiology referral. ECG, troponin levels monitoring.',
        dietaryAdvice: 'Low sodium, low fat diet. No smoking. Cardiac rehab in 4-6 weeks.'
    }, tokens.senior);
    const seniorDiagId = sDiagRes.data._id;
    console.log(`  ✅ Senior Diagnosis Created: ${seniorDiagId}`);
    check(sDiagRes.data.doctor, `Doctor linked to diagnosis`);

    const afterSDiag = (await api('get', `/cases/${ids.caseId}`, null, tokens.senior)).data;
    check(afterSDiag.status === 'DIAGNOSED', `Status → DIAGNOSED after senior diagnosis`);

    // ─── STEP 8: Senior Resolves Case ──────────────────────────────────────────
    console.log('\n━━━ STEP 8: Senior Doctor — Resolve Case ━━━');
    const resolveRes = await api('patch', `/cases/${ids.caseId}/resolve`, { closureNote: 'Patient referred to district hospital. Follow-up in 30 days.' }, tokens.senior);
    check(resolveRes.data.status === 'RESOLVED', `Status → RESOLVED`);
    check(!!resolveRes.data.resolvedAt, `resolvedAt set`);

    // ─── STEP 9: Close Case ────────────────────────────────────────────────────
    console.log('\n━━━ STEP 9: Close Case ━━━');
    const closeRes = await api('patch', `/cases/${ids.caseId}/status`, { status: 'CLOSED', note: 'Case fully closed' }, tokens.senior);
    check(closeRes.data.status === 'CLOSED', `Status → CLOSED`);

    // ─── STEP 10: Verification ─────────────────────────────────────────────────
    console.log('\n━━━ STEP 10: Verification ━━━');

    // Final case state
    const finalCase = (await api('get', `/cases/${ids.caseId}`, null, tokens.admin)).data;
    check(finalCase.status === 'CLOSED', `Final case status = CLOSED`);
    check(finalCase.statusHistory.length > 3, `Status history has > 3 entries (${finalCase.statusHistory.length})`);
    check(!!finalCase.seniorReviewedBy, `Senior reviewer linked`);

    // PDF download
    try {
        const pdfRes = await axios.get(`${API_URL}/diagnoses/${seniorDiagId}/pdf`, {
            headers: { Authorization: `Bearer ${tokens.senior}` },
            responseType: 'arraybuffer'
        });
        check(pdfRes.status === 200, `PDF download → HTTP 200`);
        check(pdfRes.headers['content-type']?.includes('application/pdf'), `Content-Type = application/pdf`);
        console.log(`  ℹ PDF Size: ${Math.round(pdfRes.data.byteLength / 1024)} KB`);
    } catch (e) {
        check(false, `PDF download failed: ${e.message}`);
    }

    // Complete follow-up
    const fuCompleteRes = await api('patch', `/followups/${ids.followupId}/complete`, { outcome: 'Patient condition improved marginally' }, tokens.junior);
    check(fuCompleteRes.data.isCompleted === true, `Follow-up completed`);

    // Notifications check
    const notifRes = await api('get', '/notifications', null, tokens.junior);
    console.log(`  ℹ Junior Dr notifications: ${notifRes.data.length}`);

    // Summary
    const hasErrors = process.exitCode === 1;
    if (!hasErrors) {
        console.log('\n✨ ═══════════════════════════════════════ ✨');
        console.log('   ALL TEST STEPS COMPLETED SUCCESSFULLY!');
        console.log('✨ ═══════════════════════════════════════ ✨\n');
        console.log('  Lifecycle: NEW → ASSIGNED → DIAGNOSED → FOLLOWUP → ESCALATED → DIAGNOSED → RESOLVED → CLOSED ✅');
    } else {
        console.error('\n⚠️  Some tests failed. Review the ❌ errors above.');
        process.exit(1);
    }
}

run().catch(err => {
    console.error('\n❌ UNEXPECTED ERROR:', err.message);
    if (err.response) console.error('Response:', JSON.stringify(err.response.data, null, 2));
    process.exit(1);
});
