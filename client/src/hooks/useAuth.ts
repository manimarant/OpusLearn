interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    onError: () => {
      // Don't retry on auth errors
    },
  });

  return {
    user,
    isLoading: isLoading && !error && !user, // Only show loading if no user and no error
    isAuthenticated: !!user && !error,
    error,
  };
}
