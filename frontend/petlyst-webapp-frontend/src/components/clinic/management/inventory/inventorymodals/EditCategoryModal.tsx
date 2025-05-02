import React, { useEffect, useRef, useState } from 'react';

// Interface for category
interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
}

// Interface for category form
interface CategoryForm {
  name: string;
  description: string;
  parent_id?: string;
  is_active: boolean;
}

interface EditCategoryModalProps {
  showEditModal: boolean;
  currentCategory: Category | null;
  categories: Category[];
  formData: CategoryForm;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleEditCategory: (e: React.FormEvent) => Promise<void>;
  closeModals: () => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  showEditModal,
  currentCategory,
  categories,
  formData,
  handleInputChange,
  handleEditCategory,
  closeModals
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isActive, setIsActive] = useState(formData.is_active);
  
  // Update local state when formData changes
  useEffect(() => {
    if (formData.is_active !== undefined) {
      setIsActive(formData.is_active);
    }
  }, [formData.is_active]);
  
  // Focus the name input when the modal opens
  useEffect(() => {
    if (showEditModal && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [showEditModal]);
  
  // Reset isActive state when modal opens with a new category
  useEffect(() => {
    if (currentCategory) {
      setIsActive(currentCategory.is_active);
    }
  }, [currentCategory]);
  
  if (!showEditModal || !currentCategory) return null;
  
  // Handle toggle switch click - completely rewritten
  const handleToggleChange = () => {
    // Toggle local state
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    
    console.log('Toggle switched:', newIsActive);
    
    // Direct modification of formData through a custom event
    // This should ensure the parent component updates its state correctly
    const customEvent = {
      target: {
        name: 'is_active',
        value: newIsActive, // Send as boolean
        type: 'checkbox',
        checked: newIsActive
      },
      // Add preventDefault method to avoid errors
      preventDefault: () => {},
      stopPropagation: () => {}
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    // Log the event for debugging
    console.log('Sending custom event:', customEvent);
    
    // Pass to parent component
    handleInputChange(customEvent);
  };
  
  // Modified submit handler to ensure is_active is properly included
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log the form data before submission
    console.log('Form data before submission:', { 
      ...formData,
      is_active: isActive // Show the actual value that will be sent
    });
    
    // Ensure the formData has the latest isActive value
    // This might not be necessary if handleToggleChange works properly,
    // but adding as a safeguard
    const customEvent = {
      target: {
        name: 'is_active',
        value: isActive,
        type: 'checkbox',
        checked: isActive
      },
      // Add preventDefault method to avoid errors
      preventDefault: () => {},
      stopPropagation: () => {}
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(customEvent);
    
    // Small delay to ensure state is updated
    setTimeout(() => {
      // Call the original edit handler
      handleEditCategory(e);
    }, 10);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Edit Category</h3>
          <button
            onClick={closeModals}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-5 rounded-md border border-gray-200">
            <div className="mb-5">
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="edit-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>
            
            <div className="mb-5">
              <label htmlFor="edit-parent_id" className="block text-sm font-medium text-gray-700 mb-2">
                Parent Category (Optional)
              </label>
              <select
                id="edit-parent_id"
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                <option value="">None (Top-level category)</option>
                {categories
                  .filter(category => category.id !== currentCategory.id) // Prevent circular references
                  .map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))
                }
              </select>
              <p className="mt-1 text-xs text-gray-500">
                A category cannot be its own parent
              </p>
            </div>
            
            <div className="mb-5">
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                rows={4}
                placeholder="Enter category description"
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">Active Status</span>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-500">{isActive ? 'Active' : 'Inactive'}</span>
                <button 
                  type="button"
                  onClick={handleToggleChange}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}
                  aria-pressed={isActive}
                  aria-labelledby="active-status"
                >
                  <span className="sr-only" id="active-status">Active status</span>
                  <span
                    className={`${isActive ? 'bg-blue-600' : 'bg-gray-200'} 
                      pointer-events-none relative inline-block h-5 w-10 rounded-full transition-colors duration-200 ease-in-out`}
                  >
                    <span
                      className={`${isActive ? 'translate-x-5' : 'translate-x-0'} 
                        pointer-events-none absolute top-0 left-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </span>
                </button>
              </div>
            </div>
            
            {/* This ensures the is_active value is explicitly included in the form submission */}
            <input 
              type="hidden" 
              name="is_active" 
              id="is_active_hidden"
              value={isActive ? "true" : "false"} 
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={closeModals}
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Update Category
            </button>
          </div>
          
          {/* Debug section - remove in production */}
          <div className="text-xs text-gray-500 border-t pt-2 mt-4">
            <p>Toggle state: {isActive ? 'true' : 'false'}</p>
            <p>Form is_active: {formData.is_active ? 'true' : 'false'}</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;
