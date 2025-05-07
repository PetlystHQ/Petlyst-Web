import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axios from 'axios';
import InventoryList from '../../../components/clinic/management/inventory/InventoryList';
import InventoryCategories from '../../../components/clinic/management/inventory/InventoryCategories';
import InventoryTransactions from '../../../components/clinic/management/inventory/InventoryTransactions';

// Tab types
type TabType = 'items' | 'categories' | 'transactions' | 'idss';

const InventoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const token = useSelector((state: RootState) => state.auth.token);
  const clinicId = localStorage.getItem('selectedClinicId');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'items':
        return <InventoryList />;
      case 'categories':
        return <InventoryCategories />;
      case 'transactions':
        return <InventoryTransactions />;
      case 'idss':
        return <div className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Intelligent Decision Support System
            </h3>
            <p className="text-gray-600 max-w-md mb-6">
              AI-powered inventory optimization coming soon.
            </p>
          </div>
        </div>;
      default:
        return <InventoryList />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Inventory Management</h2>
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

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inventory Items
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('idss')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center ${
              activeTab === 'idss'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center">
              <span className={`mr-1.5 flex items-center justify-center rounded-full p-1 ${
                activeTab === 'idss' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <svg className={`w-4 h-4 ${
                  activeTab === 'idss' ? 'text-purple-600' : 'text-gray-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </span>
              <span className={activeTab === 'idss' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-semibold' : ''}>
                iDSS
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-10 h-10 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
            </div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;