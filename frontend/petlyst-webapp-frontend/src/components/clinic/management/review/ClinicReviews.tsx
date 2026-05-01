import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '../../../../store';
import { API_URL } from '../../../../config/api';

// Set to true to show sample data when no reviews exist (for development)
const SHOW_SAMPLE_DATA = false;

interface Review {
  clinic_review_id: string;
  appointment_id: string;
  clinic_id: string;
  pet_owner_id: string;
  pet_owner_name: string; // This comes from the join in the backend
  pet_id: string;
  pet_name: string; // This comes from the join in the backend
  clinic_review_hygiene_rating: number;
  clinic_review_stuff_behaviour_rating: number;
  clinic_review_price_rating: number;
  comments: string;
  approval_status: string;
  clinic_review_date: string;
  avg_rating: number;
}

interface ReviewStats {
  avg_hygiene_rating: number;
  avg_staff_rating: number;
  avg_price_rating: number;
  overall_rating: number;
  total_reviews: number;
}

interface ClinicReviewsProps {
  clinicId?: string;
}

// Sample data for development/testing
const sampleReviews: Review[] = [
  {
    clinic_review_id: 'sample1',
    appointment_id: 'app1',
    clinic_id: '75',
    pet_owner_id: 'owner1',
    pet_owner_name: 'John Smith',
    pet_id: 'pet1',
    pet_name: 'Buddy',
    clinic_review_hygiene_rating: 5,
    clinic_review_stuff_behaviour_rating: 5,
    clinic_review_price_rating: 4,
    comments: 'Great experience! The staff was very friendly and the clinic was clean.',
    approval_status: 'approved',
    clinic_review_date: new Date().toISOString(),
    avg_rating: 4.7
  },
  {
    clinic_review_id: 'sample2',
    appointment_id: 'app2',
    clinic_id: '75',
    pet_owner_id: 'owner2',
    pet_owner_name: 'Sarah Johnson',
    pet_id: 'pet2',
    pet_name: 'Max',
    clinic_review_hygiene_rating: 4,
    clinic_review_stuff_behaviour_rating: 5,
    clinic_review_price_rating: 3,
    comments: 'Very professional service. The prices are a bit high, but the quality is good.',
    approval_status: 'approved',
    clinic_review_date: new Date(Date.now() - 7*24*60*60*1000).toISOString(), // 7 days ago
    avg_rating: 4
  }
];

const sampleStats: ReviewStats = {
  avg_hygiene_rating: 4.5,
  avg_staff_rating: 5,
  avg_price_rating: 3.5,
  overall_rating: 4.3,
  total_reviews: 2
};

const ClinicReviews: React.FC<ClinicReviewsProps> = ({ clinicId }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({1: 0, 2: 0, 3: 0, 4: 0, 5: 0});
  const [showGrowingTrustTips, setShowGrowingTrustTips] = useState<boolean>(true);

  // Filter states
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchReviewsAndStats = async () => {
      if (!clinicId) {
        console.error("Missing clinicId, cannot fetch reviews");
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching reviews for clinic ID: ${clinicId}`);

        // Fetch review statistics
        console.log("Fetching clinic stats from:", `/api/reviews/clinics/${clinicId}/stats`);
        const statsResponse = await axios.get(`${API_URL}/api/reviews/clinics/${clinicId}/stats`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        console.log("Stats response:", statsResponse.data);
        
        if (statsResponse.data) {
          // Map backend field names to our interface
          const statsData: ReviewStats = {
            avg_hygiene_rating: statsResponse.data.avg_hygiene_rating || 0,
            avg_staff_rating: statsResponse.data.avg_staff_rating || 0,
            avg_price_rating: statsResponse.data.avg_price_rating || 0,
            overall_rating: statsResponse.data.overall_rating || 0,
            total_reviews: Number(statsResponse.data.total_reviews) || 0
          };
          
          setStats(statsData);
          setAverageRating(statsData.overall_rating);
          
          console.log("Setting average rating to:", statsData.overall_rating);
        } else {
          console.warn("No stats data received from the server");
        }
        
        // Map the frontend sort option to the backend sort parameter
        let sortParam = 'newest';
        switch(sortBy) {
          case 'oldest':
            sortParam = 'oldest';
            break;
          case 'highest':
            sortParam = 'highest';
            break;
          case 'lowest':
            sortParam = 'lowest';
            break;
          default:
            sortParam = 'newest';
        }
        
        // Fetch reviews - should match what the backend expects
        console.log("Fetching reviews from:", `/api/reviews/clinic/${clinicId}`);
        console.log("With params:", { page, limit: 10, sort: sortParam, rating: filterRating });
        
        const reviewsResponse = await axios.get(`${API_URL}/api/reviews/clinic/${clinicId}`, {
          params: {
            page,
            limit: 10,
            sort: sortParam,
            rating: filterRating
          },
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        console.log("Reviews response:", reviewsResponse.data);
        
        let reviewsData: Review[] = [];
        let totalPagesCount = 0;
        
        if (reviewsResponse.data && reviewsResponse.data.reviews) {
          reviewsData = reviewsResponse.data.reviews;
          totalPagesCount = reviewsResponse.data.totalPages || 1;
        } else {
          console.warn("No reviews data in response or unexpected response format");
        }
        
        // If we have no real reviews and debug mode is on, use sample data
        if (SHOW_SAMPLE_DATA && reviewsData.length === 0) {
          reviewsData = sampleReviews;
          totalPagesCount = 1;
          
          // If we're also showing sample stats
          if (!stats || stats.total_reviews === 0) {
            setStats(sampleStats);
            setAverageRating(sampleStats.overall_rating);
          }
          console.log("Using sample data for demonstration");
        }
        
        setReviews(reviewsData);
        setTotalPages(totalPagesCount);
        
        // Calculate ratings distribution
        const counts: Record<number, number> = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
        reviewsData.forEach((review: Review) => {
          const avgRating = Math.round(review.avg_rating);
          if (avgRating >= 1 && avgRating <= 5) {
            counts[avgRating] = (counts[avgRating] || 0) + 1;
          }
        });
        setRatingCounts(counts);
        
        console.log("Successfully set reviews:", reviewsData.length);
        console.log("Rating counts:", counts);
        
      } catch (err: any) {
        console.error('Error fetching reviews:', err);
        console.error('Error details:', err.response?.data);
        setError(err.response?.data?.message || `Error fetching reviews: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviewsAndStats();
  }, [clinicId, token, page, sortBy, filterRating]);

  // Generate advice based on category ratings
  const generateCategoryAdvice = (category: string, rating: number): string => {
    if (!rating) return '';
    
    if (category === 'hygiene') {
      if (rating < 3) {
        return 'Clinic cleanliness needs significant improvement. Focus on regular cleaning schedules and sanitization protocols.';
      } else if (rating < 4) {
        return 'Your hygiene rating is satisfactory but could be improved. Consider adding more frequent disinfection procedures.';
      } else {
        return 'You maintain excellent hygiene standards. Keep up the good work and ensure consistent cleaning protocols.';
      }
    }
    
    if (category === 'staff') {
      if (rating < 3) {
        return 'Staff behavior ratings indicate concerns. Consider staff training programs focusing on client interaction and communication.';
      } else if (rating < 4) {
        return 'Your staff rating is good, but some clients see room for improvement. Regular customer service workshops could be beneficial.';
      } else {
        return 'Your staff receives excellent ratings. Continue to foster a positive work environment and recognize outstanding service.';
      }
    }
    
    if (category === 'price') {
      if (rating < 3) {
        return 'Clients find your pricing high compared to the value received. Consider reviewing your fee structure or offering tiered service options.';
      } else if (rating < 4) {
        return 'Your pricing is considered reasonable, but more transparency about costs could improve satisfaction.';
      } else {
        return 'Clients find your pricing fair and transparent. Continue to provide clear cost explanations and consider loyalty programs.';
      }
    }
    
    return '';
  };

  // Render star rating component
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Trust Insights & Reviews</h2>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Growing Trust Tips - Now at the top and collapsible */}
      <div className="mb-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setShowGrowingTrustTips(!showGrowingTrustTips)}
        >
          <h3 className="text-lg font-medium text-blue-900">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Growing Trust
            </span>
          </h3>
          <svg 
            className={`h-5 w-5 text-blue-500 transform ${showGrowingTrustTips ? 'rotate-180' : ''} transition-transform duration-200`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {showGrowingTrustTips && (
          <div className="mt-4">
            <p className="text-blue-700 mb-4">
              Reviews are a vital part of building trust with potential clients. Here are some tips to improve your clinic's online reputation:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-blue-600">
              <li>Encourage satisfied clients to leave reviews</li>
              <li>Respond professionally to all reviews, both positive and negative</li>
              <li>Address concerns mentioned in reviews to show you value feedback</li>
              <li>Incorporate constructive criticism to improve your services</li>
              <li>Highlight positive reviews in your marketing materials</li>
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Rating Overview */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 shadow-sm">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Rating Overview</h3>
          
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl font-bold text-blue-700 mr-2">
              {stats?.overall_rating !== undefined ? stats.overall_rating.toFixed(1) : "N/A"}
            </div>
            <div className="flex flex-col">
              {renderStars(Math.round(stats?.overall_rating || 0))}
              <span className="text-sm text-blue-600 mt-1">
                {stats?.total_reviews || 0} {(stats?.total_reviews || 0) === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center">
                <div className="w-12 text-sm text-gray-600">{star} stars</div>
                <div className="flex-grow ml-2">
                  <div className="bg-gray-200 h-2 rounded-full overflow-hidden w-full">
                    <div 
                      className={`h-full rounded-full ${star >= 4 ? 'bg-green-500' : star >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ 
                        width: `${stats?.total_reviews && stats?.total_reviews > 0 ? 
                          ((ratingCounts[star] || 0) / stats.total_reviews) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="ml-2 text-sm text-gray-600 w-8 text-right">
                  {ratingCounts[star] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Category Ratings */}
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 shadow-sm">
          <h3 className="text-lg font-medium text-purple-900 mb-3">Category Ratings</h3>
          <div className="space-y-4">
            {/* Hygiene Rating */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-purple-800">Hygiene</span>
                <span className="text-sm font-bold text-purple-800">
                  {stats?.avg_hygiene_rating !== undefined ? stats.avg_hygiene_rating.toFixed(1) : "N/A"}
                </span>
              </div>
              <div className="bg-purple-200 h-2.5 rounded-full">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: `${((stats?.avg_hygiene_rating || 0) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Staff Behavior Rating */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-purple-800">Staff Behavior</span>
                <span className="text-sm font-bold text-purple-800">
                  {stats?.avg_staff_rating !== undefined ? stats.avg_staff_rating.toFixed(1) : "N/A"}
                </span>
              </div>
              <div className="bg-purple-200 h-2.5 rounded-full">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: `${((stats?.avg_staff_rating || 0) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Price Rating */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-purple-800">Price Fairness</span>
                <span className="text-sm font-bold text-purple-800">
                  {stats?.avg_price_rating !== undefined ? stats.avg_price_rating.toFixed(1) : "N/A"}
                </span>
              </div>
              <div className="bg-purple-200 h-2.5 rounded-full">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: `${((stats?.avg_price_rating || 0) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trust Score */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-100 shadow-sm">
          <h3 className="text-lg font-medium text-green-900 mb-3">Trust Score</h3>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#d1fae5" 
                  strokeWidth="10"
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 45 * ((stats?.overall_rating || 0) / 5)} ${2 * Math.PI * 45}`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-green-700">
                {Math.round(((stats?.overall_rating || 0) / 5) * 100)}%
              </div>
            </div>
            <p className="text-center text-green-700">Based on {stats?.total_reviews || 0} reviews</p>
          </div>
        </div>
      </div>

      {/* Improvement Advice Section */}
      <div className="mb-8 bg-amber-50 p-6 rounded-lg border border-amber-100">
        <h3 className="text-lg font-medium text-amber-900 mb-3">
          <span className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Insights &amp; Recommendations
          </span>
        </h3>
        
        <div className="space-y-4">
          {stats && stats.avg_hygiene_rating !== undefined && 
           stats.avg_staff_rating !== undefined && 
           stats.avg_price_rating !== undefined ? (
            <>
              {/* Hygiene Advice */}
              <div className="p-3 bg-white rounded-md border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-1">Hygiene Rating: {stats.avg_hygiene_rating.toFixed(1)}</h4>
                <p className="text-amber-700 text-sm">
                  {generateCategoryAdvice('hygiene', stats.avg_hygiene_rating)}
                </p>
              </div>
              
              {/* Staff Behavior Advice */}
              <div className="p-3 bg-white rounded-md border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-1">Staff Behavior Rating: {stats.avg_staff_rating.toFixed(1)}</h4>
                <p className="text-amber-700 text-sm">
                  {generateCategoryAdvice('staff', stats.avg_staff_rating)}
                </p>
              </div>
              
              {/* Price Fairness Advice */}
              <div className="p-3 bg-white rounded-md border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-1">Price Fairness Rating: {stats.avg_price_rating.toFixed(1)}</h4>
                <p className="text-amber-700 text-sm">
                  {generateCategoryAdvice('price', stats.avg_price_rating)}
                </p>
              </div>
            </>
          ) : (
            <div className="p-4 bg-white rounded-md border border-amber-200 text-center">
              <p className="text-amber-700">
                No rating data available yet. As you receive reviews, you'll see insights here to help improve your clinic's service.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
          <div className="flex space-x-3 mt-2 sm:mt-0">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
            <select 
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterRating ? `No ${filterRating}-star reviews available.` : 'Your clinic doesn\'t have any reviews yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.clinic_review_id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center text-blue-700 mr-3">
                      {review.pet_owner_name ? review.pet_owner_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{review.pet_owner_name || 'Anonymous User'}</h4>
                      <div className="flex items-center">
                        {/* Use the average_rating from the backend if available, otherwise calculate */}
                        {renderStars(Math.round(review.avg_rating || 
                          ((review.clinic_review_hygiene_rating || 0) + 
                          (review.clinic_review_stuff_behaviour_rating || 0) + 
                          (review.clinic_review_price_rating || 0)) / 3))}
                        <span className="ml-2 text-sm text-gray-500">
                          {review.clinic_review_date ? new Date(review.clinic_review_date).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Pet information */}
                {review.pet_name && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Pet: {review.pet_name}
                    </span>
                  </div>
                )}
                
                {/* Category ratings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 mt-2">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Hygiene:</span> 
                    {renderStars(review.clinic_review_hygiene_rating || 0)}
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Staff:</span> 
                    {renderStars(review.clinic_review_stuff_behaviour_rating || 0)}
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Price:</span> 
                    {renderStars(review.clinic_review_price_rating || 0)}
                  </div>
                </div>
                
                <p className="text-gray-700 mt-2">{review.comments || 'No comments provided'}</p>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                  page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pageNum 
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                  page === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicReviews;
