"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn, User, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const { login, error, isLoading, clearError } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
    
    // Clear global error when user makes changes
    if (error) {
      clearError();
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    }
    
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });
      
      // Login successful - user will be redirected by the auth system
    } catch (error) {
      // Error is handled by the auth context and displayed via the error state
      console.error('Login failed:', error);
    }
  };

  // Handle Enter key in password field
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Login Failed</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Username field */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            Username
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange('username')}
              className={`pl-10 ${fieldErrors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter your username"
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </div>
          {fieldErrors.username && (
            <p className="text-sm text-red-600">{fieldErrors.username}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange('password')}
              onKeyDown={handleKeyDown}
              className={`pl-10 pr-10 ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)] text-white font-medium py-2.5"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </div>
          )}
        </Button>
      </form>

      {/* Additional info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Contact your administrator if you need access to this system.
        </p>
      </div>
    </div>
  );
}