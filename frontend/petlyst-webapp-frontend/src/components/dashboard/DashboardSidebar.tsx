//import React, { useEffect, useState } from 'react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';

const DashboardSidebar = () => {
  const token = useSelector((state: RootState) => state.auth.token);

  const checkVerificationStatus = async () => {
    try {
      if (!token) {
        console.error('No token found');
        return;
      }

      await axios.get(
        'http://localhost:3000/api/veterinarian/verification-status',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, [token]);

  return (
    <div className="h-full bg-white shadow-lg">
      {/* Rest of your sidebar code */}
    </div>
  );
};

export default DashboardSidebar; 