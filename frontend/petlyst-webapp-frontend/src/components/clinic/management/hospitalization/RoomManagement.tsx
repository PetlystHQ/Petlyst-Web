import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import RoomCard from './RoomCard';
import RoomForm from './RoomForm';

// Define interfaces
interface Room {
  id: string;
  room_name: string;
  room_type: 'intensive_care' | 'observation' | 'standard' | 'isolation';
  room_status: 'vacant' | 'occupied' | 'maintenance';
  clinic_id: string;
  created_at: string;
  updated_at: string;
}

interface RoomFormData {
  roomName: string;
  roomType: 'intensive_care' | 'observation' | 'standard' | 'isolation';
}

const RoomManagement: React.FC<{ clinicId: string }> = ({ clinicId }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const token = useSelector((state: RootState) => state.auth.token);

  // Fetch rooms when component mounts
  useEffect(() => {
    fetchRooms();
  }, [clinicId, token]);
  
  // Filter rooms when filtering options change
  useEffect(() => {
    filterRooms();
  }, [rooms, statusFilter, typeFilter, searchTerm]);
  
  // Fetch rooms from API
  const fetchRooms = async () => {
    if (!token || !clinicId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `http://localhost:3000/api/clinics/${clinicId}/hospitalization/rooms`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setRooms(response.data.rooms);
      } else {
        setError('Failed to fetch rooms');
      }
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err.response?.data?.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter rooms based on status, type, and search term
  const filterRooms = () => {
    let filtered = [...rooms];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(room => room.room_status === statusFilter);
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(room => room.room_type === typeFilter);
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(room => 
        room.room_name.toLowerCase().includes(term)
      );
    }
    
    setFilteredRooms(filtered);
  };
  
  // Handle form submission for adding/editing room
  const handleRoomSubmit = async (formData: RoomFormData) => {
    if (!token || !clinicId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (editingRoom) {
        // Update existing room
        const response = await axios.put(
          `http://localhost:3000/api/hospitalization/rooms/${editingRoom.id}`,
          {
            roomName: formData.roomName,
            roomType: formData.roomType
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setRooms(rooms.map(room => 
            room.id === editingRoom.id ? response.data.room : room
          ));
          setEditingRoom(null);
        } else {
          setError('Failed to update room');
        }
      } else {
        // Add new room
        const response = await axios.post(
          `http://localhost:3000/api/clinics/${clinicId}/hospitalization/rooms`,
          {
            roomName: formData.roomName,
            roomType: formData.roomType
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setRooms([...rooms, response.data.room]);
          setIsAddingRoom(false);
        } else {
          setError('Failed to create room');
        }
      }
    } catch (err: any) {
      console.error('Error submitting room:', err);
      setError(err.response?.data?.message || 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a room
  const handleDeleteRoom = async (roomId: string) => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.delete(
        `http://localhost:3000/api/hospitalization/rooms/${roomId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setRooms(rooms.filter(room => room.id !== roomId));
      } else {
        setError('Failed to delete room');
      }
    } catch (err: any) {
      console.error('Error deleting room:', err);
      setError(err.response?.data?.message || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };
  
  // Update room status
  const handleUpdateStatus = async (roomId: string, status: 'vacant' | 'occupied' | 'maintenance') => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(
        `http://localhost:3000/api/hospitalization/rooms/${roomId}/status`,
        { status },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setRooms(rooms.map(room => 
          room.id === roomId ? response.data.room : room
        ));
      } else {
        setError('Failed to update room status');
      }
    } catch (err: any) {
      console.error('Error updating room status:', err);
      setError(err.response?.data?.message || 'Failed to update room status');
    } finally {
      setLoading(false);
    }
  };
  
  // Format room type for display
  const formatRoomType = (type: string) => {
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
        <h2 className="text-xl font-semibold">Room Management</h2>
        <button
          onClick={() => {
            setIsAddingRoom(true);
            setEditingRoom(null);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Room
        </button>
      </div>
      
      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-100">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by room name..."
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Room Type
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="all">All Types</option>
              <option value="intensive_care">Intensive Care</option>
              <option value="observation">Observation</option>
              <option value="standard">Standard</option>
              <option value="isolation">Isolation</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Add/Edit Form */}
      {(isAddingRoom || editingRoom) && (
        <div className="mb-6">
          <RoomForm
            initialData={editingRoom ? {
              roomName: editingRoom.room_name,
              roomType: editingRoom.room_type
            } : undefined}
            onSubmit={handleRoomSubmit}
            onCancel={() => {
              setIsAddingRoom(false);
              setEditingRoom(null);
            }}
            isSubmitting={loading}
          />
        </div>
      )}
      
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
      
      {/* Room List */}
      {loading && !isAddingRoom && !editingRoom ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg shadow border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            {rooms.length === 0 ? 'No rooms found' : 'No rooms match the filter criteria'}
          </h3>
          <p className="mt-1 text-gray-500">
            {rooms.length === 0 
              ? 'Get started by adding a new hospitalization room.' 
              : 'Try adjusting your filters to find what you\'re looking for.'}
          </p>
          {rooms.length === 0 && (
            <div className="mt-6">
              <button
                onClick={() => setIsAddingRoom(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add First Room
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={() => {
                setIsAddingRoom(false);
                setEditingRoom(room);
              }}
              onDelete={() => handleDeleteRoom(room.id)}
              onUpdateStatus={handleUpdateStatus}
              formatRoomType={formatRoomType}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomManagement; 