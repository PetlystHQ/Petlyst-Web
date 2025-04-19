import React from 'react';

interface Pet {
  pet_id: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string;
  pet_birth_date: string;
  pet_gender: string;
  pet_owner_id: string;
  pet_profile_photo?: string;
}

interface PetOwnerPetCardProps {
  pet: Pet;
  onEdit: (pet: Pet) => void;
  onRemove?: (petId: string) => void;
}

// Helper function to calculate and format age from birth date
const calculateAge = (birthDateString: string): string => {
  if (!birthDateString) return 'Unknown age';
  
  try {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      return 'Unknown age';
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birth month hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Handle different age cases
    if (age < 0) {
      return 'Invalid age';
    } else if (age === 0) {
      // Calculate months for puppies/kittens
      let months = today.getMonth() - birthDate.getMonth();
      if (months < 0) months += 12;
      
      if (months <= 1) {
        return '1 month old';
      } else {
        return `${months} months old`;
      }
    } else if (age === 1) {
      return '1 year old';
    } else {
      return `${age} years old`;
    }
  } catch (e) {
    return 'Unknown age';
  }
};

const PetOwnerPetCard: React.FC<PetOwnerPetCardProps> = ({ pet, onEdit, onRemove }) => {
  // Generate a gender-specific color for subtle UI elements
  const genderColor = pet.pet_gender === 'Male' ? 'bg-blue-50' : 'bg-pink-50';
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex md:flex-row flex-col">
      {/* Image container with fixed width and height */}
      <div className="relative md:w-48 h-48 min-w-[12rem]">
        {pet.pet_profile_photo ? (
          <img 
            src={pet.pet_profile_photo} 
            alt={pet.pet_name} 
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${genderColor} text-gray-400`}>
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Pet information */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          {/* Pet name and gender badge in line */}
          <div className="flex items-center space-x-2 mb-3">
            <h3 className="font-semibold text-lg text-gray-800">{pet.pet_name}</h3>
            {/* Simple gender badge without icon */}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              pet.pet_gender === 'Male' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-pink-100 text-pink-800'
            }`}>
              {pet.pet_gender}
            </span>
          </div>
          
          {/* Badge containers with improved styling */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Pet type badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              {pet.pet_type}
            </span>
            
            {/* Pet breed badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
              {pet.pet_breed}
            </span>
            
            {/* Age badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
              {calculateAge(pet.pet_birth_date)}
            </span>
          </div>
        </div>
        
        {/* Action buttons with improved styling */}
        <div className="flex justify-end space-x-3 mt-3 pt-3 border-t border-gray-100">
          {onRemove && (
            <button 
              className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
              onClick={() => onRemove(pet.pet_id)}
            >
              Remove Pet
            </button>
          )}
          <button 
            className="px-3 py-1.5 text-sm rounded-md bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
            onClick={() => onEdit(pet)}
          >
            Edit Pet
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetOwnerPetCard;
