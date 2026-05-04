import React, { useState } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import AddPetModal from './petownermodals/AddPetModal';
import EditPetModal from './petownermodals/EditPetModal';
import PetOwnerPetCard from './PetOwnerPetCard';
import axiosInstance from '../../utils/axiosConfig';

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
  onPetRemoved?: () => void; // Callback to refresh pets after removing
  onPetUpdated?: () => void; // Callback to refresh pets after updating
  setActiveTab?: (tab: string) => void; // For navigation to Pet Health tab
}

// Confirmation Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-auto flex items-center justify-center">
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      
      {/* Dialog box */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-[101] mx-auto p-5"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyPets: React.FC<MyPetsProps> = ({ 
  pets, 
  onPetAdded,
  onPetRemoved = onPetAdded,
  onPetUpdated = onPetAdded,
  setActiveTab
}) => {
  // State for modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  
  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    petId: string;
    petName: string;
  }>({
    isOpen: false,
    petId: '',
    petName: ''
  });

  // Open modal to add new pet
  const handleAddPet = () => {
    setShowAddModal(true);
  };

  // Open modal to edit existing pet
  const handleEditPet = (pet: Pet) => {
    setSelectedPet(pet);
    setShowEditModal(true);
  };

  // Open confirmation dialog for pet removal
  const handleRemovePet = (petId: string) => {
    // Find pet to display its name in the confirmation
    const petToRemove = pets.find(pet => pet.pet_id === petId);
    if (petToRemove) {
      setConfirmDialog({
        isOpen: true,
        petId,
        petName: petToRemove.pet_name
      });
    }
  };
  
  // Handle viewing pet health records
  const handleViewPetHealth = (petId: string) => {
    // Store the selected pet ID in localStorage to be used by the PetHealth component
    localStorage.setItem('selectedPetHealthId', petId);
    
    // Navigate to the Pet Health tab
    if (setActiveTab) {
      setActiveTab('petHealth');
    }
  };
  
  // Execute pet removal after confirmation
  const executeRemovePet = async () => {
    try {
      setIsRemoving(true);
      setRemoveError(null);
      
      // Close the confirmation dialog
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      
      const response = await axiosInstance.delete(`/pets/${confirmDialog.petId}`);
      
      if (response.data.success) {
        // Notify parent component to refresh the pet list
        if (onPetRemoved) {
          onPetRemoved();
        }
      } else {
        setRemoveError('Failed to remove pet. Please try again.');
      }
    } catch (error) {
      console.error('Error removing pet:', error);
      setRemoveError('An error occurred while removing the pet. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };
  
  // Cancel pet removal
  const cancelRemovePet = () => {
    setConfirmDialog({
      isOpen: false,
      petId: '',
      petName: ''
    });
  };

  // Close add modal
  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };
  
  // Close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedPet(null);
  };
  
  // Handle pet updates
  const handlePetUpdated = () => {
    if (onPetUpdated) {
      onPetUpdated();
    }
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
        
        {removeError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {removeError}
          </div>
        )}
        
        {isRemoving && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Removing pet...
          </div>
        )}
        
        {pets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pets.map(pet => (
              <PetOwnerPetCard 
                key={pet.pet_id} 
                pet={pet} 
                onEdit={handleEditPet} 
                onRemove={handleRemovePet}
                onViewHealth={setActiveTab ? handleViewPetHealth : undefined}
              />
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

      {/* Add Pet Modal */}
      <AddPetModal 
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onPetAdded={onPetAdded || (() => {})}
      />
      
      {/* Edit Pet Modal */}
      <EditPetModal 
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onPetUpdated={handlePetUpdated}
        pet={selectedPet}
      />
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Remove Pet"
        message={`Are you sure you want to remove ${confirmDialog.petName}? This action cannot be undone and all associated data will be permanently deleted.`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={executeRemovePet}
        onCancel={cancelRemovePet}
      />
    </div>
  );
};

export default MyPets;
