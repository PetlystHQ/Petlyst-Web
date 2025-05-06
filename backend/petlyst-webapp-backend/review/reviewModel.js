const pool = require('../config/db');

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @returns {Promise} - Resolves to the newly created review
 */
async function createReview(reviewData) {
    try {
        // First validate that the appointment exists and is completed
        const appointmentCheck = await pool.query(
            `SELECT a.appointment_id 
             FROM appointments a 
             WHERE a.appointment_id = $1 
             AND a.pet_owner_id = $2 
             AND a.clinic_id = $3 
             AND a.appointment_status = 'completed'`,
            [reviewData.appointment_id, reviewData.pet_owner_id, reviewData.clinic_id]
        );

        if (appointmentCheck.rows.length === 0) {
            throw new Error('Cannot create review: No completed appointment found for this clinic');
        }

        // Check if review already exists for this appointment
        const existingReview = await pool.query(
            'SELECT clinic_review_id FROM reviews WHERE appointment_id = $1',
            [reviewData.appointment_id]
        );

        if (existingReview.rows.length > 0) {
            throw new Error('A review already exists for this appointment');
        }

        // Insert the review (approval_status defaults to 'pending')
        const result = await pool.query(
            `INSERT INTO reviews
            (appointment_id, clinic_id, pet_owner_id, pet_id, 
            clinic_review_hygiene_rating, clinic_review_stuff_behaviour_rating, 
            clinic_review_price_rating, comments, approval_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING *`,
            [
                reviewData.appointment_id,
                reviewData.clinic_id,
                reviewData.pet_owner_id,
                reviewData.pet_id,
                reviewData.clinic_review_hygiene_rating,
                reviewData.clinic_review_stuff_behaviour_rating,
                reviewData.clinic_review_price_rating,
                reviewData.comments
            ]
        );

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

/**
 * Get reviews for a clinic (only approved reviews for public view)
 * @param {number} clinicId - ID of the clinic
 * @param {Object} options - Pagination and filter options
 * @returns {Promise} - Resolves to reviews for the clinic
 */
async function getClinicReviews(clinicId, options = {}) {
    try {
        const { page = 1, limit = 10, includeAll = false } = options;
        const offset = (page - 1) * limit;

        // Base query
        let query = `
            SELECT r.*, 
                po.pet_owner_name,
                p.pet_name,
                p.pet_photo_url
            FROM reviews r
            JOIN pet_owners po ON r.pet_owner_id = po.pet_owner_id
            JOIN pets p ON r.pet_id = p.pet_id
            WHERE r.clinic_id = $1
        `;
        
        // Add approval status filter for public view
        if (!includeAll) {
            query += ` AND r.approval_status = 'approved'`;
        }
        
        query += ` ORDER BY r.clinic_review_date DESC
                   LIMIT $2 OFFSET $3`;

        const result = await pool.query(query, [clinicId, limit, offset]);

        // Count query for pagination
        let countQuery = `SELECT COUNT(*) FROM reviews WHERE clinic_id = $1`;
        if (!includeAll) {
            countQuery += ` AND approval_status = 'approved'`;
        }
        
        const countResult = await pool.query(countQuery, [clinicId]);

        return {
            reviews: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Get pending reviews for admin approval
 * @param {Object} options - Pagination and filter options
 * @returns {Promise} - Resolves to pending reviews for admin approval
 */
async function getPendingReviews(options = {}) {
    try {
        const { page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT r.*, 
                po.pet_owner_name,
                p.pet_name,
                c.clinic_name
             FROM reviews r
             JOIN pet_owners po ON r.pet_owner_id = po.pet_owner_id
             JOIN pets p ON r.pet_id = p.pet_id
             JOIN clinics c ON r.clinic_id = c.clinic_id
             WHERE r.approval_status = 'pending'
             ORDER BY r.clinic_review_date ASC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query(
            "SELECT COUNT(*) FROM reviews WHERE approval_status = 'pending'"
        );

        return {
            reviews: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Get reviews by a pet owner
 * @param {number} petOwnerId - ID of the pet owner
 * @returns {Promise} - Resolves to reviews by the pet owner
 */
async function getPetOwnerReviews(petOwnerId) {
    try {
        const result = await pool.query(
            `SELECT r.*, c.clinic_name
             FROM reviews r
             JOIN clinics c ON r.clinic_id = c.clinic_id
             WHERE r.pet_owner_id = $1
             ORDER BY r.clinic_review_date DESC`,
            [petOwnerId]
        );

        return result.rows;
    } catch (error) {
        throw error;
    }
}

/**
 * Get a single review by ID
 * @param {number} reviewId - ID of the review
 * @returns {Promise} - Resolves to the review data
 */
async function getReviewById(reviewId) {
    try {
        const result = await pool.query(
            `SELECT r.*, 
                po.pet_owner_name,
                p.pet_name,
                c.clinic_name
             FROM reviews r
             JOIN pet_owners po ON r.pet_owner_id = po.pet_owner_id
             JOIN pets p ON r.pet_id = p.pet_id
             JOIN clinics c ON r.clinic_id = c.clinic_id
             WHERE r.clinic_review_id = $1`,
            [reviewId]
        );

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

/**
 * Update a review
 * @param {number} reviewId - ID of the review to update
 * @param {Object} reviewData - Updated review data
 * @param {number} petOwnerId - ID of the pet owner for authorization
 * @returns {Promise} - Resolves to the updated review
 */
async function updateReview(reviewId, reviewData, petOwnerId) {
    try {
        // Check if review exists and belongs to the pet owner
        const reviewCheck = await pool.query(
            'SELECT clinic_review_id FROM reviews WHERE clinic_review_id = $1 AND pet_owner_id = $2',
            [reviewId, petOwnerId]
        );

        if (reviewCheck.rows.length === 0) {
            throw new Error('Review not found or you are not authorized to update it');
        }

        // Reset approval status to pending since the review was modified
        const result = await pool.query(
            `UPDATE reviews
             SET clinic_review_hygiene_rating = COALESCE($1, clinic_review_hygiene_rating),
                 clinic_review_stuff_behaviour_rating = COALESCE($2, clinic_review_stuff_behaviour_rating),
                 clinic_review_price_rating = COALESCE($3, clinic_review_price_rating),
                 comments = COALESCE($4, comments),
                 approval_status = 'pending'
             WHERE clinic_review_id = $5
             RETURNING *`,
            [
                reviewData.clinic_review_hygiene_rating,
                reviewData.clinic_review_stuff_behaviour_rating,
                reviewData.clinic_review_price_rating,
                reviewData.comments,
                reviewId
            ]
        );

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

/**
 * Approve a review
 * @param {number} reviewId - ID of the review to approve
 * @returns {Promise} - Resolves to the approved review
 */
async function approveReview(reviewId) {
    try {
        const result = await pool.query(
            `UPDATE reviews
             SET approval_status = 'approved'
             WHERE clinic_review_id = $1
             RETURNING *`,
            [reviewId]
        );

        if (result.rows.length === 0) {
            throw new Error('Review not found');
        }

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

/**
 * Reject a review
 * @param {number} reviewId - ID of the review to reject
 * @returns {Promise} - Resolves to the rejected review
 */
async function rejectReview(reviewId) {
    try {
        const result = await pool.query(
            `UPDATE reviews
             SET approval_status = 'rejected'
             WHERE clinic_review_id = $1
             RETURNING *`,
            [reviewId]
        );

        if (result.rows.length === 0) {
            throw new Error('Review not found');
        }

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

/**
 * Delete a review
 * @param {number} reviewId - ID of the review to delete
 * @param {number} petOwnerId - ID of the pet owner for authorization
 * @returns {Promise} - Resolves to the deleted review
 */
async function deleteReview(reviewId, petOwnerId) {
    try {
        // Check if review exists and belongs to the pet owner
        const reviewCheck = await pool.query(
            'SELECT clinic_review_id FROM reviews WHERE clinic_review_id = $1 AND pet_owner_id = $2',
            [reviewId, petOwnerId]
        );

        if (reviewCheck.rows.length === 0) {
            throw new Error('Review not found or you are not authorized to delete it');
        }

        const result = await pool.query(
            'DELETE FROM reviews WHERE clinic_review_id = $1 RETURNING *',
            [reviewId]
        );

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

/**
 * Admin delete a review
 * @param {number} reviewId - ID of the review to delete
 * @returns {Promise} - Resolves to the deleted review
 */
async function adminDeleteReview(reviewId) {
    try {
        const result = await pool.query(
            'DELETE FROM reviews WHERE clinic_review_id = $1 RETURNING *',
            [reviewId]
        );

        if (result.rows.length === 0) {
            throw new Error('Review not found');
        }

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

/**
 * Get a clinic's average ratings
 * @param {number} clinicId - ID of the clinic
 * @returns {Promise} - Resolves to the clinic's average ratings
 */
async function getClinicAverageRatings(clinicId) {
    try {
        const result = await pool.query(
            `SELECT 
                AVG(clinic_review_hygiene_rating) as avg_hygiene_rating,
                AVG(clinic_review_stuff_behaviour_rating) as avg_staff_rating,
                AVG(clinic_review_price_rating) as avg_price_rating,
                (
                    AVG(clinic_review_hygiene_rating) + 
                    AVG(clinic_review_stuff_behaviour_rating) + 
                    AVG(clinic_review_price_rating)
                ) / 3 as overall_rating,
                COUNT(*) as total_reviews
             FROM reviews
             WHERE clinic_id = $1 AND approval_status = 'approved'`,
            [clinicId]
        );

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

/**
 * Check if a pet owner can review a clinic
 * @param {number} petOwnerId - ID of the pet owner
 * @param {number} clinicId - ID of the clinic
 * @returns {Promise} - Resolves to eligible appointments that can be reviewed
 */
async function getReviewableAppointments(petOwnerId, clinicId) {
    try {
        const result = await pool.query(
            `SELECT a.appointment_id, a.appointment_date, a.pet_id, p.pet_name
             FROM appointments a
             JOIN pets p ON a.pet_id = p.pet_id
             LEFT JOIN reviews r ON a.appointment_id = r.appointment_id
             WHERE a.pet_owner_id = $1 
             AND a.clinic_id = $2 
             AND a.appointment_status = 'completed'
             AND r.clinic_review_id IS NULL`,
            [petOwnerId, clinicId]
        );

        return result.rows;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createReview,
    getClinicReviews,
    getPetOwnerReviews,
    getReviewById,
    updateReview,
    deleteReview,
    getClinicAverageRatings,
    getReviewableAppointments,
    getPendingReviews,
    approveReview,
    rejectReview,
    adminDeleteReview
};
