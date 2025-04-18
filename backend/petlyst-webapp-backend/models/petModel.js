const pool = require('../config/db');

class Pet {
    // Create a new pet
    static async createPet(petOwnerId, name, species, breed, birthDate, gender, photoUrl) {
        try {
            // Parse birth date into day, month, year if provided
            let birthDay = null;
            let birthMonth = null;
            let birthYear = null;
            
            if (birthDate) {
                const date = new Date(birthDate);
                if (!isNaN(date.getTime())) {
                    birthDay = date.getDate();
                    birthMonth = date.getMonth() + 1; // getMonth returns 0-11
                    birthYear = date.getFullYear();
                }
            }
            
            const query = {
                text: `INSERT INTO "pets" (pet_owner_id, pet_name, pet_species, pet_breed, pet_gender, pet_photo, pet_birth_day, pet_birth_month, pet_birth_year) 
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                       RETURNING pet_id, pet_owner_id, pet_name, pet_species, pet_breed, pet_gender, pet_photo, pet_birth_day, pet_birth_month, pet_birth_year`,
                values: [petOwnerId, name, species, breed, gender, photoUrl || null, birthDay, birthMonth, birthYear]
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Pet creation failed');
            }
            
            // Map the returned columns to the expected format and reconstruct birth date
            const pet = result.rows[0];
            let birthDateFormatted = null;
            
            if (pet.pet_birth_year && pet.pet_birth_month && pet.pet_birth_day) {
                birthDateFormatted = `${pet.pet_birth_year}-${pet.pet_birth_month.toString().padStart(2, '0')}-${pet.pet_birth_day.toString().padStart(2, '0')}`;
            }
            
            return {
                id: pet.pet_id,
                pet_owner_id: pet.pet_owner_id,
                name: pet.pet_name,
                species: pet.pet_species,
                breed: pet.pet_breed,
                gender: pet.pet_gender,
                birth_date: birthDateFormatted,
                photo: pet.pet_photo
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
                const pet = result.rows[0];
                // Reconstruct birth date if all components exist
                let birthDateFormatted = null;
                
                if (pet.pet_birth_year && pet.pet_birth_month && pet.pet_birth_day) {
                    birthDateFormatted = `${pet.pet_birth_year}-${pet.pet_birth_month.toString().padStart(2, '0')}-${pet.pet_birth_day.toString().padStart(2, '0')}`;
                }
                
                // Map the returned columns to the expected format
                return {
                    id: pet.pet_id,
                    pet_owner_id: pet.pet_owner_id,
                    name: pet.pet_name,
                    species: pet.pet_species,
                    breed: pet.pet_breed,
                    gender: pet.pet_gender,
                    birth_date: birthDateFormatted,
                    photo: pet.pet_photo
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
            
            return result.rows.map(pet => {
                // Reconstruct birth date if all components exist
                let birthDateFormatted = null;
                
                if (pet.pet_birth_year && pet.pet_birth_month && pet.pet_birth_day) {
                    birthDateFormatted = `${pet.pet_birth_year}-${pet.pet_birth_month.toString().padStart(2, '0')}-${pet.pet_birth_day.toString().padStart(2, '0')}`;
                }
                
                return {
                    id: pet.pet_id,
                    pet_owner_id: pet.pet_owner_id,
                    name: pet.pet_name,
                    species: pet.pet_species,
                    breed: pet.pet_breed,
                    gender: pet.pet_gender,
                    birth_date: birthDateFormatted,
                    photo: pet.pet_photo
                };
            });
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
            if (updateData.gender) {
                updateFields.push(`pet_gender = $${valueCounter}`);
                values.push(updateData.gender);
                valueCounter++;
            }
            if (updateData.photo !== undefined) {
                updateFields.push(`pet_photo = $${valueCounter}`);
                values.push(updateData.photo);
                valueCounter++;
            }
            
            // Handle birth date update - convert to day, month, year
            if (updateData.birth_date) {
                const date = new Date(updateData.birth_date);
                if (!isNaN(date.getTime())) {
                    updateFields.push(`pet_birth_day = $${valueCounter}`);
                    values.push(date.getDate());
                    valueCounter++;
                    
                    updateFields.push(`pet_birth_month = $${valueCounter}`);
                    values.push(date.getMonth() + 1); // getMonth returns 0-11
                    valueCounter++;
                    
                    updateFields.push(`pet_birth_year = $${valueCounter}`);
                    values.push(date.getFullYear());
                    valueCounter++;
                }
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
                       RETURNING pet_id, pet_owner_id, pet_name, pet_species, pet_breed, pet_gender, pet_photo, pet_birth_day, pet_birth_month, pet_birth_year`,
                values: values
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Pet update failed');
            }
            
            // Map the returned columns to the expected format
            const pet = result.rows[0];
            let birthDateFormatted = null;
            
            if (pet.pet_birth_year && pet.pet_birth_month && pet.pet_birth_day) {
                birthDateFormatted = `${pet.pet_birth_year}-${pet.pet_birth_month.toString().padStart(2, '0')}-${pet.pet_birth_day.toString().padStart(2, '0')}`;
            }
            
            return {
                id: pet.pet_id,
                pet_owner_id: pet.pet_owner_id,
                name: pet.pet_name,
                species: pet.pet_species,
                breed: pet.pet_breed,
                gender: pet.pet_gender,
                birth_date: birthDateFormatted,
                photo: pet.pet_photo
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