/**
 * Centralized Permission System for JobFlow
 * 
 * Role Hierarchy (from highest to lowest):
 * 1. ADMIN - Full system access, can modify system settings
 * 2. MANAGER - Can manage personnel, projects, schedules, and view all data within company
 * 3. HR_MANAGER - Specialized HR role: personnel management, contracts, but limited project/schedule access
 * 4. PLANNER - Specialized planning role: schedule/project management, but limited personnel access
 * 5. EMPLOYEE - Fixed employee, can view projects, register time, set availability
 * 6. FREELANCER - Contract worker, similar to employee but may have restricted access to some features
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'HR_MANAGER' | 'PLANNER' | 'EMPLOYEE' | 'FREELANCER';

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

    // HR-specific permissions
    canManageContracts: boolean;
    canViewSalaryInfo: boolean;
    canManageLeaveRequests: boolean;
    canManageEmployeeTypes: boolean;
    canAccessHRReports: boolean;
    canManagePersonalData: boolean;

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
    canManageScheduleTemplates: boolean;
    canAutoGenerateSchedules: boolean;

    // Time Management
    canViewAllTimeEntries: boolean;
    canApproveTimeEntries: boolean;
    canManageClockStatus: boolean;
    canAccessTimeReports: boolean;

    // Data Access
    canViewCompanyWideData: boolean;
    canViewAllAvailability: boolean;
    canExportData: boolean;
    canAccessAnalytics: boolean;

    // Planning-specific permissions
    canManageWorkflowOptimization: boolean;
    canViewResourcePlanning: boolean;
    canManageCapacityPlanning: boolean;

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

        // HR-specific permissions - ADMIN ONLY
        canManageContracts: true,
        canViewSalaryInfo: true,
        canManageLeaveRequests: true,
        canManageEmployeeTypes: true,
        canAccessHRReports: true,
        canManagePersonalData: true,

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
        canManageScheduleTemplates: true,
        canAutoGenerateSchedules: true,

        // Time Management - ADMIN + MANAGER
        canViewAllTimeEntries: true,
        canApproveTimeEntries: true,
        canManageClockStatus: true,
        canAccessTimeReports: true,

        // Data Access - ADMIN + MANAGER
        canViewCompanyWideData: true,
        canViewAllAvailability: true,
        canExportData: true,
        canAccessAnalytics: true,

        // Planning-specific permissions
        canManageWorkflowOptimization: true,
        canViewResourcePlanning: true,
        canManageCapacityPlanning: true,

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

        // HR-specific permissions - ADMIN ONLY
        canManageContracts: true,
        canViewSalaryInfo: true,
        canManageLeaveRequests: true,
        canManageEmployeeTypes: true,
        canAccessHRReports: true,
        canManagePersonalData: true,

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
        canManageScheduleTemplates: true,
        canAutoGenerateSchedules: true,

        // Time Management - ADMIN + MANAGER
        canViewAllTimeEntries: true,
        canApproveTimeEntries: true,
        canManageClockStatus: true,
        canAccessTimeReports: true,

        // Data Access - ADMIN + MANAGER
        canViewCompanyWideData: true,
        canViewAllAvailability: true,
        canExportData: true,
        canAccessAnalytics: true,

        // Planning-specific permissions
        canManageWorkflowOptimization: true,
        canViewResourcePlanning: true,
        canManageCapacityPlanning: true,

        // Personal Features - ALL ROLES
        canRegisterTime: true,
        canSetAvailability: true,
        canViewOwnProjects: true,
        canExpressProjectInterest: true,
    },

    HR_MANAGER: {
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

        // HR-specific permissions - ADMIN ONLY
        canManageContracts: true,
        canViewSalaryInfo: true,
        canManageLeaveRequests: true,
        canManageEmployeeTypes: true,
        canAccessHRReports: true,
        canManagePersonalData: true,

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
        canManageScheduleTemplates: false,
        canAutoGenerateSchedules: false,

        // Time Management - Own data only
        canViewAllTimeEntries: false,
        canApproveTimeEntries: false,
        canManageClockStatus: false,
        canAccessTimeReports: false,

        // Data Access - Limited
        canViewCompanyWideData: false,
        canViewAllAvailability: false,
        canExportData: false,
        canAccessAnalytics: false,

        // Planning-specific permissions
        canManageWorkflowOptimization: false,
        canViewResourcePlanning: true,
        canManageCapacityPlanning: false,

        // Personal Features - ALL ROLES
        canRegisterTime: true,
        canSetAvailability: true,
        canViewOwnProjects: true,
        canExpressProjectInterest: true,
    },

    PLANNER: {
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

        // HR-specific permissions - ADMIN ONLY
        canManageContracts: true,
        canViewSalaryInfo: true,
        canManageLeaveRequests: true,
        canManageEmployeeTypes: true,
        canAccessHRReports: true,
        canManagePersonalData: true,

        // Project Management - Limited access
        canViewAllProjects: false, // Only assigned projects
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canAssignProjectMembers: false,
        canViewProjectInterests: false,

        // Schedule Management - Limited access
        canViewAllSchedules: false, // Only assigned schedules
        canCreateSchedules: false,
        canEditSchedules: false,
        canDeleteSchedules: false,
        canManageShifts: false,
        canManageScheduleTemplates: false,
        canAutoGenerateSchedules: false,

        // Time Management - Own data only
        canViewAllTimeEntries: false,
        canApproveTimeEntries: false,
        canManageClockStatus: false,
        canAccessTimeReports: false,

        // Data Access - Limited
        canViewCompanyWideData: false,
        canViewAllAvailability: false,
        canExportData: false,
        canAccessAnalytics: false,

        // Planning-specific permissions
        canManageWorkflowOptimization: true,
        canViewResourcePlanning: true,
        canManageCapacityPlanning: true,

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

        // HR-specific permissions - ADMIN ONLY
        canManageContracts: true,
        canViewSalaryInfo: true,
        canManageLeaveRequests: true,
        canManageEmployeeTypes: true,
        canAccessHRReports: true,
        canManagePersonalData: true,

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
        canManageScheduleTemplates: false,
        canAutoGenerateSchedules: false,

        // Time Management - Own data only
        canViewAllTimeEntries: false,
        canApproveTimeEntries: false,
        canManageClockStatus: false,
        canAccessTimeReports: false,

        // Data Access - Limited
        canViewCompanyWideData: false,
        canViewAllAvailability: false,
        canExportData: false,
        canAccessAnalytics: false,

        // Planning-specific permissions
        canManageWorkflowOptimization: false,
        canViewResourcePlanning: false,
        canManageCapacityPlanning: false,

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

        // HR-specific permissions - ADMIN ONLY
        canManageContracts: true,
        canViewSalaryInfo: true,
        canManageLeaveRequests: true,
        canManageEmployeeTypes: true,
        canAccessHRReports: true,
        canManagePersonalData: true,

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
        canManageScheduleTemplates: false,
        canAutoGenerateSchedules: false,

        // Time Management - Own data only
        canViewAllTimeEntries: false,
        canApproveTimeEntries: false,
        canManageClockStatus: false,
        canAccessTimeReports: false,

        // Data Access - Limited
        canViewCompanyWideData: false,
        canViewAllAvailability: false,
        canExportData: false,
        canAccessAnalytics: false,

        // Planning-specific permissions
        canManageWorkflowOptimization: false,
        canViewResourcePlanning: false,
        canManageCapacityPlanning: false,

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
 * Check if user has HR management access (Admin, Manager, or HR_Manager)
 */
export function hasHRAccess(role: UserRole): boolean {
    return role === 'ADMIN' || role === 'MANAGER' || role === 'HR_MANAGER';
}

/**
 * Check if user has planning access (Admin, Manager, or Planner)
 */
export function hasPlanningAccess(role: UserRole): boolean {
    return role === 'ADMIN' || role === 'MANAGER' || role === 'PLANNER';
}

/**
 * Check if user is a specialized role (HR_Manager or Planner)
 */
export function isSpecializedRole(role: UserRole): boolean {
    return role === 'HR_MANAGER' || role === 'PLANNER';
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
        case 'ADMIN': return 6;
        case 'MANAGER': return 5;
        case 'HR_MANAGER': return 4;
        case 'PLANNER': return 3;
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

/**
 * Get user-friendly role name and description
 */
export function getRoleDisplayInfo(role: UserRole): { name: string; description: string; emoji: string } {
    switch (role) {
        case 'ADMIN':
            return {
                name: 'Administrator',
                description: 'Volledige systeemtoegang en alle rechten',
                emoji: '👑'
            };
        case 'MANAGER':
            return {
                name: 'Manager',
                description: 'Operationeel beheer van personeel, projecten en roosters',
                emoji: '👨‍💼'
            };
        case 'HR_MANAGER':
            return {
                name: 'HR Manager',
                description: 'Specialistrol voor personeelszaken en contractbeheer',
                emoji: '👥'
            };
        case 'PLANNER':
            return {
                name: 'Planner',
                description: 'Specialistrol voor roosters, projecten en resource planning',
                emoji: '📅'
            };
        case 'EMPLOYEE':
            return {
                name: 'Medewerker',
                description: 'Vaste medewerker met basis functionaliteiten',
                emoji: '👨‍💻'
            };
        case 'FREELANCER':
            return {
                name: 'Freelancer',
                description: 'Contractmedewerker met beperkte toegang',
                emoji: '🎯'
            };
        default:
            return {
                name: 'Onbekend',
                description: 'Onbekende rol',
                emoji: '❓'
            };
    }
} 