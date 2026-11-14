
export type AppRole = 'FARMER' | 'ANALYST' | 'ADMIN'

export const ROUTE_PERMISSIONS: Record<string, AppRole[]> = {
  '/dashboard': ['FARMER', 'ANALYST', 'ADMIN'],

  // Farm and crop management
  '/farms': ['FARMER', 'ANALYST', 'ADMIN'],
  '/fields': ['FARMER', 'ANALYST', 'ADMIN'],
  '/crop-management': ['FARMER', 'ANALYST', 'ADMIN'],

  // Dataset management
  '/dataset-upload': ['FARMER'],
  '/data-quality': ['FARMER', 'ANALYST', 'ADMIN'],

  // Agricultural intelligence
  '/crop-predictions': ['FARMER', 'ANALYST', 'ADMIN'],
  '/comparable-plots': ['FARMER', 'ANALYST', 'ADMIN'],

  // Analytics and reporting
  '/alerts': ['FARMER', 'ANALYST', 'ADMIN'],
  '/reports': ['FARMER', 'ANALYST', 'ADMIN'],

  // Account settings
  '/settings': ['FARMER', 'ANALYST', 'ADMIN'],
}

export function canAccessRoute(
  role: string | undefined,
  path: string
): boolean {
  if (!role) return false

  const allowedRoles = ROUTE_PERMISSIONS[path]

  if (!allowedRoles) return false

  return allowedRoles.includes(role as AppRole)
}

export function getRoleDisplayName(role: string | undefined): string {
  if (!role) return 'User'

  return role.charAt(0) + role.slice(1).toLowerCase()
}
