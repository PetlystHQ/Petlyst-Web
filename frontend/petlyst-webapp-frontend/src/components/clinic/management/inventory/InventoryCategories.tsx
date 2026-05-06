import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import axios from 'axios';
import AddCategoryModal from './inventorymodals/AddCategoryModal';
import EditCategoryModal from './inventorymodals/EditCategoryModal';
import { API_URL } from '../../../../config/api';
import { getApiErrorMessage } from '../../../../utils/errorMessage';

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
  is_active: boolean;
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
    parent_id: undefined,
    is_active: true
  });

  const token = useSelector((state: RootState) => state.auth.token);
  const clinicId = localStorage.getItem('selectedClinicId');

  // Define closeModals function using useCallback so it can be used in the event listener
  const closeModals = useCallback(() => {
    // First reset form to avoid flicker
    resetForm();
    
    // Then close modals and clear currentCategory
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentCategory(null);
  }, []);

  // Add event listener for ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (showAddModal || showEditModal)) {
        closeModals();
      }
    };

    // Add event listener when modals are open
    if (showAddModal || showEditModal) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Cleanup - remove event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showAddModal, showEditModal, closeModals]);

  useEffect(() => {
    fetchCategories();
    // fetchCategories is in-component and runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    if (!token || !clinicId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/clinics/${clinicId}/inventory/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.categories) {
        setCategories(response.data.categories);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(getApiErrorMessage(err, 'Failed to fetch categories'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Prevent default form behavior to maintain focus
    e.preventDefault();
    
    // Handle checkbox input
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prevState => ({
        ...prevState,
        [name]: checked
      }));
      return;
    }
    
    // Use callback form of setState to avoid focus issues
    setFormData(prevState => ({
      ...prevState,
      [name]: value === '' && name === 'parent_id' ? undefined : value
    }));
  };

  const resetForm = () => {
    // Reset form to initial state
    setFormData({
      name: '',
      description: '',
      parent_id: undefined,
      is_active: true
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
      parent_id: category.parent_id,
      is_active: category.is_active
    });
    setShowEditModal(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clinicId) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/clinics/${clinicId}/inventory/categories`,
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
    } catch (err) {
      console.error('Error adding category:', err);
      setError(getApiErrorMessage(err, 'Failed to add category'));
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clinicId || !currentCategory) return;

    try {
      const response = await axios.put(
        `${API_URL}/api/clinics/${clinicId}/inventory/categories/${currentCategory.id}`,
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
    } catch (err) {
      console.error('Error updating category:', err);
      setError(getApiErrorMessage(err, 'Failed to update category'));
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
        <div className={`flex items-center justify-between p-3 bg-white border rounded-md ${level > 0 ? 'ml-6' : ''} ${!category.is_active ? 'opacity-60' : ''}`}>
          <div>
            <div className="flex items-center">
              <span className="font-medium">{category.name}</span>
              {!category.is_active && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  Inactive
                </span>
              )}
            </div>
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

  // Render category hierarchy and other UI
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
      <AddCategoryModal 
        showAddModal={showAddModal}
        formData={formData}
        categories={categories}
        handleInputChange={handleInputChange}
        handleAddCategory={handleAddCategory}
        closeModals={closeModals}
      />
      <EditCategoryModal 
        showEditModal={showEditModal}
        currentCategory={currentCategory}
        categories={categories}
        formData={formData}
        handleInputChange={handleInputChange}
        handleEditCategory={handleEditCategory}
        closeModals={closeModals}
      />
    </div>
  );
};

export default InventoryCategories; 