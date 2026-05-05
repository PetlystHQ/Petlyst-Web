import React, { useState, useEffect } from 'react';

const Pets: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // Örnek veri yükleme efekti
  useEffect(() => {
    // Veri yükleme simülasyonu
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">My Pets</h2>
      <p className="text-gray-600">Pet yönetim bileşeni buraya gelecek.</p>
    </div>
  );
};

export default Pets; 