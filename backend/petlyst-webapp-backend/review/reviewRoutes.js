const express = require('express');
const router = express.Router();
const reviewModel = require('./reviewModel');
const authMiddleware = require('../middleware/authMiddleware');
const { validateReviewData } = require('../utils/validators');

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private (Pet Owner only)
 */
router.post('/', authMiddleware.verifyPetOwner, async (req, res) => {
    try {
        const reviewData = {
            appointment_id: req.body.appointment_id,
            clinic_id: req.body.clinic_id,
            pet_owner_id: req.user.pet_owner_id,
            pet_id: req.body.pet_id,
            clinic_review_hygiene_rating: req.body.clinic_review_hygiene_rating,
            clinic_review_stuff_behaviour_rating: req.body.clinic_review_stuff_behaviour_rating,
            clinic_review_price_rating: req.body.clinic_review_price_rating,
            comments: req.body.comments
        };

        // Validate review data
        const validationErrors = validateReviewData(reviewData);
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }

        const review = await reviewModel.createReview(reviewData);
        res.status(201).json(review);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(error.message.includes('Cannot create review') ? 400 : 500)
           .json({ message: error.message });
    }
});

/**
 * @route   GET /api/reviews/clinic/:clinicId
 * @desc    Get all reviews for a clinic with pagination
 * @access  Public
 */
router.get('/clinic/:clinicId', async (req, res) => {
    try {
        const clinicId = parseInt(req.params.clinicId);
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
        };

        const reviews = await reviewModel.getClinicReviews(clinicId, options);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching clinic reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/reviews/clinics/:clinicId/stats
 * @desc    Get average ratings for a clinic
 * @access  Public
 */
router.get('/clinics/:clinicId/stats', async (req, res) => {
    try {
        const clinicId = parseInt(req.params.clinicId);
        const stats = await reviewModel.getClinicAverageRatings(clinicId);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching clinic review stats:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/reviews/pet-owner
 * @desc    Get all reviews by the authenticated pet owner
 * @access  Private (Pet Owner only)
 */
router.get('/pet-owner', authMiddleware.verifyPetOwner, async (req, res) => {
    try {
        const petOwnerId = req.user.pet_owner_id;
        const reviews = await reviewModel.getPetOwnerReviews(petOwnerId);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching pet owner reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/reviews/:reviewId
 * @desc    Get a single review by ID
 * @access  Public
 */
router.get('/:reviewId', async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId);
        const review = await reviewModel.getReviewById(reviewId);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        res.json(review);
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Update a review
 * @access  Private (Pet Owner only, owner of the review)
 */
router.put('/:reviewId', authMiddleware.verifyPetOwner, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId);
        const petOwnerId = req.user.pet_owner_id;
        
        const reviewData = {
            clinic_review_hygiene_rating: req.body.clinic_review_hygiene_rating,
            clinic_review_stuff_behaviour_rating: req.body.clinic_review_stuff_behaviour_rating,
            clinic_review_price_rating: req.body.clinic_review_price_rating,
            comments: req.body.comments
        };

        const review = await reviewModel.updateReview(reviewId, reviewData, petOwnerId);
        res.json(review);
    } catch (error) {
        console.error('Error updating review:', error);
        if (error.message.includes('not authorized')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (Pet Owner only, owner of the review)
 */
router.delete('/:reviewId', authMiddleware.verifyPetOwner, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId);
        const petOwnerId = req.user.pet_owner_id;
        
        const review = await reviewModel.deleteReview(reviewId, petOwnerId);
        res.json({ message: 'Review deleted successfully', review });
    } catch (error) {
        console.error('Error deleting review:', error);
        if (error.message.includes('not authorized')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/reviews/can-review/clinic/:clinicId
 * @desc    Check if pet owner can review a clinic and get reviewable appointments
 * @access  Private (Pet Owner only)
 */
router.get('/can-review/clinic/:clinicId', authMiddleware.verifyPetOwner, async (req, res) => {
    try {
        const clinicId = parseInt(req.params.clinicId);
        const petOwnerId = req.user.pet_owner_id;
        
        const reviewableAppointments = await reviewModel.getReviewableAppointments(petOwnerId, clinicId);
        
        res.json({
            canReview: reviewableAppointments.length > 0,
            reviewableAppointments
        });
    } catch (error) {
        console.error('Error checking review eligibility:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
