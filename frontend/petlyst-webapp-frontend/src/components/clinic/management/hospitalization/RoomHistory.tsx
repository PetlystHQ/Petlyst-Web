import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { API_URL } from '../../../../config/api';

interface Hospitalization {
  id: string;
  room_id: string;
  pet_id: string;
  admission_date: string;
  expected_discharge_date: string;
  actual_discharge_date: string | null;
  room_name: string;
  room_type: string;
  pet_name: string;
  pet_species: string;
  pet_breed: string;
  clinic_id: string;
}

interface RoomHistoryProps {
  clinicId: string;
}

const RoomHistory: React.FC<RoomHistoryProps> = ({ clinicId }) => {
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'current' | 'discharged'>('all');
  
  const token = useSelector((state: RootState) => state.auth.token);
  
  useEffect(() => {
    fetchHospitalizationHistory();
  }, [clinicId, token, filter]);
  
  const fetchHospitalizationHistory = async () => {
    if (!token || !clinicId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First, get current hospitalizations
      const currentResponse = await axios.get(
        `${API_URL}/api/clinics/${clinicId}/hospitalization/current`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Now we need to get all hospitalization records (including discharged)
      // We'll use a custom endpoint or query to get all records
      const historicalData = await fetchHistoricalData();
      
      let allHospitalizations: Hospitalization[] = [];
      
      if (currentResponse.data.success) {
        const currentHospitalizations = currentResponse.data.hospitalizations;
        
        // Filter hospitalizations based on selected filter
        if (filter === 'all') {
          allHospitalizations = [...currentHospitalizations, ...historicalData];
        } else if (filter === 'current') {
          allHospitalizations = [...currentHospitalizations];
        } else if (filter === 'discharged') {
          allHospitalizations = [...historicalData];
        }
        
        // Sort by admission date (newest first)
        allHospitalizations.sort((a, b) => {
          return new Date(b.admission_date).getTime() - new Date(a.admission_date).getTime();
        });
        
        setHospitalizations(allHospitalizations);
      } else {
        setError('Failed to fetch hospitalization history');
      }
    } catch (err: any) {
      console.error('Error fetching hospitalization history:', err);
      setError(err.response?.data?.message || 'Failed to fetch hospitalization history');
    } finally {
      setLoading(false);
    }
  };
  
  // This function would fetch historical hospitalization data
  // This is a placeholder implementation since we don't have a specific endpoint for historical data
  const fetchHistoricalData = async (): Promise<Hospitalization[]> => {
    try {
      // We can use the existing endpoint and then filter on the frontend
      // In a real implementation, we would ideally have a backend endpoint that provides this data directly
      const response = await axios.get(
        `${API_URL}/api/clinics/${clinicId}/hospitalization/all`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Return only discharged hospitalizations
        return response.data.hospitalizations.filter((h: Hospitalization) => h.actual_discharge_date !== null);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // Return empty array on error - we'll still show current hospitalizations
      return [];
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Calculate duration of hospitalization
  const calculateDuration = (admissionDate: string, dischargeDate: string | null) => {
    const start = new Date(admissionDate);
    const end = dischargeDate ? new Date(dischargeDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Get room type display
  const getRoomTypeDisplay = (type: string) => {
    switch (type) {
      case 'intensive_care':
        return 'Intensive Care';
      case 'observation':
        return 'Observation';
      case 'standard':
        return 'Standard';
      case 'isolation':
        return 'Isolation';
      default:
        return type;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Hospitalization History</h2>
        
        <div className="flex space-x-2">
          <select
            className="block w-44 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'current' | 'discharged')}
          >
            <option value="all">All Records</option>
            <option value="current">Currently Hospitalized</option>
            <option value="discharged">Discharged Patients</option>
          </select>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
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
      
      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
        </div>
      )}
      
      {/* Hospitalization History Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {hospitalizations.length === 0 ? (
            <div className="p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hospitalization records found</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no {filter === 'all' ? '' : filter === 'current' ? 'current ' : 'discharged '}
                hospitalization records for this clinic.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Discharge
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Discharge
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hospitalizations.map((hospitalization) => (
                    <tr key={hospitalization.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {hospitalization.pet_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {hospitalization.pet_species} / {hospitalization.pet_breed}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{hospitalization.room_name}</div>
                        <div className="text-sm text-gray-500">{getRoomTypeDisplay(hospitalization.room_type)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(hospitalization.admission_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(hospitalization.expected_discharge_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {hospitalization.actual_discharge_date 
                            ? formatDate(hospitalization.actual_discharge_date) 
                            : <span className="text-yellow-600">Not discharged</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {calculateDuration(hospitalization.admission_date, hospitalization.actual_discharge_date)} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${hospitalization.actual_discharge_date
                            ? 'bg-green-100 text-green-800'  
                            : 'bg-yellow-100 text-yellow-800'}`}>
                          {hospitalization.actual_discharge_date ? 'Discharged' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomHistory;
