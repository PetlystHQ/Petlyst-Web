import React, { useState } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import AddEditPetModal from './petownermodals/AddEditPetModal';

interface Pet {
  pet_id: string;
  pet_name: string;
  pet_type: string; // This is actually species from backend
  pet_breed: string;
  pet_birth_date: string;
  pet_gender: string;
  pet_owner_id: string;
  pet_profile_photo?: string;
}

interface MyPetsProps {
  pets: Pet[];
  loading?: boolean;
  error?: string | null;
  onPetAdded?: () => void; // Callback to refresh pets after adding
}

const MyPets: React.FC<MyPetsProps> = ({ pets, onPetAdded }) => {
  // State for add/edit pet modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedPet, setSelectedPet] = useState<Pet | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      return null; // Return null for invalid dates
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Open modal to add new pet
  const handleAddPet = () => {
    setSelectedPet(undefined);
    setModalMode('add');
    setShowModal(true);
  };

  // Open modal to edit existing pet
  const handleEditPet = (pet: Pet) => {
    setSelectedPet(pet);
    setModalMode('edit');
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">My Pets</h2>
          <button 
            onClick={handleAddPet}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusCircleIcon className="w-5 h-5 mr-1" />
            Add New Pet
          </button>
        </div>
        
        {pets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map(pet => (
              <div key={pet.pet_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gray-200 relative">
                  {pet.pet_profile_photo ? (
                    <img 
                      src={pet.pet_profile_photo} 
                      alt={pet.pet_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-800">{pet.pet_name}</h3>
                  <p className="text-gray-600">{pet.pet_type} - {pet.pet_breed}</p>
                  <p className="text-sm text-gray-500">
                    {pet.pet_gender}, Born: {formatDate(pet.pet_birth_date)}
                  </p>
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      View Details
                    </button>
                    <button 
                      className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                      onClick={() => handleEditPet(pet)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No pets added yet</h3>
            <p className="text-gray-600 mb-4">Add your pets to keep track of their health records and appointments</p>
            <button 
              onClick={handleAddPet}
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Pet
            </button>
          </div>
        )}
      </div>

      {/* Pet Modal */}
      <AddEditPetModal 
        isOpen={showModal}
        onClose={handleCloseModal}
        onPetAdded={onPetAdded || (() => {})}
        petToEdit={selectedPet}
        mode={modalMode}
      />
    </div>
  );
};

export default MyPets;
