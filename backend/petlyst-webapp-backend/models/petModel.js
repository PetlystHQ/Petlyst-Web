const pool = require('../config/db');

class Pet {
    // Create a new pet
    static async createPet(petOwnerId, name, species, breed, birthDate, photoUrl) {
        try {
            const query = {
                text: `INSERT INTO "pets" (pet_owner_id, pet_name, pet_species, pet_breed, pet_birth_date, pet_photo) 
                       VALUES ($1, $2, $3, $4, $5, $6) 
                       RETURNING pet_id, pet_owner_id, pet_name, pet_species, pet_breed, pet_birth_date, pet_photo`,
                values: [petOwnerId, name, species, breed, birthDate || null, photoUrl || null]
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Pet creation failed');
            }
            
            // Map the returned columns to the expected format
            return {
                id: result.rows[0].pet_id,
                pet_owner_id: result.rows[0].pet_owner_id,
                name: result.rows[0].pet_name,
                species: result.rows[0].pet_species,
                breed: result.rows[0].pet_breed,
                birth_date: result.rows[0].pet_birth_date,
                photo: result.rows[0].pet_photo
            };
            
        } catch (error) {
            console.error('Error in createPet:', error);
            throw error;
        }
    }

    // Get pet by id
    static async getPetById(petId) {
        try {
            const query = {
                text: 'SELECT * FROM "pets" WHERE pet_id = $1',
                values: [petId]
            };
            const result = await pool.query(query);
            
            if (result.rows[0]) {
                // Map the returned columns to the expected format
                return {
                    id: result.rows[0].pet_id,
                    pet_owner_id: result.rows[0].pet_owner_id,
                    name: result.rows[0].pet_name,
                    species: result.rows[0].pet_species,
                    breed: result.rows[0].pet_breed,
                    birth_date: result.rows[0].pet_birth_date,
                    photo: result.rows[0].pet_photo
                };
            }
            return null;
        } catch (error) {
            console.error('Error in getPetById:', error);
            throw error;
        }
    }

    // Get all pets for a specific owner
    static async getPetsByOwnerId(ownerId) {
        try {
            const query = {
                text: 'SELECT * FROM "pets" WHERE pet_owner_id = $1',
                values: [ownerId]
            };
            const result = await pool.query(query);
            
            return result.rows.map(pet => ({
                id: pet.pet_id,
                pet_owner_id: pet.pet_owner_id,
                name: pet.pet_name,
                species: pet.pet_species,
                breed: pet.pet_breed,
                birth_date: pet.pet_birth_date,
                photo: pet.pet_photo
            }));
        } catch (error) {
            console.error('Error in getPetsByOwnerId:', error);
            throw error;
        }
    }

    // Update pet information
    static async updatePet(petId, updateData) {
        try {
            // Construct the update query dynamically based on the fields to update
            const updateFields = [];
            const values = [];
            let valueCounter = 1;

            // Only include fields that are provided in the updateData
            if (updateData.name) {
                updateFields.push(`pet_name = $${valueCounter}`);
                values.push(updateData.name);
                valueCounter++;
            }
            if (updateData.species) {
                updateFields.push(`pet_species = $${valueCounter}`);
                values.push(updateData.species);
                valueCounter++;
            }
            if (updateData.breed) {
                updateFields.push(`pet_breed = $${valueCounter}`);
                values.push(updateData.breed);
                valueCounter++;
            }
            if (updateData.birth_date) {
                updateFields.push(`pet_birth_date = $${valueCounter}`);
                values.push(updateData.birth_date);
                valueCounter++;
            }
            if (updateData.photo !== undefined) {
                updateFields.push(`pet_photo = $${valueCounter}`);
                values.push(updateData.photo);
                valueCounter++;
            }

            // If no fields to update, return the current pet data
            if (updateFields.length === 0) {
                return await this.getPetById(petId);
            }

            // Add the petId as the last parameter
            values.push(petId);

            const query = {
                text: `UPDATE "pets" 
                       SET ${updateFields.join(', ')} 
                       WHERE pet_id = $${valueCounter} 
                       RETURNING pet_id, pet_owner_id, pet_name, pet_species, pet_breed, pet_birth_date, pet_photo`,
                values: values
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Pet update failed');
            }
            
            // Map the returned columns to the expected format
            return {
                id: result.rows[0].pet_id,
                pet_owner_id: result.rows[0].pet_owner_id,
                name: result.rows[0].pet_name,
                species: result.rows[0].pet_species,
                breed: result.rows[0].pet_breed,
                birth_date: result.rows[0].pet_birth_date,
                photo: result.rows[0].pet_photo
            };
            
        } catch (error) {
            console.error('Error in updatePet:', error);
            throw error;
        }
    }

    // Delete a pet
    static async deletePet(petId) {
        try {
            const query = {
                text: 'DELETE FROM "pets" WHERE pet_id = $1 RETURNING pet_id',
                values: [petId]
            };
            
            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Pet deletion failed - Pet not found');
            }
            
            return { id: result.rows[0].pet_id };
        } catch (error) {
            console.error('Error in deletePet:', error);
            throw error;
        }
    }
}

module.exports = Pet; 