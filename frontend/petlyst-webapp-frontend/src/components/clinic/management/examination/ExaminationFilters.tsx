import React, { useState, useEffect, ChangeEvent } from 'react';
import { ExaminationFilter } from './examinationService';

interface ExaminationFiltersProps {
  onFilterChange: (filters: ExaminationFilter) => void;
}

const ExaminationFilters: React.FC<ExaminationFiltersProps> = ({ onFilterChange }) => {
  const [petId, setPetId] = useState<string>('');
  const [petName, setPetName] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [clinicId, setClinicId] = useState<string>('');

  // Debounce filter changes to not overwhelm with API requests
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      const filters: ExaminationFilter = {};
      
      if (petId) filters.pet_id = parseInt(petId);
      if (status) filters.status = status;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;
      if (clinicId) filters.clinic_id = parseInt(clinicId);
      
      onFilterChange(filters);
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [petId, status, startDate, endDate, clinicId, onFilterChange]);

  const handleReset = () => {
    setPetId('');
    setPetName('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setClinicId('');
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
      <h3 className="text-lg font-semibold mb-3">Filtreler</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="petFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Hayvan
          </label>
          <input
            id="petFilter"
            type="text"
            placeholder="Hayvan adını girin"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={petName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPetName(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Durum
          </label>
          <select
            id="statusFilter"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={status}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="started">Başlandı</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="clinicFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Klinik
          </label>
          <select
            id="clinicFilter"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={clinicId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setClinicId(e.target.value)}
          >
            <option value="">Tümü</option>
            {/* Klinik listesi dinamik olarak yüklenebilir */}
          </select>
        </div>
        
        <div>
          <label htmlFor="startDateFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Başlangıç Tarihi
          </label>
          <input
            id="startDateFilter"
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={startDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="endDateFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Bitiş Tarihi
          </label>
          <input
            id="endDateFilter"
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={endDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
          />
        </div>
        
        <div className="flex items-end">
          <button 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            onClick={handleReset}
          >
            Sıfırla
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExaminationFilters;
