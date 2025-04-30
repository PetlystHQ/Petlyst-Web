import React, { useEffect } from 'react';

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

interface AddItemModalProps {
  showAddModal: boolean;
  formData: InventoryItemForm;
  categories: Category[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleAddItem: (e: React.FormEvent) => Promise<void>;
  closeModals: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  showAddModal,
  formData,
  categories,
  handleInputChange,
  handleAddItem,
  closeModals
}) => {
  if (!showAddModal) return null;
  
  // Custom handler for expiry date to ensure empty strings become null
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue = value === '' ? null : value;
    
    // Create a synthetic event with the modified value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: finalValue
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(syntheticEvent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Add New Inventory Item</h3>
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
        
        <form onSubmit={handleAddItem} className="space-y-6">
          {/* Item Details Section */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-4">Item Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name <span className="text-red-500">*</span>
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
              
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                  SKU / Item Code
                </label>
                <input
                  id="sku"
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  placeholder="Enter SKU or item code"
                />
              </div>
              
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category_id"
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
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
                <label htmlFor="current_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  id="current_quantity"
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
                <label htmlFor="unit_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="unit_type"
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
                <label htmlFor="min_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Stock Level <span className="text-red-500">*</span>
                </label>
                <input
                  id="min_quantity"
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
                <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    id="purchase_price"
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
                <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    id="sale_price"
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
                <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  id="expiry_date"
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date || ''}
                  onChange={handleExpiryDateChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
              
              <div>
                <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number
                </label>
                <input
                  id="batch_number"
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Location
                </label>
                <input
                  id="location"
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
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
