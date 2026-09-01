'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Profile, UniversityMembership, University, UserRole } from '@/types';

interface UserContextValue {
  profile: Profile;
  memberships: (UniversityMembership & { university: University })[];
  activeUniversity: University | null;
  activeRole: UserRole;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children, value }: { children: ReactNode; value: UserContextValue }) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
