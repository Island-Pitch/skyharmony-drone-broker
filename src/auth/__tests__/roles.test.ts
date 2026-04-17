import { describe, it, expect } from 'vitest';
import { Role, Permission, hasPermission, ROLE_PERMISSIONS } from '../roles';

describe('Role enum', () => {
  it('defines all required roles', () => {
    expect(Role.CentralRepoAdmin).toBe('CentralRepoAdmin');
    expect(Role.OperatorAdmin).toBe('OperatorAdmin');
    expect(Role.OperatorStaff).toBe('OperatorStaff');
    expect(Role.LogisticsStaff).toBe('LogisticsStaff');
    expect(Role.SystemAI).toBe('SystemAI');
  });
});

describe('Permission enum', () => {
  it('defines asset permissions', () => {
    expect(Permission.AssetCreate).toBeDefined();
    expect(Permission.AssetRead).toBeDefined();
    expect(Permission.AssetUpdate).toBeDefined();
    expect(Permission.AssetDelete).toBeDefined();
  });

  it('defines audit permissions', () => {
    expect(Permission.AuditRead).toBeDefined();
  });

  it('defines fleet summary permissions', () => {
    expect(Permission.FleetSummary).toBeDefined();
  });
});

describe('ROLE_PERMISSIONS matrix', () => {
  it('CentralRepoAdmin has all permissions', () => {
    const adminPerms = ROLE_PERMISSIONS[Role.CentralRepoAdmin];
    for (const perm of Object.values(Permission)) {
      expect(adminPerms).toContain(perm);
    }
  });

  it('OperatorAdmin cannot create or delete assets', () => {
    const perms = ROLE_PERMISSIONS[Role.OperatorAdmin];
    expect(perms).not.toContain(Permission.AssetCreate);
    expect(perms).not.toContain(Permission.AssetDelete);
  });

  it('OperatorAdmin can read assets and fleet summary', () => {
    const perms = ROLE_PERMISSIONS[Role.OperatorAdmin];
    expect(perms).toContain(Permission.AssetRead);
    expect(perms).toContain(Permission.FleetSummary);
  });

  it('OperatorStaff can read assets but not create them', () => {
    const perms = ROLE_PERMISSIONS[Role.OperatorStaff];
    expect(perms).toContain(Permission.AssetRead);
    expect(perms).not.toContain(Permission.AssetCreate);
    expect(perms).not.toContain(Permission.AssetDelete);
  });

  it('LogisticsStaff can read assets', () => {
    const perms = ROLE_PERMISSIONS[Role.LogisticsStaff];
    expect(perms).toContain(Permission.AssetRead);
  });

  it('SystemAI can read and update assets', () => {
    const perms = ROLE_PERMISSIONS[Role.SystemAI];
    expect(perms).toContain(Permission.AssetRead);
    expect(perms).toContain(Permission.AssetUpdate);
  });
});

describe('hasPermission', () => {
  it('returns true when role has the permission', () => {
    expect(hasPermission(Role.CentralRepoAdmin, Permission.AssetCreate)).toBe(true);
  });

  it('returns false when role lacks the permission', () => {
    expect(hasPermission(Role.OperatorAdmin, Permission.AssetCreate)).toBe(false);
  });

  it('returns true for OperatorStaff reading assets', () => {
    expect(hasPermission(Role.OperatorStaff, Permission.AssetRead)).toBe(true);
  });
});
