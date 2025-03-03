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

export const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({
  socialMediaLinks,
  handleSocialMediaChange,
  handleAddEmptySocialMedia,
  handleRemoveSocialMedia,
  hasExistingClinic,
  loading
}) => {
  return (
    <div>
      <div className="flex items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">
          URLs
        </label>
      </div>
      
      <div className="space-y-3">
        {socialMediaLinks.length === 0 && (
          <p className="text-sm text-gray-500 italic">Optional: Add your clinic's social media links</p>
        )}
        
        {socialMediaLinks.map((link, index) => {
          // Define all icons outside of the switch statement
          const facebookIcon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
          </svg>;
          
          const instagramIcon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428.247-.67.632-1.276 1.153-1.772a4.91 4.91 0 011.772-1.153c.637-.247 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z" />
          </svg>;
          
          const twitterIcon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
          </svg>;
          
          const linkedinIcon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>;
          
          // Get the appropriate icon and color based on the current platform
          let icon;
          let iconColor;
          
          switch(link.platform) {
            case 'Facebook':
              icon = facebookIcon;
              iconColor = "text-blue-600";
              break;
            case 'Instagram':
              icon = instagramIcon;
              iconColor = "text-pink-600";
              break;
            case 'Twitter':
              icon = twitterIcon;
              iconColor = "text-blue-400";
              break;
            case 'LinkedIn':
              icon = linkedinIcon;
              iconColor = "text-blue-700";
              break;
            default:
              icon = null;
              iconColor = "text-gray-600";
          }
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-1/3">
                <div className="relative">
                  <select 
                    value={link.platform}
                    onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                    disabled={hasExistingClinic || loading}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
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
                  {/* Position the icon with proper alignment */}
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <div className={iconColor}>
                      {icon}
                    </div>
                  </div>
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
                    className="ml-2 w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md bg-white text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Add new social media row */}
        <button
          type="button"
          onClick={handleAddEmptySocialMedia}
          disabled={hasExistingClinic || loading}
          className="w-full mt-2 py-3 px-3 border border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm text-blue-600 font-medium">Add social media link</span>
        </button>
      </div>
    </div>
  );
}; 