import React, { useState, useRef, useEffect } from 'react';
import { Tooltip } from '../shared/Tooltip';

interface VisualsFormProps {
  selectedPhotos: File[];
  photoPreviewUrls: string[];
  handlePhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemovePhoto: (index: number) => void;
  hasExistingClinic: boolean;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  isEditMode?: boolean;
}

export const VisualsForm: React.FC<VisualsFormProps> = ({
  selectedPhotos,
  photoPreviewUrls,
  handlePhotoSelect,
  handleRemovePhoto,
  hasExistingClinic,
  loading,
  error,
  setError,
  isEditMode = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const MIN_PHOTOS = 3;
  const MAX_PHOTOS = 10;
  
  // Image loading state tracking
  const [loadingImages, setLoadingImages] = useState<{[key: number]: boolean}>({});

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
    // Optionally show error state or message
  };

  // Mark images as loading when they're added to the previews
  useEffect(() => {
    const newLoadingState: {[key: number]: boolean} = {};
    photoPreviewUrls.forEach((_, index) => {
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
  }, [photoPreviewUrls.length]);
  
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
    if (files.length + selectedPhotos.length > MAX_PHOTOS) {
      setError(`You can only upload up to ${MAX_PHOTOS} photos. Please select fewer photos.`);
      return;
    }
    
    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Check if there are non-image files
    if (imageFiles.length < files.length) {
      setError('Only image files are allowed. Some files were not added.');
    } else {
      setError('');
    }
    
    // Pass the valid image files to the parent handler
    if (imageFiles.length > 0) {
      const event = {
        target: {
          files: imageFiles as unknown as FileList
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handlePhotoSelect(event);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Fotoğraf yükleme sayfasını tetikleme
  const handleAddPhotoClick = () => {
    console.log("Add photo clicked, opening file dialog");
    // Dosya input referansı boş değilse, click() metodunu çağır
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input reference is null");
    }
  };
  
  // Get number of photos needed to meet minimum
  const getPhotosNeeded = () => {
    const needed = MIN_PHOTOS - selectedPhotos.length;
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
          Please upload between {MIN_PHOTOS} and {MAX_PHOTOS} photos of your clinic.
          {getPhotosNeeded() > 0 && ` You need to add at least ${getPhotosNeeded()} more photo${getPhotosNeeded() > 1 ? 's' : ''}.`}
        </p>
      </div>
      
      {/* Photo upload progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Upload Progress</span>
          <span className={`font-medium ${selectedPhotos.length >= MIN_PHOTOS ? 'text-green-600' : 'text-amber-600'}`}>
            {selectedPhotos.length}/{MAX_PHOTOS} Photos
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              selectedPhotos.length >= MIN_PHOTOS ? 'bg-green-500' : 'bg-amber-500'
            }`}
            style={{ width: `${(selectedPhotos.length / MAX_PHOTOS) * 100}%` }}
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
      
      {/* File input - this should be outside any conditional rendering */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*"
        multiple
        disabled={(hasExistingClinic && !isEditMode) || loading || selectedPhotos.length >= MAX_PHOTOS}
      />
      
      {/* File upload area - only show if no photos are uploaded yet */}
      {photoPreviewUrls.length === 0 && (
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
          } ${hasExistingClinic || loading ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={hasExistingClinic || loading || selectedPhotos.length >= MAX_PHOTOS ? undefined : handleAddPhotoClick}
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
              <span className={`${
                selectedPhotos.length >= MAX_PHOTOS 
                  ? 'text-gray-400' 
                  : 'text-blue-600 font-medium'
              }`}>
                {selectedPhotos.length >= MAX_PHOTOS 
                  ? 'Maximum photos reached' 
                  : dragActive 
                    ? 'Drop your photos here' 
                    : 'Upload photos'
                }
              </span>
              <p className="mt-1">{selectedPhotos.length >= MAX_PHOTOS ? '' : 'or drag and drop'}</p>
            </div>
            
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
          
          {/* Absolute positioned background element for animations */}
          {dragActive && (
            <div className="absolute inset-0 bg-blue-500/5 rounded-xl animate-pulse pointer-events-none"></div>
          )}
        </div>
      )}
      
      {/* Photo gallery */}
      {photoPreviewUrls.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Uploaded Photos ({photoPreviewUrls.length}/{MAX_PHOTOS})
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photoPreviewUrls.map((url, index) => (
              <div 
                key={index} 
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
                    src={url} 
                    alt={`Clinic photo ${index + 1}`} 
                    className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 ${loadingImages[index] ? 'opacity-0' : 'opacity-100'}`}
                    style={{ objectPosition: 'center' }}
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {!hasExistingClinic && !loading && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full text-white shadow-md transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    aria-label="Remove photo"
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="sr-only">Remove photo</span>
                  </button>
                )}
                
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Photo {index + 1}
                </div>
              </div>
            ))}
            
            {/* Add more photos button (if below max) */}
            {selectedPhotos.length < MAX_PHOTOS && !hasExistingClinic && !loading && (
              <div 
                className="aspect-w-4 aspect-h-3 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors duration-300"
                onClick={handleAddPhotoClick}
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
      
      {/* Reminder about minimum photos */}
      {selectedPhotos.length > 0 && selectedPhotos.length < MIN_PHOTOS && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 mt-6 animate-fadeIn shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>You need to upload at least {MIN_PHOTOS} photos. Please add {MIN_PHOTOS - selectedPhotos.length} more.</p>
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