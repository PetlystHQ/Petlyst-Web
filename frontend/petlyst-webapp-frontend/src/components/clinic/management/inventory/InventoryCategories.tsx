import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import axios from 'axios';

// Interface for category
interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
}

// Extended category interface with children
interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

// Interface for category form
interface CategoryForm {
  name: string;
  description: string;
  parent_id?: string;
}

const InventoryCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    description: '',
    parent_id: undefined
  });

  const token = useSelector((state: RootState) => state.auth.token);
  const clinicId = localStorage.getItem('selectedClinicId');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    if (!token || !clinicId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://localhost:3000/api/clinics/${clinicId}/inventory/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.categories) {
        setCategories(response.data.categories);
      } else {
        setError('Failed to load categories');
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value === '' && name === 'parent_id' ? undefined : value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_id: undefined
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentCategory(null);
    resetForm();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clinicId) return;

    try {
      const response = await axios.post(
        `http://localhost:3000/api/clinics/${clinicId}/inventory/categories`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await fetchCategories();
        closeModals();
      }
    } catch (err: any) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clinicId || !currentCategory) return;

    try {
      const response = await axios.put(
        `http://localhost:3000/api/clinics/${clinicId}/inventory/categories/${currentCategory.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await fetchCategories();
        closeModals();
      }
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.message || 'Failed to update category');
    }
  };

  // Function to display categories in a hierarchical structure
  const getCategoryHierarchy = (): CategoryWithChildren[] => {
    // First, get all root categories (no parent)
    const rootCategories = categories.filter(cat => !cat.parent_id);
    
    // Function to get child categories recursively
    const getChildren = (parentId: string): Category[] => {
      return categories.filter(cat => cat.parent_id === parentId);
    };
    
    // Function to build hierarchy recursively
    const buildHierarchy = (cats: Category[]): CategoryWithChildren[] => {
      return cats.map(cat => ({
        ...cat,
        children: buildHierarchy(getChildren(cat.id))
      }));
    };
    
    return buildHierarchy(rootCategories);
  };

  // Recursive component to render category hierarchy
  const CategoryItem = ({ category, level = 0 }: { category: CategoryWithChildren, level?: number }) => {
    return (
      <div className="mb-2">
        <div className={`flex items-center justify-between p-3 bg-white border rounded-md ${level > 0 ? 'ml-6' : ''}`}>
          <div>
            <span className="font-medium">{category.name}</span>
            {category.description && (
              <p className="text-sm text-gray-500">{category.description}</p>
            )}
          </div>
          <button
            onClick={() => openEditModal(category)}
            className="p-1 text-blue-600 hover:text-blue-900 bg-blue-50 rounded"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        
        {category.children && category.children.length > 0 && (
          <div className="mt-2">
            {category.children.map((child) => (
              <CategoryItem key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Add Category Modal
  const AddCategoryModal = () => {
    if (!showAddModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-md p-6">
          <h3 className="text-lg font-medium mb-4">Add New Category</h3>
          
          <form onSubmit={handleAddCategory}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (Optional)</label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">None (Root Category)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Category
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Category Modal
  const EditCategoryModal = () => {
    if (!showEditModal || !currentCategory) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-md p-6">
          <h3 className="text-lg font-medium mb-4">Edit Category</h3>
          
          <form onSubmit={handleEditCategory}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (Optional)</label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">None (Root Category)</option>
                {categories
                  .filter(cat => cat.id !== currentCategory.id) // Prevent selecting self as parent
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))
                }
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Category
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Categories</h3>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
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

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-10 h-10 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
        </div>
      ) : (
        <>
          {categories.length === 0 ? (
            <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new category for your inventory items.
              </p>
              <div className="mt-6">
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Category
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {getCategoryHierarchy().map((category: CategoryWithChildren) => (
                <CategoryItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddCategoryModal />
      <EditCategoryModal />
    </div>
  );
};

export default InventoryCategories; 