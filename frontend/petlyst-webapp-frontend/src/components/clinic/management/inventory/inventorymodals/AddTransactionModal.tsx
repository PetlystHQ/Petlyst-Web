import React from 'react';

// Interface for inventory item
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  unit_type: string;
  current_quantity: number;
}

// Interface for transaction form
interface TransactionForm {
  inventory_item_id: string;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'expired' | 'damaged' | 'return';
  quantity: number;
  unit_price: number;
  batch_number?: string;
  expiry_date?: string;
  notes?: string;
  reference_id?: string;
}

interface AddTransactionModalProps {
  showAddModal: boolean;
  formData: TransactionForm;
  inventoryItems: InventoryItem[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleAddTransaction: (e: React.FormEvent) => Promise<void>;
  closeModals: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  showAddModal,
  formData,
  inventoryItems,
  handleInputChange,
  handleAddTransaction,
  closeModals
}) => {
  if (!showAddModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-medium">Add New Transaction</h3>
          <button onClick={closeModals} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleAddTransaction} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory Item <span className="text-red-500">*</span>
              </label>
              <select
                name="inventory_item_id"
                value={formData.inventory_item_id}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select an item</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku || 'No SKU'})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type <span className="text-red-500">*</span>
              </label>
              <select
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="purchase">Purchase (Add to Inventory)</option>
                <option value="usage">Usage (Remove from Inventory)</option>
                <option value="adjustment">Adjustment</option>
                <option value="expired">Expired Items</option>
                <option value="damaged">Damaged Items</option>
                <option value="return">Return Items</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price
              </label>
              <input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave at 0 for non-purchase transactions
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number
              </label>
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference ID
              </label>
              <input
                type="text"
                name="reference_id"
                value={formData.reference_id}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Invoice number, order number, etc."
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={closeModals}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
