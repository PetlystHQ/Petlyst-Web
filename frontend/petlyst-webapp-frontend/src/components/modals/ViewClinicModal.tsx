import React, { useEffect, useState } from 'react';
import { Clinic } from '../../types/dashboard';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_URL } from '../../config/api';
import { getApiErrorMessage } from '../../utils/errorMessage';

interface ViewClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic;
}

const ViewClinicModal: React.FC<ViewClinicModalProps> = ({ isOpen, onClose, clinic }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [photos, setPhotos] = useState<Array<{ url: string; key: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/clinics/${clinic.clinic_id}/photos`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setPhotos(response.data.photos || []);
      } catch (err) {
        console.error('Error fetching photos:', err);
        setError(getApiErrorMessage(err, 'Failed to fetch photos'));
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && clinic.clinic_id) {
      fetchPhotos();
    }
  }, [isOpen, clinic.clinic_id, token]);

  if (!isOpen) return null;

  return (
    <>
      {/* Full Screen Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Full screen view"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col">
          <div className="p-6 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold text-gray-900">{clinic.clinic_name}</h3>
                <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md">
                  <svg className="w-4 h-4 mr-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">{photos.length} photos</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Photo Gallery Section */}
          <div className="p-6 border-b">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-12 h-12 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                </div>
              </div>
            ) : error ? (
              <div className="text-sm text-red-600 p-4 bg-red-50 rounded">{error}</div>
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div 
                    key={photo.key} 
                    className="relative aspect-square cursor-pointer group"
                    onClick={() => setSelectedPhoto(photo.url)}
                  >
                    <div className="absolute inset-0">
                      <img
                        src={photo.url}
                        alt={`Clinic photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-200 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">No photos available</p>
              </div>
            )}
          </div>

          {/* Clinic Details Section */}
          <div className="p-6 overflow-y-auto flex-grow">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Address</h4>
                <p className="mt-1 text-sm text-gray-900">{clinic.clinic_address || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
                <p className="mt-1 text-sm text-gray-900">{clinic.clinic_phone_number || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-sm text-gray-900">{clinic.clinic_description || 'No description available'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t flex-shrink-0">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewClinicModal; 