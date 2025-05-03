const pool = require('../../config/db');

/**
 * Treatment operations
 */

// Create a new treatment
async function createTreatment(treatmentData) {
    try {
        const {
            diagnosis_id,
            treatment_type,
            treatment_name,
            description,
            start_date,
            end_date,
            status,
            notes,
            outcome,
            protocol_id
        } = treatmentData;

        const result = await pool.query(
            `INSERT INTO treatments (
                diagnosis_id,
                treatment_type,
                treatment_name,
                description,
                start_date,
                end_date,
                status,
                notes,
                outcome,
                protocol_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                diagnosis_id,
                treatment_type,
                treatment_name,
                description,
                start_date || new Date(),
                end_date,
                status || 'planned',
                notes,
                outcome,
                protocol_id
            ]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating treatment:', error);
        throw error;
    }
}

// Get a specific treatment by ID
async function getTreatment(treatmentId) {
    try {
        const result = await pool.query(
            `SELECT t.*, 
                    d.diagnosis_name, d.diagnosis_code,
                    e.pet_id, e.examination_id,
                    p.pet_name, p.pet_species, p.pet_breed,
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
             FROM treatments t
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN pets p ON e.pet_id = p.pet_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             WHERE t.treatment_id = $1`,
            [treatmentId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        // Get associated medications
        const medications = await pool.query(
            `SELECT m.*, i.name as medication_name, i.description as medication_description
             FROM medications m
             LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
             WHERE m.treatment_id = $1`,
            [treatmentId]
        );
        
        const treatment = result.rows[0];
        treatment.medications = medications.rows;
        
        return treatment;
    } catch (error) {
        console.error('Error getting treatment:', error);
        throw error;
    }
}

// List treatments with various filters
async function listTreatments(filters, limit = 20, offset = 0) {
    try {
        let query = `
            SELECT t.*, 
                   d.diagnosis_name, d.diagnosis_code,
                   e.pet_id, e.examination_id,
                   p.pet_name, p.pet_species, p.pet_breed,
                   CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
            FROM treatments t
            JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
            JOIN examinations e ON d.examination_id = e.examination_id
            JOIN pets p ON e.pet_id = p.pet_id
            JOIN veterinarians v ON e.vet_id = v.veterinarian_id
            JOIN users u ON v.veterinarian_id = u.user_id
            WHERE 1=1
        `;
        
        const queryParams = [];
        let paramIndex = 1;
        
        // Apply filters
        if (filters.treatment_id) {
            query += ` AND t.treatment_id = $${paramIndex}`;
            queryParams.push(filters.treatment_id);
            paramIndex++;
        }
        
        if (filters.diagnosis_id) {
            query += ` AND t.diagnosis_id = $${paramIndex}`;
            queryParams.push(filters.diagnosis_id);
            paramIndex++;
        }
        
        if (filters.treatment_type) {
            query += ` AND t.treatment_type = $${paramIndex}`;
            queryParams.push(filters.treatment_type);
            paramIndex++;
        }
        
        if (filters.treatment_name) {
            query += ` AND t.treatment_name ILIKE $${paramIndex}`;
            queryParams.push(`%${filters.treatment_name}%`);
            paramIndex++;
        }
        
        if (filters.status) {
            query += ` AND t.status = $${paramIndex}`;
            queryParams.push(filters.status);
            paramIndex++;
        }
        
        if (filters.outcome) {
            query += ` AND t.outcome = $${paramIndex}`;
            queryParams.push(filters.outcome);
            paramIndex++;
        }
        
        if (filters.protocol_id) {
            query += ` AND t.protocol_id = $${paramIndex}`;
            queryParams.push(filters.protocol_id);
            paramIndex++;
        }
        
        if (filters.pet_id) {
            query += ` AND e.pet_id = $${paramIndex}`;
            queryParams.push(filters.pet_id);
            paramIndex++;
        }
        
        if (filters.vet_id) {
            query += ` AND e.vet_id = $${paramIndex}`;
            queryParams.push(filters.vet_id);
            paramIndex++;
        }
        
        if (filters.examination_id) {
            query += ` AND e.examination_id = $${paramIndex}`;
            queryParams.push(filters.examination_id);
            paramIndex++;
        }
        
        // Date range filters
        if (filters.start_date) {
            query += ` AND t.start_date >= $${paramIndex}`;
            queryParams.push(filters.start_date);
            paramIndex++;
        }
        
        if (filters.end_date) {
            query += ` AND (t.end_date <= $${paramIndex} OR t.end_date IS NULL)`;
            queryParams.push(filters.end_date);
            paramIndex++;
        }
        
        // Add order by, limit and offset
        query += ` ORDER BY t.start_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex+1}`;
        queryParams.push(limit, offset);
        
        const result = await pool.query(query, queryParams);
        
        // Get medications for each treatment
        const treatments = result.rows;
        
        if (treatments.length > 0) {
            const treatmentIds = treatments.map(t => t.treatment_id);
            
            const medicationsQuery = `
                SELECT m.*, m.treatment_id, i.name as medication_name, i.description as medication_description
                FROM medications m
                LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
                WHERE m.treatment_id = ANY($1)
            `;
            
            const medicationsResult = await pool.query(medicationsQuery, [treatmentIds]);
            
            // Add medications to each treatment
            const medicationsByTreatment = {};
            medicationsResult.rows.forEach(med => {
                if (!medicationsByTreatment[med.treatment_id]) {
                    medicationsByTreatment[med.treatment_id] = [];
                }
                medicationsByTreatment[med.treatment_id].push(med);
            });
            
            treatments.forEach(treatment => {
                treatment.medications = medicationsByTreatment[treatment.treatment_id] || [];
            });
        }
        
        return treatments;
    } catch (error) {
        console.error('Error listing treatments:', error);
        throw error;
    }
}

// Update treatment
async function updateTreatment(treatmentId, updateData) {
    try {
        const {
            treatment_type,
            treatment_name,
            description,
            start_date,
            end_date,
            status,
            notes,
            outcome
        } = updateData;
        
        // Only update fields that are provided
        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;
        
        if (treatment_type !== undefined) {
            updateFields.push(`treatment_type = $${paramIndex}`);
            queryParams.push(treatment_type);
            paramIndex++;
        }
        
        if (treatment_name !== undefined) {
            updateFields.push(`treatment_name = $${paramIndex}`);
            queryParams.push(treatment_name);
            paramIndex++;
        }
        
        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex}`);
            queryParams.push(description);
            paramIndex++;
        }
        
        if (start_date !== undefined) {
            updateFields.push(`start_date = $${paramIndex}`);
            queryParams.push(start_date);
            paramIndex++;
        }
        
        if (end_date !== undefined) {
            updateFields.push(`end_date = $${paramIndex}`);
            queryParams.push(end_date);
            paramIndex++;
        }
        
        if (status !== undefined) {
            updateFields.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }
        
        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex}`);
            queryParams.push(notes);
            paramIndex++;
        }
        
        if (outcome !== undefined) {
            updateFields.push(`outcome = $${paramIndex}`);
            queryParams.push(outcome);
            paramIndex++;
        }
        
        // Add updated_at
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // If no fields to update, just return the current treatment
        if (updateFields.length === 1) {
            return getTreatment(treatmentId);
        }
        
        queryParams.push(treatmentId);
        
        const query = `
            UPDATE treatments
            SET ${updateFields.join(', ')}
            WHERE treatment_id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await pool.query(query, queryParams);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        // Return the updated treatment with all related data
        return getTreatment(treatmentId);
    } catch (error) {
        console.error('Error updating treatment:', error);
        throw error;
    }
}

// Update treatment status
async function updateTreatmentStatus(treatmentId, status) {
    try {
        const result = await pool.query(
            `UPDATE treatments 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE treatment_id = $2 
             RETURNING *`,
            [status, treatmentId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return getTreatment(treatmentId);
    } catch (error) {
        console.error('Error updating treatment status:', error);
        throw error;
    }
}

// Update treatment outcome
async function updateTreatmentOutcome(treatmentId, outcome) {
    try {
        const result = await pool.query(
            `UPDATE treatments 
             SET outcome = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE treatment_id = $2 
             RETURNING *`,
            [outcome, treatmentId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return getTreatment(treatmentId);
    } catch (error) {
        console.error('Error updating treatment outcome:', error);
        throw error;
    }
}

// Delete treatment
async function deleteTreatment(treatmentId) {
    try {
        // First delete any associated medications
        await pool.query(
            'DELETE FROM medications WHERE treatment_id = $1',
            [treatmentId]
        );
        
        // Then delete the treatment
        const result = await pool.query(
            'DELETE FROM treatments WHERE treatment_id = $1 RETURNING *',
            [treatmentId]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting treatment:', error);
        throw error;
    }
}

// Get all treatments for a diagnosis
async function getDiagnosisTreatments(diagnosisId) {
    try {
        const result = await pool.query(
            `SELECT t.* 
             FROM treatments t
             WHERE t.diagnosis_id = $1
             ORDER BY t.start_date DESC`,
            [diagnosisId]
        );
        
        // Get medications for each treatment
        const treatments = result.rows;
        
        if (treatments.length > 0) {
            const treatmentIds = treatments.map(t => t.treatment_id);
            
            const medicationsQuery = `
                SELECT m.*, m.treatment_id, i.name as medication_name, i.description as medication_description
                FROM medications m
                LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
                WHERE m.treatment_id = ANY($1)
            `;
            
            const medicationsResult = await pool.query(medicationsQuery, [treatmentIds]);
            
            // Add medications to each treatment
            const medicationsByTreatment = {};
            medicationsResult.rows.forEach(med => {
                if (!medicationsByTreatment[med.treatment_id]) {
                    medicationsByTreatment[med.treatment_id] = [];
                }
                medicationsByTreatment[med.treatment_id].push(med);
            });
            
            treatments.forEach(treatment => {
                treatment.medications = medicationsByTreatment[treatment.treatment_id] || [];
            });
        }
        
        return treatments;
    } catch (error) {
        console.error('Error getting diagnosis treatments:', error);
        throw error;
    }
}

// Get all treatments for a pet
async function getPetTreatments(petId) {
    try {
        const result = await pool.query(
            `SELECT t.*, 
                    d.diagnosis_name, d.diagnosis_code,
                    e.examination_id,
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
             FROM treatments t
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             WHERE e.pet_id = $1
             ORDER BY t.start_date DESC`,
            [petId]
        );
        
        // Get medications for each treatment
        const treatments = result.rows;
        
        if (treatments.length > 0) {
            const treatmentIds = treatments.map(t => t.treatment_id);
            
            const medicationsQuery = `
                SELECT m.*, m.treatment_id, i.name as medication_name, i.description as medication_description
                FROM medications m
                LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
                WHERE m.treatment_id = ANY($1)
            `;
            
            const medicationsResult = await pool.query(medicationsQuery, [treatmentIds]);
            
            // Add medications to each treatment
            const medicationsByTreatment = {};
            medicationsResult.rows.forEach(med => {
                if (!medicationsByTreatment[med.treatment_id]) {
                    medicationsByTreatment[med.treatment_id] = [];
                }
                medicationsByTreatment[med.treatment_id].push(med);
            });
            
            treatments.forEach(treatment => {
                treatment.medications = medicationsByTreatment[treatment.treatment_id] || [];
            });
        }
        
        return treatments;
    } catch (error) {
        console.error('Error getting pet treatments:', error);
        throw error;
    }
}

// Get treatment protocols
async function getTreatmentProtocols(species = null) {
    try {
        let query = `
            SELECT * FROM treatment_protocols
            WHERE is_active = true
        `;
        
        const queryParams = [];
        
        if (species) {
            query += ` AND (species = $1 OR species IS NULL)`;
            queryParams.push(species);
        }
        
        query += ` ORDER BY protocol_name`;
        
        const result = await pool.query(query, queryParams);
        return result.rows;
    } catch (error) {
        console.error('Error getting treatment protocols:', error);
        throw error;
    }
}

// Get treatment protocol details with steps
async function getTreatmentProtocolDetails(protocolId) {
    try {
        // Get protocol information
        const protocolResult = await pool.query(
            `SELECT * FROM treatment_protocols WHERE protocol_id = $1`,
            [protocolId]
        );
        
        if (protocolResult.rows.length === 0) {
            return null;
        }
        
        const protocol = protocolResult.rows[0];
        
        // Get protocol steps
        const stepsResult = await pool.query(
            `SELECT * FROM protocol_steps 
             WHERE protocol_id = $1 
             ORDER BY step_order`,
            [protocolId]
        );
        
        protocol.steps = stepsResult.rows;
        
        // Get medications for each step
        if (protocol.steps.length > 0) {
            const stepIds = protocol.steps.map(step => step.step_id);
            
            const medicationsResult = await pool.query(
                `SELECT pm.*, ps.step_order, i.name as medication_name, i.description as medication_description
                 FROM protocol_medications pm
                 JOIN protocol_steps ps ON pm.step_id = ps.step_id
                 LEFT JOIN inventory_items i ON pm.inventory_item_id = i.id
                 WHERE pm.protocol_id = $1
                 ORDER BY ps.step_order`,
                [protocolId]
            );
            
            // Organize medications by step
            const medicationsByStep = {};
            medicationsResult.rows.forEach(med => {
                if (!medicationsByStep[med.step_id]) {
                    medicationsByStep[med.step_id] = [];
                }
                medicationsByStep[med.step_id].push(med);
            });
            
            // Add medications to each step
            protocol.steps.forEach(step => {
                step.medications = medicationsByStep[step.step_id] || [];
            });
        }
        
        return protocol;
    } catch (error) {
        console.error('Error getting treatment protocol details:', error);
        throw error;
    }
}

// Add medication to a treatment
async function addMedicationToTreatment(treatmentId, medicationData) {
    try {
        const {
            inventory_item_id,
            dosage,
            frequency,
            route,
            start_date,
            end_date,
            notes,
            quantity_used
        } = medicationData;
        
        const result = await pool.query(
            `INSERT INTO medications (
                treatment_id,
                inventory_item_id,
                dosage,
                frequency,
                route,
                start_date,
                end_date,
                notes,
                quantity_used
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                treatmentId,
                inventory_item_id,
                dosage,
                frequency,
                route,
                start_date || new Date(),
                end_date,
                notes,
                quantity_used
            ]
        );
        
        // Update inventory quantity if quantity_used is provided
        if (quantity_used && quantity_used > 0 && inventory_item_id) {
            // Get current inventory item details
            const inventoryItemResult = await pool.query(
                `SELECT * FROM inventory_items WHERE id = $1`,
                [inventory_item_id]
            );
            
            if (inventoryItemResult.rows.length > 0) {
                const inventoryItem = inventoryItemResult.rows[0];
                const currentQuantity = inventoryItem.current_quantity;
                const newQuantity = currentQuantity - quantity_used;
                
                // Update inventory quantity
                await pool.query(
                    `UPDATE inventory_items SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                    [newQuantity, inventory_item_id]
                );
                
                // Add inventory transaction
                await pool.query(
                    `INSERT INTO inventory_transactions (
                        id,
                        inventory_item_id,
                        transaction_type,
                        quantity,
                        transaction_date,
                        notes,
                        performed_by_user_id,
                        reference_id,
                        clinic_id,
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
                    [
                        `trans-${Date.now()}`,
                        inventory_item_id,
                        'usage',
                        quantity_used,
                        new Date(),
                        `Used for treatment ID: ${treatmentId}`,
                        medicationData.performed_by_user_id,
                        treatmentId,
                        inventoryItem.clinic_id
                    ]
                );
            }
        }
        
        // Get the medication with inventory item details
        const medication = await pool.query(
            `SELECT m.*, i.name as medication_name, i.description as medication_description 
             FROM medications m
             LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
             WHERE m.medication_id = $1`,
            [result.rows[0].medication_id]
        );
        
        return medication.rows[0];
    } catch (error) {
        console.error('Error adding medication to treatment:', error);
        throw error;
    }
}

// Update medication
async function updateMedication(medicationId, updateData) {
    try {
        const {
            dosage,
            frequency,
            route,
            start_date,
            end_date,
            notes,
            quantity_used
        } = updateData;
        
        // Only update fields that are provided
        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;
        
        if (dosage !== undefined) {
            updateFields.push(`dosage = $${paramIndex}`);
            queryParams.push(dosage);
            paramIndex++;
        }
        
        if (frequency !== undefined) {
            updateFields.push(`frequency = $${paramIndex}`);
            queryParams.push(frequency);
            paramIndex++;
        }
        
        if (route !== undefined) {
            updateFields.push(`route = $${paramIndex}`);
            queryParams.push(route);
            paramIndex++;
        }
        
        if (start_date !== undefined) {
            updateFields.push(`start_date = $${paramIndex}`);
            queryParams.push(start_date);
            paramIndex++;
        }
        
        if (end_date !== undefined) {
            updateFields.push(`end_date = $${paramIndex}`);
            queryParams.push(end_date);
            paramIndex++;
        }
        
        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex}`);
            queryParams.push(notes);
            paramIndex++;
        }
        
        // Quantity used needs special handling for inventory
        let oldQuantityUsed = 0;
        let inventoryItemId = null;
        let treatmentId = null;
        
        if (quantity_used !== undefined) {
            // Get the current medication to calculate quantity difference
            const currentMedication = await pool.query(
                `SELECT * FROM medications WHERE medication_id = $1`,
                [medicationId]
            );
            
            if (currentMedication.rows.length === 0) {
                throw new Error('Medication not found');
            }
            
            oldQuantityUsed = currentMedication.rows[0].quantity_used || 0;
            inventoryItemId = currentMedication.rows[0].inventory_item_id;
            treatmentId = currentMedication.rows[0].treatment_id;
            
            updateFields.push(`quantity_used = $${paramIndex}`);
            queryParams.push(quantity_used);
            paramIndex++;
        }
        
        // Add updated_at
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // If no fields to update, just return the current medication
        if (updateFields.length === 1) {
            const result = await pool.query(
                `SELECT m.*, i.name as medication_name, i.description as medication_description 
                 FROM medications m
                 LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
                 WHERE m.medication_id = $1`,
                [medicationId]
            );
            return result.rows[0];
        }
        
        queryParams.push(medicationId);
        
        const query = `
            UPDATE medications
            SET ${updateFields.join(', ')}
            WHERE medication_id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await pool.query(query, queryParams);
        
        // Update inventory if quantity changed
        if (quantity_used !== undefined && inventoryItemId) {
            const quantityDiff = quantity_used - oldQuantityUsed;
            
            if (quantityDiff !== 0) {
                // Get inventory item
                const inventoryItemResult = await pool.query(
                    `SELECT * FROM inventory_items WHERE id = $1`,
                    [inventoryItemId]
                );
                
                if (inventoryItemResult.rows.length > 0) {
                    const inventoryItem = inventoryItemResult.rows[0];
                    const currentQuantity = inventoryItem.current_quantity;
                    const newQuantity = currentQuantity - quantityDiff;
                    
                    // Update inventory quantity
                    await pool.query(
                        `UPDATE inventory_items SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                        [newQuantity, inventoryItemId]
                    );
                    
                    // Add inventory transaction for the difference
                    if (quantityDiff > 0) {
                        // Additional usage
                        await pool.query(
                            `INSERT INTO inventory_transactions (
                                id,
                                inventory_item_id,
                                transaction_type,
                                quantity,
                                transaction_date,
                                notes,
                                performed_by_user_id,
                                reference_id,
                                clinic_id,
                                created_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
                            [
                                `trans-${Date.now()}`,
                                inventoryItemId,
                                'usage',
                                quantityDiff,
                                new Date(),
                                `Updated usage for treatment ID: ${treatmentId}`,
                                updateData.performed_by_user_id,
                                treatmentId,
                                inventoryItem.clinic_id
                            ]
                        );
                    } else if (quantityDiff < 0) {
                        // Quantity was reduced, add adjustment transaction
                        await pool.query(
                            `INSERT INTO inventory_transactions (
                                id,
                                inventory_item_id,
                                transaction_type,
                                quantity,
                                transaction_date,
                                notes,
                                performed_by_user_id,
                                reference_id,
                                clinic_id,
                                created_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
                            [
                                `trans-${Date.now()}`,
                                inventoryItemId,
                                'adjustment',
                                Math.abs(quantityDiff),
                                new Date(),
                                `Reduced usage for treatment ID: ${treatmentId}`,
                                updateData.performed_by_user_id,
                                treatmentId,
                                inventoryItem.clinic_id
                            ]
                        );
                    }
                }
            }
        }
        
        // Get the updated medication with inventory item details
        const updatedMedication = await pool.query(
            `SELECT m.*, i.name as medication_name, i.description as medication_description 
             FROM medications m
             LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
             WHERE m.medication_id = $1`,
            [medicationId]
        );
        
        return updatedMedication.rows[0];
    } catch (error) {
        console.error('Error updating medication:', error);
        throw error;
    }
}

// Delete medication
async function deleteMedication(medicationId) {
    try {
        // Get the current medication for inventory adjustment
        const currentMedication = await pool.query(
            `SELECT m.*, t.treatment_id, i.clinic_id 
             FROM medications m
             JOIN treatments t ON m.treatment_id = t.treatment_id
             LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
             WHERE m.medication_id = $1`,
            [medicationId]
        );
        
        if (currentMedication.rows.length === 0) {
            throw new Error('Medication not found');
        }
        
        const medication = currentMedication.rows[0];
        const quantityUsed = medication.quantity_used || 0;
        const inventoryItemId = medication.inventory_item_id;
        const treatmentId = medication.treatment_id;
        const clinicId = medication.clinic_id;
        
        // Delete the medication
        const result = await pool.query(
            'DELETE FROM medications WHERE medication_id = $1 RETURNING *',
            [medicationId]
        );
        
        // Update inventory if needed
        if (quantityUsed > 0 && inventoryItemId) {
            // Get current inventory item details
            const inventoryItemResult = await pool.query(
                `SELECT * FROM inventory_items WHERE id = $1`,
                [inventoryItemId]
            );
            
            if (inventoryItemResult.rows.length > 0) {
                const inventoryItem = inventoryItemResult.rows[0];
                const currentQuantity = inventoryItem.current_quantity;
                const newQuantity = currentQuantity + quantityUsed;
                
                // Update inventory quantity
                await pool.query(
                    `UPDATE inventory_items SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                    [newQuantity, inventoryItemId]
                );
                
                // Add inventory transaction
                await pool.query(
                    `INSERT INTO inventory_transactions (
                        id,
                        inventory_item_id,
                        transaction_type,
                        quantity,
                        transaction_date,
                        notes,
                        performed_by_user_id,
                        reference_id,
                        clinic_id,
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
                    [
                        `trans-${Date.now()}`,
                        inventoryItemId,
                        'adjustment',
                        quantityUsed,
                        new Date(),
                        `Removed medication from treatment ID: ${treatmentId}`,
                        medication.performed_by_user_id,
                        treatmentId,
                        clinicId
                    ]
                );
            }
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting medication:', error);
        throw error;
    }
}

module.exports = {
    createTreatment,
    getTreatment,
    listTreatments,
    updateTreatment,
    updateTreatmentStatus,
    updateTreatmentOutcome,
    deleteTreatment,
    getDiagnosisTreatments,
    getPetTreatments,
    getTreatmentProtocols,
    getTreatmentProtocolDetails,
    addMedicationToTreatment,
    updateMedication,
    deleteMedication
};
