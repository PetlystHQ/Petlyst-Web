import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosConfig';

interface Pet {
  pet_id: string;
  pet_name: string;
  pet_owner_name: string;
  pet_owner_surname: string;
  pet_type: string;
  pet_breed: string;
  pet_birthdate?: string;
  pet_birth_day?: number;
  pet_birth_month?: number;
  pet_birth_year?: number;
  pet_gender?: string;
  last_visit_date?: string;
  total_appointments?: number;
  owner_id: string;
}

const PetRecords: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name_asc');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get clinic ID from localStorage when component mounts
  useEffect(() => {
    const storedClinicId = localStorage.getItem('selectedClinicId');
    if (storedClinicId) {
      setClinicId(storedClinicId);
    }
  }, []);

  // Function to fetch pets data
  const fetchPets = async () => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Using the new endpoint that uses clinic_patients table
      const response = await axiosInstance.get(`/clinics/${clinicId}/patients`);
      
      if (response.data.success) {
        const fetchedPets = response.data.pets || [];
        console.log('Fetched patients:', fetchedPets);
        setPets(fetchedPets);
        setLastRefresh(new Date());
      } else {
        setError('Failed to fetch patient records');
        
        // For development: Create mock data if endpoint fails
        if (process.env.NODE_ENV === 'development') {
          useMockData();
        }
      }
    } catch (err) {
      console.error('Error fetching patient records:', err);
      setError('Failed to fetch patient records. Please try again.');
      
      // For development: Create mock data
      if (process.env.NODE_ENV === 'development') {
        useMockData();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to use mock data
  const useMockData = () => {
    console.log('Using mock data');
    const mockPets: Pet[] = [
      {
        pet_id: '1',
        pet_name: 'Max',
        pet_owner_name: 'John',
        pet_owner_surname: 'Doe',
        pet_type: 'Dog',
        pet_breed: 'Golden Retriever',
        pet_birthdate: '2018-05-10',
        pet_gender: 'Male',
        last_visit_date: '2023-11-15',
        total_appointments: 5,
        owner_id: '101'
      },
      {
        pet_id: '2',
        pet_name: 'Bella',
        pet_owner_name: 'Jane',
        pet_owner_surname: 'Smith',
        pet_type: 'Cat',
        pet_breed: 'Siamese',
        pet_birthdate: '2020-03-22',
        pet_gender: 'Female',
        last_visit_date: '2023-12-01',
        total_appointments: 3,
        owner_id: '102'
      },
      {
        pet_id: '3',
        pet_name: 'Charlie',
        pet_owner_name: 'Robert',
        pet_owner_surname: 'Johnson',
        pet_type: 'Dog',
        pet_breed: 'Beagle',
        pet_birthdate: '2019-08-15',
        pet_gender: 'Male',
        last_visit_date: '2023-10-20',
        total_appointments: 6,
        owner_id: '103'
      },
      {
        pet_id: '4',
        pet_name: 'Luna',
        pet_owner_name: 'Emily',
        pet_owner_surname: 'Williams',
        pet_type: 'Cat',
        pet_breed: 'Persian',
        pet_birthdate: '2021-01-30',
        pet_gender: 'Female',
        last_visit_date: '2023-12-10',
        total_appointments: 2,
        owner_id: '104'
      },
      {
        pet_id: '5',
        pet_name: 'Cooper',
        pet_owner_name: 'Michael',
        pet_owner_surname: 'Brown',
        pet_type: 'Dog',
        pet_breed: 'Labrador',
        pet_birthdate: '2017-11-05',
        pet_gender: 'Male',
        last_visit_date: '2023-12-05',
        total_appointments: 8,
        owner_id: '105'
      }
    ];
    
    setPets(mockPets);
    setLastRefresh(new Date());
  };

  // Fetch pets when clinicId changes
  useEffect(() => {
    fetchPets();
  }, [clinicId]);

  // Set up automatic refresh interval (every 30 seconds)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing pet records');
      fetchPets();
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [clinicId]);

  // Add a manual refresh function
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    fetchPets();
  };

  // Filter pets based on search term
  const filteredPets = pets.filter(pet => {
    const searchString = searchTerm.toLowerCase();
    return (
      pet.pet_name.toLowerCase().includes(searchString) ||
      `${pet.pet_owner_name} ${pet.pet_owner_surname}`.toLowerCase().includes(searchString) ||
      pet.pet_type.toLowerCase().includes(searchString) ||
      pet.pet_breed.toLowerCase().includes(searchString)
    );
  });

  // Sort pets
  const sortedPets = [...filteredPets].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.pet_name.localeCompare(b.pet_name);
      case 'name_desc':
        return b.pet_name.localeCompare(a.pet_name);
      case 'owner_asc':
        return `${a.pet_owner_name} ${a.pet_owner_surname}`.localeCompare(`${b.pet_owner_name} ${b.pet_owner_surname}`);
      case 'owner_desc':
        return `${b.pet_owner_name} ${b.pet_owner_surname}`.localeCompare(`${a.pet_owner_name} ${a.pet_owner_surname}`);
      case 'recent_visit':
        return new Date(b.last_visit_date || '').getTime() - new Date(a.last_visit_date || '').getTime();
      case 'most_visits':
        return (b.total_appointments || 0) - (a.total_appointments || 0);
      default:
        return a.pet_name.localeCompare(b.pet_name);
    }
  });

  // Format date as DD/MM/YYYY
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  // Calculate pet age
  const calculateAge = (pet: Pet) => {
    // If we have the complete birthdate fields, use those
    if (pet.pet_birth_year && pet.pet_birth_month && pet.pet_birth_day) {
      try {
        const birth = new Date(pet.pet_birth_year, pet.pet_birth_month - 1, pet.pet_birth_day);
        const today = new Date();
        
        // Toplam ay farkını hesapla
        let totalMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        
        // Eğer bugünün günü, doğum gününden küçükse 1 ay düş
        if (today.getDate() < birth.getDate()) {
          totalMonths--;
        }
        
        // Eğer toplam ay negatifse (geçersiz tarih), 0 olarak kabul et
        if (totalMonths < 0) totalMonths = 0;
        
        // Yıl ve ay olarak hesapla
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        
        // Yıl ve ay formatında göster
        if (years > 0) {
          if (months > 0) {
            return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
          } else {
            return `${years} ${years === 1 ? 'year' : 'years'}`;
          }
        } else if (months > 0) {
          return `${months} ${months === 1 ? 'month' : 'months'}`;
        } else {
          // Eğer hem yıl hem ay sıfırsa, hafta veya gün hesapla
          const diffTime = Math.abs(today.getTime() - birth.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 7) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
          } else {
            return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
          }
        }
      } catch (error) {
        console.error('Error calculating age from day/month/year:', error);
      }
    }
    
    // Fallback to pet_birthdate if available
    if (pet.pet_birthdate) {
      try {
        const birth = new Date(pet.pet_birthdate);
        const today = new Date();
        
        // Toplam ay farkını hesapla
        let totalMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        
        // Eğer bugünün günü, doğum gününden küçükse 1 ay düş
        if (today.getDate() < birth.getDate()) {
          totalMonths--;
        }
        
        // Eğer toplam ay negatifse (geçersiz tarih), 0 olarak kabul et
        if (totalMonths < 0) totalMonths = 0;
        
        // Yıl ve ay olarak hesapla
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        
        // Yıl ve ay formatında göster
        if (years > 0) {
          if (months > 0) {
            return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
          } else {
            return `${years} ${years === 1 ? 'year' : 'years'}`;
          }
        } else if (months > 0) {
          return `${months} ${months === 1 ? 'month' : 'months'}`;
        } else {
          // Eğer hem yıl hem ay sıfırsa, hafta veya gün hesapla
          const diffTime = Math.abs(today.getTime() - birth.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 7) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
          } else {
            return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
          }
        }
      } catch (error) {
        console.error('Error calculating age from birthdate:', error);
      }
    }
    
    return 'Unknown';
  };

  // Get formatted birthdate from pet info
  const getFormattedBirthdate = (pet: Pet) => {
    // If we have the individual birthdate components
    if (pet.pet_birth_year && pet.pet_birth_month && pet.pet_birth_day) {
      try {
        const date = new Date(pet.pet_birth_year, pet.pet_birth_month - 1, pet.pet_birth_day);
        return date.toLocaleDateString();
      } catch (error) {
        console.error('Error formatting birthdate from components:', error);
      }
    }
    
    // Fallback to pet_birthdate if available
    if (pet.pet_birthdate) {
      return formatDate(pet.pet_birthdate);
    }
    
    return 'N/A';
  };

  // Open pet details modal
  const openPetModal = (pet: Pet) => {
    setSelectedPet(pet);
    setIsModalOpen(true);
  };

  // Close pet details modal
  const closePetModal = () => {
    setSelectedPet(null);
    setIsModalOpen(false);
  };

  // Render pet details modal
  const renderPetModal = () => {
    if (!selectedPet) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-0 max-w-3xl w-full shadow-xl overflow-hidden">
          {/* Modal Header */}
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-800">Pet Details: {selectedPet.pet_name}</h3>
              <button
                onClick={closePetModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Modal Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pet Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h4 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 mb-4">Pet Information</h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-800">{selectedPet.pet_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Type & Breed</p>
                    <p className="font-medium text-gray-800">{selectedPet.pet_type} • {selectedPet.pet_breed}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium text-gray-800">{selectedPet.pet_gender || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Birthdate & Age</p>
                    <p className="font-medium text-gray-800">
                      {getFormattedBirthdate(selectedPet)} • {calculateAge(selectedPet)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Owner Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h4 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 mb-4">Owner Information</h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-800">{selectedPet.pet_owner_name} {selectedPet.pet_owner_surname}</p>
                  </div>
                  
                  <div>
                    <button
                      className="px-4 py-2 mt-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                      onClick={() => {
                        // Redirect to owner profile or contact page (to be implemented)
                        console.log('View owner details:', selectedPet.owner_id);
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Owner Details
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Visit History */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 md:col-span-2">
                <h4 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 mb-4">Visit History</h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Last Visit</p>
                    <p className="font-medium text-gray-800">
                      {selectedPet.last_visit_date ? formatDate(selectedPet.last_visit_date) : 'No visits recorded'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Total Appointments</p>
                    <p className="font-medium text-gray-800">{selectedPet.total_appointments || 0}</p>
                  </div>
                  
                  <div>
                    <button
                      className="px-4 py-2 mt-4 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center"
                      onClick={() => {
                        // Redirect to pet's appointment history (to be implemented)
                        console.log('View appointment history for:', selectedPet.pet_id);
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      View Appointment History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 border-t border-gray-200">
            <button
              onClick={closePetModal}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add timestamp in the UI to show when data was last refreshed
  const formatRefreshTime = () => {
    return lastRefresh.toLocaleTimeString();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Patient Records</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Last refreshed: {formatRefreshTime()}</span>
          <button 
            onClick={handleManualRefresh}
            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md flex items-center gap-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-1/3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input 
            type="text" 
            className="w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by pet name, owner, type, or breed" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="owner_asc">Owner (A-Z)</option>
          <option value="owner_desc">Owner (Z-A)</option>
          <option value="recent_visit">Recent Visit</option>
          <option value="most_visits">Most Visits</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : sortedPets.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-gray-800 font-medium text-lg mb-2">No pet records found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Pet records will appear here after appointments.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPets.map((pet) => (
            <div 
              key={pet.pet_id}
              onClick={() => openPetModal(pet)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg text-gray-800">{pet.pet_name}</h3>
                  <p className="text-gray-600 text-sm">
                    {pet.pet_type} • {pet.pet_breed}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Owner: {pet.pet_owner_name} {pet.pet_owner_surname}
                  </p>
                </div>
                
                <div className="flex flex-col items-end">
                  {pet.pet_gender && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pet.pet_gender.toLowerCase() === 'male' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-pink-100 text-pink-800'
                    }`}>
                      {pet.pet_gender}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 mt-2">
                    {pet.total_appointments ? `${pet.total_appointments} visits` : 'No visits'}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Last Visit</p>
                  <p className="text-sm font-medium">
                    {pet.last_visit_date ? formatDate(pet.last_visit_date) : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="text-sm font-medium">
                    {calculateAge(pet)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pet Detail Modal */}
      {isModalOpen && renderPetModal()}
    </div>
  );
};

export default PetRecords;
