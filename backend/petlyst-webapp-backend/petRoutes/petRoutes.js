const express = require('express');
const router = express.Router();
const Pet = require('../models/petModel');
const authenticateToken = require('../middleware/authenticateToken');
const pool = require('../config/db');

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
            pet_profile_photo: pet.photo // Frontend uses pet_profile_photo
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
            pet_profile_photo: pet.photo // Frontend uses pet_profile_photo
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

// Add a new pet
router.post('/add', authenticateToken, async (req, res) => {
    try {
        // Check if the user is a pet owner
        if (req.user.userType !== 'pet_owner') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Only pet owners can add pets.' 
            });
        }

        const ownerId = req.user.userId;
        const { name, species, breed, birth_date, gender, photo } = req.body;

        // Validate required fields
        if (!name || !species || !breed) {
            return res.status(400).json({
                success: false,
                message: 'Name, species, and breed are required'
            });
        }

        // Create new pet
        const newPet = await Pet.createPet(ownerId, name, species, breed, birth_date, gender, photo);

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

// Update a pet
router.put('/:petId', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.userId;
        const { name, species, breed, birth_date, gender, photo } = req.body;
        
        // Prepare update data
        const updateData = {};
        if (name) updateData.name = name;
        if (species) updateData.species = species;
        if (breed) updateData.breed = breed;
        if (birth_date) updateData.birth_date = birth_date;
        if (gender) updateData.gender = gender;
        if (photo !== undefined) updateData.photo = photo;

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

        // Update pet
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
            pet_profile_photo: updatedPet.photo
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

        // Delete pet
        await Pet.deletePet(petId);

        res.json({
            success: true,
            message: 'Pet deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete pet',
            error: error.message
        });
    }
});

module.exports = router; 