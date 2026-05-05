import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { updateProfile } from '../../store/slices/authSlice';
import axiosInstance from '../../utils/axiosConfig';
import { PencilIcon, CheckIcon, ArrowUpTrayIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { getApiErrorMessage, getApiErrorResponse } from '../../utils/errorMessage';
interface MyProfileProps {
  loading?: boolean;
  error?: string | null;
}

const MyProfile: React.FC<MyProfileProps> = ({ loading: externalLoading = false, error: externalError = null }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useAppDispatch();
  
  // Profile state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profileData, setProfileData] = useState({
    phone: user?.phone || '',
    address: user?.address || '',
    profilePhoto: user?.profile_photo || '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [phoneValid, setPhoneValid] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fetchLoading, setFetchLoading] = useState<boolean>(true);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [photoLoading, setPhotoLoading] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  // Fetch profile data (extract as named function to be reused)
  const fetchProfileData = async () => {
    try {
      setFetchLoading(true);
      setFetchError(null);
      
      const response = await axiosInstance.get('/pet-owners/profile');
      
      if (response.data.success) {
        const userData = response.data.user;
        console.log('Refreshed profile data after update:', userData);
        setProfileData({
          phone: userData.phone || '',
          address: userData.address || '',
          profilePhoto: userData.profile_photo || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setFetchError(getApiErrorMessage(err, 'Failed to fetch profile data'));
    } finally {
      setFetchLoading(false);
    }
  };

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    if (phoneNumber.length <= 10) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  // Validate phone number
  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const isValid = cleanPhone === '' || cleanPhone.length === 10;
    setPhoneValid(isValid);
    return isValid;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setProfileData({ ...profileData, [name]: formattedPhone });
      validatePhone(formattedPhone);
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUpdateError('Profile photo must be less than 5MB');
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUpdateError('Profile photo must be a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    setPhotoFile(file);
    setPhotoLoading(true);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setPhotoLoading(false);
    };
    reader.onerror = () => {
      setUpdateError('Error reading file');
      setPhotoLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle choosing and removing photo
  const handleChoosePhoto = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    // Kullanıcının mevcut profil fotoğrafını kaldırmak istediğini işaretle
    setProfileData(prev => ({
      ...prev,
      profilePhoto: '' // Profil fotoğrafını temizle
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Eğer edit modunda değilsek ve direkt kaldırmak istiyorsak güncellemeyi tetikle
    if (!isEditing && user?.profile_photo) {
      handleRemovePhotoSubmit();
    }
  };
  
  // Explicitly handle profile photo removal
  const handleRemovePhotoSubmit = async () => {
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    
    try {
      // Extract the S3 key from the current profile photo URL if available
      let photoKey = null;
      const fullPhotoUrl = user?.profile_photo || '';
      
      if (user?.profile_photo && user.profile_photo.includes('amazonaws.com/')) {
        photoKey = user.profile_photo.split('amazonaws.com/')[1];
        console.log('Extracted S3 key for deletion:', photoKey);
      }
      
      const formData = new FormData();
      formData.append('remove_photo', 'true');
      
      // Send both the key and full URL to help backend identify and delete the file
      if (photoKey) {
        formData.append('photo_key', photoKey);
      }
      
      if (fullPhotoUrl) {
        formData.append('full_photo_url', fullPhotoUrl);
      }
      
      // Also send the user ID to help locate the folder in S3
      formData.append('user_id', user?.id?.toString() || '');
      
      console.log('Submitting profile photo removal with key:', photoKey);
      console.log('Full photo URL:', fullPhotoUrl);
      
      const response = await axiosInstance.put('/pet-owners/profile', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Server response for photo removal:', response.data);
      
      if (response.data.success) {
        setUpdateSuccess(true);
        
        // Clear profile photo in local state
        setProfileData(prev => ({
          ...prev,
          profilePhoto: ''
        }));
        
        // Update Redux state with empty profile photo to ensure it's cleared
        dispatch(updateProfile({
          phone: user?.phone || '',
          address: user?.address || '',
          profile_photo: '' // Use empty string instead of null to match type expectations
        }));
        
        // Force refresh profile data from the server to ensure we have the latest state
        setTimeout(() => {
          fetchProfileData();
        }, 500);
      }
    } catch (err) {
      console.error('Profile photo removal error:', err);
      setUpdateError(getApiErrorMessage(err, 'Failed to remove profile photo'));
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(profileData.phone)) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const formData = new FormData();
      
      // Form verilerini ekle - boş string yerine null değer gönderme
      formData.append('user_phone', profileData.phone || '');
      formData.append('user_address', profileData.address || '');
      
      // Debug için konsola çıktı
      console.log('Submitting profile update with data:', {
        phone: profileData.phone || '',
        address: profileData.address || '',
        hasPhotoFile: !!photoFile,
        hasExistingPhoto: !!profileData.profilePhoto,
        originalPhoto: user?.profile_photo
      });
      
      // Handle photo uploading logic
      if (photoFile) {
        // Yeni fotoğraf yükle
        console.log('Adding photo file to form:', photoFile.name, photoFile.type, photoFile.size);
        formData.append('profile_photo', photoFile);
      } else if (!profileData.profilePhoto && user?.profile_photo) {
        // Profil fotoğrafı önceden vardı ama şimdi temizlendi - kaldırma isteği
        console.log('Requesting photo removal - clear flag is set');
        formData.append('remove_photo', 'true');
      } else if (profileData.profilePhoto) {
        console.log('Using existing photo URL');
        formData.append('user_profile_photo', profileData.profilePhoto);
      }
      
      // Form verilerini kontrol et
      console.log('Form data entries:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      const response = await axiosInstance.put('/pet-owners/profile', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Server response:', response.data);

      if (response.data.success) {
        setUpdateSuccess(true);
        setIsEditing(false);
        
        const updatedProfile = response.data.user || {
          phone: profileData.phone,
          address: profileData.address,
          profile_photo: response.data.profile_photo || profileData.profilePhoto
        };
        
        console.log('Updating Redux state with:', updatedProfile);
        
        dispatch(updateProfile({
          phone: updatedProfile.phone,
          address: updatedProfile.address,
          profile_photo: updatedProfile.profile_photo // Use the actual profile photo URL
        }));
        
        // Reset photo state
        setPhotoFile(null);
        setPhotoPreview('');
        
        // Update local state with the new profile photo from the server
        setProfileData(prev => ({
          ...prev,
          profilePhoto: updatedProfile.profile_photo || ''
        }));
      }
    } catch (err) {
      console.error('Profile update error:', err);
      console.error('Error response:', getApiErrorResponse(err)?.data);
      setUpdateError(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setUpdateLoading(false);
    }
  };

  // Toggle edit mode and cancel
  const toggleEditMode = () => {
    setIsEditing(true);
    setUpdateSuccess(false);
    setPhotoPreview('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData({
      phone: user?.phone || '',
      address: user?.address || '',
      profilePhoto: user?.profile_photo || '',
    });
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUpdateError(null);
    setUpdateSuccess(false);
    setPhoneValid(true);
  };

  // Determine if we're loading
  const isLoading = externalLoading || fetchLoading;
  const error = externalError || fetchError;

  // Determine which image to display
  const displayImage = photoPreview || profileData.profilePhoto;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with profile photo */}
      <div className="relative h-28 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="absolute -bottom-12 left-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
              {displayImage ? (
                <img 
                  src={displayImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : isEditing ? (
                  <button 
                    type="button"
                    onClick={handleChoosePhoto}
                    className="flex flex-col items-center justify-center text-blue-500 w-full h-full"
                  >
                    <ArrowUpTrayIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs">Add Photo</span>
                  </button>
              ) : (
                <UserCircleIcon className="w-16 h-16 text-gray-400" />
              )}
              
              {photoLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white"></div>
                </div>
              )}
            </div>
            {isEditing && displayImage && (
              <button 
                type="button"
                onClick={handleChoosePhoto}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/jpg"
            className="hidden"
          />
        </div>
      </div>

      {/* Profile content */}
      <div className="p-5 pt-16">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">My Profile</h2>
          {!isEditing && (
            <button 
              type="button"
              onClick={toggleEditMode}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3 text-sm">
            <p>{error}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {updateSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start text-sm">
                <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-green-800">Profile updated successfully!</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input 
                  type="text" 
                  value={user?.name || ''} 
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input 
                  type="text" 
                  value={user?.surname || ''} 
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={user?.email} 
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
            </div>

            {/* Contact Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
                {isEditing && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
              </label>
              <input 
                type="tel" 
                name="phone"
                value={profileData.phone} 
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-md text-sm
                  ${!phoneValid ? 'border-red-500' : 'border-gray-300'} 
                  ${!isEditing ? 'bg-gray-50' : 'bg-white'}`
                }
                placeholder="(555) 123-4567"
              />
              {!phoneValid && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid 10-digit phone number or leave it empty</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
                {isEditing && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
              </label>
              <textarea 
                name="address"
                value={profileData.address} 
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={2}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                placeholder="Enter your address"
              />
            </div>

            {isEditing && displayImage && (
              <div>
                <div className="flex items-center mt-1">
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Profile Photo
                  </button>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {updateError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">
                <p>{updateError}</p>
              </div>
            )}
            
            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updateLoading || !phoneValid}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
