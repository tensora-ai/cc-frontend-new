"use client";

import Image from "next/image";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Header() {
  const auth = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render user menu on login page or when not authenticated
  const showUserMenu = auth.isAuthenticated && auth.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and App Name */}
          <div className="flex items-center">
            <Image 
              src="/tensora_logo.png" 
              alt="Tensora Logo" 
              width={100} 
              height={100}
              className="h-auto"
            />
            <span className="font-semibold text-xl text-tensora-dark">Count</span>
          </div>

          {/* User Menu */}
          {showUserMenu && (
            <div className="relative" ref={menuRef}>
              {/* User Info Button */}
              <Button
                variant="ghost"
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                {/* User Avatar */}
                <div className="flex items-center justify-center h-8 w-8 bg-[var(--tensora-light)] text-white rounded-full text-sm font-medium">
                  {auth.display.getUserInitials()}
                </div>
                
                {/* User Info */}
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">
                    {auth.display.getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">
                    {auth.display.getUserRoleDisplay()}
                  </p>
                </div>
                
                {/* Dropdown Arrow */}
                <ChevronDown 
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`} 
                />
              </Button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  {/* User Profile Section */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center h-10 w-10 bg-[var(--tensora-light)] text-white rounded-full text-sm font-medium">
                        {auth.display.getUserInitials()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {auth.display.getUserDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {auth.display.getUserRoleDisplay()}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-1">
                          Access to: {auth.display.formatProjectAccessList()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Actions */}
                  <div className="border-t border-gray-100">
                    {/* Logout */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        auth.logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading state when auth is loading */}
          {auth.isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="hidden sm:block">
                <div className="animate-pulse h-4 w-20 bg-gray-200 rounded mb-1"></div>
                <div className="animate-pulse h-3 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}