import React from 'react';
import { PhoneNumberEntry, PhoneTypeEnum } from '../../../types/clinic';

interface PhoneNumberSectionProps {
  phoneNumbers: PhoneNumberEntry[];
  handlePhoneNumberChange: (index: number, field: 'type' | 'number', value: string) => void;
  handleAddEmptyPhoneNumber: () => void;
  handleRemovePhoneNumber: (index: number) => void;
  hasExistingClinic: boolean;
  loading: boolean;
  invalidLengthPhoneNumbers?: PhoneNumberEntry[]; // 11 haneli olmayan telefon numaralarını tutan prop
}

// Maximum number of phone numbers allowed
const MAX_PHONE_NUMBERS = 5;

// Function to get user-friendly label for phone type enum values
const getPhoneTypeLabel = (type: PhoneTypeEnum): string => {
  switch(type) {
    case 'fixed_line':
      return 'Fixed Line';
    case 'mobile_number':
      return 'Mobile Number';
    case '':
      return 'Select Type';
    default:
      return 'Select Type';
  }
};

export const PhoneNumberSection: React.FC<PhoneNumberSectionProps> = ({
  phoneNumbers,
  handlePhoneNumberChange,
  handleAddEmptyPhoneNumber,
  handleRemovePhoneNumber,
  hasExistingClinic,
  loading,
  invalidLengthPhoneNumbers = [] // Varsayılan olarak boş dizi
}) => {
  // Check if maximum number of phone numbers is reached
  const isMaxNumbersReached = phoneNumbers.length >= MAX_PHONE_NUMBERS;

  // Belirli bir telefon numarasının 11 haneli olup olmadığını kontrol eden yardımcı fonksiyon
  const isInvalidPhoneNumber = (phone: PhoneNumberEntry) => {
    return invalidLengthPhoneNumbers.some(
      invalidPhone => 
        invalidPhone.type === phone.type && 
        invalidPhone.number === phone.number
    );
  };

  return (
    <div>
      <div className="flex items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Phone Numbers
        </label>
      </div>
      
      <div className="space-y-3">
        {phoneNumbers.length === 0 && (
          <p className="text-sm text-gray-500 italic">Add your clinic's phone numbers (max 5)</p>
        )}
        
        {phoneNumbers.map((entry, index) => {
          const isInvalid = isInvalidPhoneNumber(entry);
          
          // Telefon numarasının geçerliliğini kontrol et (11 haneli ve boş olmayan)
          const isValidPhoneNumber = entry.type && 
            entry.number && 
            entry.number.trim() !== '' && 
            entry.number.trim().replace(/\s+/g, '').length === 11;
          
          // Kenarlık sınıfını belirle: geçersizse kırmızı, geçerliyse yeşil, diğer durumlarda gri
          const inputBorderClass = isInvalid 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : isValidPhoneNumber
              ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';

          return (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-1/3">
                <div className="relative">
                  <select 
                    value={entry.type}
                    onChange={(e) => handlePhoneNumberChange(index, 'type', e.target.value)}
                    disabled={hasExistingClinic || loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="" disabled>Select Type</option>
                    <option value="fixed_line">Fixed Line</option>
                    <option value="mobile_number">Mobile Number</option>
                  </select>
                </div>
              </div>
              <div className="w-2/3">
                <div className="flex items-center">
                  <div className="w-full relative">
                    <input
                      type="tel"
                      value={entry.number}
                      onChange={(e) => handlePhoneNumberChange(index, 'number', e.target.value)}
                      placeholder="Enter phone number (11 digits)"
                      disabled={hasExistingClinic || loading || !entry.type}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 ${inputBorderClass} ${isValidPhoneNumber ? 'pr-10' : ''}`}
                    />
                    
                    {/* Geçerli telefon numarası için yeşil tik ekle */}
                    {isValidPhoneNumber && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}                    
                  </div>
                  {/* Styled delete button in a square box */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoneNumber(index)}
                    disabled={hasExistingClinic || loading}
                    className="ml-2 w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md bg-white text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Add new phone number row */}
        <button
          type="button"
          onClick={handleAddEmptyPhoneNumber}
          disabled={hasExistingClinic || loading || isMaxNumbersReached}
          className={`w-full mt-2 py-3 px-3 border border-dashed ${isMaxNumbersReached ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'} rounded-md focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg className={`h-4 w-4 mr-2 ${isMaxNumbersReached ? 'text-gray-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span className={`text-sm font-medium ${isMaxNumbersReached ? 'text-gray-400' : 'text-blue-600'}`}>
            {isMaxNumbersReached ? 'Maximum phone numbers reached (5)' : 'Add Phone Number'}
          </span>
        </button>
        
        {phoneNumbers.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Maximum 5 phone numbers allowed. Add both fixed line and mobile numbers as needed. Phone numbers must be exactly 11 digits.
          </p>
        )}
      </div>
    </div>
  );
}; 