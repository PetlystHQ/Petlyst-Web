import React, { useEffect, useState, useRef } from 'react';
import { Clinic } from '../../types/dashboard';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface EditClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic;
  onUpdate?: (updatedClinic: Clinic) => void;
}

interface PhotoWithPreview {
  url: string;
  key: string;
  isPreview?: boolean;
  previewUrl?: string;
  file?: File;
}

const scrollbarHideStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const EditClinicModal: React.FC<EditClinicModalProps> = ({ isOpen, onClose, clinic, onUpdate }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [photos, setPhotos] = useState<PhotoWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: clinic.name,
    address: clinic.address || '',
    phone_number: clinic.phone_number || '',
    description: clinic.description || ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);

  useEffect(() => {
    // Reset form data when clinic changes
    setFormData({
      name: clinic.name,
      address: clinic.address || '',
      phone_number: clinic.phone_number || '',
      description: clinic.description || ''
    });
    setIsEditing(false);
  }, [clinic]);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/clinics/${clinic.id}/photos`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setPhotos(response.data.photos || []);
      } catch (err: any) {
        console.error('Error fetching photos:', err);
        setError(err.response?.data?.message || 'Failed to fetch photos');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && clinic.id) {
      fetchPhotos();
    }
  }, [isOpen, clinic.id, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Add preview to photos array immediately
    const previewPhoto: PhotoWithPreview = {
      url: previewUrl,
      key: `preview-${Date.now()}`,
      isPreview: true,
      previewUrl,
      file
    };
    
    setPhotos(prev => [...prev, previewPhoto]);
    setPendingUploads(prev => [...prev, file]);
    setHasChanges(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPhoto = async (file: File): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('clinicId', clinic.id);
    formData.append('clinicName', clinic.name);

    const response = await axios.post(
      'http://localhost:3000/api/clinics/upload-photo',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to upload photo');
    }

    return response.data.photo;
  };

  const handleUpdate = async () => {
    setUpdateLoading(true);
    setError(null);
    try {
      // First, upload any pending photos
      const photoUploads = photos
        .filter(photo => photo.file)
        .map(async photo => {
          try {
            const uploadedPhoto = await uploadPhoto(photo.file!);
            return {
              oldKey: photo.key,
              newPhoto: uploadedPhoto
            };
          } catch (err) {
            console.error('Error uploading photo:', err);
            return null;
          }
        });

      const uploadResults = await Promise.all(photoUploads);
      
      // Update photos array with uploaded photos
      setPhotos(prev => prev.map(photo => {
        const uploadResult = uploadResults.find(result => result?.oldKey === photo.key);
        if (uploadResult) {
          return {
            ...uploadResult.newPhoto,
            isPreview: false,
            previewUrl: undefined
          };
        }
        return photo;
      }));

      // Then update clinic details
      const response = await axios.put(
        `http://localhost:3000/api/clinics/${clinic.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        onUpdate?.(response.data.clinic);
        onClose();
      } else {
        setError(response.data.message || 'Failed to update clinic');
      }
    } catch (err: any) {
      console.error('Error updating clinic:', err);
      setError(err.response?.data?.message || 'Failed to update clinic');
    } finally {
      setUpdateLoading(false);
      setPendingUploads([]);
    }
  };

  // Function to handle horizontal scroll
  const handleScroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 300; // Adjust this value based on your needs
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      sliderRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
    };
  }, [photos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <style>{scrollbarHideStyles}</style>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="text-xl font-semibold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                placeholder="Clinic Name"
              />
            ) : (
              <h3 className="text-xl font-semibold text-gray-900">{clinic.name}</h3>
            )}
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

        {/* Admin Verification Notice */}
        <div className="mx-6 my-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Verification Required</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Updates to clinic details will need admin approval. Your clinic will be in pending status until verified.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-lg flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-gray-900">{photos.length} Photos</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  uploadLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {uploadLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Photo
                  </>
                )}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-sm text-red-600 p-4 bg-red-50 rounded">{error}</div>
          ) : (
            <>
              {photos.length > 0 ? (
                <div className="relative">
                  {/* Left scroll button */}
                  {scrollPosition > 0 && (
                    <button
                      onClick={() => handleScroll('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-75 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Right scroll button */}
                  {sliderRef.current && scrollPosition < sliderRef.current.scrollWidth - sliderRef.current.clientWidth && (
                    <button
                      onClick={() => handleScroll('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-75 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Photo slider */}
                  <div 
                    ref={sliderRef}
                    className="flex overflow-x-auto gap-4 pb-4 no-scrollbar"
                    style={{ 
                      scrollBehavior: 'smooth',
                      msOverflowStyle: 'none',
                      scrollbarWidth: 'none'
                    }}
                  >
                    {photos.map((photo, index) => (
                      <div 
                        key={photo.key} 
                        className="flex-none w-[300px] relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={photo.previewUrl || photo.url}
                          alt={`Clinic photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No photos</h3>
                  <p className="mt-1 text-sm text-gray-500">Add photos to showcase your clinic</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {/* Clinic Details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Address</h4>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter address"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{clinic.address || 'Not specified'}</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
              {isEditing ? (
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{clinic.phone_number || 'Not specified'}</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter description"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{clinic.description || 'No description available'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 mt-auto">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={updateLoading || !hasChanges}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                updateLoading || !hasChanges
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {updateLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClinicModal; 