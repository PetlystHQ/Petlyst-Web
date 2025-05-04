const pool = require('../../config/db');

/**
 * Reports operations
 */

// Get complete medical history of a pet
async function getPetMedicalHistory(petId) {
    try {
        // Get pet information
        const petInfo = await pool.query(
            `SELECT p.*, o.owner_name, o.owner_surname, o.owner_phone, o.owner_email
             FROM pets p
             LEFT JOIN pet_owners o ON p.owner_id = o.owner_id
             WHERE p.pet_id = $1`,
            [petId]
        );
        
        if (petInfo.rows.length === 0) {
            return null;
        }
        
        const pet = petInfo.rows[0];
        
        // Get all examinations for the pet
        const examinations = await pool.query(
            `SELECT e.*, 
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name,
                    c.clinic_name
             FROM examinations e
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             LEFT JOIN clinics c ON v.clinic_id = c.clinic_id
             WHERE e.pet_id = $1
             ORDER BY e.created_at DESC`,
            [petId]
        );
        
        // For each examination, get diagnoses, treatments and medications
        const examinationsWithDetails = await Promise.all(examinations.rows.map(async (exam) => {
            // Get diagnoses for this examination
            const diagnoses = await pool.query(
                `SELECT d.* 
                 FROM diagnoses d
                 WHERE d.examination_id = $1
                 ORDER BY d.diagnosis_date DESC`,
                [exam.examination_id]
            );
            
            // For each diagnosis, get treatments
            const diagnosesWithTreatments = await Promise.all(diagnoses.rows.map(async (diagnosis) => {
                // Get treatments for this diagnosis
                const treatments = await pool.query(
                    `SELECT t.* 
                     FROM treatments t
                     WHERE t.diagnosis_id = $1
                     ORDER BY t.start_date DESC`,
                    [diagnosis.diagnosis_id]
                );
                
                // For each treatment, get medications
                const treatmentsWithMedications = await Promise.all(treatments.rows.map(async (treatment) => {
                    // Get medications for this treatment
                    const medications = await pool.query(
                        `SELECT m.*, i.name as medication_name, i.description as medication_description 
                         FROM medications m
                         LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
                         WHERE m.treatment_id = $1
                         ORDER BY m.start_date DESC`,
                        [treatment.treatment_id]
                    );
                    
                    return {
                        ...treatment,
                        medications: medications.rows
                    };
                }));
                
                return {
                    ...diagnosis,
                    treatments: treatmentsWithMedications
                };
            }));
            
            return {
                ...exam,
                diagnoses: diagnosesWithTreatments
            };
        }));
        
        return {
            pet: pet,
            examinations: examinationsWithDetails
        };
    } catch (error) {
        console.error('Error getting pet medical history:', error);
        throw error;
    }
}

// Get examination summary with diagnoses, treatments and medications
async function getExaminationSummary(examinationId) {
    try {
        // Get examination information
        const examinationInfo = await pool.query(
            `SELECT e.*, 
                    p.pet_name, p.pet_species, p.pet_breed, p.pet_birthdate, p.pet_gender,
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name,
                    c.clinic_name, c.clinic_address, c.clinic_phone
             FROM examinations e
             JOIN pets p ON e.pet_id = p.pet_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             LEFT JOIN clinics c ON v.clinic_id = c.clinic_id
             WHERE e.examination_id = $1`,
            [examinationId]
        );
        
        if (examinationInfo.rows.length === 0) {
            return null;
        }
        
        const examination = examinationInfo.rows[0];
        
        // Get diagnoses for this examination
        const diagnoses = await pool.query(
            `SELECT d.* 
             FROM diagnoses d
             WHERE d.examination_id = $1
             ORDER BY d.diagnosis_date DESC`,
            [examinationId]
        );
        
        // For each diagnosis, get treatments
        const diagnosesWithTreatments = await Promise.all(diagnoses.rows.map(async (diagnosis) => {
            // Get treatments for this diagnosis
            const treatments = await pool.query(
                `SELECT t.* 
                 FROM treatments t
                 WHERE t.diagnosis_id = $1
                 ORDER BY t.start_date DESC`,
                [diagnosis.diagnosis_id]
            );
            
            // For each treatment, get medications
            const treatmentsWithMedications = await Promise.all(treatments.rows.map(async (treatment) => {
                // Get medications for this treatment
                const medications = await pool.query(
                    `SELECT m.*, i.name as medication_name, i.description as medication_description 
                     FROM medications m
                     LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
                     WHERE m.treatment_id = $1
                     ORDER BY m.start_date DESC`,
                    [treatment.treatment_id]
                );
                
                return {
                    ...treatment,
                    medications: medications.rows
                };
            }));
            
            return {
                ...diagnosis,
                treatments: treatmentsWithMedications
            };
        }));
        
        return {
            examination: examination,
            diagnoses: diagnosesWithTreatments
        };
    } catch (error) {
        console.error('Error getting examination summary:', error);
        throw error;
    }
}

// Get treatment details with diagnosis and medications
async function getTreatmentReport(treatmentId) {
    try {
        // Get treatment information with related data
        const treatmentInfo = await pool.query(
            `SELECT t.*, 
                    d.diagnosis_name, d.diagnosis_code, d.description as diagnosis_description,
                    e.examination_id, e.notes as examination_notes, e.temperature, e.heart_rate, e.respiratory_rate, e.weight,
                    p.pet_id, p.pet_name, p.pet_species, p.pet_breed, p.pet_birthdate, p.pet_gender,
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name,
                    c.clinic_name, c.clinic_address, c.clinic_phone
             FROM treatments t
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN pets p ON e.pet_id = p.pet_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             LEFT JOIN clinics c ON v.clinic_id = c.clinic_id
             WHERE t.treatment_id = $1`,
            [treatmentId]
        );
        
        if (treatmentInfo.rows.length === 0) {
            return null;
        }
        
        const treatment = treatmentInfo.rows[0];
        
        // Get medications for this treatment
        const medications = await pool.query(
            `SELECT m.*, i.name as medication_name, i.description as medication_description 
             FROM medications m
             LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
             WHERE m.treatment_id = $1
             ORDER BY m.start_date DESC`,
            [treatmentId]
        );
        
        return {
            treatment: treatment,
            medications: medications.rows
        };
    } catch (error) {
        console.error('Error getting treatment report:', error);
        throw error;
    }
}

// Generate formatted report data for examination
async function generateExaminationReportData(examinationId) {
    try {
        const summary = await getExaminationSummary(examinationId);
        
        if (!summary) {
            return null;
        }
        
        // Format data for direct display
        const reportData = {
            title: `Muayene Raporu - ${summary.examination.pet_name}`,
            date: new Date(summary.examination.created_at).toLocaleDateString('tr-TR'),
            clinic: {
                name: summary.examination.clinic_name,
                address: summary.examination.clinic_address,
                phone: summary.examination.clinic_phone
            },
            veterinarian: summary.examination.veterinarian_name,
            pet: {
                name: summary.examination.pet_name,
                species: summary.examination.pet_species,
                breed: summary.examination.pet_breed,
                birthdate: summary.examination.pet_birthdate ? new Date(summary.examination.pet_birthdate).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                gender: summary.examination.pet_gender,
                age: summary.examination.pet_birthdate ? calculateAge(new Date(summary.examination.pet_birthdate)) : 'Bilinmiyor'
            },
            examination: {
                id: summary.examination.examination_id,
                date: new Date(summary.examination.created_at).toLocaleDateString('tr-TR'),
                status: formatStatus(summary.examination.status),
                notes: summary.examination.notes,
                vital_signs: {
                    temperature: summary.examination.temperature ? `${summary.examination.temperature} °C` : '-',
                    heart_rate: summary.examination.heart_rate ? `${summary.examination.heart_rate} bpm` : '-',
                    respiratory_rate: summary.examination.respiratory_rate ? `${summary.examination.respiratory_rate} bpm` : '-',
                    weight: summary.examination.weight ? `${summary.examination.weight} kg` : '-'
                }
            },
            diagnoses: summary.diagnoses.map(diagnosis => ({
                name: diagnosis.diagnosis_name,
                code: diagnosis.diagnosis_code,
                description: diagnosis.description,
                date: diagnosis.diagnosis_date ? new Date(diagnosis.diagnosis_date).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                severity: formatSeverity(diagnosis.severity),
                notes: diagnosis.notes,
                treatments: diagnosis.treatments.map(treatment => ({
                    name: treatment.treatment_name,
                    type: formatTreatmentType(treatment.treatment_type),
                    description: treatment.description,
                    start_date: treatment.start_date ? new Date(treatment.start_date).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                    end_date: treatment.end_date ? new Date(treatment.end_date).toLocaleDateString('tr-TR') : 'Devam ediyor',
                    status: formatStatus(treatment.status),
                    outcome: formatOutcome(treatment.outcome),
                    notes: treatment.notes,
                    medications: treatment.medications.map(medication => ({
                        name: medication.medication_name || 'İsimsiz İlaç',
                        dosage: medication.dosage,
                        frequency: medication.frequency,
                        route: formatRoute(medication.route),
                        start_date: medication.start_date ? new Date(medication.start_date).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                        end_date: medication.end_date ? new Date(medication.end_date).toLocaleDateString('tr-TR') : 'Devam ediyor',
                        notes: medication.notes
                    }))
                }))
            }))
        };
        
        return reportData;
    } catch (error) {
        console.error('Error generating examination report data:', error);
        throw error;
    }
}

// Generate formatted report data for treatment
async function generateTreatmentReportData(treatmentId) {
    try {
        const report = await getTreatmentReport(treatmentId);
        
        if (!report) {
            return null;
        }
        
        // Format data for direct display
        const reportData = {
            title: `Tedavi Raporu - ${report.treatment.pet_name}`,
            date: new Date().toLocaleDateString('tr-TR'),
            clinic: {
                name: report.treatment.clinic_name,
                address: report.treatment.clinic_address,
                phone: report.treatment.clinic_phone
            },
            veterinarian: report.treatment.veterinarian_name,
            pet: {
                name: report.treatment.pet_name,
                species: report.treatment.pet_species,
                breed: report.treatment.pet_breed,
                birthdate: report.treatment.pet_birthdate ? new Date(report.treatment.pet_birthdate).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                gender: report.treatment.pet_gender,
                age: report.treatment.pet_birthdate ? calculateAge(new Date(report.treatment.pet_birthdate)) : 'Bilinmiyor'
            },
            diagnosis: {
                name: report.treatment.diagnosis_name,
                code: report.treatment.diagnosis_code,
                description: report.treatment.diagnosis_description
            },
            treatment: {
                id: report.treatment.treatment_id,
                name: report.treatment.treatment_name,
                type: formatTreatmentType(report.treatment.treatment_type),
                description: report.treatment.description,
                start_date: report.treatment.start_date ? new Date(report.treatment.start_date).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                end_date: report.treatment.end_date ? new Date(report.treatment.end_date).toLocaleDateString('tr-TR') : 'Devam ediyor',
                duration: calculateDuration(report.treatment.start_date, report.treatment.end_date),
                status: formatStatus(report.treatment.status),
                outcome: formatOutcome(report.treatment.outcome),
                notes: report.treatment.notes
            },
            medications: report.medications.map(medication => ({
                name: medication.medication_name || 'İsimsiz İlaç',
                dosage: medication.dosage,
                frequency: medication.frequency,
                route: formatRoute(medication.route),
                start_date: medication.start_date ? new Date(medication.start_date).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                end_date: medication.end_date ? new Date(medication.end_date).toLocaleDateString('tr-TR') : 'Devam ediyor',
                duration: calculateDuration(medication.start_date, medication.end_date),
                notes: medication.notes
            })),
            examination: {
                temperature: report.treatment.temperature ? `${report.treatment.temperature} °C` : '-',
                heart_rate: report.treatment.heart_rate ? `${report.treatment.heart_rate} bpm` : '-',
                respiratory_rate: report.treatment.respiratory_rate ? `${report.treatment.respiratory_rate} bpm` : '-',
                weight: report.treatment.weight ? `${report.treatment.weight} kg` : '-',
                notes: report.treatment.examination_notes
            }
        };
        
        return reportData;
    } catch (error) {
        console.error('Error generating treatment report data:', error);
        throw error;
    }
}

// Get pet health summary for dashboard
async function getPetHealthSummary(petId) {
    try {
        // Get basic pet information
        const petInfo = await pool.query(
            `SELECT p.*, o.owner_name, o.owner_surname, o.owner_phone, o.owner_email
             FROM pets p
             LEFT JOIN pet_owners o ON p.owner_id = o.owner_id
             WHERE p.pet_id = $1`,
            [petId]
        );
        
        if (petInfo.rows.length === 0) {
            return null;
        }
        
        const pet = petInfo.rows[0];
        
        // Get latest examination
        const latestExamination = await pool.query(
            `SELECT e.*, 
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
             FROM examinations e
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             WHERE e.pet_id = $1
             ORDER BY e.created_at DESC
             LIMIT 1`,
            [petId]
        );
        
        // Get active diagnoses (from latest examination)
        let activeExamination = null;
        let activeDiagnoses = [];
        
        if (latestExamination.rows.length > 0) {
            activeExamination = latestExamination.rows[0];
            
            const diagnoses = await pool.query(
                `SELECT d.* 
                 FROM diagnoses d
                 WHERE d.examination_id = $1
                 ORDER BY d.diagnosis_date DESC`,
                [activeExamination.examination_id]
            );
            
            activeDiagnoses = diagnoses.rows;
        }
        
        // Get active treatments
        const activeTreatments = await pool.query(
            `SELECT t.*, d.diagnosis_name, d.diagnosis_code 
             FROM treatments t
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             WHERE e.pet_id = $1 AND t.status IN ('planned', 'in_progress')
             ORDER BY t.start_date DESC`,
            [petId]
        );
        
        // Get current medications
        const currentMedications = await pool.query(
            `SELECT m.*, i.name as medication_name, t.treatment_name, d.diagnosis_name
             FROM medications m
             JOIN treatments t ON m.treatment_id = t.treatment_id
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
             WHERE e.pet_id = $1 
                AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
                AND m.start_date <= CURRENT_DATE
             ORDER BY m.start_date DESC`,
            [petId]
        );
        
        // Get examination history stats
        const examinationStats = await pool.query(
            `SELECT COUNT(*) as total_examinations, 
                    MAX(created_at) as last_examination_date,
                    MIN(created_at) as first_examination_date
             FROM examinations
             WHERE pet_id = $1`,
            [petId]
        );
        
        // Get completed treatments stats
        const treatmentStats = await pool.query(
            `SELECT COUNT(*) as total_treatments,
                    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_treatments,
                    COUNT(CASE WHEN t.outcome = 'successful' THEN 1 END) as successful_treatments
             FROM treatments t
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             WHERE e.pet_id = $1`,
            [petId]
        );
        
        return {
            pet: {
                ...pet,
                age: pet.pet_birthdate ? calculateAge(new Date(pet.pet_birthdate)) : 'Bilinmiyor'
            },
            latest_examination: activeExamination ? {
                ...activeExamination,
                examination_date: activeExamination.created_at ? new Date(activeExamination.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                status: formatStatus(activeExamination.status)
            } : null,
            active_diagnoses: activeDiagnoses.map(diagnosis => ({
                ...diagnosis,
                diagnosis_date: diagnosis.diagnosis_date ? new Date(diagnosis.diagnosis_date).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                severity: formatSeverity(diagnosis.severity)
            })),
            active_treatments: activeTreatments.rows.map(treatment => ({
                ...treatment,
                start_date: treatment.start_date ? new Date(treatment.start_date).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                end_date: treatment.end_date ? new Date(treatment.end_date).toLocaleDateString('tr-TR') : 'Devam ediyor',
                status: formatStatus(treatment.status),
                type: formatTreatmentType(treatment.treatment_type)
            })),
            current_medications: currentMedications.rows.map(medication => ({
                ...medication,
                start_date: medication.start_date ? new Date(medication.start_date).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                end_date: medication.end_date ? new Date(medication.end_date).toLocaleDateString('tr-TR') : 'Devam ediyor',
                route: formatRoute(medication.route)
            })),
            stats: {
                examinations: {
                    ...examinationStats.rows[0],
                    last_examination_date: examinationStats.rows[0].last_examination_date ? new Date(examinationStats.rows[0].last_examination_date).toLocaleDateString('tr-TR') : 'Yok',
                    first_examination_date: examinationStats.rows[0].first_examination_date ? new Date(examinationStats.rows[0].first_examination_date).toLocaleDateString('tr-TR') : 'Yok'
                },
                treatments: treatmentStats.rows[0]
            }
        };
    } catch (error) {
        console.error('Error getting pet health summary:', error);
        throw error;
    }
}

// Get clinic medical reports dashboard
async function getClinicMedicalDashboard(clinicId, startDate = null, endDate = null) {
    try {
        // Set default date range if not provided (last 30 days)
        if (!startDate) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            startDate = thirtyDaysAgo.toISOString().split('T')[0];
        }
        
        if (!endDate) {
            endDate = new Date().toISOString().split('T')[0];
        }
        
        // Get examinations count by date
        const examinationsByDate = await pool.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM examinations e
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             WHERE v.clinic_id = $1
                AND created_at >= $2
                AND created_at <= ($3 || ' 23:59:59')::timestamp
             GROUP BY DATE(created_at)
             ORDER BY DATE(created_at)`,
            [clinicId, startDate, endDate]
        );
        
        // Get diagnoses count by type
        const diagnosesByType = await pool.query(
            `SELECT d.diagnosis_type, COUNT(*) as count
             FROM diagnoses d
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             WHERE v.clinic_id = $1
                AND d.created_at >= $2
                AND d.created_at <= ($3 || ' 23:59:59')::timestamp
             GROUP BY d.diagnosis_type
             ORDER BY count DESC`,
            [clinicId, startDate, endDate]
        );
        
        // Get top diagnoses
        const topDiagnoses = await pool.query(
            `SELECT d.diagnosis_name, COUNT(*) as count
             FROM diagnoses d
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             WHERE v.clinic_id = $1
                AND d.created_at >= $2
                AND d.created_at <= ($3 || ' 23:59:59')::timestamp
             GROUP BY d.diagnosis_name
             ORDER BY count DESC
             LIMIT 10`,
            [clinicId, startDate, endDate]
        );
        
        // Get treatments status counts
        const treatmentStatusCounts = await pool.query(
            `SELECT t.status, COUNT(*) as count
             FROM treatments t
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             WHERE v.clinic_id = $1
                AND t.created_at >= $2
                AND t.created_at <= ($3 || ' 23:59:59')::timestamp
             GROUP BY t.status
             ORDER BY count DESC`,
            [clinicId, startDate, endDate]
        );
        
        // Get treatments outcome counts
        const treatmentOutcomeCounts = await pool.query(
            `SELECT t.outcome, COUNT(*) as count
             FROM treatments t
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             WHERE v.clinic_id = $1
                AND t.status = 'completed'
                AND t.created_at >= $2
                AND t.created_at <= ($3 || ' 23:59:59')::timestamp
             GROUP BY t.outcome
             ORDER BY count DESC`,
            [clinicId, startDate, endDate]
        );
        
        // Get top medications used
        const topMedications = await pool.query(
            `SELECT i.name, SUM(m.quantity_used) as total_used
             FROM medications m
             JOIN inventory_items i ON m.inventory_item_id = i.id
             JOIN treatments t ON m.treatment_id = t.treatment_id
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             WHERE v.clinic_id = $1
                AND i.clinic_id = $1
                AND m.created_at >= $2
                AND m.created_at <= ($3 || ' 23:59:59')::timestamp
             GROUP BY i.name
             ORDER BY total_used DESC
             LIMIT 10`,
            [clinicId, startDate, endDate]
        );
        
        // Get total counts
        const totalCounts = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM examinations e 
                 JOIN veterinarians v ON e.vet_id = v.veterinarian_id
                 WHERE v.clinic_id = $1
                    AND e.created_at >= $2
                    AND e.created_at <= ($3 || ' 23:59:59')::timestamp) AS total_examinations,
                
                (SELECT COUNT(*) FROM diagnoses d 
                 JOIN examinations e ON d.examination_id = e.examination_id
                 JOIN veterinarians v ON e.vet_id = v.veterinarian_id
                 WHERE v.clinic_id = $1
                    AND d.created_at >= $2
                    AND d.created_at <= ($3 || ' 23:59:59')::timestamp) AS total_diagnoses,
                
                (SELECT COUNT(*) FROM treatments t 
                 JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
                 JOIN examinations e ON d.examination_id = e.examination_id
                 JOIN veterinarians v ON e.vet_id = v.veterinarian_id
                 WHERE v.clinic_id = $1
                    AND t.created_at >= $2
                    AND t.created_at <= ($3 || ' 23:59:59')::timestamp) AS total_treatments,
                
                (SELECT COUNT(*) FROM medications m
                 JOIN treatments t ON m.treatment_id = t.treatment_id
                 JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
                 JOIN examinations e ON d.examination_id = e.examination_id
                 JOIN veterinarians v ON e.vet_id = v.veterinarian_id
                 WHERE v.clinic_id = $1
                    AND m.created_at >= $2
                    AND m.created_at <= ($3 || ' 23:59:59')::timestamp) AS total_medications`,
            [clinicId, startDate, endDate]
        );
        
        return {
            date_range: {
                start_date: startDate,
                end_date: endDate,
                formatted_range: `${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')}`
            },
            summary: totalCounts.rows[0],
            examinations_by_date: examinationsByDate.rows.map(item => ({
                ...item,
                formatted_date: new Date(item.date).toLocaleDateString('tr-TR')
            })),
            diagnoses_by_type: diagnosesByType.rows.map(item => ({
                ...item,
                diagnosis_type_formatted: formatDiagnosisType(item.diagnosis_type)
            })),
            top_diagnoses: topDiagnoses.rows,
            treatment_status_counts: treatmentStatusCounts.rows.map(item => ({
                ...item,
                status_formatted: formatStatus(item.status)
            })),
            treatment_outcome_counts: treatmentOutcomeCounts.rows.map(item => ({
                ...item,
                outcome_formatted: formatOutcome(item.outcome)
            })),
            top_medications: topMedications.rows
        };
    } catch (error) {
        console.error('Error getting clinic medical dashboard:', error);
        throw error;
    }
}

// Update examination status to completed
async function completeExamination(examinationId) {
    try {
        const result = await pool.query(
            `UPDATE examinations
             SET status = 'completed', updated_at = CURRENT_TIMESTAMP
             WHERE examination_id = $1
             RETURNING *`,
            [examinationId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error completing examination:', error);
        throw error;
    }
}

// Helper functions for formatting
function calculateAge(birthdate) {
    const today = new Date();
    const diff = today - birthdate;
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (years > 0) {
        return `${years} yıl ${months} ay`;
    } else {
        return `${months} ay`;
    }
}

function calculateDuration(startDate, endDate) {
    if (!startDate) return 'Belirsiz';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diff = end - start;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return 'Henüz başlamadı';
    
    if (days === 1) return '1 gün';
    
    return `${days} gün`;
}

function formatStatus(status) {
    if (!status) return 'Belirsiz';
    
    const statusMap = {
        'planned': 'Planlandı',
        'in_progress': 'Devam Ediyor',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi'
    };
    
    return statusMap[status] || status;
}

function formatSeverity(severity) {
    if (!severity) return 'Belirsiz';
    
    const severityMap = {
        'mild': 'Hafif',
        'moderate': 'Orta',
        'severe': 'Şiddetli',
        'critical': 'Kritik'
    };
    
    return severityMap[severity] || severity;
}

function formatTreatmentType(type) {
    if (!type) return 'Belirsiz';
    
    const typeMap = {
        'medication': 'İlaç Tedavisi',
        'surgery': 'Cerrahi Müdahale',
        'therapy': 'Terapi',
        'diet': 'Diyet',
        'exercise': 'Egzersiz',
        'other': 'Diğer'
    };
    
    return typeMap[type] || type;
}

function formatOutcome(outcome) {
    if (!outcome) return 'Henüz belirlenmedi';
    
    const outcomeMap = {
        'successful': 'Başarılı',
        'unsuccessful': 'Başarısız',
        'monitoring': 'Takip Ediliyor'
    };
    
    return outcomeMap[outcome] || outcome;
}

function formatRoute(route) {
    if (!route) return 'Belirsiz';
    
    const routeMap = {
        'oral': 'Ağızdan',
        'injection': 'Enjeksiyon',
        'topical': 'Haricen',
        'iv': 'Damar İçi',
        'im': 'Kas İçi',
        'sc': 'Deri Altı'
    };
    
    return routeMap[route] || route;
}

function formatDiagnosisType(type) {
    if (!type) return 'Belirsiz';
    
    const typeMap = {
        'primary': 'Birincil',
        'secondary': 'İkincil',
        'differential': 'Ayırıcı',
        'presumptive': 'Varsayılan',
        'rule_out': 'Dışlanması Gereken'
    };
    
    return typeMap[type] || type;
}

module.exports = {
    getPetMedicalHistory,
    getExaminationSummary,
    getTreatmentReport,
    generateExaminationReportData,
    generateTreatmentReportData,
    getPetHealthSummary,
    getClinicMedicalDashboard,
    completeExamination
};
