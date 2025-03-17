import React, { useState } from 'react';
import { Tooltip } from '../shared/Tooltip';

interface ServicesFormProps {
  formData: {
    servedAnimalTypes: string[];
    medicalServices: string[];
    additionalServices: string[];
  };
  handleServicesChange: (field: 'servedAnimalTypes' | 'medicalServices' | 'additionalServices', value: string[]) => void;
  hasExistingClinic: boolean;
  loading: boolean;
  setError?: (error: string) => void;
  isEditMode?: boolean;
}

// Accordion props için tip tanımlama
interface AccordionSectionProps {
  title: string;
  subtitle: string;
  icon: JSX.Element;
  accentColor: string;
  isOpen: boolean;
  toggleOpen: () => void;
  selectedItemsCount: number;
  children: React.ReactNode;
  isRequired?: boolean;
}

// Varsayılan seçenekler
const animalTypeOptions = [
  'Dogs', 'Cats', 'Birds', 'Rabbits', 'Rodents', 'Ferrets', 'Reptiles', 
  'Amphibians', 'Fish', 'Exotic Pets', 'Farm Animals', 'Horses', 'Other'
];

const medicalServicesOptions = [
  'Vaccination', 'Preventive Care', 'Dental Care', 'Surgery', 'Emergency Care', 'X-Ray',
  'Ultrasound', 'Laboratory Tests', 'Pharmacy', 'Internal Medicine', 'Orthopedics',
  'Cardiology', 'Dermatology', 'Ophthalmology', 'Neurology', 'Reproduction',
  'Behavior Consultation', 'Nutrition Consultation', 'Euthanasia'
];

const additionalServicesOptions = [
  'Grooming', 'Boarding', 'Pet Hotel', 'Pet Daycare', 'Pet Training',
  'Pet Transportation', 'Pet Adoption', 'Pet Insurance', 'Online Consultation',
  'Home Visits', 'Microchipping', 'Pet Food & Supplies'
];

// Akordiyon bileşeni
const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  subtitle,
  icon,
  accentColor,
  isOpen,
  toggleOpen,
  selectedItemsCount,
  children,
  isRequired = false
}) => {
  // Renk konfigürasyonları
  const colorClasses = {
    blue: {
      header: 'bg-blue-50 border-blue-100',
      title: 'text-blue-800',
      subtitle: 'text-blue-600',
      icon: 'text-blue-600',
      chevron: 'text-blue-500',
      count: 'bg-blue-100 text-blue-800'
    },
    green: {
      header: 'bg-green-50 border-green-100',
      title: 'text-green-800',
      subtitle: 'text-green-600',
      icon: 'text-green-600',
      chevron: 'text-green-500',
      count: 'bg-green-100 text-green-800'
    },
    purple: {
      header: 'bg-purple-50 border-purple-100',
      title: 'text-purple-800',
      subtitle: 'text-purple-600',
      icon: 'text-purple-600',
      chevron: 'text-purple-500',
      count: 'bg-purple-100 text-purple-800'
    },
  };
  
  const colors = colorClasses[accentColor as keyof typeof colorClasses];
  
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out">
      <button
        className={`w-full text-left p-4 border-b ${colors.header} flex items-center justify-between`}
        onClick={toggleOpen}
        type="button"
      >
        <div className="flex items-center">
          <span className={`mr-2 ${colors.icon}`}>{icon}</span>
          <div>
            <h3 className={`text-lg font-medium ${colors.title} flex items-center`}>
              {title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
              {selectedItemsCount > 0 && (
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.count}`}>
                  {selectedItemsCount} selected
                </span>
              )}
            </h3>
            <p className={`text-sm ${colors.subtitle} mt-1`}>{subtitle}</p>
          </div>
        </div>
        
        <svg 
          className={`h-5 w-5 ${colors.chevron} transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="p-6 animate-slideDown">
          {children}
        </div>
      )}
    </section>
  );
};

export const ServicesForm: React.FC<ServicesFormProps> = ({
  formData,
  handleServicesChange,
  hasExistingClinic,
  loading,
  setError,
  isEditMode = false
}) => {
  // Track which accordion section is open
  const [openSection, setOpenSection] = useState<string | null>('animalTypes');
  
  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };
  
  const handleOptionToggle = (
    field: 'servedAnimalTypes' | 'medicalServices' | 'additionalServices',
    option: string
  ) => {
    const currentValues = formData[field];
    const updatedValues = currentValues.includes(option)
      ? currentValues.filter(item => item !== option)
      : [...currentValues, option];
    
    handleServicesChange(field, updatedValues);
    
    // Temizle herhangi bir hata mesajını
    if (setError) {
      setError('');
    }
  };

  // ServicesForm bileşenine yüklenir yüklenmez hata mesajını temizleyelim
  React.useEffect(() => {
    if (setError) {
      setError('');
    }
  }, [setError]);

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Clinic Services</h2>
          <Tooltip text="Select the types of animals and services your clinic provides" />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Choose all the animals you treat and services you offer to help pet owners find your clinic.
          <span className="text-red-500 ml-1">* At least one selection required in each category.</span>
        </p>
      </div>

      {/* Accordion sections */}
      <div className="space-y-4">
        {/* Animal Types Section */}
        <AccordionSection 
          title="Served Animal Types"
          subtitle="Select all types of animals your clinic treats"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          }
          accentColor="blue"
          isOpen={openSection === 'animalTypes'}
          toggleOpen={() => toggleSection('animalTypes')}
          selectedItemsCount={formData.servedAnimalTypes.length}
          isRequired={true}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {animalTypeOptions.map((animal) => (
              <div key={animal} className="flex items-center">
                <input
                  type="checkbox"
                  id={`animal-${animal}`}
                  checked={formData.servedAnimalTypes.includes(animal)}
                  onChange={(e) => handleOptionToggle('servedAnimalTypes', animal)}
                  disabled={(hasExistingClinic && !isEditMode) || loading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`animal-${animal}`} className="ml-2 block text-sm text-gray-700">
                  {animal}
                </label>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* Medical Services Section */}
        <AccordionSection 
          title="Medical Services"
          subtitle="Select all medical services your clinic provides"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          }
          accentColor="green"
          isOpen={openSection === 'medicalServices'}
          toggleOpen={() => toggleSection('medicalServices')}
          selectedItemsCount={formData.medicalServices.length}
          isRequired={true}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {medicalServicesOptions.map((service) => (
              <div key={service} className="flex items-center">
                <input
                  type="checkbox"
                  id={`medical-${service}`}
                  checked={formData.medicalServices.includes(service)}
                  onChange={(e) => handleOptionToggle('medicalServices', service)}
                  disabled={(hasExistingClinic && !isEditMode) || loading}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor={`medical-${service}`} className="ml-2 block text-sm text-gray-700">
                  {service}
                </label>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* Additional Services Section */}
        <AccordionSection 
          title="Additional Services"
          subtitle="Select all additional services your clinic offers"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          }
          accentColor="purple"
          isOpen={openSection === 'additionalServices'}
          toggleOpen={() => toggleSection('additionalServices')}
          selectedItemsCount={formData.additionalServices.length}
          isRequired={true}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {additionalServicesOptions.map((service) => (
              <div key={service} className="flex items-center">
                <input
                  type="checkbox"
                  id={`additional-${service}`}
                  checked={formData.additionalServices.includes(service)}
                  onChange={(e) => handleOptionToggle('additionalServices', service)}
                  disabled={(hasExistingClinic && !isEditMode) || loading}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor={`additional-${service}`} className="ml-2 block text-sm text-gray-700">
                  {service}
                </label>
              </div>
            ))}
          </div>
        </AccordionSection>
      </div>
    </div>
  );
};

// Animasyon için CSS ekle
const style = document.createElement('style');
style.innerHTML = `
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slideDown {
  animation: slideDown 0.3s ease-out forwards;
}
`;
document.head.appendChild(style); 