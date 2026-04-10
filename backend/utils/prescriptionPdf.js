const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a professional prescription PDF
 * @param {Object} data - { caseId, patientName, age, gender, doctorName, doctorRole, date, diagnosis, prescription, notes }
 * @returns {Promise<string>} - Path to the generated PDF
 */
const generatePrescriptionPDF = async (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const filename = `Prescription-${data.caseId}-${Date.now()}.pdf`;
            const uploadDir = path.join(__dirname, '../uploads/prescriptions');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, filename);
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // Header
            doc.fillColor('#2563EB').fontSize(24).text('Rural Health Connect', { align: 'center' });
            doc.fontSize(10).fillColor('#64748B').text('Quality Healthcare for Rural Communities', { align: 'center' });
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#E2E8F0');
            doc.moveDown();

            // Doctor & Date Info
            doc.fillColor('#111827').fontSize(12).text(`Doctor: Dr. ${data.doctorName}`, { align: 'left' });
            doc.fontSize(10).fillColor('#64748B').text(`Role: ${data.doctorRole}`, { align: 'left' });
            doc.moveUp();
            doc.fillColor('#111827').fontSize(11).text(`Date: ${data.date}`, { align: 'right' });
            doc.moveDown();

            // Patient Info Box
            doc.rect(50, doc.y, 500, 60).fill('#F8FAFC').stroke('#E2E8F0');
            doc.fillColor('#111827').fontSize(12).text('Patient Details', 60, doc.y + 10);
            doc.fontSize(10).text(`Name: ${data.patientName}`, 60, doc.y + 5);
            doc.text(`Age/Gender: ${data.age} / ${data.gender}`, 250, doc.y - 12);
            doc.text(`Case ID: ${data.caseId}`, 400, doc.y - 12);
            doc.moveDown(4);

            // Diagnosis section
            doc.fillColor('#2563EB').fontSize(14).text('Clinical Diagnosis', { underline: true });
            doc.fillColor('#111827').fontSize(11).text(data.diagnosis || 'No diagnosis provided');
            doc.moveDown();

            // Prescription Table Header
            doc.fillColor('#2563EB').fontSize(14).text('Prescription (Rx)', { underline: true });
            doc.moveDown(0.5);

            if (data.prescription && data.prescription.length > 0) {
                data.prescription.forEach((item, index) => {
                    doc.fillColor('#111827').fontSize(11).text(`${index + 1}. ${item.medicine} - ${item.dosage} (${item.frequency})`);
                    doc.fontSize(9).fillColor('#64748B').text(`   Duration: ${item.duration} | Route: ${item.route}`);
                    doc.moveDown(0.5);
                });
            } else {
                doc.fillColor('#111827').fontSize(11).text('No medications prescribed.');
            }

            doc.moveDown();
            if (data.notes) {
                doc.fillColor('#2563EB').fontSize(12).text('Clinical Notes:');
                doc.fillColor('#111827').fontSize(10).text(data.notes);
            }

            // Footer
            doc.fontSize(10).fillColor('#94A3B8').text(
                'This is a computer-generated prescription and does not require a physical signature.',
                50, 700, { align: 'center', width: 500 }
            );

            doc.end();
            stream.on('finish', () => resolve(filePath));
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generatePrescriptionPDF };
