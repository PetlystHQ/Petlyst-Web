const express = require('express');
const router = express.Router();
const reviewModel = require('./reviewModel');
const authenticateToken = require('../middleware/authenticateToken');
const { validateReviewData } = require('../utils/validators');

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private (Pet Owner only)
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Validate user is a pet owner
        if (req.user.userType !== 'pet_owner') {
            return res.status(403).json({ message: 'Access denied. Pet owner access only.' });
        }

        const reviewData = {
            appointment_id: req.body.appointment_id,
            clinic_id: req.body.clinic_id,
            pet_owner_id: req.user.userId,
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
        res.status(201).json({
            review,
            message: 'Review submitted successfully. It will be visible after admin approval.'
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(error.message.includes('Cannot create review') ? 400 : 500)
           .json({ message: error.message });
    }
});

/**
 * @route   GET /api/reviews/clinic/:clinicId
 * @desc    Get all approved reviews for a clinic with pagination
 * @access  Public
 */
router.get('/clinic/:clinicId', async (req, res) => {
    try {
        const clinicId = parseInt(req.params.clinicId);
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            // By default, only return approved reviews
            includeAll: false,
            // Add support for rating filter and sort options
            rating: req.query.rating ? parseInt(req.query.rating) : null,
            sort: req.query.sort || 'newest'
        };

        const reviews = await reviewModel.getClinicReviews(clinicId, options);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching clinic reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/reviews/clinics/:clinicId/all
 * @desc    Get all reviews for a clinic (admin access)
 * @access  Private (Admin only)
 */
router.get('/clinics/:clinicId/all', authenticateToken, async (req, res) => {
    try {
        // Validate user is an admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin access only.' });
        }

        const clinicId = parseInt(req.params.clinicId);
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            includeAll: true // Show all reviews including pending and rejected
        };

        const reviews = await reviewModel.getClinicReviews(clinicId, options);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching all clinic reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/reviews/admin/pending
 * @desc    Get all pending reviews for admin approval
 * @access  Private (Admin only)
 */
router.get('/admin/pending', authenticateToken, async (req, res) => {
    try {
        // Validate user is an admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin access only.' });
        }

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
        };

        const pendingReviews = await reviewModel.getPendingReviews(options);
        res.json(pendingReviews);
    } catch (error) {
        console.error('Error fetching pending reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PUT /api/reviews/admin/:reviewId/approve
 * @desc    Approve a review
 * @access  Private (Admin only)
 */
router.put('/admin/:reviewId/approve', authenticateToken, async (req, res) => {
    try {
        // Validate user is an admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin access only.' });
        }

        const reviewId = parseInt(req.params.reviewId);
        const approvedReview = await reviewModel.approveReview(reviewId);
        
        res.json({
            review: approvedReview,
            message: 'Review approved successfully.'
        });
    } catch (error) {
        console.error('Error approving review:', error);
        if (error.message.includes('Review not found')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/reviews/admin/:reviewId
 * @desc    Delete a review by admin
 * @access  Private (Admin only)
 */
router.delete('/admin/:reviewId', authenticateToken, async (req, res) => {
    try {
        // Validate user is an admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin access only.' });
        }

        const reviewId = parseInt(req.params.reviewId);
        const deletedReview = await reviewModel.adminDeleteReview(reviewId);
        
        res.json({
            review: deletedReview,
            message: 'Review deleted successfully by admin.'
        });
    } catch (error) {
        console.error('Error deleting review by admin:', error);
        if (error.message.includes('Review not found')) {
            return res.status(404).json({ message: error.message });
        }
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
router.get('/pet-owner', authenticateToken, async (req, res) => {
    try {
        // Validate user is a pet owner
        if (req.user.userType !== 'pet_owner') {
            return res.status(403).json({ message: 'Access denied. Pet owner access only.' });
        }

        const petOwnerId = req.user.userId;
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
        
        // For public access, only return approved reviews
        if (!req.user || req.user.userType !== 'admin') {
            if (review.approval_status !== 'approved') {
                return res.status(404).json({ message: 'Review not found or not yet approved' });
            }
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
router.put('/:reviewId', authenticateToken, async (req, res) => {
    try {
        // Validate user is a pet owner
        if (req.user.userType !== 'pet_owner') {
            return res.status(403).json({ message: 'Access denied. Pet owner access only.' });
        }

        const reviewId = parseInt(req.params.reviewId);
        const petOwnerId = req.user.userId;
        
        const reviewData = {
            clinic_review_hygiene_rating: req.body.clinic_review_hygiene_rating,
            clinic_review_stuff_behaviour_rating: req.body.clinic_review_stuff_behaviour_rating,
            clinic_review_price_rating: req.body.clinic_review_price_rating,
            comments: req.body.comments
        };

        const review = await reviewModel.updateReview(reviewId, reviewData, petOwnerId);
        res.json({
            review,
            message: 'Review updated successfully. It will be visible after admin approval.'
        });
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
router.delete('/:reviewId', authenticateToken, async (req, res) => {
    try {
        // Validate user is a pet owner
        if (req.user.userType !== 'pet_owner') {
            return res.status(403).json({ message: 'Access denied. Pet owner access only.' });
        }

        const reviewId = parseInt(req.params.reviewId);
        const petOwnerId = req.user.userId;
        
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
router.get('/can-review/clinic/:clinicId', authenticateToken, async (req, res) => {
    try {
        // Validate user is a pet owner
        if (req.user.userType !== 'pet_owner') {
            return res.status(403).json({ message: 'Access denied. Pet owner access only.' });
        }

        const clinicId = parseInt(req.params.clinicId);
        const petOwnerId = req.user.userId;
        
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
