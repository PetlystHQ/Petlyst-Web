const pool = require('../../config/db');

/**
 * Medications operations
 */

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

// Get medication by ID
async function getMedication(medicationId) {
    try {
        const result = await pool.query(
            `SELECT m.*, i.name as medication_name, i.description as medication_description,
                    t.treatment_name, t.treatment_id,
                    d.diagnosis_id, d.diagnosis_name,
                    e.examination_id, e.pet_id
             FROM medications m
             LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
             JOIN treatments t ON m.treatment_id = t.treatment_id
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             WHERE m.medication_id = $1`,
            [medicationId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error getting medication:', error);
        throw error;
    }
}

// Get all medications for a treatment
async function getTreatmentMedications(treatmentId) {
    try {
        const result = await pool.query(
            `SELECT m.*, i.name as medication_name, i.description as medication_description 
             FROM medications m
             LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
             WHERE m.treatment_id = $1
             ORDER BY m.start_date DESC`,
            [treatmentId]
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error getting treatment medications:', error);
        throw error;
    }
}

// Get all medications for a pet
async function getPetMedications(petId) {
    try {
        const result = await pool.query(
            `SELECT m.*, i.name as medication_name, i.description as medication_description,
                    t.treatment_name, t.treatment_id,
                    d.diagnosis_id, d.diagnosis_name,
                    e.examination_id
             FROM medications m
             LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
             JOIN treatments t ON m.treatment_id = t.treatment_id
             JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
             JOIN examinations e ON d.examination_id = e.examination_id
             WHERE e.pet_id = $1
             ORDER BY m.start_date DESC`,
            [petId]
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error getting pet medications:', error);
        throw error;
    }
}

// List medications with various filters
async function listMedications(filters, limit = 20, offset = 0) {
    try {
        let query = `
            SELECT m.*, i.name as medication_name, i.description as medication_description,
                   t.treatment_name, t.treatment_id,
                   d.diagnosis_id, d.diagnosis_name,
                   e.examination_id, e.pet_id,
                   p.pet_name, p.pet_species, p.pet_breed
            FROM medications m
            LEFT JOIN inventory_items i ON m.inventory_item_id = i.id
            JOIN treatments t ON m.treatment_id = t.treatment_id
            JOIN diagnoses d ON t.diagnosis_id = d.diagnosis_id
            JOIN examinations e ON d.examination_id = e.examination_id
            JOIN pets p ON e.pet_id = p.pet_id
            WHERE 1=1
        `;
        
        const queryParams = [];
        let paramIndex = 1;
        
        // Apply filters
        if (filters.medication_id) {
            query += ` AND m.medication_id = $${paramIndex}`;
            queryParams.push(filters.medication_id);
            paramIndex++;
        }
        
        if (filters.treatment_id) {
            query += ` AND m.treatment_id = $${paramIndex}`;
            queryParams.push(filters.treatment_id);
            paramIndex++;
        }
        
        if (filters.inventory_item_id) {
            query += ` AND m.inventory_item_id = $${paramIndex}`;
            queryParams.push(filters.inventory_item_id);
            paramIndex++;
        }
        
        if (filters.diagnosis_id) {
            query += ` AND d.diagnosis_id = $${paramIndex}`;
            queryParams.push(filters.diagnosis_id);
            paramIndex++;
        }
        
        if (filters.examination_id) {
            query += ` AND e.examination_id = $${paramIndex}`;
            queryParams.push(filters.examination_id);
            paramIndex++;
        }
        
        if (filters.pet_id) {
            query += ` AND e.pet_id = $${paramIndex}`;
            queryParams.push(filters.pet_id);
            paramIndex++;
        }
        
        if (filters.medication_name) {
            query += ` AND i.name ILIKE $${paramIndex}`;
            queryParams.push(`%${filters.medication_name}%`);
            paramIndex++;
        }
        
        if (filters.route) {
            query += ` AND m.route = $${paramIndex}`;
            queryParams.push(filters.route);
            paramIndex++;
        }
        
        // Date range filters
        if (filters.start_date) {
            query += ` AND m.start_date >= $${paramIndex}`;
            queryParams.push(filters.start_date);
            paramIndex++;
        }
        
        if (filters.end_date) {
            query += ` AND (m.end_date <= $${paramIndex} OR m.end_date IS NULL)`;
            queryParams.push(filters.end_date);
            paramIndex++;
        }
        
        // Add order by, limit and offset
        query += ` ORDER BY m.start_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex+1}`;
        queryParams.push(limit, offset);
        
        const result = await pool.query(query, queryParams);
        
        return result.rows;
    } catch (error) {
        console.error('Error listing medications:', error);
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
            return getMedication(medicationId);
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
        
        // Get the updated medication with all details
        return getMedication(medicationId);
    } catch (error) {
        console.error('Error updating medication:', error);
        throw error;
    }
}

// Delete medication
async function deleteMedication(medicationId, performed_by_user_id) {
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
                        performed_by_user_id,
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

// Get inventory medications
async function getInventoryMedications(clinicId) {
    try {
        const result = await pool.query(
            `SELECT id, name, description, category, current_quantity, unit, reorder_level, cost_price
             FROM inventory_items
             WHERE clinic_id = $1 AND (category = 'medication' OR category = 'medical_supply')
             ORDER BY name`,
            [clinicId]
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error getting inventory medications:', error);
        throw error;
    }
}

module.exports = {
    addMedicationToTreatment,
    getMedication,
    getTreatmentMedications,
    getPetMedications,
    listMedications,
    updateMedication,
    deleteMedication,
    getInventoryMedications
};
