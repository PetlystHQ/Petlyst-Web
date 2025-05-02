import React, { useState } from 'react';

interface Room {
  id: string;
  room_name: string;
  room_type: 'intensive_care' | 'observation' | 'standard' | 'isolation';
  room_status: 'vacant' | 'occupied' | 'maintenance';
  clinic_id: string;
  created_at: string;
  updated_at: string;
}

interface RoomCardProps {
  room: Room;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (roomId: string, status: 'vacant' | 'occupied' | 'maintenance') => void;
  formatRoomType: (type: string) => string;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onDelete, onUpdateStatus, formatRoomType }) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: (
            <svg className="h-5 w-5 text-green-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'occupied':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-200',
          icon: (
            <svg className="h-5 w-5 text-orange-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'maintenance':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: (
            <svg className="h-5 w-5 text-gray-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: null
        };
    }
  };
  
  // Get room type icon
  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'intensive_care':
        return (
          <svg className="h-5 w-5 text-red-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'observation':
        return (
          <svg className="h-5 w-5 text-blue-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'standard':
        return (
          <svg className="h-5 w-5 text-green-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'isolation':
        return (
          <svg className="h-5 w-5 text-yellow-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const statusColor = getStatusColor(room.room_status);

  return (
    <div className={`border-2 rounded-lg overflow-hidden shadow-sm ${statusColor.border} hover:shadow-md transition-all duration-200`}>
      <div className={`${statusColor.bg} px-4 py-3 border-b ${statusColor.border}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{room.room_name}</h3>
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={() => {
                      onEdit();
                      setShowStatusDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Edit Room
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowStatusDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Delete Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-white">
        {/* Room Type */}
        <div className="flex items-center mb-3">
          {getRoomTypeIcon(room.room_type)}
          <span className="text-gray-700">
            Type: <span className="font-medium">{formatRoomType(room.room_type)}</span>
          </span>
        </div>
        
        {/* Room Status */}
        <div className="flex items-center mb-3">
          {statusColor.icon}
          <span className={`${statusColor.text}`}>
            Status: <span className="font-medium">{room.room_status.charAt(0).toUpperCase() + room.room_status.slice(1)}</span>
          </span>
        </div>
        
        {/* Created Date */}
        <div className="text-sm text-gray-500 mb-4">
          Created: {new Date(room.created_at).toLocaleDateString()}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <select
            value={room.room_status}
            onChange={(e) => onUpdateStatus(room.id, e.target.value as 'vacant' | 'occupied' | 'maintenance')}
            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={room.room_status === 'occupied'}
          >
            <option value="vacant">Set as Vacant</option>
            <option value="occupied" disabled>Set as Occupied</option>
            <option value="maintenance">Set as Maintenance</option>
          </select>
          
          <button
            onClick={onEdit}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard; 