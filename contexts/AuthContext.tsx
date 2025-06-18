"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState, LoginRequest, LoginResponse, AuthError } from '@/models/auth';
import { tokenStorage, authUtils, setupAutoLogout } from '@/lib/auth-utils';
import { getApiUrl, publicFetch } from '@/lib/api-config';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading true
  });
  
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const userData = tokenStorage.getUserData();
        
        if (token && userData && authUtils.isAuthenticated()) {
          // Token exists and is valid
          setAuthState({
            user: userData,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Setup auto-logout functionality
          const cleanup = setupAutoLogout();
          
          // Cleanup on component unmount
          return cleanup;
        } else {
          // No valid token/user data
          tokenStorage.clearAll();
          setAuthState({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        tokenStorage.clearAll();
        setAuthState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await publicFetch(getApiUrl('auth/login'), {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
      }

      const loginData: LoginResponse = await response.json();
      
      // Store token and user data
      tokenStorage.setAccessToken(loginData.access_token);
      tokenStorage.setUserData(loginData.user);

      // Update auth state
      setAuthState({
        user: loginData.user,
        accessToken: loginData.access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Setup auto-logout
      setupAutoLogout();

      console.log('Login successful for user:', loginData.user.username);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', errorMessage);
      
      // Clear any partial auth data
      tokenStorage.clearAll();
      
      setAuthState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      setError(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    try {
      // Call logout endpoint (optional, for tracking purposes)
      publicFetch(getApiUrl('auth/logout'), {
        method: 'POST',
      }).catch(error => {
        // Ignore logout endpoint errors, we're logging out anyway
        console.log('Logout endpoint error (ignored):', error);
      });
    } catch (error) {
      // Ignore errors during logout API call
      console.log('Logout API call failed (ignored):', error);
    }

    // Clear local auth data
    tokenStorage.clearAll();
    
    // Update auth state
    setAuthState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    setError(null);
    
    console.log('User logged out');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Refresh user data from backend
  const refreshUserData = async (): Promise<void> => {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token || !authUtils.isAuthenticated()) {
        throw new Error('No valid token available');
      }

      const response = await fetch(getApiUrl('auth/me'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          logout();
          return;
        }
        throw new Error('Failed to refresh user data');
      }

      const userData: User = await response.json();
      
      // Update stored user data
      tokenStorage.setUserData(userData);
      
      // Update auth state
      setAuthState(prev => ({
        ...prev,
        user: userData,
      }));

    } catch (error) {
      console.error('Error refreshing user data:', error);
      // Don't logout on refresh errors unless it's auth-related
      if (error instanceof Error && error.message.includes('401')) {
        logout();
      }
    }
  };

  // Clear error function
  const clearError = (): void => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshUserData,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}