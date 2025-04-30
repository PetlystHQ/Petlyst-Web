import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import axios from 'axios';
import AddItemModal from './inventorymodals/AddItemModal';
import EditItemModal from './inventorymodals/EditItemModal';

// Interface for inventory item
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  category_name?: string;
  description: string;
  unit_type: string;
  current_quantity: number;
  min_quantity: number;
  purchase_price: number;
  sale_price: number;
  location: string;
  expiry_date?: string;
  batch_number?: string;
  image_url?: string;
  is_active: boolean;
}

// Interface for inventory item form
interface InventoryItemForm {
  name: string;
  sku: string;
  category_id: string;
  description: string;
  unit_type: string;
  current_quantity: number;
  min_quantity: number;
  purchase_price: number;
  sale_price: number;
  location: string;
  expiry_date?: string | null;
  batch_number?: string;
}

// Interface for category
interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

const InventoryList: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryItemForm>({
    name: '',
    sku: '',
    category_id: '',
    description: '',
    unit_type: 'Unit',
    current_quantity: 0,
    min_quantity: 0,
    purchase_price: 0,
    sale_price: 0,
    location: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('');

  const token = useSelector((state: RootState) => state.auth.token);
  const clinicId = localStorage.getItem('selectedClinicId');

  // Define closeModals function using useCallback so it can be used in the event listener
  const closeModals = useCallback(() => {
    // First reset form to avoid flicker
    resetForm();
    
    // Then close modals and clear currentItem
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentItem(null);
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
    fetchInventoryItems();
    fetchCategories();
  }, []);

  const fetchInventoryItems = async () => {
    if (!token || !clinicId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://localhost:3000/api/clinics/${clinicId}/inventory/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.items) {
        console.log('Fetched inventory items:', response.data.items);
        
        // Process the items to ensure numeric values are properly parsed
        const processedItems = response.data.items.map((item: any) => ({
          ...item,
          current_quantity: Number(item.current_quantity || 0),
          min_quantity: Number(item.min_quantity || 0),
          purchase_price: Number(item.purchase_price || 0),
          sale_price: Number(item.sale_price || 0)
        }));
        
        setInventoryItems(processedItems);
      } else {
        setError('Failed to load inventory items');
      }
    } catch (err: any) {
      console.error('Error fetching inventory items:', err);
      setError(err.response?.data?.message || 'Failed to fetch inventory items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token || !clinicId) return;

    try {
      const response = await axios.get(`http://localhost:3000/api/clinics/${clinicId}/inventory/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Prevent default form behavior to maintain focus
    e.preventDefault();
    
    // Use callback form of setState to avoid focus issues
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'number' ? 
        // Handle number inputs consistently
        (value === '' ? 0 : parseFloat(value)) : 
        // For other inputs, just use the value directly
        value
    }));
  };

  const resetForm = () => {
    // Reset form to initial state
    setFormData({
      name: '',
      sku: '',
      category_id: '',
      description: '',
      unit_type: 'Unit',
      current_quantity: 0,
      min_quantity: 0,
      purchase_price: 0,
      sale_price: 0,
      location: '',
      expiry_date: '',
      batch_number: '',
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    console.log("Opening edit modal for item:", item);
    console.log("Item expiry date:", item.expiry_date, "type:", typeof item.expiry_date);
    setCurrentItem(item);
    setShowEditModal(true);
  };

  const openAddStockModal = (item: InventoryItem) => {
    // To be implemented for stock transactions
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clinicId) return;

    try {
      // Create a copy of formData with null instead of empty string for expiry_date
      const dataToSubmit = {
        ...formData,
        // Ensure these fields are explicitly included even if they're empty strings
        current_quantity: formData.current_quantity || 0,
        min_quantity: formData.min_quantity || 0,
        purchase_price: formData.purchase_price || 0,
        sale_price: formData.sale_price || 0,
        location: formData.location || null,
        expiry_date: formData.expiry_date === '' ? null : formData.expiry_date,
        batch_number: formData.batch_number || null
      };

      console.log('Submitting new item:', dataToSubmit);

      const response = await axios.post(
        `http://localhost:3000/api/clinics/${clinicId}/inventory/items`,
        dataToSubmit,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await fetchInventoryItems();
        closeModals();
      }
    } catch (err: any) {
      console.error('Error adding inventory item:', err);
      setError(err.response?.data?.message || 'Failed to add inventory item');
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clinicId || !currentItem) return;

    try {
      // Create a copy of formData with null instead of empty string for expiry_date
      const dataToSubmit = {
        ...formData,
        expiry_date: formData.expiry_date === '' ? null : formData.expiry_date
      };

      const response = await axios.put(
        `http://localhost:3000/api/clinics/${clinicId}/inventory/items/${currentItem.id}`,
        dataToSubmit,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await fetchInventoryItems();
        closeModals();
      }
    } catch (err: any) {
      console.error('Error updating inventory item:', err);
      setError(err.response?.data?.message || 'Failed to update inventory item');
    }
  };

  // Filter items based on search term, category, and stock status
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
    
    let matchesStockStatus = true;
    if (selectedStockStatus === 'low') {
      matchesStockStatus = item.current_quantity <= item.min_quantity;
    } else if (selectedStockStatus === 'out') {
      matchesStockStatus = item.current_quantity === 0;
    } else if (selectedStockStatus === 'in') {
      matchesStockStatus = item.current_quantity > 0;
    }
    
    return matchesSearch && matchesCategory && matchesStockStatus;
  });

  // Table columns for inventory items
  const renderTableHeader = () => {
    return (
      <thead>
        <tr className="bg-gray-50 text-left">
          <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
          <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
          <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
          <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
          <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
    );
  };

  // Render each inventory item row
  const renderTableRow = (item: InventoryItem) => {
    // Stock status based on quantity vs reorder level
    const stockStatus = 
      item.current_quantity <= 0 ? 'Out of Stock' : 
      item.current_quantity <= item.min_quantity ? 'Low Stock' : 'In Stock';
      
    const statusColor = 
      item.current_quantity <= 0 ? 'bg-red-100 text-red-800' : 
      item.current_quantity <= item.min_quantity ? 'bg-yellow-100 text-yellow-800' : 
      'bg-green-100 text-green-800';

    return (
      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="p-3 text-sm">
          <div className="font-medium text-gray-900">{item.name}</div>
          {item.description && (
            <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
          )}
        </td>
        <td className="p-3 text-sm text-gray-500">{item.sku || '-'}</td>
        <td className="p-3 text-sm text-gray-500">{item.category_name || '-'}</td>
        <td className="p-3 text-sm text-gray-900 font-medium">{item.current_quantity}</td>
        <td className="p-3 text-sm text-gray-500">{item.unit_type}</td>
        <td className="p-3 text-sm text-gray-500">${Number(item.purchase_price).toFixed(2)}</td>
        <td className="p-3">
          <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
            {stockStatus}
          </span>
        </td>
        <td className="p-3">
          <div className="flex space-x-2">
            <button
              onClick={() => openEditModal(item)}
              className="p-1 text-green-600 hover:text-green-900 bg-green-50 rounded"
              title="Edit Item"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex-1 md:mr-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search inventory items..."
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-48">
            <select
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-48">
            <select
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
            >
              <option value="">All Stock Status</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
              <option value="in">In Stock</option>
            </select>
          </div>
          
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Item
          </button>
        </div>
      </div>

      {/* Inventory items table */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-10 h-10 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
        </div>
      ) : (
        <>
          {filteredItems.length === 0 ? (
            <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding new inventory items to your clinic.
              </p>
              <div className="mt-6">
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Inventory Item
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                {renderTableHeader()}
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map(item => renderTableRow(item))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add Item Modal */}
      <AddItemModal 
        showAddModal={showAddModal}
        formData={formData}
        categories={categories}
        handleInputChange={handleInputChange}
        handleAddItem={handleAddItem}
        closeModals={closeModals}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        showEditModal={showEditModal}
        currentItem={currentItem}
        categories={categories}
        closeModal={() => {
          setShowEditModal(false);
          setCurrentItem(null);
        }}
        onItemUpdated={fetchInventoryItems}
      />
    </div>
  );
};

export default InventoryList;