export enum Role {
  CentralRepoAdmin = 'CentralRepoAdmin',
  OperatorAdmin = 'OperatorAdmin',
  OperatorStaff = 'OperatorStaff',
  LogisticsStaff = 'LogisticsStaff',
  SystemAI = 'SystemAI',
}

export enum Permission {
  AssetCreate = 'asset:create',
  AssetRead = 'asset:read',
  AssetUpdate = 'asset:update',
  AssetDelete = 'asset:delete',
  AssetAllocate = 'asset:allocate',
  AuditRead = 'audit:read',
  FleetSummary = 'fleet:summary',
  BookingCreate = 'booking:create',
  BookingRead = 'booking:read',
  BookingApprove = 'booking:approve',
  ScanCheckIn = 'scan:checkin',
  ScanCheckOut = 'scan:checkout',
  ManifestRead = 'manifest:read',
  ManifestCreate = 'manifest:create',
  IncidentReport = 'incident:report',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.CentralRepoAdmin]: Object.values(Permission),

  [Role.OperatorAdmin]: [
    Permission.AssetRead,
    Permission.AssetAllocate,
    Permission.AuditRead,
    Permission.FleetSummary,
    Permission.BookingCreate,
    Permission.BookingRead,
    Permission.ManifestRead,
    Permission.IncidentReport,
  ],

  [Role.OperatorStaff]: [
    Permission.AssetRead,
    Permission.AssetUpdate,
    Permission.FleetSummary,
    Permission.BookingRead,
    Permission.ScanCheckIn,
    Permission.ScanCheckOut,
    Permission.IncidentReport,
  ],

  [Role.LogisticsStaff]: [
    Permission.AssetRead,
    Permission.FleetSummary,
    Permission.ManifestRead,
    Permission.ManifestCreate,
    Permission.ScanCheckIn,
    Permission.ScanCheckOut,
  ],

  [Role.SystemAI]: [
    Permission.AssetRead,
    Permission.AssetUpdate,
    Permission.AuditRead,
    Permission.FleetSummary,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
