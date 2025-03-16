import React from 'react';

interface VideoConferenceButtonProps {
  className?: string;
}

const VideoConferenceButton: React.FC<VideoConferenceButtonProps> = ({ className = '' }) => {
  const handleStartMeeting = () => {
    window.open('https://meet.jit.si/PetlystVeterinarianMeeting', '_blank');
  };

  return (
    <div className={`p-4 sm:p-6 bg-purple-50 rounded-lg border border-purple-100 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-purple-800 mb-3">Video Conference</h3>
      <p className="text-sm text-purple-700 mb-3">Start or join a video meeting with pet owners using Jitsi Meet</p>
      <button
        onClick={handleStartMeeting}
        className="w-full px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Start Jitsi Meeting
      </button>
    </div>
  );
};

export default VideoConferenceButton; 