import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider - Setting up auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('AuthProvider - Auth state changed:', user ? 'User authenticated' : 'No user');
      console.log('AuthProvider - User details:', user);
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider - Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading
  };

  console.log('AuthProvider - Current state:', { user: user?.email, loading });

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
