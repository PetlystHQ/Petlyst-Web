import React, { useState } from 'react';
import { ClinicFormData } from '../../../types/clinic';
import { Tooltip } from '../shared/Tooltip';

interface AppointmentsFormProps {
  formData: ClinicFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  loading: boolean;
}

export const AppointmentsForm: React.FC<AppointmentsFormProps> = ({
  formData,
  handleInputChange,
  loading
}) => {
  // Günler listesi
  const weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Çalışma günlerini güncelle
  const handleDaySelection = (day: string, type: 'regular' | 'emergency') => {
    const field = type === 'regular' ? 'available_days' : 'emergency_available_days';
    const currentDays = formData[field];
    
    // Gün seçili ise kaldır, değilse ekle
    let updatedDays;
    if (currentDays.includes(day)) {
      updatedDays = currentDays.filter(d => d !== day);
    } else {
      updatedDays = [...currentDays, day];
    }
    
    // handleInputChange'i doğrudan çağıralım
    const customEvent = {
      target: {
        name: field,
        value: updatedDays,
        type: 'select-multiple'
      }
    };
    
    // @ts-ignore - Bu event tam olarak HTMLSelectElement ile eşleşmiyor ama amacımız için çalışacak
    handleInputChange(customEvent);
  };

  return (
    <div className="form-section fade-in">
      <h3 className="form-section-title">Clinic Working Hours</h3>
      <p className="text-muted mb-4">Set your clinic's regular and emergency working days and hours.</p>
      
      <div className="mb-4">
        <label className="form-label font-weight-bold">
          Regular Working Days
          <Tooltip text="Select the days when your clinic is regularly open." />
        </label>
        
        <div className="day-selector mb-3">
          {weekDays.map(day => (
            <div 
              key={`regular-${day}`}
              className={`day-chip ${formData.available_days.includes(day) ? 'selected' : ''}`}
              onClick={() => handleDaySelection(day, 'regular')}
            >
              {day.substring(0, 3)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="form-label font-weight-bold">
          Emergency Available Days
          <Tooltip text="Select the days when your clinic is available for emergencies." />
        </label>
        
        <div className="day-selector mb-3">
          {weekDays.map(day => (
            <div 
              key={`emergency-${day}`}
              className={`day-chip emergency ${formData.emergency_available_days.includes(day) ? 'selected' : ''}`}
              onClick={() => handleDaySelection(day, 'emergency')}
            >
              {day.substring(0, 3)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="opening_time" className="form-label font-weight-bold">
            Opening Time
            <Tooltip text="The time when your clinic opens." />
          </label>
          <input
            type="time"
            className="form-control"
            id="opening_time"
            name="opening_time"
            value={formData.opening_time}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
        </div>
        
        <div className="col-md-6 mb-3">
          <label htmlFor="closing_time" className="form-label font-weight-bold">
            Closing Time
            <Tooltip text="The time when your clinic closes." />
          </label>
          <input
            type="time"
            className="form-control"
            id="closing_time"
            name="closing_time"
            value={formData.closing_time}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
        </div>
      </div>

      <style>
        {`
        .day-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .day-chip {
          padding: 8px 16px;
          border-radius: 20px;
          background-color: #f1f1f1;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #ddd;
        }
        
        .day-chip.selected {
          background-color: #4caf50;
          color: white;
          border-color: #3d8b40;
        }
        
        .day-chip.emergency {
          border-color: #f44336;
        }
        
        .day-chip.emergency.selected {
          background-color: #f44336;
          color: white;
          border-color: #d32f2f;
        }
        `}
      </style>
    </div>
  );
}; 