import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import axios from 'axios';

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

  useEffect(() => {
    fetchInventoryItems();
    fetchCategories();
  }, []);

  const fetchInventoryItems = async () => {
    if (!token || !clinicId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://localhost:3000/api/clinics/${clinicId}/inventory`, {
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
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: name === 'current_quantity' || name === 'min_quantity' || 
              name === 'purchase_price' || name === 'sale_price' 
              ? parseFloat(value) : value
    });
  };

  const resetForm = () => {
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

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentItem(null);
    resetForm();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clinicId) return;

    try {
      const response = await axios.post(
        `http://localhost:3000/api/clinics/${clinicId}/inventory`,
        formData,
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
      const response = await axios.put(
        `http://localhost:3000/api/clinics/${clinicId}/inventory/${currentItem.id}`,
        formData,
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

  // Add, Edit, and AddStock Modal Components will be implemented here
  // For brevity, I'm focusing on the main component structure first

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
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map(item => {
                    const category = categories.find(c => c.id === item.category_id);
                    const isLowStock = item.current_quantity <= item.min_quantity;
                    const isOutOfStock = item.current_quantity === 0;
                    
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{category?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {isOutOfStock ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Low Stock: {item.current_quantity}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-900">{item.current_quantity}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.unit_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.purchase_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.sale_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openAddStockModal(item)}
                              className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded"
                              title="Add Stock"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1 rounded"
                              title="Edit"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal implementations would go here */}
    </div>
  );
};

export default InventoryList;