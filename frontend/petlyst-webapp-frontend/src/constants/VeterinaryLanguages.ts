/**
 * Constants and utilities for veterinary languages
 */

// Language interface
export interface Language {
  id: string;
  name: string;
  category: string;
}

// Language categories
export const LANGUAGE_CATEGORIES = [
  'European Languages',
  'Turkic Languages'
];

// Predefined languages commonly spoken by veterinarians
export const VETERINARY_LANGUAGES: Language[] = [
  // European Languages
  { id: 'english', name: 'English', category: 'European Languages' },
  { id: 'spanish', name: 'Spanish', category: 'European Languages' },
  { id: 'french', name: 'French', category: 'European Languages' },
  { id: 'german', name: 'German', category: 'European Languages' },
  
  // Turkic Languages
  { id: 'turkish', name: 'Turkish', category: 'Turkic Languages' },
  { id: 'azerbaijan', name: 'Azerbaijani', category: 'Turkic Languages' },

];

/**
 * Get a language by its ID
 */
export const getLanguageById = (id: string): Language | undefined => {
  return VETERINARY_LANGUAGES.find(language => language.id === id);
};

/**
 * Get a language name by its ID
 */
export const getLanguageNameById = (id: string): string => {
  const language = getLanguageById(id);
  return language ? language.name : id;
};

/**
 * Get all languages in a specific category
 */
export const getLanguagesByCategory = (category: string): Language[] => {
  return VETERINARY_LANGUAGES.filter(language => language.category === category);
};
