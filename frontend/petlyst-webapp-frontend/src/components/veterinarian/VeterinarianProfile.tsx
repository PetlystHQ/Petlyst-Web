import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppSelector } from '../../hooks/useAppSelector';
import { API_ENDPOINTS } from '../../constants/dashboard';

interface Education {
  education_id: number;
  school_name: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

interface FormData {
  school_name: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

const VeterinarianProfile: React.FC = () => {
  const { token } = useAppSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState<string>('education');
  
  // Education state
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [educationLoading, setEducationLoading] = useState<boolean>(true);
  const [educationError, setEducationError] = useState<string | null>(null);
  
  // Education form state
  const [showEducationForm, setShowEducationForm] = useState<boolean>(false);
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const [educationFormData, setEducationFormData] = useState<FormData>({
    school_name: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false
  });

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEducationId, setDeleteEducationId] = useState<number | null>(null);

  useEffect(() => {
    fetchEducation();
  }, [token]);

  const fetchEducation = async () => {
    try {
      setEducationLoading(true);
      const response = await axios.get(API_ENDPOINTS.EDUCATION, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEducationList(response.data);
      setEducationError(null);
    } catch (error) {
      console.error('Error fetching education data:', error);
      setEducationError('Failed to load education data. Please try again later.');
    } finally {
      setEducationLoading(false);
    }
  };

  const handleAddEducation = () => {
    setEducationFormData({
      school_name: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      is_current: false
    });
    setEditingEducationId(null);
    setShowEducationForm(true);
  };

  const handleEditEducation = (education: Education) => {
    setEducationFormData({
      school_name: education.school_name,
      field_of_study: education.field_of_study,
      start_date: education.start_date.split('T')[0], // Format date to YYYY-MM-DD
      end_date: education.end_date ? education.end_date.split('T')[0] : '',
      is_current: education.is_current
    });
    setEditingEducationId(education.education_id);
    setShowEducationForm(true);
  };

  const handleEducationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEducationFormData(prev => ({
        ...prev,
        [name]: checked,
        ...(name === 'is_current' && checked ? { end_date: '' } : {})
      }));
    } else {
      setEducationFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        school_name: educationFormData.school_name,
        field_of_study: educationFormData.field_of_study,
        start_date: educationFormData.start_date,
        end_date: educationFormData.is_current ? null : educationFormData.end_date,
        is_current: educationFormData.is_current
      };

      if (editingEducationId) {
        // Update existing education
        await axios.put(`${API_ENDPOINTS.EDUCATION}/${editingEducationId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Add new education
        await axios.post(API_ENDPOINTS.EDUCATION, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Reset form and fetch updated data
      setShowEducationForm(false);
      setEditingEducationId(null);
      fetchEducation();
    } catch (error) {
      console.error('Error saving education:', error);
      setEducationError('Failed to save education data. Please try again.');
    }
  };

  const handleDeleteEducation = async (educationId: number) => {
    setDeleteEducationId(educationId);
    setShowDeleteModal(true);
  };

  const confirmDeleteEducation = async () => {
    try {
      if (deleteEducationId) {
        await axios.delete(`${API_ENDPOINTS.EDUCATION}/${deleteEducationId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchEducation();
        setShowDeleteModal(false);
        setDeleteEducationId(null);
      }
    } catch (error) {
      console.error('Error deleting education:', error);
      setEducationError('Failed to delete education record. Please try again.');
      setShowDeleteModal(false);
    }
  };

  const cancelDeleteEducation = () => {
    setShowDeleteModal(false);
    setDeleteEducationId(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const renderEducationSection = () => {
    if (educationLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-10 h-10 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      );
    }

    if (educationError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{educationError}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Education Form */}
        {showEducationForm && (
          <div className="bg-white rounded-lg p-6 mb-8 shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">
              {editingEducationId ? 'Edit Education' : 'Add Education'}
            </h3>
            <form onSubmit={handleSubmitEducation}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-1">
                    School/University <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="school_name"
                    name="school_name"
                    value={educationFormData.school_name}
                    onChange={handleEducationFormChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="e.g. Ankara University"
                  />
                </div>
                
                <div>
                  <label htmlFor="field_of_study" className="block text-sm font-medium text-gray-700 mb-1">
                    Field of Study <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="field_of_study"
                    name="field_of_study"
                    value={educationFormData.field_of_study}
                    onChange={handleEducationFormChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="e.g. Veterinary Medicine"
                  />
                </div>
                
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={educationFormData.start_date}
                    onChange={handleEducationFormChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                </div>
                
                <div className="flex items-center h-full pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="is_current"
                      name="is_current"
                      checked={educationFormData.is_current}
                      onChange={handleEducationFormChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      I am currently studying here
                    </span>
                  </label>
                </div>
                
                {!educationFormData.is_current && (
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={educationFormData.end_date}
                      onChange={handleEducationFormChange}
                      required={!educationFormData.is_current}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowEducationForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                >
                  {editingEducationId ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Education
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Education List */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Education History</h3>
              <p className="text-sm text-gray-500 mt-1">Add your academic qualifications and education background</p>
            </div>
            {!showEducationForm && (
              <button
                onClick={handleAddEducation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Education
              </button>
            )}
          </div>
          
          {/* No education records message - only show when no records AND form is not visible */}
          {educationList.length === 0 && !showEducationForm && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-500 mb-2">No education records found</p>
              <p className="text-sm text-gray-400">Add your educational background to enhance your professional profile</p>
            </div>
          )}
          
          {/* Education list - only render if we have records */}
          {educationList.length > 0 && (
            <div className="space-y-4">
              {educationList.map((education) => (
                <div key={education.education_id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">{education.school_name}</h4>
                      <p className="text-gray-600 mt-1">{education.field_of_study}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {formatDate(education.start_date)} - {education.is_current ? 
                            <span className="text-blue-600 font-medium">Present</span> : 
                            formatDate(education.end_date)
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEducation(education)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteEducation(education.education_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {education.is_current && (
                    <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Currently Studying
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Profile Tabs */}
      <div className="px-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('education')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'education'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Education
            </div>
          </button>
          <button
            onClick={() => setActiveTab('certifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'certifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Certifications
            </div>
          </button>
          <button
            onClick={() => setActiveTab('expertise')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'expertise'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Areas of Expertise
            </div>
          </button>
          <button
            onClick={() => setActiveTab('biography')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'biography'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Biography
            </div>
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'education' && renderEducationSection()}
        {activeTab === 'certifications' && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Certifications Coming Soon</h3>
            <p className="text-gray-500 max-w-md">
              You will soon be able to add your professional certifications and licenses to enhance your veterinary profile.
            </p>
          </div>
        )}
        {activeTab === 'expertise' && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Areas of Expertise Coming Soon</h3>
            <p className="text-gray-500 max-w-md">
              You will soon be able to highlight your specialized areas of expertise to show your unique veterinary skills.
            </p>
          </div>
        )}
        {activeTab === 'biography' && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Biography Coming Soon</h3>
            <p className="text-gray-500 max-w-md">
              You will soon be able to write your professional biography to tell clients about your background and veterinary philosophy.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">Delete Education Record</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this education record? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={cancelDeleteEducation}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEducation}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeterinarianProfile; 