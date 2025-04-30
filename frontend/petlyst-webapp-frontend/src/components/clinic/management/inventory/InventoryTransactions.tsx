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
  unit_type: string;
  current_quantity: number;
}

// Interface for transaction
interface Transaction {
  id: string;
  inventory_item_id: string;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'expired' | 'damaged' | 'return';
  quantity: number;
  unit_price: number;
  total_price: number;
  transaction_date: string;
  batch_number?: string;
  expiry_date?: string;
  notes?: string;
  performed_by_user_id: string;
  reference_id?: string;
  clinic_id: string;
  created_at: string;
  item_name?: string;
  performed_by_name?: string;
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

const InventoryTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  
  const [formData, setFormData] = useState<TransactionForm>({
    inventory_item_id: '',
    transaction_type: 'purchase',
    quantity: 0,
    unit_price: 0,
    batch_number: '',
    expiry_date: '',
    notes: '',
    reference_id: ''
  });

  const token = useSelector((state: RootState) => state.auth.token);
  const clinicId = localStorage.getItem('selectedClinicId');
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    fetchTransactions();
    fetchInventoryItems();
  }, []);

  const fetchTransactions = async () => {
    if (!token || !clinicId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://localhost:3000/api/clinics/${clinicId}/inventory/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.transactions) {
        setTransactions(response.data.transactions);
      } else {
        setError('Failed to load transactions');
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    if (!token || !clinicId) return;

    try {
      const response = await axios.get(`http://localhost:3000/api/clinics/${clinicId}/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.items) {
        setInventoryItems(response.data.items);
      }
    } catch (err: any) {
      console.error('Error fetching inventory items:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'unit_price' 
              ? parseFloat(value) 
              : value
    });

    // Auto-calculate total price when unit price or quantity changes
    if (name === 'quantity' || name === 'unit_price') {
      const quantity = name === 'quantity' ? parseFloat(value) : formData.quantity;
      const unitPrice = name === 'unit_price' ? parseFloat(value) : formData.unit_price;
      
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        // This is just for visual feedback in the form - the backend will calculate the actual total
        const totalPrice = quantity * unitPrice;
        console.log('Calculated total price:', totalPrice);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      inventory_item_id: '',
      transaction_type: 'purchase',
      quantity: 0,
      unit_price: 0,
      batch_number: '',
      expiry_date: '',
      notes: '',
      reference_id: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openDetailModal = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setShowDetailModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowDetailModal(false);
    setCurrentTransaction(null);
    resetForm();
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clinicId || !userId) return;

    try {
      // Add the performed_by_user_id to the form data
      const transactionData = {
        ...formData,
        performed_by_user_id: userId
      };

      const response = await axios.post(
        `http://localhost:3000/api/clinics/${clinicId}/inventory/transactions`,
        transactionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await fetchTransactions();
        await fetchInventoryItems(); // Refresh inventory items as quantities may have changed
        closeModals();
      }
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      setError(err.response?.data?.message || 'Failed to add transaction');
    }
  };

  // Filter transactions based on filters
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Filter by date range
      const transactionDate = new Date(transaction.transaction_date);
      const meetsStartDate = startDate ? transactionDate >= new Date(startDate) : true;
      const meetsEndDate = endDate ? transactionDate <= new Date(endDate) : true;
      
      // Filter by transaction type
      const meetsType = selectedType ? transaction.transaction_type === selectedType : true;
      
      // Filter by inventory item
      const meetsItem = selectedItem ? transaction.inventory_item_id === selectedItem : true;
      
      return meetsStartDate && meetsEndDate && meetsType && meetsItem;
    });
  };

  // Get transaction type display name
  const getTransactionTypeDisplay = (type: string): string => {
    switch(type) {
      case 'purchase': return 'Purchase';
      case 'usage': return 'Usage';
      case 'adjustment': return 'Adjustment';
      case 'expired': return 'Expired';
      case 'damaged': return 'Damaged';
      case 'return': return 'Return';
      default: return type;
    }
  };

  // Get item name by ID
  const getItemNameById = (itemId: string): string => {
    const item = inventoryItems.find(item => item.id === itemId);
    return item ? item.name : 'Unknown Item';
  };

  // Transaction Detail Modal Component
  const TransactionDetailModal = () => {
    if (!showDetailModal || !currentTransaction) return null;
    
    const item = inventoryItems.find(item => item.id === currentTransaction.inventory_item_id);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Transaction Details</h3>
            <button
              onClick={closeModals}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Item</p>
              <p className="text-sm text-gray-900">{item?.name || 'Unknown Item'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Transaction Type</p>
              <p className="text-sm text-gray-900">{getTransactionTypeDisplay(currentTransaction.transaction_type)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-sm text-gray-900">{new Date(currentTransaction.transaction_date).toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Quantity</p>
              <p className="text-sm text-gray-900">
                {currentTransaction.quantity} {item?.unit_type || 'units'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Unit Price</p>
              <p className="text-sm text-gray-900">${currentTransaction.unit_price.toFixed(2)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Total Price</p>
              <p className="text-sm text-gray-900">${currentTransaction.total_price.toFixed(2)}</p>
            </div>
            
            {currentTransaction.batch_number && (
              <div>
                <p className="text-sm font-medium text-gray-500">Batch Number</p>
                <p className="text-sm text-gray-900">{currentTransaction.batch_number}</p>
              </div>
            )}
            
            {currentTransaction.expiry_date && (
              <div>
                <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                <p className="text-sm text-gray-900">{new Date(currentTransaction.expiry_date).toLocaleDateString()}</p>
              </div>
            )}
            
            {currentTransaction.reference_id && (
              <div>
                <p className="text-sm font-medium text-gray-500">Reference</p>
                <p className="text-sm text-gray-900">{currentTransaction.reference_id}</p>
              </div>
            )}
          </div>
          
          {currentTransaction.notes && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Notes</p>
              <p className="text-sm text-gray-900 mt-1">{currentTransaction.notes}</p>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeModals}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add Transaction Modal Component
  const AddTransactionModal = () => {
    if (!showAddModal) return null;
    
    const selectedItemData = inventoryItems.find(item => item.id === formData.inventory_item_id);
    const showExpiryAndBatch = formData.transaction_type === 'purchase' || formData.transaction_type === 'adjustment';
    const isDeduction = ['usage', 'expired', 'damaged'].includes(formData.transaction_type);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Add Transaction</h3>
            <button
              onClick={closeModals}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleAddTransaction}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Item</label>
                <select
                  name="inventory_item_id"
                  value={formData.inventory_item_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select an item</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.current_quantity} {item.unit_type} available)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                <select
                  name="transaction_type"
                  value={formData.transaction_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="purchase">Purchase (Add Stock)</option>
                  <option value="usage">Usage (Reduce Stock)</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="expired">Expired</option>
                  <option value="damaged">Damaged</option>
                  <option value="return">Return</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity ({selectedItemData?.unit_type || 'units'})
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  min={0.01}
                  step={0.01}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {isDeduction && selectedItemData && formData.quantity > selectedItemData.current_quantity && (
                  <p className="mt-1 text-xs text-red-600">
                    Warning: Quantity exceeds current stock ({selectedItemData.current_quantity} {selectedItemData.unit_type})
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Price ($)</label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  min={0}
                  step={0.01}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {showExpiryAndBatch && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Batch Number (Optional)</label>
                    <input
                      type="text"
                      name="batch_number"
                      value={formData.batch_number}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      name="expiry_date"
                      value={formData.expiry_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Reference ID (Optional)</label>
                <input
                  type="text"
                  name="reference_id"
                  value={formData.reference_id}
                  onChange={handleInputChange}
                  placeholder="Invoice/Order/Lot number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
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
                Add Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  const filteredTransactions = getFilteredTransactions();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Inventory Transactions</h3>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Transaction
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
      
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Filter Transactions</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="purchase">Purchase</option>
              <option value="usage">Usage</option>
              <option value="adjustment">Adjustment</option>
              <option value="expired">Expired</option>
              <option value="damaged">Damaged</option>
              <option value="return">Return</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Items</option>
              {inventoryItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-10 h-10 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
        </div>
      ) : (
        <>
          {filteredTransactions.length === 0 ? (
            <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {transactions.length === 0 
                  ? 'Get started by adding new transactions to track inventory movement.'
                  : 'No transactions match your current filter criteria.'}
              </p>
              {transactions.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Record First Transaction
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto shadow-md border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map(transaction => {
                    const item = inventoryItems.find(item => item.id === transaction.inventory_item_id);
                    const transactionTypeColor = (() => {
                      switch(transaction.transaction_type) {
                        case 'purchase': return 'bg-green-100 text-green-800';
                        case 'usage': return 'bg-blue-100 text-blue-800';
                        case 'adjustment': return 'bg-purple-100 text-purple-800';
                        case 'expired': return 'bg-red-100 text-red-800';
                        case 'damaged': return 'bg-orange-100 text-orange-800';
                        case 'return': return 'bg-yellow-100 text-yellow-800';
                        default: return 'bg-gray-100 text-gray-800';
                      }
                    })();
                    
                    return (
                      <tr 
                        key={transaction.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => openDetailModal(transaction)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(transaction.transaction_date).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item?.name || getItemNameById(transaction.inventory_item_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transactionTypeColor}`}>
                            {getTransactionTypeDisplay(transaction.transaction_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {transaction.quantity} {item?.unit_type || 'units'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${transaction.total_price.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ${transaction.unit_price.toFixed(2)} per unit
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {transaction.reference_id || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailModal(transaction);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Details
                          </button>
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

      {/* Modals */}
      <AddTransactionModal />
      <TransactionDetailModal />
    </div>
  );
};

export default InventoryTransactions; 