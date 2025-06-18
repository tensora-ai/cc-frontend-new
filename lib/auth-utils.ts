/**
 * Authentication utilities for token management and JWT handling
 */

import { JWTPayload, User, UserRole } from "@/models/auth";

// Storage keys
const ACCESS_TOKEN_KEY = 'tensora_count_access_token';
const USER_DATA_KEY = 'tensora_count_user_data';

/**
 * Token Storage Functions
 */
export const tokenStorage = {
  // Store access token
  setAccessToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  },

  // Get access token
  getAccessToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  },

  // Remove access token
  removeAccessToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  },

  // Store user data
  setUserData: (user: User): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }
  },

  // Get user data
  getUserData: (): User | null => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(USER_DATA_KEY);
      if (userData) {
        try {
          return JSON.parse(userData) as User;
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          return null;
        }
      }
    }
    return null;
  },

  // Remove user data
  removeUserData: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_DATA_KEY);
    }
  },

  // Clear all auth data
  clearAll: (): void => {
    tokenStorage.removeAccessToken();
    tokenStorage.removeUserData();
  }
};

/**
 * JWT Token Functions
 */
export const jwtUtils = {
  // Decode JWT payload without verification (for client-side use only)
  decodePayload: (token: string): JWTPayload | null => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload) as JWTPayload;
    } catch (error) {
      console.error('Error decoding JWT payload:', error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    const payload = jwtUtils.decodePayload(token);
    if (!payload) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  },

  // Get token expiry date
  getTokenExpiry: (token: string): Date | null => {
    const payload = jwtUtils.decodePayload(token);
    if (!payload) return null;
    
    return new Date(payload.exp * 1000);
  },

  // Check if token expires within specified minutes
  isTokenExpiringSoon: (token: string, minutesThreshold: number = 5): boolean => {
    const payload = jwtUtils.decodePayload(token);
    if (!payload) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const thresholdTime = currentTime + (minutesThreshold * 60);
    
    return payload.exp < thresholdTime;
  }
};

/**
 * Auth State Functions
 */
export const authUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = tokenStorage.getAccessToken();
    if (!token) return false;
    
    return !jwtUtils.isTokenExpired(token);
  },

  // Get current user from stored data
  getCurrentUser: (): User | null => {
    if (!authUtils.isAuthenticated()) return null;
    return tokenStorage.getUserData();
  },

  // Logout user (clear all data)
  logout: (): void => {
    tokenStorage.clearAll();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  // Check if user has specific role
  hasRole: (user: User | null, role: UserRole): boolean => {
    return user?.role === role;
  },

  // Check if user is super admin
  isSuperAdmin: (user: User | null): boolean => {
    return authUtils.hasRole(user, UserRole.SUPER_ADMIN);
  },

  // Check if user has access to a specific project
  hasProjectAccess: (user: User | null, projectId: string): boolean => {
    if (!user) return false;
    
    // Super admin has access to all projects
    if (authUtils.isSuperAdmin(user)) return true;
    
    // Check if project is in user's access list
    return user.project_access?.includes(projectId) ?? false;
  },

  // Get user's accessible project IDs
  getAccessibleProjects: (user: User | null): string[] => {
    if (!user) return [];
    
    // Super admin has access to all projects (return empty array to indicate "all")
    if (authUtils.isSuperAdmin(user)) return [];
    
    // Return user's specific project access
    return user.project_access ?? [];
  },

  // Check if user can manage projects (create/delete)
  canManageProjects: (user: User | null): boolean => {
    return authUtils.isSuperAdmin(user);
  },

  // Check if user can manage a specific project's settings
  canManageProject: (user: User | null, projectId: string): boolean => {
    if (!user) return false;
    
    // Super admin can manage all projects
    if (authUtils.isSuperAdmin(user)) return true;
    
    // Project admin can manage their assigned projects
    return (
      user.role === UserRole.PROJECT_ADMIN && 
      authUtils.hasProjectAccess(user, projectId)
    );
  },

  // Check if user can view dashboard for a project
  canViewDashboard: (user: User | null, projectId: string): boolean => {
    if (!user) return false;
    
    // All roles can view dashboard if they have project access
    return authUtils.hasProjectAccess(user, projectId);
  },

  // Format user display name
  getUserDisplayName: (user: User | null): string => {
    if (!user) return 'Unknown User';
    return user.username;
  },

  // Format user role for display
  getUserRoleDisplay: (user: User | null): string => {
    if (!user) return '';
    
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Administrator';
      case UserRole.PROJECT_ADMIN:
        return 'Project Administrator';
      case UserRole.PROJECT_OPERATOR:
        return 'Project Operator';
      default:
        return user.role;
    }
  }
};

/**
 * Auto-logout functionality
 */
export const setupAutoLogout = (): (() => void) => {
  let timeoutId: NodeJS.Timeout;

  const checkTokenExpiry = () => {
    const token = tokenStorage.getAccessToken();
    
    if (token && jwtUtils.isTokenExpired(token)) {
      console.log('Token expired, logging out...');
      authUtils.logout();
      return;
    }
    
    if (token) {
      // Check again in 1 minute
      timeoutId = setTimeout(checkTokenExpiry, 60 * 1000);
    }
  };

  // Start checking
  checkTokenExpiry();

  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};