export const API_CONFIG = {
  // Backend API base URL - use environment variable with fallback
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
  
  // API Key for authentication
  API_KEY: process.env.NEXT_PUBLIC_API_KEY || "your-api-key-here",
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
};

// Helper function to get API headers
export function getApiHeaders() {
  return {
    "Content-Type": "application/json",
    "X-API-KEY": API_CONFIG.API_KEY,
  };
}

// Helper function to create full API URL
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const path = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
  return `${API_CONFIG.API_BASE_URL}/${path}`;
}