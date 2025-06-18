"use client";

import { useAuthContext } from '@/contexts/AuthContext';
import { authUtils } from '@/lib/auth-utils';
import { UserRole } from '@/models/auth';

/**
 * Custom hook that provides authentication state and utility functions
 */
export function useAuth() {
  const auth = useAuthContext();

  return {
    // Core auth state
    user: auth.user,
    accessToken: auth.accessToken,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,

    // Auth actions
    login: auth.login,
    logout: auth.logout,
    refreshUserData: auth.refreshUserData,
    clearError: auth.clearError,

    // Permission utilities
    permissions: {
      // Role checking
      hasRole: (role: UserRole): boolean => {
        return authUtils.hasRole(auth.user, role);
      },

      isSuperAdmin: (): boolean => {
        return authUtils.isSuperAdmin(auth.user);
      },

      isProjectAdmin: (): boolean => {
        return authUtils.hasRole(auth.user, UserRole.PROJECT_ADMIN);
      },

      isProjectOperator: (): boolean => {
        return authUtils.hasRole(auth.user, UserRole.PROJECT_OPERATOR);
      },

      // Project access
      hasProjectAccess: (projectId: string): boolean => {
        return authUtils.hasProjectAccess(auth.user, projectId);
      },

      getAccessibleProjects: (): string[] => {
        return authUtils.getAccessibleProjects(auth.user);
      },

      // Management permissions
      canManageProjects: (): boolean => {
        return authUtils.canManageProjects(auth.user);
      },

      canManageProject: (projectId: string): boolean => {
        return authUtils.canManageProject(auth.user, projectId);
      },

      canViewDashboard: (projectId: string): boolean => {
        return authUtils.canViewDashboard(auth.user, projectId);
      },

      // Specific feature permissions
      canCreateProject: (): boolean => {
        return authUtils.isSuperAdmin(auth.user);
      },

      canDeleteProject: (): boolean => {
        return authUtils.isSuperAdmin(auth.user);
      },

      canManageCameras: (projectId: string): boolean => {
        return authUtils.canManageProject(auth.user, projectId);
      },

      canManageAreas: (projectId: string): boolean => {
        return authUtils.canManageProject(auth.user, projectId);
      },

      canManageCameraConfigs: (projectId: string): boolean => {
        return authUtils.canManageProject(auth.user, projectId);
      },

      // UI display permissions
      shouldShowCreateProjectButton: (): boolean => {
        return authUtils.canManageProjects(auth.user);
      },

      shouldShowDeleteProjectButton: (): boolean => {
        return authUtils.canManageProjects(auth.user);
      },

      shouldShowEditCameraButton: (projectId: string): boolean => {
        return authUtils.canManageProject(auth.user, projectId);
      },

      shouldShowDeleteCameraButton: (projectId: string): boolean => {
        return authUtils.canManageProject(auth.user, projectId);
      },

      shouldShowEditAreaButton: (projectId: string): boolean => {
        return authUtils.canManageProject(auth.user, projectId);
      },

      shouldShowDeleteAreaButton: (projectId: string): boolean => {
        return authUtils.canManageProject(auth.user, projectId);
      },

      // Filter projects based on user access
      filterAccessibleProjects: <T extends { id: string }>(projects: T[]): T[] => {
        if (authUtils.isSuperAdmin(auth.user)) {
          return projects; // Super admin sees all projects
        }

        const accessibleProjectIds = authUtils.getAccessibleProjects(auth.user);
        return projects.filter(project => accessibleProjectIds.includes(project.id));
      },
    },

    // User display utilities
    display: {
      getUserDisplayName: (): string => {
        return authUtils.getUserDisplayName(auth.user);
      },

      getUserRoleDisplay: (): string => {
        return authUtils.getUserRoleDisplay(auth.user);
      },

      getUserInitials: (): string => {
        if (!auth.user?.username) return 'U';
        return auth.user.username
          .split(' ')
          .map(name => name.charAt(0).toUpperCase())
          .slice(0, 2)
          .join('');
      },

      formatProjectAccessList: (): string => {
        if (!auth.user) return '';
        
        if (authUtils.isSuperAdmin(auth.user)) {
          return 'All projects';
        }

        const accessCount = auth.user.project_access?.length ?? 0;
        if (accessCount === 0) {
          return 'No projects assigned';
        }

        return `${accessCount} project${accessCount !== 1 ? 's' : ''} assigned`;
      },
    },

    // Authentication status helpers
    status: {
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      hasError: !!auth.error,
      isReady: !auth.isLoading && !auth.error,
    },
  };
}