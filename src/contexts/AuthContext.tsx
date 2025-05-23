import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth'; // Remove unused Auth type
import { auth as firebaseAuth } from '../firebaseConfig'; // Assuming auth is exported from firebaseConfig.ts

interface AuthContextType {
  currentUser: User | null; // User type is now correctly imported
  loading: boolean;
  error: string | null;
  register: (email: string, pass: string) => Promise<User | null>;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const register = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      // setCurrentUser(userCredential.user); // onAuthStateChanged will handle this
      setLoading(false);
      return userCredential.user;
    } catch (e: any) {
      setError(e.message || 'Failed to register');
      setLoading(false);
      console.error("Registration error:", e);
      return null;
    }
  };

  const login = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      // setCurrentUser(userCredential.user); // onAuthStateChanged will handle this
      setLoading(false);
      return userCredential.user;
    } catch (e: any) {
      setError(e.message || 'Failed to login');
      setLoading(false);
      console.error("Login error:", e);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    setError(null);
    try {
      await signOut(firebaseAuth);
      // setCurrentUser(null); // onAuthStateChanged will handle this
    } catch (e: any) {
      setError(e.message || 'Failed to logout');
      console.error("Logout error:", e);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
      {/* Render children only after initial auth state check is complete */}
      {/* Or show a global loader: loading ? <GlobalLoader /> : children */}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
