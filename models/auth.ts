/**
 * Authentication types and interfaces for the Tensora Count frontend
 */

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  PROJECT_ADMIN = "PROJECT_ADMIN", 
  PROJECT_OPERATOR = "PROJECT_OPERATOR"
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  project_access?: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface JWTPayload {
  sub: string; // user_id
  username: string;
  role: UserRole;
  project_access?: string[];
  exp: number; // expiry timestamp
  iat: number; // issued at timestamp
}

// Permission-related types
export interface PermissionContext {
  user: User;
  projectId?: string;
}

export enum Permission {
  // Project management
  CREATE_PROJECT = "CREATE_PROJECT",
  DELETE_PROJECT = "DELETE_PROJECT",
  VIEW_PROJECT = "VIEW_PROJECT",
  
  // Camera/Area management
  MANAGE_CAMERAS = "MANAGE_CAMERAS",
  MANAGE_AREAS = "MANAGE_AREAS",
  
  // Dashboard access
  VIEW_DASHBOARD = "VIEW_DASHBOARD",
}

// API Error types
export interface AuthError {
  message: string;
  code?: string;
}