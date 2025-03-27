// Constants for predefined veterinary expertise areas
export type VeterinaryExpertiseArea = {
  id: string;
  name: string;
  category?: string;
};

// List of veterinary expertise areas organized by categories
export const VETERINARY_EXPERTISE_AREAS: VeterinaryExpertiseArea[] = [
  // Small Animal Medicine
  { id: 'small_animal_general', name: 'Small Animal General Practice', category: 'Small Animal Medicine' },
  { id: 'small_animal_internal', name: 'Small Animal Internal Medicine', category: 'Small Animal Medicine' },
  { id: 'small_animal_surgery', name: 'Small Animal Surgery', category: 'Small Animal Medicine' },
  { id: 'small_animal_cardiology', name: 'Small Animal Cardiology', category: 'Small Animal Medicine' },
  { id: 'small_animal_dermatology', name: 'Small Animal Dermatology', category: 'Small Animal Medicine' },
  { id: 'small_animal_dentistry', name: 'Small Animal Dentistry', category: 'Small Animal Medicine' },
  { id: 'small_animal_ophthalmology', name: 'Small Animal Ophthalmology', category: 'Small Animal Medicine' },
  { id: 'small_animal_orthopedics', name: 'Small Animal Orthopedics', category: 'Small Animal Medicine' },
  { id: 'small_animal_neurology', name: 'Small Animal Neurology', category: 'Small Animal Medicine' },
  { id: 'small_animal_oncology', name: 'Small Animal Oncology', category: 'Small Animal Medicine' },
  { id: 'small_animal_behavior', name: 'Small Animal Behavior', category: 'Small Animal Medicine' },
  
  // Large Animal Medicine
  { id: 'large_animal_general', name: 'Large Animal General Practice', category: 'Large Animal Medicine' },
  { id: 'equine_medicine', name: 'Equine Medicine', category: 'Large Animal Medicine' },
  { id: 'equine_surgery', name: 'Equine Surgery', category: 'Large Animal Medicine' },
  { id: 'food_animal_medicine', name: 'Food Animal Medicine', category: 'Large Animal Medicine' },
  { id: 'bovine_medicine', name: 'Bovine Medicine', category: 'Large Animal Medicine' },
  { id: 'ruminant_medicine', name: 'Ruminant Medicine', category: 'Large Animal Medicine' },
  { id: 'swine_medicine', name: 'Swine Medicine', category: 'Large Animal Medicine' },
  { id: 'poultry_medicine', name: 'Poultry Medicine', category: 'Large Animal Medicine' },
  
  // Exotic Animal Medicine
  { id: 'exotic_animal_medicine', name: 'Exotic Animal Medicine', category: 'Exotic Animal Medicine' },
  { id: 'avian_medicine', name: 'Avian Medicine', category: 'Exotic Animal Medicine' },
  { id: 'reptile_medicine', name: 'Reptile Medicine', category: 'Exotic Animal Medicine' },
  { id: 'amphibian_medicine', name: 'Amphibian Medicine', category: 'Exotic Animal Medicine' },
  { id: 'fish_medicine', name: 'Fish Medicine', category: 'Exotic Animal Medicine' },
  { id: 'wildlife_medicine', name: 'Wildlife Medicine', category: 'Exotic Animal Medicine' },
  { id: 'zoo_medicine', name: 'Zoo Medicine', category: 'Exotic Animal Medicine' },
  
  // Specialized Services
  { id: 'emergency_critical_care', name: 'Emergency & Critical Care', category: 'Specialized Services' },
  { id: 'veterinary_anesthesia', name: 'Veterinary Anesthesia', category: 'Specialized Services' },
  { id: 'veterinary_radiology', name: 'Veterinary Radiology & Imaging', category: 'Specialized Services' },
  { id: 'veterinary_pathology', name: 'Veterinary Pathology', category: 'Specialized Services' },
  { id: 'veterinary_microbiology', name: 'Veterinary Microbiology', category: 'Specialized Services' },
  { id: 'veterinary_parasitology', name: 'Veterinary Parasitology', category: 'Specialized Services' },
  { id: 'veterinary_nutrition', name: 'Veterinary Nutrition', category: 'Specialized Services' },
  { id: 'veterinary_pharmacology', name: 'Veterinary Pharmacology', category: 'Specialized Services' },
  { id: 'preventive_medicine', name: 'Preventive Medicine', category: 'Specialized Services' },
  { id: 'rehabilitation_medicine', name: 'Rehabilitation Medicine', category: 'Specialized Services' },
  
  // Other Specialties
  { id: 'laboratory_animal_medicine', name: 'Laboratory Animal Medicine', category: 'Other Specialties' },
  { id: 'public_health', name: 'Public Health', category: 'Other Specialties' },
  { id: 'theriogenology', name: 'Theriogenology (Reproduction)', category: 'Other Specialties' },
  { id: 'toxicology', name: 'Toxicology', category: 'Other Specialties' },
  { id: 'epidemiology', name: 'Epidemiology', category: 'Other Specialties' },
  { id: 'animal_welfare', name: 'Animal Welfare', category: 'Other Specialties' },
];

// Get expertise by ID
export const getExpertiseById = (id: string): VeterinaryExpertiseArea | undefined => {
  return VETERINARY_EXPERTISE_AREAS.find(expertise => expertise.id === id);
};

// Get expertise name by ID
export const getExpertiseNameById = (id: string): string => {
  const expertise = getExpertiseById(id);
  return expertise ? expertise.name : id;
};

// Get all categories
export const EXPERTISE_CATEGORIES = Array.from(
  new Set(VETERINARY_EXPERTISE_AREAS.map(expertise => expertise.category))
).filter(Boolean) as string[];
