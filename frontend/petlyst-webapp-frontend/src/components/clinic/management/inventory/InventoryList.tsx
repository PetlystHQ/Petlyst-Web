import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import axios from 'axios';
import AddItemModal from './inventorymodals/AddItemModal';

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
  expiry_date?: string;
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
        setInventoryItems(response.data.items);
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
    setCurrentItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || '',
      category_id: item.category_id,
      description: item.description || '',
      unit_type: item.unit_type,
      current_quantity: item.current_quantity,
      min_quantity: item.min_quantity,
      purchase_price: item.purchase_price,
      sale_price: item.sale_price,
      location: item.location || '',
      expiry_date: item.expiry_date,
      batch_number: item.batch_number,
    });
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
        expiry_date: formData.expiry_date === '' ? null : formData.expiry_date
      };

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
        <td className="p-3 text-sm text-gray-500">${(item.purchase_price || 0).toFixed(2)}</td>
        <td className="p-3">
          <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
            {stockStatus}
          </span>
        </td>
        <td className="p-3">
          <div className="flex space-x-2">
            <button
              onClick={() => openAddStockModal(item)}
              className="p-1 text-blue-600 hover:text-blue-900 bg-blue-50 rounded"
              title="Add Stock"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </button>
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

  // Edit Item Modal
  const EditItemModal = () => {
    if (!showEditModal || !currentItem) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-xl font-semibold text-gray-800">Edit Inventory Item</h3>
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
          
          <form onSubmit={handleEditItem} className="space-y-6">
            {/* Item Details Section */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-4">Item Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-sku" className="block text-sm font-medium text-gray-700 mb-2">
                    SKU / Item Code
                  </label>
                  <input
                    id="edit-sku"
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="Enter SKU or item code"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-category_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="Enter item description"
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Stock & Pricing Section */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-4">Stock & Pricing</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="edit-unit_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-unit_type"
                    name="unit_type"
                    value={formData.unit_type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    required
                  >
                    <option value="Unit">Unit</option>
                    <option value="Box">Box</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Pack">Pack</option>
                    <option value="Vial">Vial</option>
                    <option value="Ampule">Ampule</option>
                    <option value="Tube">Tube</option>
                    <option value="Syringe">Syringe</option>
                    <option value="Bag">Bag</option>
                    <option value="Roll">Roll</option>
                    <option value="Piece">Piece</option>
                    <option value="Pair">Pair</option>
                    <option value="Kit">Kit</option>
                    <option value="Set">Set</option>
                    <option value="Gram">Gram</option>
                    <option value="Kilogram">Kilogram</option>
                    <option value="Milliliter">Milliliter</option>
                    <option value="Liter">Liter</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="edit-min_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Min Stock Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-min_quantity"
                    type="number"
                    name="min_quantity"
                    value={formData.min_quantity}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Alert will be triggered when stock falls below this level</p>
                </div>
                
                <div>
                  <label htmlFor="edit-purchase_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      id="edit-purchase_price"
                      type="number"
                      name="purchase_price"
                      value={formData.purchase_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-md pl-7 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="edit-sale_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      id="edit-sale_price"
                      type="number"
                      name="sale_price"
                      value={formData.sale_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-md pl-7 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Details Section */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-4">Additional Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="edit-expiry_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    id="edit-expiry_date"
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-batch_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number
                  </label>
                  <input
                    id="edit-batch_number"
                    type="text"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Location
                  </label>
                  <input
                    id="edit-location"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="Shelf, cabinet, etc."
                  />
                </div>
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
                Update Item
              </button>
            </div>
          </form>
        </div>
      </div>
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

      {/* Add Item Modal - Updated to use the new component */}
      <AddItemModal 
        showAddModal={showAddModal}
        formData={formData}
        categories={categories}
        handleInputChange={handleInputChange}
        handleAddItem={handleAddItem}
        closeModals={closeModals}
      />

      {/* Edit Item Modal */}
      <EditItemModal />
    </div>
  );
};

export default InventoryList;