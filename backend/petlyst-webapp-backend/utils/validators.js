/**
 * Validates review data
 * @param {Object} reviewData - Review data to validate
 * @returns {Array} - Array of validation errors, empty if no errors
 */
function validateReviewData(reviewData) {
    const errors = [];

    // Required fields
    if (!reviewData.appointment_id) {
        errors.push('Appointment ID is required');
    }

    if (!reviewData.clinic_id) {
        errors.push('Clinic ID is required');
    }

    if (!reviewData.pet_owner_id) {
        errors.push('Pet owner ID is required');
    }

    if (!reviewData.pet_id) {
        errors.push('Pet ID is required');
    }

    // Validate ratings (must be between 1 and 5)
    if (reviewData.clinic_review_hygiene_rating) {
        const rating = parseFloat(reviewData.clinic_review_hygiene_rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push('Hygiene rating must be between 1 and 5');
        }
    } else {
        errors.push('Hygiene rating is required');
    }

    if (reviewData.clinic_review_stuff_behaviour_rating) {
        const rating = parseFloat(reviewData.clinic_review_stuff_behaviour_rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push('Staff behavior rating must be between 1 and 5');
        }
    } else {
        errors.push('Staff behavior rating is required');
    }

    if (reviewData.clinic_review_price_rating) {
        const rating = parseFloat(reviewData.clinic_review_price_rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push('Price rating must be between 1 and 5');
        }
    } else {
        errors.push('Price rating is required');
    }

    // Comments are optional but should be a string if provided
    if (reviewData.comments && typeof reviewData.comments !== 'string') {
        errors.push('Comments must be a string');
    }

    return errors;
}

module.exports = {
    validateReviewData
}; 