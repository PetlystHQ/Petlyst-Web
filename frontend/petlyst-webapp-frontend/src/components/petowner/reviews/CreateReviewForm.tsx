import React, { useState } from 'react';
import axiosInstance from '../../../utils/axiosConfig';
import StarRating from './StarRating';
import { getApiErrorMessage, getApiErrorResponse } from '../../../utils/errorMessage';
interface Review {
  clinic_review_id: string;
  clinic_id: string;
  clinic_name: string;
  pet_id: string;
  pet_name: string;
  appointment_id: string;
  clinic_review_hygiene_rating: number;
  clinic_review_stuff_behaviour_rating: number;
  clinic_review_price_rating: number;
  comments: string;
  clinic_review_date: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface CreateReviewFormProps {
  appointmentId: string;
  clinicId: string;
  clinicName: string;
  petId: string;
  petName: string;
  appointmentDate: string;
  appointmentStartHour: string;
  appointmentEndHour: string;
  existingReview?: Review; // Optional prop for edit mode
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

const CreateReviewForm: React.FC<CreateReviewFormProps> = ({
  appointmentId,
  clinicId,
  clinicName,
  petId,
  petName,
  appointmentDate,
  appointmentStartHour,
  appointmentEndHour,
  existingReview,
  onSubmitSuccess,
  onCancel
}) => {
  const isEditMode = !!existingReview;
  
  // Form state - initialize with existing values if in edit mode
  const [hygieneRating, setHygieneRating] = useState<number>(
    existingReview ? existingReview.clinic_review_hygiene_rating : 0
  );
  const [staffRating, setStaffRating] = useState<number>(
    existingReview ? existingReview.clinic_review_stuff_behaviour_rating : 0
  );
  const [priceRating, setPriceRating] = useState<number>(
    existingReview ? existingReview.clinic_review_price_rating : 0
  );
  const [comments, setComments] = useState<string>(
    existingReview ? existingReview.comments : ''
  );
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Calculate average rating
  const averageRating = ((hygieneRating + staffRating + priceRating) / 3).toFixed(1);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    
    try {
      const timePart = timeStr.includes('T') 
        ? timeStr.split('T')[1].substring(0, 5) 
        : timeStr.substring(0, 5);
        
      return timePart;
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeStr;
    }
  };
  
  // Submit the review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (hygieneRating === 0 || staffRating === 0 || priceRating === 0) {
      setError('Please provide a rating for all categories');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const reviewData = {
        appointment_id: appointmentId,
        clinic_id: clinicId,
        pet_id: petId,
        clinic_review_hygiene_rating: hygieneRating,
        clinic_review_stuff_behaviour_rating: staffRating,
        clinic_review_price_rating: priceRating,
        comments
      };
      
      let response;
      
      if (isEditMode && existingReview) {
        // Update existing review
        response = await axiosInstance.put(`/reviews/${existingReview.clinic_review_id}`, reviewData);
      } else {
        // Create new review
        response = await axiosInstance.post('/reviews', reviewData);
      }
      
      if (response.data) {
        setSuccess(true);
        // Show success message briefly before redirecting or closing
        setTimeout(() => {
          if (onSubmitSuccess) {
            onSubmitSuccess();
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      
      // Handle duplicate key error specifically
      if (getApiErrorMessage(err)?.includes('duplicate key value violates unique constraint') ||
          getApiErrorMessage(err)?.includes('A review already exists for this appointment')) {
        setError('You have already submitted a review for this appointment. Please edit your existing review instead.');
      } else {
        setError(getApiErrorMessage(err, 'Failed to submit review. Please try again.'));
      }
      
      // If this is a development environment, log additional details
      if (process.env.NODE_ENV === 'development') {
        console.log('Error details:', getApiErrorResponse(err)?.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {isEditMode ? 'Edit Your Review for ' : 'Review Your Visit to '}{clinicName}
      </h2>
      
      {success ? (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6">
          <p className="font-medium">Your review has been {isEditMode ? 'updated' : 'submitted'} successfully!</p>
          <p className="text-sm mt-1">It will be published after admin approval.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-6">
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">Pet:</span> {petName}
              </p>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">Date:</span> {formatDate(appointmentDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">Time:</span> {formatTime(appointmentStartHour)} - {formatTime(appointmentEndHour)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <label className="block text-gray-700 font-medium mb-3">
                Cleanliness and Hygiene
              </label>
              <StarRating rating={hygieneRating} setRating={setHygieneRating} />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <label className="block text-gray-700 font-medium mb-3">
                Staff Behavior and Professionalism
              </label>
              <StarRating rating={staffRating} setRating={setStaffRating} />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <label className="block text-gray-700 font-medium mb-3">
                Price and Value for Money
              </label>
              <StarRating rating={priceRating} setRating={setPriceRating} />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-3">
              Additional Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience (optional)"
            />
          </div>
          
          {hygieneRating > 0 && staffRating > 0 && priceRating > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-gray-700">
                Your overall rating: <span className="font-bold text-amber-500">★ {averageRating}</span>
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className={`px-6 py-2 text-white rounded-md ${
                isSubmitting || success
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : isEditMode ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateReviewForm;
