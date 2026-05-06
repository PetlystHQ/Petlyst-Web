import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Tooltip } from '../shared/Tooltip';
import { API_URL } from '../../../config/api';
import { getApiErrorMessage } from '../../../utils/errorMessage';

interface ClinicPhoto {
  clinic_album_photo_id: number;
  clinic_album_photo_url: string;
  clinic_album_photo_url_created_at: string;
}

interface EditVisualsProps {
  clinicId: string | number;
  clinicName: string;
  clinicType: string;
  token: string;
  onPhotoChange?: () => void;
}

export const EditVisuals: React.FC<EditVisualsProps> = ({
  clinicId,
  clinicName,
  clinicType,
  token,
  onPhotoChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState<ClinicPhoto[]>([]);
  const [selectedNewPhotos, setSelectedNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviewUrls, setNewPhotoPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const MIN_PHOTOS = 3;
  const MAX_PHOTOS = 10;
  
  // Image loading state tracking
  const [loadingImages, setLoadingImages] = useState<{[key: number]: boolean}>({});

  // Fetch existing photos on component mount
  useEffect(() => {
    fetchClinicPhotos();
    // fetchClinicPhotos is in-component and closes over clinicId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);
  
  // Create URL previews when new photos are selected
  useEffect(() => {
    // Clean up previous preview URLs to avoid memory leaks
    const previews = selectedNewPhotos.map(photo => URL.createObjectURL(photo));
    setNewPhotoPreviewUrls(previews);
    
    // Clean up function to revoke object URLs
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedNewPhotos]);

  const fetchClinicPhotos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = API_URL;
      const response = await axios.get(`${apiUrl}/api/clinics/${clinicId}/photos`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setExistingPhotos(response.data.photos);
      } else {
        setError('Failed to fetch clinic photos');
      }
    } catch (err) {
      console.error('Error fetching clinic photos:', err);
      setError(getApiErrorMessage(err, 'Failed to fetch clinic photos'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (index: number) => {
    setLoadingImages(prev => ({
      ...prev,
      [index]: false
    }));
  };

  const handleImageError = (index: number) => {
    setLoadingImages(prev => ({
      ...prev,
      [index]: false
    }));
  };

  // Mark images as loading when they're added to the previews
  useEffect(() => {
    const newLoadingState: {[key: number]: boolean} = {};
    [...existingPhotos, ...newPhotoPreviewUrls].forEach((_, index) => {
      if (loadingImages[index] === undefined) {
        newLoadingState[index] = true;
      }
    });
    
    if (Object.keys(newLoadingState).length > 0) {
      setLoadingImages(prev => ({
        ...prev,
        ...newLoadingState
      }));
    }
    // The effect tracks the *count* of photos to seed loading state for new
    // entries; tracking the arrays themselves (or `loadingImages`) would
    // re-set state on every render that mutates the loading map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPhotos.length, newPhotoPreviewUrls.length]);
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      validateAndProcessFiles(files);
    }
  };
  
  // Handle file input selection
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      validateAndProcessFiles(files);
    }
  };
  
  // Validate and process selected files
  const validateAndProcessFiles = (files: File[]) => {
    // Check if adding these files would exceed maximum
    const totalPhotos = existingPhotos.length + selectedNewPhotos.length + files.length;
    if (totalPhotos > MAX_PHOTOS) {
      setError(`You can only have up to ${MAX_PHOTOS} photos. Please select fewer photos.`);
      return;
    }
    
    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Check if there are non-image files
    if (imageFiles.length < files.length) {
      setError('Only image files are allowed. Some files were not added.');
    } else {
      setError(null);
    }
    
    // Add the valid image files to the selected photos
    if (imageFiles.length > 0) {
      setSelectedNewPhotos(prev => [...prev, ...imageFiles]);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Trigger file input
  const handleAddPhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Upload selected photos
  const handleUploadPhotos = async () => {
    if (selectedNewPhotos.length === 0) return;
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const apiUrl = API_URL;
      
      // SADECE klinik ID ve adını gönder, tip ekleme (tip backend'de eklenecek)
      const sanitizedClinicName = clinicName.toLowerCase().replace(/\s+/g, '-');
      const folderName = `${clinicId}-${sanitizedClinicName}`;
      
      // Convert clinicType to database format
      const dbFormatClinicType = clinicType === 'Animal Hospital' ? 'animal_hospital' : 'veterinary_clinic';
      
      console.log('Uploading photo with clinic type:', {
        displayFormat: clinicType,
        dbFormat: dbFormatClinicType,
        folderPath: folderName
      });
      
      const uploadPromises = selectedNewPhotos.map(async (photo, index) => {
        const formData = new FormData();
        formData.append('photo', photo);
        formData.append('clinicId', clinicId.toString());
        formData.append('clinicName', folderName);
        formData.append('clinicType', dbFormatClinicType); // Use database format
        
        return axios.post(`${apiUrl}/api/clinics/upload-photo`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            console.log(`Upload progress for photo ${index + 1}: ${progress}%`);
          }
        });
      });
      
      await Promise.all(uploadPromises);
      
      // Clear selected new photos and previews
      setSelectedNewPhotos([]);
      setNewPhotoPreviewUrls([]);
      
      // Fetch the updated photo list
      await fetchClinicPhotos();
      
      setSuccess('Photos uploaded successfully');
      
      // Notify parent component if needed
      if (onPhotoChange) {
        onPhotoChange();
      }
    } catch (err) {
      console.error('Error uploading photos:', err);
      setError(getApiErrorMessage(err, 'Failed to upload photos'));
    } finally {
      setUploading(false);
    }
  };
  
  // Remove a newly selected photo (not yet uploaded)
  const handleRemoveNewPhoto = (index: number) => {
    setSelectedNewPhotos(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    
    setNewPhotoPreviewUrls(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index]); // Clean up the URL
      updated.splice(index, 1);
      return updated;
    });
  };
  
  // Delete an existing photo from S3 and database
  const handleDeleteExistingPhoto = async (photoId: number) => {
    setDeleting(photoId);
    setError(null);
    setSuccess(null);
    
    // Check if deletion would result in fewer than minimum required photos
    if (existingPhotos.length + selectedNewPhotos.length <= MIN_PHOTOS) {
      setError(`You need at least ${MIN_PHOTOS} photos. Please upload more photos before deleting.`);
      setDeleting(null);
      return;
    }
    
    try {
      const apiUrl = API_URL;
      await axios.delete(`${apiUrl}/api/clinics/${clinicId}/photos/${photoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update the local state to remove the deleted photo
      setExistingPhotos(prev => prev.filter(photo => photo.clinic_album_photo_id !== photoId));
      
      setSuccess('Photo deleted successfully');
      
      // Notify parent component if needed
      if (onPhotoChange) {
        onPhotoChange();
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError(getApiErrorMessage(err, 'Failed to delete photo'));
    } finally {
      setDeleting(null);
    }
  };
  
  // Get total number of photos (existing + new)
  const getTotalPhotoCount = () => existingPhotos.length + selectedNewPhotos.length;
  
  // Get number of photos needed to meet minimum
  const getPhotosNeeded = () => {
    const needed = MIN_PHOTOS - getTotalPhotoCount();
    return needed > 0 ? needed : 0;
  };
  
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Clinic Photos</h2>
          <Tooltip text="Upload photos to showcase your clinic to potential clients" />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Please have between {MIN_PHOTOS} and {MAX_PHOTOS} photos of your clinic.
          {getPhotosNeeded() > 0 && ` You need to add at least ${getPhotosNeeded()} more photo${getPhotosNeeded() > 1 ? 's' : ''}.`}
        </p>
      </div>
      
      {/* Photo upload progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Photo Gallery</span>
          <span className={`font-medium ${getTotalPhotoCount() >= MIN_PHOTOS ? 'text-green-600' : 'text-amber-600'}`}>
            {getTotalPhotoCount()}/{MAX_PHOTOS} Photos
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              getTotalPhotoCount() >= MIN_PHOTOS ? 'bg-green-500' : 'bg-amber-500'
            }`}
            style={{ width: `${(getTotalPhotoCount() / MAX_PHOTOS) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6 animate-fadeIn shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 mb-6 animate-fadeIn shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>{success}</p>
          </div>
        </div>
      )}
      
      {/* File input - this should be outside any conditional rendering */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*"
        multiple
        disabled={loading || uploading || getTotalPhotoCount() >= MAX_PHOTOS}
      />
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="ml-4 text-gray-600">Loading clinic photos...</p>
        </div>
      )}
      
      {/* Existing photos gallery */}
      {!loading && (existingPhotos.length > 0 || selectedNewPhotos.length > 0) && (
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Clinic Photos ({getTotalPhotoCount()}/{MAX_PHOTOS})
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Existing photos */}
            {existingPhotos.map((photo, index) => (
              <div 
                key={`existing-${photo.clinic_album_photo_id}`} 
                className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-white"
                style={{ minHeight: '200px' }}
              >
                <div className="aspect-w-4 aspect-h-3 h-full overflow-hidden bg-gray-100">
                  {/* Loading indicator */}
                  {loadingImages[index] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                      <div className="w-8 h-8 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                      </div>
                    </div>
                  )}
                  
                  <img 
                    src={photo.clinic_album_photo_url} 
                    alt={`Clinic photo ${index + 1}`} 
                    className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 ${loadingImages[index] ? 'opacity-0' : 'opacity-100'}`}
                    style={{ objectPosition: 'center' }}
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleDeleteExistingPhoto(photo.clinic_album_photo_id)}
                  disabled={deleting === photo.clinic_album_photo_id || uploading}
                  className={`absolute top-2 right-2 p-1.5 bg-red-600 rounded-full text-white shadow-md transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    (deleting === photo.clinic_album_photo_id || uploading) ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  aria-label="Remove photo"
                >
                  {deleting === photo.clinic_album_photo_id ? (
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="sr-only">Remove photo</span>
                </button>
                
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Photo {index + 1}
                </div>
              </div>
            ))}
            
            {/* Newly added photos (not yet uploaded) */}
            {newPhotoPreviewUrls.map((url, index) => (
              <div 
                key={`new-${index}`} 
                className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-white border-2 border-blue-300"
                style={{ minHeight: '200px' }}
              >
                <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br-md">
                  New
                </div>
                
                <div className="aspect-w-4 aspect-h-3 h-full overflow-hidden bg-gray-100">
                  <img 
                    src={url} 
                    alt={`New clinic photo ${index + 1}`} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    style={{ objectPosition: 'center' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveNewPhoto(index)}
                  disabled={uploading}
                  className={`absolute top-2 right-2 p-1.5 bg-red-600 rounded-full text-white shadow-md transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    uploading ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  aria-label="Remove photo"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="sr-only">Remove photo</span>
                </button>
              </div>
            ))}
            
            {/* Add more photos button (if below max) */}
            {getTotalPhotoCount() < MAX_PHOTOS && !loading && !uploading && (
              <div 
                className="aspect-w-4 aspect-h-3 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors duration-300"
                onClick={handleAddPhotoClick}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center p-4">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span className="mt-2 block text-sm font-medium text-gray-500">Add Photo</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Upload button for new photos */}
      {selectedNewPhotos.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleUploadPhotos}
            disabled={uploading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload {selectedNewPhotos.length} New Photo{selectedNewPhotos.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}
      
      {/* No photos yet message */}
      {!loading && existingPhotos.length === 0 && selectedNewPhotos.length === 0 && (
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
          } cursor-pointer`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleAddPhotoClick}
        >
          <div className="space-y-4">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              dragActive ? 'bg-blue-100 text-blue-600 scale-110' : 'bg-gray-100 text-gray-400'
            }`}>
              <svg className="h-10 w-10" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path 
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="text-blue-600 font-medium">
                {dragActive ? 'Drop your photos here' : 'Upload photos'}
              </span>
              <p className="mt-1">or drag and drop</p>
            </div>
            
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
          
          {/* Absolute positioned background element for animations */}
          {dragActive && (
            <div className="absolute inset-0 bg-blue-500/5 rounded-xl animate-pulse pointer-events-none"></div>
          )}
        </div>
      )}
      
      {/* Reminder about minimum photos */}
      {getTotalPhotoCount() > 0 && getTotalPhotoCount() < MIN_PHOTOS && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 mt-6 animate-fadeIn shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>You need to have at least {MIN_PHOTOS} photos. Please add {MIN_PHOTOS - getTotalPhotoCount()} more.</p>
          </div>
        </div>
      )}
      
      {/* Tip section */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-6">
        <h4 className="text-sm font-medium text-blue-800 flex items-center">
          <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
          Tips for Great Clinic Photos
        </h4>
        <ul className="mt-2 text-sm text-blue-700 space-y-1 ml-5 list-disc">
          <li>Include photos of your clinic's exterior and waiting area</li>
          <li>Show treatment rooms and equipment</li>
          <li>Ensure good lighting and clear focus</li>
          <li>Consider adding photos of your veterinary team (with their permission)</li>
        </ul>
      </div>
    </div>
  );
};

// Add CSS animation
const styles = document.createElement('style');
styles.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
`;
document.head.appendChild(styles); 