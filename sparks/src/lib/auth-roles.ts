// User roles and permissions system

export type UserRole = 'user' | 'admin' | 'developer';

export interface UserPermissions {
  canAccessAdminPanel: boolean;
  canManageUsers: boolean;
  canViewSystemStatus: boolean;
  canModifySettings: boolean;
  canAccessAnalytics: boolean;
  canManageFeatures: boolean;
  canViewLogs: boolean;
  canExportData: boolean;
}

export interface ExtendedUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  permissions: UserPermissions;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  user: {
    canAccessAdminPanel: false,
    canManageUsers: false,
    canViewSystemStatus: false,
    canModifySettings: false,
    canAccessAnalytics: false,
    canManageFeatures: false,
    canViewLogs: false,
    canExportData: false
  },
  admin: {
    canAccessAdminPanel: true,
    canManageUsers: true,
    canViewSystemStatus: true,
    canModifySettings: true,
    canAccessAnalytics: true,
    canManageFeatures: true,
    canViewLogs: true,
    canExportData: true
  },
  developer: {
    canAccessAdminPanel: true,
    canManageUsers: true,
    canViewSystemStatus: true,
    canModifySettings: true,
    canAccessAnalytics: true,
    canManageFeatures: true,
    canViewLogs: true,
    canExportData: true
  }
};

// Privileged email addresses with automatic admin/developer access
export const PRIVILEGED_EMAILS: Record<string, UserRole> = {
  'kodexalabs.space@gmail.com': 'developer'
};

// Utility functions
export function getUserRole(email: string): UserRole {
  return PRIVILEGED_EMAILS[email.toLowerCase()] || 'user';
}

export function getUserPermissions(role: UserRole): UserPermissions {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(user: ExtendedUser | null, permission: keyof UserPermissions): boolean {
  if (!user) return false;
  return user.permissions[permission];
}

export function isAdmin(user: ExtendedUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'developer';
}

export function isDeveloper(user: ExtendedUser | null): boolean {
  return user?.role === 'developer';
}

export function canAccessAdminPanel(user: ExtendedUser | null): boolean {
  return hasPermission(user, 'canAccessAdminPanel');
}

// Create extended user from basic user data
export function createExtendedUser(basicUser: any): ExtendedUser {
  const role = getUserRole(basicUser.email || '');
  const permissions = getUserPermissions(role);
  
  return {
    id: basicUser.id,
    email: basicUser.email,
    name: basicUser.name || basicUser.full_name,
    role,
    permissions,
    createdAt: basicUser.created_at || new Date().toISOString(),
    lastLogin: basicUser.last_sign_in_at,
    isActive: true
  };
}

// Admin panel navigation items based on permissions
export interface AdminNavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  permission: keyof UserPermissions;
  description: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Admin Dashboard',
    icon: 'LayoutDashboard',
    href: '/admin',
    permission: 'canAccessAdminPanel',
    description: 'Overview of system status and key metrics'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: 'Users',
    href: '/admin/users',
    permission: 'canManageUsers',
    description: 'Manage user accounts and permissions'
  },
  {
    id: 'system',
    label: 'System Status',
    icon: 'Activity',
    href: '/admin/system',
    permission: 'canViewSystemStatus',
    description: 'Monitor system health and performance'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    href: '/admin/analytics',
    permission: 'canAccessAnalytics',
    description: 'View usage statistics and insights'
  },
  {
    id: 'features',
    label: 'Feature Management',
    icon: 'Settings',
    href: '/admin/features',
    permission: 'canManageFeatures',
    description: 'Enable/disable features and configurations'
  },
  {
    id: 'logs',
    label: 'System Logs',
    icon: 'FileText',
    href: '/admin/logs',
    permission: 'canViewLogs',
    description: 'View application logs and error reports'
  },
  {
    id: 'export',
    label: 'Data Export',
    icon: 'Download',
    href: '/admin/export',
    permission: 'canExportData',
    description: 'Export system data and generate reports'
  }
];

// Get available navigation items for a user
export function getAvailableNavItems(user: ExtendedUser | null): AdminNavItem[] {
  if (!user) return [];
  
  return ADMIN_NAV_ITEMS.filter(item => 
    hasPermission(user, item.permission)
  );
}

// Security audit logging
export interface SecurityAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

export function createAuditLog(
  user: ExtendedUser,
  action: string,
  resource: string,
  success: boolean = true,
  details?: Record<string, any>
): SecurityAuditLog {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: user.id,
    userEmail: user.email,
    action,
    resource,
    timestamp: new Date().toISOString(),
    success,
    details
  };
}