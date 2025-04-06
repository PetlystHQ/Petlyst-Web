import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Define the Clinic interface (should match what's in SearchResult.tsx)
interface Clinic {
  clinic_id: number;
  clinic_name: string;
  clinic_type: string;
  clinic_description: string;
  opening_time: string;
  closing_time: string;
  available_days: boolean[];
  province: string;
  district: string;
  clinic_address: string;
  latitude: number;
  longitude: number;
  photos: string[]; // This is an array of S3 URL strings, not objects
  slug?: string; // Optional slug field for SEO-friendly URLs
}

interface ClinicCardProps {
  clinic: Clinic;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
  const navigate = useNavigate();
  
  // Default image if clinic has no photos
  const defaultImage = '/images/default-clinic.jpg';
  
  // Get the first image or use default
  // Photos are directly S3 URL strings in this component
  const imageUrl = clinic.photos && clinic.photos.length > 0 
    ? clinic.photos[0] 
    : defaultImage;
  
  // Format clinic hours - remove seconds from time format
  const formatTime = (time: string) => {
    if (!time) return 'Not specified';
    
    // If time has seconds part (e.g. "14:30:00"), remove it
    if (time.includes(':')) {
      const parts = time.split(':');
      if (parts.length > 2) {
        return `${parts[0]}:${parts[1]}`;
      }
    }
    return time;
  };
  
  // Format clinic type to show proper display name
  const formatClinicType = (type: string) => {
    if (type === 'animal_hospital' || type === 'animal hospital') return 'Animal Hospital';
    if (type === 'veterinary_clinic' || type === 'veterinary clinic') return 'Veterinary Clinic';
    return type; // Return as is for any other type
  };
  
  // Check if clinic is open now (simplified logic)
  const isOpenNow = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if clinic is open today
    if (!clinic.available_days[day]) return false;
    
    // More advanced time checking could be added here
    return true;
  };
  
  // Handle click on the entire card
  const handleCardClick = () => {
    // Sadece slug ile yönlendirme yapılacak
    if (clinic.slug) {
      navigate(`/clinics/${clinic.slug}`);
    } else {
      console.warn("Clinic has no slug:", clinic.clinic_id);
      // Slug yoksa yönlendirme yapmayacağız
    }
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-md transition-transform hover:shadow-lg hover:-translate-y-1 bg-white cursor-pointer h-full flex flex-col" onClick={handleCardClick}>
      {/* Clinic Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={clinic.clinic_name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, set a fallback
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-sm font-medium shadow-sm">
          {formatClinicType(clinic.clinic_type)}
        </div>
      </div>
      
      {/* Clinic Info */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{clinic.clinic_name}</h3>
        
        <div className="flex items-center mb-3">
          <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-600 text-sm truncate">{clinic.district}, {clinic.province}</p>
        </div>
        
        <div className="flex items-center mt-auto">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isOpenNow() ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-700">
            {isOpenNow() ? 'Open now' : 'Closed'} · {formatTime(clinic.opening_time)} - {formatTime(clinic.closing_time)}
          </span>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex justify-between items-center">
        {clinic.slug ? (
          <Link 
            to={`/clinics/${clinic.slug}`}
            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            Book Now
          </Link>
        ) : (
          <button
            className="text-white bg-gray-400 px-4 py-1.5 rounded-md text-sm font-medium cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              console.warn("Cannot book: Clinic has no slug", clinic.clinic_id);
            }}
          >
            Book Now
          </button>
        )}
        <div className="flex space-x-2">
          <button 
            className="text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors duration-150"
            title="Add to favorites"
            onClick={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button 
            className="text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors duration-150"
            title="Message"
            onClick={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          <button 
            className="text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors duration-150"
            title="Contact"
            onClick={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
