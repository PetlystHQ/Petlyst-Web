import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store';
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
  expiry_date?: string | null;
  batch_number?: string;
  image_url?: string;
  is_active: boolean;
}

// Interface for category
interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

// Interface for form data
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
  is_active: boolean;
}

interface EditItemModalProps {
  showEditModal: boolean;
  currentItem: InventoryItem | null;
  categories: Category[];
  closeModal: () => void;
  onItemUpdated: () => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({
  showEditModal,
  currentItem,
  categories,
  closeModal,
  onItemUpdated
}) => {
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
    expiry_date: '',
    batch_number: '',
    is_active: true
  });
  // Local state for expiry date to fix date input issues
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = useSelector((state: RootState) => state.auth.token);
  const clinicId = localStorage.getItem('selectedClinicId');

  // Initialize form when currentItem changes
  useEffect(() => {
    if (currentItem) {
      // Format the date properly if it exists
      let formattedDate = '';
      if (currentItem.expiry_date) {
        console.log('Original expiry_date from DB:', currentItem.expiry_date);
        
        // Handle possible date formats
        try {
          // If it's already in YYYY-MM-DD format
          if (typeof currentItem.expiry_date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(currentItem.expiry_date)) {
            // Just take the first 10 characters in case there's a time component
            formattedDate = currentItem.expiry_date.substring(0, 10);
            console.log('Using direct date string:', formattedDate);
          } else {
            // Try to parse as date and format
            const date = new Date(currentItem.expiry_date);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
              console.log('Parsed date to:', formattedDate);
            }
          }
        } catch (err) {
          console.error('Error formatting date:', err);
        }
      }

      console.log('Setting expiryDate state to:', formattedDate);
      setExpiryDate(formattedDate);

      setFormData({
        name: currentItem.name,
        sku: currentItem.sku || '',
        category_id: currentItem.category_id,
        description: currentItem.description || '',
        unit_type: currentItem.unit_type,
        current_quantity: Number(currentItem.current_quantity),
        min_quantity: Number(currentItem.min_quantity),
        purchase_price: Number(currentItem.purchase_price),
        sale_price: Number(currentItem.sale_price || 0),
        location: currentItem.location || '',
        expiry_date: formattedDate,
        batch_number: currentItem.batch_number || '',
        is_active: currentItem.is_active
      });
    }
  }, [currentItem]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'number' ? 
        (value === '' ? 0 : parseFloat(value)) : 
        value
    }));
  };

  // Custom handler for expiry date to ensure proper format and handling
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    console.log('Date input changed to:', value);
    
    // Update local state first
    setExpiryDate(value);
    
    // Then update form data state, ensuring empty strings become null
    const finalValue = value === '' ? null : value;
    
    setFormData(prevState => ({
      ...prevState,
      expiry_date: finalValue
    }));
  };

  // Handle form submission
  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clinicId || !currentItem) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create a copy of formData with proper handling for expiry_date
      const dataToSubmit = {
        ...formData,
        // Ensure numeric values are properly formatted
        current_quantity: Number(formData.current_quantity) || 0,
        min_quantity: Number(formData.min_quantity) || 0,
        purchase_price: Number(formData.purchase_price) || 0,
        sale_price: Number(formData.sale_price) || 0,
        // Format the date properly
        expiry_date: formData.expiry_date || null
      };

      console.log('Submitting edited data:', dataToSubmit);

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
        console.log('Item updated successfully:', response.data.item);
        // Refresh inventory list
        onItemUpdated();
        // Close modal
        closeModal();
      }
    } catch (err: any) {
      console.error('Error updating inventory item:', err);
      setError(err.response?.data?.message || 'Failed to update inventory item');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showEditModal || !currentItem) return null;
    
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Edit Inventory Item</h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
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
                <label htmlFor="edit-current_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-current_quantity"
                  type="number"
                  name="current_quantity"
                  value={formData.current_quantity}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  required
                />
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
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
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
              onClick={closeModal}
              disabled={isLoading}
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;
