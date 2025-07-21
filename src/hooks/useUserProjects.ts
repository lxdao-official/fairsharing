import { useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import { useUser } from './useAuth';

export function useUserProjects() {
  const { user } = useUser();

  // Fetch all user's project memberships
  const {
    data: userProjects,
    isLoading,
    error,
  } = trpc.user.getProjectMemberships.useQuery(undefined, {
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Helper function to check if user is a validator for a specific project
  const isValidatorForProject = useMemo(() => {
    return (projectId: string): boolean => {
      if (!userProjects) return false;
      const membership = userProjects.find((m) => m.projectId === projectId);
      return membership?.role?.includes('VALIDATOR') || false;
    };
  }, [userProjects]);

  // Helper function to check if user is a member of a specific project
  const isMemberOfProject = useMemo(() => {
    return (projectId: string): boolean => {
      if (!userProjects) return false;
      return userProjects.some((m) => m.projectId === projectId);
    };
  }, [userProjects]);

  // Helper function to get user's roles in a specific project
  const getRolesInProject = useMemo(() => {
    return (projectId: string): string[] => {
      if (!userProjects) return [];
      const membership = userProjects.find((m) => m.projectId === projectId);
      return membership?.role || [];
    };
  }, [userProjects]);

  return {
    userProjects,
    isLoading,
    error,
    isValidatorForProject,
    isMemberOfProject,
    getRolesInProject,
  };
}
