/**
 * Centralized Permission System for JobFlow
 * 
 * Role Hierarchy (from highest to lowest):
 * 1. ADMIN - Full system access, can modify system settings
 * 2. MANAGER - Can manage personnel, projects, schedules, and view all data within company
 * 3. EMPLOYEE - Fixed employee, can view projects, register time, set availability
 * 4. FREELANCER - Contract worker, similar to employee but may have restricted access to some features
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FREELANCER';

export interface PermissionLevel {
    // System Administration
    canManageSystemSettings: boolean;
    canManageEmailSettings: boolean;
    canManageWorkLocations: boolean;
    canManageWorkTypes: boolean;

    // User Management
    canViewAllUsers: boolean;
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canChangeUserRoles: boolean;
    canResetPasswords: boolean;

    // Project Management
    canViewAllProjects: boolean;
    canCreateProjects: boolean;
    canEditProjects: boolean;
    canDeleteProjects: boolean;
    canAssignProjectMembers: boolean;
    canViewProjectInterests: boolean;

    // Schedule Management
    canViewAllSchedules: boolean;
    canCreateSchedules: boolean;
    canEditSchedules: boolean;
    canDeleteSchedules: boolean;
    canManageShifts: boolean;

    // Time Management
    canViewAllTimeEntries: boolean;
    canApproveTimeEntries: boolean;
    canManageClockStatus: boolean;

    // Data Access
    canViewCompanyWideData: boolean;
    canViewAllAvailability: boolean;
    canExportData: boolean;

    // Personal Features
    canRegisterTime: boolean;
    canSetAvailability: boolean;
    canViewOwnProjects: boolean;
    canExpressProjectInterest: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, PermissionLevel> = {
    ADMIN: {
        // System Administration - ADMIN ONLY
        canManageSystemSettings: true,
        canManageEmailSettings: true,
        canManageWorkLocations: true,
        canManageWorkTypes: true,

        // User Management - ADMIN ONLY
        canViewAllUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canChangeUserRoles: true,
        canResetPasswords: true,

        // Project Management - ADMIN + MANAGER
        canViewAllProjects: true,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
        canAssignProjectMembers: true,
        canViewProjectInterests: true,

        // Schedule Management - ADMIN + MANAGER
        canViewAllSchedules: true,
        canCreateSchedules: true,
        canEditSchedules: true,
        canDeleteSchedules: true,
        canManageShifts: true,

        // Time Management - ADMIN + MANAGER
        canViewAllTimeEntries: true,
        canApproveTimeEntries: true,
        canManageClockStatus: true,

        // Data Access - ADMIN + MANAGER
        canViewCompanyWideData: true,
        canViewAllAvailability: true,
        canExportData: true,

        // Personal Features - ALL ROLES
        canRegisterTime: true,
        canSetAvailability: true,
        canViewOwnProjects: true,
        canExpressProjectInterest: true,
    },

    MANAGER: {
        // System Administration - ADMIN ONLY
        canManageSystemSettings: false,
        canManageEmailSettings: true,
        canManageWorkLocations: true,
        canManageWorkTypes: true,

        // User Management - ADMIN ONLY (except viewing)
        canViewAllUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: false,
        canChangeUserRoles: false,
        canResetPasswords: true,

        // Project Management - ADMIN + MANAGER
        canViewAllProjects: true,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
        canAssignProjectMembers: true,
        canViewProjectInterests: true,

        // Schedule Management - ADMIN + MANAGER
        canViewAllSchedules: true,
        canCreateSchedules: true,
        canEditSchedules: true,
        canDeleteSchedules: true,
        canManageShifts: true,

        // Time Management - ADMIN + MANAGER
        canViewAllTimeEntries: true,
        canApproveTimeEntries: true,
        canManageClockStatus: true,

        // Data Access - ADMIN + MANAGER
        canViewCompanyWideData: true,
        canViewAllAvailability: true,
        canExportData: true,

        // Personal Features - ALL ROLES
        canRegisterTime: true,
        canSetAvailability: true,
        canViewOwnProjects: true,
        canExpressProjectInterest: true,
    },

    EMPLOYEE: {
        // System Administration - ADMIN ONLY
        canManageSystemSettings: false,
        canManageEmailSettings: false,
        canManageWorkLocations: false,
        canManageWorkTypes: false,

        // User Management - ADMIN ONLY
        canViewAllUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canChangeUserRoles: false,
        canResetPasswords: false,

        // Project Management - Limited access
        canViewAllProjects: false, // Only assigned projects
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canAssignProjectMembers: false,
        canViewProjectInterests: false,

        // Schedule Management - View only
        canViewAllSchedules: false, // Only own schedule
        canCreateSchedules: false,
        canEditSchedules: false,
        canDeleteSchedules: false,
        canManageShifts: false,

        // Time Management - Own data only
        canViewAllTimeEntries: false,
        canApproveTimeEntries: false,
        canManageClockStatus: false,

        // Data Access - Limited
        canViewCompanyWideData: false,
        canViewAllAvailability: false,
        canExportData: false,

        // Personal Features - ALL ROLES
        canRegisterTime: true,
        canSetAvailability: true,
        canViewOwnProjects: true,
        canExpressProjectInterest: true,
    },

    FREELANCER: {
        // System Administration - ADMIN ONLY
        canManageSystemSettings: false,
        canManageEmailSettings: false,
        canManageWorkLocations: false,
        canManageWorkTypes: false,

        // User Management - ADMIN ONLY
        canViewAllUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canChangeUserRoles: false,
        canResetPasswords: false,

        // Project Management - Limited access
        canViewAllProjects: false, // Only assigned projects
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canAssignProjectMembers: false,
        canViewProjectInterests: false,

        // Schedule Management - View only
        canViewAllSchedules: false, // Only own schedule
        canCreateSchedules: false,
        canEditSchedules: false,
        canDeleteSchedules: false,
        canManageShifts: false,

        // Time Management - Own data only
        canViewAllTimeEntries: false,
        canApproveTimeEntries: false,
        canManageClockStatus: false,

        // Data Access - Limited
        canViewCompanyWideData: false,
        canViewAllAvailability: false,
        canExportData: false,

        // Personal Features - ALL ROLES
        canRegisterTime: true,
        canSetAvailability: true,
        canViewOwnProjects: true,
        canExpressProjectInterest: true,
    },
};

/**
 * Get permissions for a specific role
 */
export function getPermissions(role: UserRole): PermissionLevel {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.FREELANCER;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: keyof PermissionLevel): boolean {
    return getPermissions(role)[permission];
}

/**
 * Check if user has admin-only access
 */
export function isAdmin(role: UserRole): boolean {
    return role === 'ADMIN';
}

/**
 * Check if user has admin or manager access
 */
export function isAdminOrManager(role: UserRole): boolean {
    return role === 'ADMIN' || role === 'MANAGER';
}

/**
 * Check if user can manage personnel (view/edit users)
 */
export function canManagePersonnel(role: UserRole): boolean {
    return hasPermission(role, 'canViewAllUsers');
}

/**
 * Check if user can approve time entries
 */
export function canApproveTime(role: UserRole): boolean {
    return hasPermission(role, 'canApproveTimeEntries');
}

/**
 * Check if user can manage system settings
 */
export function canManageSystem(role: UserRole): boolean {
    return hasPermission(role, 'canManageSystemSettings');
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: UserRole): number {
    switch (role) {
        case 'ADMIN': return 4;
        case 'MANAGER': return 3;
        case 'EMPLOYEE': return 2;
        case 'FREELANCER': return 1;
        default: return 0;
    }
}

/**
 * Check if role A has higher or equal permissions than role B
 */
export function hasHigherOrEqualRole(roleA: UserRole, roleB: UserRole): boolean {
    return getRoleLevel(roleA) >= getRoleLevel(roleB);
} 