import React from 'react';

// Interface for category
interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

// Interface for category form
interface CategoryForm {
  name: string;
  description: string;
  parent_id?: string;
}

interface AddCategoryModalProps {
  showAddModal: boolean;
  formData: CategoryForm;
  categories: Category[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleAddCategory: (e: React.FormEvent) => Promise<void>;
  closeModals: () => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  showAddModal,
  formData,
  categories,
  handleInputChange,
  handleAddCategory,
  closeModals
}) => {
  if (!showAddModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Add New Category</h3>
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
        
        <form onSubmit={handleAddCategory} className="space-y-6">
          <div className="bg-gray-50 p-5 rounded-md border border-gray-200">
            <div className="mb-5">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>
            
            <div className="mb-5">
              <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-2">
                Parent Category (Optional)
              </label>
              <select
                id="parent_id"
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                <option value="">None (Top-level category)</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select a parent to create a sub-category
              </p>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                rows={4}
                placeholder="Enter category description"
              />
            </div>
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
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
