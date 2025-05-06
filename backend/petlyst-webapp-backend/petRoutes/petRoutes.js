const express = require('express');
const router = express.Router();
const Pet = require('../models/petModel');
const authenticateToken = require('../middleware/authenticateToken');
const pool = require('../config/db');
// Add new imports for file uploading
const multer = require('multer');
const s3Service = require('../aws/s3Service');
const { uploadPetPhoto, deletePetPhoto } = s3Service;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all pets for the authenticated user (pet owner)
router.get('/my-pets', authenticateToken, async (req, res) => {
    try {
        // Check if the user is a pet owner
        if (req.user.userType !== 'pet_owner') {
            return res.status(403).json({ message: 'Access denied. User is not a pet owner.' });
        }

        const ownerId = req.user.userId;
        const pets = await Pet.getPetsByOwnerId(ownerId);

        // Transform pet data for frontend compatibility if needed
        const transformedPets = pets.map(pet => ({
            pet_id: pet.id,
            pet_name: pet.name,
            pet_type: pet.species, // Frontend uses pet_type instead of species
            pet_breed: pet.breed,
            pet_birth_date: pet.birth_date,
            pet_gender: pet.gender,
            pet_owner_id: pet.pet_owner_id,
            pet_profile_photo: pet.photo, // Frontend uses pet_profile_photo
            pet_status: pet.status // Add status to frontend response
        }));

        res.json({
            success: true,
            pets: transformedPets
        });
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pets',
            error: error.message
        });
    }
});

// Get a specific pet by ID
router.get('/:petId', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.userId;
        
        // Get the pet
        const pet = await Pet.getPetById(petId);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check if pet is deleted and user is not an admin
        if (pet.status === 'deleted' && req.user.userType !== 'admin') {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check if the user is the owner of the pet or a veterinarian
        if (req.user.userType === 'pet_owner' && pet.pet_owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this pet.'
            });
        }
        
        // Transform pet data for frontend compatibility
        const transformedPet = {
            pet_id: pet.id,
            pet_name: pet.name,
            pet_type: pet.species, // Frontend uses pet_type instead of species
            pet_breed: pet.breed,
            pet_birth_date: pet.birth_date,
            pet_gender: pet.gender,
            pet_owner_id: pet.pet_owner_id,
            pet_profile_photo: pet.photo, // Frontend uses pet_profile_photo
            pet_status: pet.status
        };
        
        res.json({
            success: true,
            pet: transformedPet
        });
    } catch (error) {
        console.error('Error fetching pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pet details',
            error: error.message
        });
    }
});

// Update the add pet route to handle file uploads
router.post('/add', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        // Check if the user is a pet owner
        if (req.user.userType !== 'pet_owner') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Only pet owners can add pets.' 
            });
        }

        const ownerId = req.user.userId;
        const { name, species, breed, birth_date, birth_day, birth_month, birth_year, gender } = req.body;

        // Validate required fields
        if (!name || !species || !breed) {
            return res.status(400).json({
                success: false,
                message: 'Name, species, and breed are required'
            });
        }

        let photoUrl = null;
        
        // Upload photo to S3 if provided
        if (req.file) {
            try {
                const uploadResult = await uploadPetPhoto(req.file, ownerId, name);
                photoUrl = uploadResult.url;
                console.log('Pet photo uploaded successfully:', photoUrl);
            } catch (uploadError) {
                console.error('Failed to upload pet photo:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload pet photo. Please try again.',
                    error: uploadError.message
                });
            }
        }

        // Create new pet with the S3 photo URL and birth date components
        const newPet = await Pet.createPet(
            ownerId, 
            name, 
            species, 
            breed, 
            birth_date, 
            gender, 
            photoUrl,
            birth_day,
            birth_month,
            birth_year
        );

        // Transform for frontend
        const transformedPet = {
            pet_id: newPet.id,
            pet_name: newPet.name,
            pet_type: newPet.species,
            pet_breed: newPet.breed,
            pet_birth_date: newPet.birth_date,
            pet_gender: newPet.gender,
            pet_owner_id: newPet.pet_owner_id,
            pet_profile_photo: newPet.photo
        };

        res.status(201).json({
            success: true,
            message: 'Pet added successfully',
            pet: transformedPet
        });
    } catch (error) {
        console.error('Error adding pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add pet',
            error: error.message
        });
    }
});

// Update the update pet route to handle file uploads
router.put('/:petId', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.userId;
        const { name, species, breed, birth_date, gender, removePhoto } = req.body;
        
        // Check if pet exists and belongs to the user
        const pet = await Pet.getPetById(petId);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check if pet is deleted
        if (pet.status === 'deleted') {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Verify ownership
        if (req.user.userType === 'pet_owner' && pet.pet_owner_id !== userId) {
            return res.status(403).json({
                success: false, 
                message: 'Access denied. You do not own this pet.'
            });
        }

        // Prepare update data
        const updateData = {};
        if (name) updateData.name = name;
        if (species) updateData.species = species;
        if (breed) updateData.breed = breed;
        if (birth_date) updateData.birth_date = birth_date;
        if (gender) updateData.gender = gender;
        
        // Handle photo update logic
        if (req.file) {
            try {
                // Delete old photo if exists
                if (pet.photo) {
                    try {
                        // Extract key from URL
                        const key = pet.photo.split('.com/')[1];
                        await deletePetPhoto(key).catch(err => {
                            console.warn('Failed to delete old pet photo:', err);
                            // Continue even if delete fails
                        });
                    } catch (deleteError) {
                        console.warn('Error processing photo URL:', deleteError);
                    }
                }
                
                // Upload new photo (use the updated name if it exists, otherwise use existing name)
                const petName = name || pet.name;
                const uploadResult = await uploadPetPhoto(req.file, pet.pet_owner_id, petName);
                updateData.photo = uploadResult.url;
                console.log('Pet photo updated successfully:', updateData.photo);
            } catch (uploadError) {
                console.error('Failed to upload pet photo:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload pet photo. Please try again.',
                    error: uploadError.message
                });
            }
        } else if (removePhoto === 'true' && pet.photo) {
            // Handle photo removal if explicitly requested
            try {
                // Extract key from URL
                const key = pet.photo.split('.com/')[1];
                await deletePetPhoto(key).catch(err => {
                    console.warn('Failed to delete pet photo:', err);
                });
                updateData.photo = null;
            } catch (deleteError) {
                console.warn('Error processing photo URL for deletion:', deleteError);
            }
        }

        // Update pet with all the changes
        const updatedPet = await Pet.updatePet(petId, updateData);

        // Transform for frontend
        const transformedPet = {
            pet_id: updatedPet.id,
            pet_name: updatedPet.name,
            pet_type: updatedPet.species,
            pet_breed: updatedPet.breed,
            pet_birth_date: updatedPet.birth_date,
            pet_gender: updatedPet.gender,
            pet_owner_id: updatedPet.pet_owner_id,
            pet_profile_photo: updatedPet.photo,
            pet_status: updatedPet.status
        };

        res.json({
            success: true,
            message: 'Pet updated successfully',
            pet: transformedPet
        });
    } catch (error) {
        console.error('Error updating pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update pet',
            error: error.message
        });
    }
});

// Delete a pet
router.delete('/:petId', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.userId;

        // Check if pet exists and belongs to the user
        const pet = await Pet.getPetById(petId);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Verify ownership
        if (req.user.userType === 'pet_owner' && pet.pet_owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this pet.'
            });
        }

        // Instead of deleting the pet, update its status to 'deleted'
        await Pet.updatePetStatus(petId, 'deleted');

        res.json({
            success: true,
            message: 'Pet marked as deleted successfully'
        });
    } catch (error) {
        console.error('Error marking pet as deleted:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark pet as deleted',
            error: error.message
        });
    }
});

// Add chip number to a pet
router.post('/:petId/chip', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const { chipNumber } = req.body;
        const userId = req.user.userId;
        
        // Validate chip number
        if (!chipNumber || chipNumber.length !== 15 || !/^\d+$/.test(chipNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Chip number must be 15 digits'
            });
        }
        
        // Check if pet exists
        const pet = await Pet.getPetById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check if pet is deleted and user is not an admin
        if (pet.status === 'deleted') {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check authorization (pet owner or veterinarian)
        if (req.user.userType === 'pet_owner' && pet.pet_owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this pet.'
            });
        }
        
        // Add chip number to pet
        const result = await pool.query(
            'UPDATE pets SET chip_number = $1 WHERE pet_id = $2 AND chip_number IS NULL RETURNING *',
            [chipNumber, petId]
        );
        
        if (result.rowCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'Chip number already exists for this pet or pet not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Chip number added successfully',
            chipNumber: chipNumber
        });
    } catch (error) {
        console.error('Error adding chip number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add chip number',
            error: error.message
        });
    }
});

// Get chip number of a pet
router.get('/:petId/chip', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.userId;
        
        // Check if pet exists
        const pet = await Pet.getPetById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check if pet is deleted and user is not an admin
        if (pet.status === 'deleted') {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check authorization (pet owner or veterinarian)
        if (req.user.userType === 'pet_owner' && pet.pet_owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this pet.'
            });
        }
        
        // Get chip number
        const result = await pool.query(
            'SELECT chip_number FROM pets WHERE pet_id = $1',
            [petId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        res.json({
            success: true,
            chipNumber: result.rows[0].chip_number
        });
    } catch (error) {
        console.error('Error getting chip number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get chip number',
            error: error.message
        });
    }
});

// Update chip number of a pet
router.put('/:petId/chip', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const { chipNumber } = req.body;
        const userId = req.user.userId;
        
        // Validate chip number
        if (!chipNumber || chipNumber.length !== 15 || !/^\d+$/.test(chipNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Chip number must be 15 digits'
            });
        }
        
        // Check if pet exists
        const pet = await Pet.getPetById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check if pet is deleted and user is not an admin
        if (pet.status === 'deleted') {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check authorization (pet owner or veterinarian)
        if (req.user.userType === 'pet_owner' && pet.pet_owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this pet.'
            });
        }
        
        // Update chip number
        const result = await pool.query(
            'UPDATE pets SET chip_number = $1 WHERE pet_id = $2 RETURNING *',
            [chipNumber, petId]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Chip number updated successfully',
            chipNumber: chipNumber
        });
    } catch (error) {
        console.error('Error updating chip number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update chip number',
            error: error.message
        });
    }
});

// Delete chip number from a pet
router.delete('/:petId/chip', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.userId;
        
        // Check if pet exists
        const pet = await Pet.getPetById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check if pet is deleted and user is not an admin
        if (pet.status === 'deleted') {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check authorization (pet owner or veterinarian)
        if (req.user.userType === 'pet_owner' && pet.pet_owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this pet.'
            });
        }
        
        // Delete chip number
        const result = await pool.query(
            'UPDATE pets SET chip_number = NULL WHERE pet_id = $1 RETURNING *',
            [petId]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Chip number removed successfully'
        });
    } catch (error) {
        console.error('Error removing chip number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove chip number',
            error: error.message
        });
    }
});

module.exports = router; 