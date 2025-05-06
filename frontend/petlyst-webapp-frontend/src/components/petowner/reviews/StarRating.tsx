import React from 'react';

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  max?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  setRating, 
  max = 5 
}) => {
  const handleStarClick = (selectedRating: number) => {
    // If user clicks the same star twice, reset the rating
    if (selectedRating === rating) {
      setRating(0);
    } else {
      setRating(selectedRating);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(starValue)}
            className="focus:outline-none"
            aria-label={`Rate ${starValue} out of ${max}`}
          >
            <svg 
              className={`w-8 h-8 ${
                starValue <= rating ? 'text-amber-400' : 'text-gray-300'
              } hover:text-amber-300 transition-colors`}
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        );
      })}
      
      {rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          {rating}.0
        </span>
      )}
    </div>
  );
};

export default StarRating; 