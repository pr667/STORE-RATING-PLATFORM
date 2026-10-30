import type { Role } from '../types';

export const ROLES: Role[] = ['NORMAL_USER', 'STORE_OWNER', 'SYSTEM_ADMIN'];

export const roleLabels: Record<Role, string> = {
  NORMAL_USER: 'Normal user',
  STORE_OWNER: 'Store owner',
  SYSTEM_ADMIN: 'System admin',
};

// Where each role lands after logging in
export function homePathForRole(role: Role): string {
  switch (role) {
    case 'SYSTEM_ADMIN':
      return '/admin';
    case 'STORE_OWNER':
      return '/owner';
    default:
      return '/stores';
  }
}