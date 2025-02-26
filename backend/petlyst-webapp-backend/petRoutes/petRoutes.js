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

        res.json({
            success: true,
            pets: pets
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
        
        res.json({
            success: true,
            pet: pet
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
        const { name, species, breed, birth_date, photo } = req.body;

        // Validate required fields
        if (!name || !species || !breed) {
            return res.status(400).json({
                success: false,
                message: 'Name, species, and breed are required'
            });
        }

        // Create new pet
        const newPet = await Pet.createPet(ownerId, name, species, breed, birth_date, photo);

        res.status(201).json({
            success: true,
            message: 'Pet added successfully',
            pet: newPet
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
        const updateData = req.body;

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

        res.json({
            success: true,
            message: 'Pet updated successfully',
            pet: updatedPet
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