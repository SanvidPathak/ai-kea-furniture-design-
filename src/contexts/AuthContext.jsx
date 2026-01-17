import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getCurrentUser, getUserProfile } from '../services/authService.js';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    useEffect(() => {
      // Listen for auth state changes
      // NOTE: onAuthChange fires immediately with current user (or null) from indexedDB
      // We rely on THIS to set initial loading state properly.
      const unsubscribe = onAuthChange(async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Fetch additional profile data (role) from Firestore
            const profile = await getUserProfile(firebaseUser.uid);
            setUser({ ...firebaseUser, ...profile });
          } catch (error) {
            console.error("Error fetching user profile:", error);
            // Fallback to basic auth user if firestore fails
            setUser(firebaseUser);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, []);

    const value = {
      user,
      loading,
      isAuthenticated: !!user,
    };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }
