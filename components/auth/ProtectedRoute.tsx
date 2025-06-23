"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/models/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  // Role-based access control
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  // Project-based access control
  projectId?: string;
  requireProjectAccess?: boolean;
  // Custom permission function
  customPermissionCheck?: (auth: ReturnType<typeof useAuth>) => boolean;
  // UI customization
  fallbackComponent?: ReactNode;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  projectId,
  requireProjectAccess = false,
  customPermissionCheck,
  fallbackComponent,
  loadingComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    // If still loading, don't redirect yet
    if (auth.isLoading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!auth.isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [auth.isAuthenticated, auth.isLoading, router]);

  // Show loading state
  if (auth.isLoading) {
    return (
      loadingComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--tensora-medium)] mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!auth.isAuthenticated) {
    return null;
  }

  // Check role-based permissions
  const hasRolePermission = (): boolean => {
    if (!auth.user) return false;

    // Check specific required role
    if (requiredRole) {
      return auth.permissions.hasRole(requiredRole);
    }

    // Check if user has any of the allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles.some(role => auth.permissions.hasRole(role));
    }

    // If no role requirements specified, allow access
    return true;
  };

  // Check project-based permissions
  const hasProjectPermission = (): boolean => {
    if (!requireProjectAccess || !projectId) return true;
    if (!auth.user) return false;

    return auth.permissions.hasProjectAccess(projectId);
  };

  // Check custom permissions
  const hasCustomPermission = (): boolean => {
    if (!customPermissionCheck) return true;
    
    return customPermissionCheck(auth);
  };

  // Perform all permission checks
  const hasRoleAccess = hasRolePermission();
  const hasProjectAccess = hasProjectPermission();
  const hasCustomAccess = hasCustomPermission();

  // If any permission check fails, show access denied
  if (!hasRoleAccess || !hasProjectAccess || !hasCustomAccess) {
    return (
      fallbackComponent || (
        <AccessDenied
          user={auth.user}
          missingRole={!hasRoleAccess}
          missingProjectAccess={!hasProjectAccess}
          missingCustomAccess={!hasCustomAccess}
          requiredRole={requiredRole}
          allowedRoles={allowedRoles}
          projectId={projectId}
        />
      )
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Access denied component
interface AccessDeniedProps {
  user: any;
  missingRole: boolean;
  missingProjectAccess: boolean;
  missingCustomAccess: boolean;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  projectId?: string;
}

function AccessDenied({
  user,
  missingRole,
  missingProjectAccess,
  missingCustomAccess,
  requiredRole,
  allowedRoles,
  projectId,
}: AccessDeniedProps) {
  const auth = useAuth();

  // Determine the specific reason for access denial
  const getAccessDeniedReason = (): string => {
    if (missingRole) {
      if (requiredRole) {
        return `This page requires ${auth.display.getUserRoleDisplay()} role, but you have ${auth.display.getUserRoleDisplay()} role.`;
      }
      if (allowedRoles && allowedRoles.length > 0) {
        const roleNames = allowedRoles.map(role => {
          switch (role) {
            case UserRole.SUPER_ADMIN: return 'Super Administrator';
            case UserRole.PROJECT_ADMIN: return 'Project Administrator';
            case UserRole.PROJECT_OPERATOR: return 'Project Operator';
            default: return role;
          }
        }).join(' or ');
        return `This page requires ${roleNames} role.`;
      }
      return 'You do not have the required role to access this page.';
    }

    if (missingProjectAccess && projectId) {
      return `You do not have access to project "${projectId}".`;
    }

    if (missingCustomAccess) {
      return 'You do not have permission to access this page.';
    }

    return 'Access denied for unknown reason.';
  };

  const getSuggestions = (): string[] => {
    const suggestions: string[] = [];

    if (missingRole) {
      suggestions.push('Contact your administrator to request role changes');
    }

    if (missingProjectAccess) {
      suggestions.push('Ask your administrator to grant you access to this project');
    }

    suggestions.push('Use the navigation menu to access pages you have permission for');

    return suggestions;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <Lock className="h-8 w-8 text-red-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>

          {/* User info */}
          <div className="bg-gray-50 rounded-md p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Signed in as:</p>
            <p className="font-medium text-gray-900">{auth.display.getUserDisplayName()}</p>
            <p className="text-sm text-gray-500">{auth.display.getUserRoleDisplay()}</p>
          </div>

          {/* Reason */}
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-800 mb-2">
                  Access Restricted
                </p>
                <p className="text-sm text-red-700">
                  {getAccessDeniedReason()}
                </p>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="text-left mb-6">
            <p className="text-sm font-medium text-gray-900 mb-2">What you can do:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.history.back()}
              className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)] text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={auth.logout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Convenience wrapper for common use cases
export function SuperAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      {children}
    </ProtectedRoute>
  );
}

export function ProjectManagementRoute({ 
  children, 
  projectId 
}: { 
  children: ReactNode; 
  projectId: string;
}) {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PROJECT_ADMIN]}
      projectId={projectId}
      requireProjectAccess={true}
    >
      {children}
    </ProtectedRoute>
  );
}

export function DashboardRoute({ 
  children, 
  projectId 
}: { 
  children: ReactNode; 
  projectId: string;
}) {
  return (
    <ProtectedRoute
      projectId={projectId}
      requireProjectAccess={true}
    >
      {children}
    </ProtectedRoute>
  );
}