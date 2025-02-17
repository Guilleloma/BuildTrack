import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('PrivateRoute - Current location:', location);
  console.log('PrivateRoute - Auth state:', { user, loading });

  if (loading) {
    console.log('PrivateRoute - Still loading auth state');
    return null;
  }

  if (!user) {
    console.log('PrivateRoute - No authenticated user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('PrivateRoute - User authenticated, rendering protected content');
  return children;
};

export default PrivateRoute; 
