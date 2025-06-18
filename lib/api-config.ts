import { tokenStorage, authUtils } from "@/lib/auth-utils";

export const API_CONFIG = {
  // Backend API base URL - use environment variable with fallback
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,

  // Request timeout in milliseconds
  TIMEOUT: 30000,
};

// Helper function to get API headers with JWT authentication
export function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add JWT token if available and not expired
  const token = tokenStorage.getAccessToken();
  if (token && authUtils.isAuthenticated()) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// Helper function to get API headers for authentication endpoints (no token required)
export function getAuthApiHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

// Helper function to create full API URL
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const path = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
  return `${API_CONFIG.API_BASE_URL}/${path}`;
}

// Enhanced fetch wrapper with automatic 401 handling
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getApiHeaders(),
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized responses
  if (response.status === 401) {
    console.log('Received 401 response, token may be expired');
    
    // Clear auth data and redirect to login
    authUtils.logout();
    
    // Throw error to prevent further processing
    throw new Error('Authentication required - redirecting to login');
  }

  return response;
}

// Fetch wrapper for public endpoints (like login)
export async function publicFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthApiHeaders(),
      ...options.headers,
    },
  });
}