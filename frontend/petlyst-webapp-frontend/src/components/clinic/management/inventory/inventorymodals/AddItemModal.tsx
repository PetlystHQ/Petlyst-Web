import React, { useEffect, useState } from 'react';

// Interface for inventory item form
interface InventoryItemForm {
  name: string;
  sku: string;
  category_id: string;
  description: string;
  unit_type: string;
  current_quantity: number | string;
  min_quantity: number | string;
  purchase_price: number | string;
  sale_price: number | string;
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
  // Local state for numeric values and expiry date
  const [localQuantity, setLocalQuantity] = useState<string>('');
  const [localMinQuantity, setLocalMinQuantity] = useState<string>('');
  const [localPurchasePrice, setLocalPurchasePrice] = useState<string>('');
  const [localSalePrice, setLocalSalePrice] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [previousUnitType, setPreviousUnitType] = useState<string>(formData.unit_type);
  
  // Check if expiry date is in the past
  const isExpiryDateInPast = expiryDate ? new Date(expiryDate) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
  
  // Initialize local state when modal opens
  useEffect(() => {
    if (showAddModal) {
      setLocalQuantity(formData.current_quantity === 0 ? '' : String(formData.current_quantity));
      setLocalMinQuantity(formData.min_quantity === 0 ? '' : String(formData.min_quantity));
      setLocalPurchasePrice(formData.purchase_price === 0 ? '' : String(formData.purchase_price));
      setLocalSalePrice(formData.sale_price === 0 ? '' : String(formData.sale_price));
      setExpiryDate(formData.expiry_date || '');
      setPreviousUnitType(formData.unit_type);
    }
  }, [showAddModal, formData]);
  
  // Handle unit type changes without resetting numeric values
  useEffect(() => {
    if (formData.unit_type !== previousUnitType) {
      setPreviousUnitType(formData.unit_type);
      // No need to reset numeric values when unit type changes
    }
  }, [formData.unit_type, previousUnitType]);
  
  // Handler for numeric field with integer values
  const handleNumericChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const value = e.target.value;
    const name = e.target.name;
    
    // Update local state first
    setter(value);
    
    // Allow empty string for user input
    if (value === '') {
      // Create synthetic event to update parent's formData
      const element = document.createElement('input');
      element.name = name;
      element.value = '0'; // Always send 0 for empty string to avoid null values
      element.type = 'text';
      
      const newEvent = {
        target: element,
        preventDefault: () => {} // Add empty preventDefault method to synthetic event
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleInputChange(newEvent);
      return;
    }
    
    // Only allow numeric input (integers only)
    if (/^\d+$/.test(value)) {
      // Create synthetic event to update parent's formData
      const element = document.createElement('input');
      element.name = name;
      element.value = value;
      element.type = 'text';
      
      const newEvent = {
        target: element,
        preventDefault: () => {} // Add empty preventDefault method to synthetic event
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleInputChange(newEvent);
    }
  };
  
  // Custom handler for expiry date to ensure empty strings become null
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Update local state first
    setExpiryDate(value);
    
    // Make sure parent component gets the actual date value
    const element = document.createElement('input');
    element.name = 'expiry_date';
    element.value = value;
    element.type = 'date';
    
    const newEvent = {
      target: element,
      preventDefault: () => {} // Add empty preventDefault method to synthetic event
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(newEvent);
  };
  
  // Custom handler for unit type changes
  const handleUnitTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Call the parent handler
    handleInputChange(e);
  };

  // Check if purchase price is greater than sale price
  const isPurchasePriceGreaterThanSalePrice = 
    Number(localPurchasePrice) > 0 && 
    Number(localSalePrice) > 0 && 
    Number(localPurchasePrice) > Number(localSalePrice);

  const handleSubmit = (e: React.FormEvent) => {
    // Prevent default form behavior
    e.preventDefault();
    
    // Ensure all numeric values are properly converted to integers before submission
    const element1 = document.createElement('input');
    element1.name = 'current_quantity';
    element1.value = localQuantity || '0';
    element1.type = 'text';
    handleInputChange({
      target: element1,
      preventDefault: () => {}
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    
    const element2 = document.createElement('input');
    element2.name = 'min_quantity';
    element2.value = localMinQuantity || '0';
    element2.type = 'text';
    handleInputChange({
      target: element2,
      preventDefault: () => {}
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    
    const element3 = document.createElement('input');
    element3.name = 'purchase_price';
    element3.value = localPurchasePrice || '0';
    element3.type = 'text';
    handleInputChange({
      target: element3,
      preventDefault: () => {}
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    
    const element4 = document.createElement('input');
    element4.name = 'sale_price';
    element4.value = localSalePrice || '0';
    element4.type = 'text';
    handleInputChange({
      target: element4,
      preventDefault: () => {}
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    
    const element5 = document.createElement('input');
    element5.name = 'expiry_date';
    element5.value = expiryDate;
    element5.type = 'date';
    handleInputChange({
      target: element5,
      preventDefault: () => {}
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    
    // Now call the parent component's handleAddItem
    handleAddItem(e);
  };

  // Koşullu render etme yöntemini değiştirdim - doğrudan return yerine JSX içinde koşullu render
  return (
    <>
      {showAddModal && (
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
            
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      type="text"
                      name="current_quantity"
                      value={localQuantity}
                      onChange={(e) => handleNumericChange(e, setLocalQuantity)}
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                      placeholder="Enter quantity"
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
                      onChange={handleUnitTypeChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                    >
                      <option value="Unit">Unit</option>
                      <option value="Box">Box</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Pack">Pack</option>
                      <option value="Tube">Tube</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="min_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Min Stock Level <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="min_quantity"
                      type="text"
                      name="min_quantity"
                      value={localMinQuantity}
                      onChange={(e) => handleNumericChange(e, setLocalMinQuantity)}
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                      placeholder="Enter minimum quantity"
                    />
                    <p className="mt-1 text-xs text-gray-500">Alert will be triggered when stock falls below this level</p>
                  </div>
                  
                  <div>
                    <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₺</span>
                      </div>
                      <input
                        id="purchase_price"
                        type="text"
                        name="purchase_price"
                        value={localPurchasePrice}
                        onChange={(e) => handleNumericChange(e, setLocalPurchasePrice)}
                        className="w-full border border-gray-300 rounded-md pl-7 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        required
                        placeholder="Enter purchase price"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₺</span>
                      </div>
                      <input
                        id="sale_price"
                        type="text"
                        name="sale_price"
                        value={localSalePrice}
                        onChange={(e) => handleNumericChange(e, setLocalSalePrice)}
                        className="w-full border border-gray-300 rounded-md pl-7 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        required
                        placeholder="Enter sale price"
                      />
                    </div>
                  </div>
                  
                  {isPurchasePriceGreaterThanSalePrice && (
                    <div className="col-span-3 mt-2">
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              Purchase price is greater than sale price. Please confirm if this is correct for an item that will be sold.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                      value={expiryDate}
                      onChange={handleExpiryDateChange}
                      className={`w-full border ${isExpiryDateInPast ? 'border-red-300' : 'border-gray-300'} rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                    />
                    {isExpiryDateInPast && (
                      <p className="mt-1 text-xs text-red-600">
                        Warning: You are adding an item with an expired date.
                      </p>
                    )}
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
      )}
    </>
  );
};

export default AddItemModal;
