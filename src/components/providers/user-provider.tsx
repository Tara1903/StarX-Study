'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Profile, SchoolMembership, School, UserRole } from '@/types';

interface UserContextValue {
  profile: Profile;
  memberships: (SchoolMembership & { school: School })[];
  activeSchool: School | null;
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
