import { Permission } from '@/auth/roles';

export interface AppRoute {
  path: string;
  label: string;
  icon: string;
  nav: ('side' | 'top' | 'mobile')[];
  permission?: Permission;
}

export const appRoutes: AppRoute[] = [
  { path: 'dashboard', label: 'Dashboard', icon: 'grid', nav: ['side', 'top', 'mobile'], permission: Permission.FleetSummary },
  { path: 'fleet', label: 'Fleet', icon: 'send', nav: ['side', 'top', 'mobile'], permission: Permission.AssetRead },
  { path: 'bookings', label: 'Bookings', icon: 'calendar', nav: ['side', 'top', 'mobile'], permission: Permission.BookingRead },
  { path: 'billing', label: 'Billing', icon: 'dollar-sign', nav: ['side', 'top', 'mobile'], permission: Permission.BillingRead },
  { path: 'scan', label: 'Scan', icon: 'camera', nav: ['side', 'top', 'mobile'], permission: Permission.ScanCheckIn },
  { path: 'allocation', label: 'Allocation', icon: 'layers', nav: ['side', 'top', 'mobile'], permission: Permission.AssetAllocate },
  { path: 'incidents', label: 'Incidents', icon: 'alert-triangle', nav: ['side', 'mobile'], permission: Permission.IncidentReport },
  { path: 'missions', label: 'Missions', icon: 'map', nav: ['side', 'top', 'mobile'] },
  { path: 'marketplace', label: 'Marketplace', icon: 'shopping-bag', nav: ['side', 'top', 'mobile'] },
  { path: 'operator/dashboard', label: 'Operator Dashboard', icon: 'grid', nav: [] },
];
