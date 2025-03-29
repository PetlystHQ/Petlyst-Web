import React from 'react';
import { Link } from 'react-router-dom';

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
}

interface ClinicCardProps {
  clinic: Clinic;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
  // Default image if clinic has no photos
  const defaultImage = '/images/default-clinic.jpg';
  
  // Get the first image or use default
  // Photos are directly S3 URL strings in this component
  const imageUrl = clinic.photos && clinic.photos.length > 0 
    ? clinic.photos[0] 
    : defaultImage;
  
  // Format clinic hours
  const formatTime = (time: string) => {
    if (!time) return 'Not specified';
    return time;
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

  return (
    <div className="rounded-lg overflow-hidden shadow-md transition-transform hover:shadow-lg hover:-translate-y-1 bg-white">
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
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-sm font-medium">
          {clinic.clinic_type}
        </div>
      </div>
      
      {/* Clinic Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{clinic.clinic_name}</h3>
        <p className="text-gray-600 text-sm mb-2 truncate">{clinic.district}, {clinic.province}</p>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{clinic.clinic_address}</p>
        
        <div className="flex items-center mb-4">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isOpenNow() ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-700">
            {isOpenNow() ? 'Open now' : 'Closed'} · {formatTime(clinic.opening_time)} - {formatTime(clinic.closing_time)}
          </span>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex justify-between items-center">
        <Link to={`/clinics/${clinic.clinic_id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View Details
        </Link>
        <div className="flex space-x-2">
          <button 
            className="text-gray-700 hover:bg-gray-100 p-1.5 rounded-full"
            title="Add to favorites"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button 
            className="text-gray-700 hover:bg-gray-100 p-1.5 rounded-full"
            title="Share"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button 
            className="text-gray-700 hover:bg-gray-100 p-1.5 rounded-full"
            title="Contact"
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
