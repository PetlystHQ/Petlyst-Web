import React from 'react';
import { SocialMediaLink } from '../../../types/clinic';

interface SocialMediaSectionProps {
  socialMediaLinks: SocialMediaLink[];
  handleSocialMediaChange: (index: number, field: 'platform' | 'url', value: string) => void;
  handleAddEmptySocialMedia: () => void;
  handleRemoveSocialMedia: (index: number) => void;
  hasExistingClinic: boolean;
  loading: boolean;
}

// Maximum number of social media links allowed
const MAX_SOCIAL_MEDIA_LINKS = 4;

export const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({
  socialMediaLinks,
  handleSocialMediaChange,
  handleAddEmptySocialMedia,
  handleRemoveSocialMedia,
  hasExistingClinic,
  loading
}) => {
  // Check if maximum number of links is reached
  const isMaxLinksReached = socialMediaLinks.length >= MAX_SOCIAL_MEDIA_LINKS;

  return (
    <div>
      <div className="flex items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Social Media Accounts
        </label>
      </div>
      
      <div className="space-y-3">
        {socialMediaLinks.length === 0 && (
          <p className="text-sm text-gray-500 italic">Optional: Add your clinic's social media accounts (max 4)</p>
        )}
        
        {socialMediaLinks.map((link, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-1/3">
              <div className="relative">
                <select 
                  value={link.platform}
                  onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                  disabled={hasExistingClinic || loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="" disabled>Choose Platform</option>
                  {!socialMediaLinks.some((l, i) => i !== index && l.platform === 'Facebook') && (
                    <option value="Facebook">Facebook</option>
                  )}
                  {!socialMediaLinks.some((l, i) => i !== index && l.platform === 'Instagram') && (
                    <option value="Instagram">Instagram</option>
                  )}
                  {!socialMediaLinks.some((l, i) => i !== index && l.platform === 'Twitter') && (
                    <option value="Twitter">Twitter</option>
                  )}
                  {!socialMediaLinks.some((l, i) => i !== index && l.platform === 'LinkedIn') && (
                    <option value="LinkedIn">LinkedIn</option>
                  )}
                </select>
              </div>
            </div>
            <div className="w-2/3">
              <div className="flex items-center">
                <div className="w-full">
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleSocialMediaChange(index, 'url', e.target.value)}
                    placeholder="Enter URL"
                    disabled={hasExistingClinic || loading || !link.platform}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                {/* Styled delete button in a square box */}
                <button
                  type="button"
                  onClick={() => handleRemoveSocialMedia(index)}
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
        ))}
        
        {/* Add new social media row */}
        <button
          type="button"
          onClick={handleAddEmptySocialMedia}
          disabled={hasExistingClinic || loading || isMaxLinksReached}
          className={`w-full mt-2 py-3 px-3 border border-dashed ${isMaxLinksReached ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'} rounded-md focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg className={`h-4 w-4 mr-2 ${isMaxLinksReached ? 'text-gray-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span className={`text-sm font-medium ${isMaxLinksReached ? 'text-gray-400' : 'text-blue-600'}`}>
            {isMaxLinksReached ? 'Maximum links reached (4)' : 'Add Social Media Link'}
          </span>
        </button>
        
        {socialMediaLinks.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Maximum 4 social media links allowed. Each platform can only be added once.
          </p>
        )}
      </div>
    </div>
  );
}; 