export interface AppRoute {
  path: string;
  label: string;
  icon: string;
  nav: ('side' | 'top' | 'mobile')[];
}

export const appRoutes: AppRoute[] = [
  { path: 'dashboard', label: 'Dashboard', icon: 'grid', nav: ['side', 'top', 'mobile'] },
  { path: 'fleet', label: 'Fleet', icon: 'send', nav: ['side', 'top', 'mobile'] },
  { path: 'missions', label: 'Missions', icon: 'map', nav: ['side', 'top', 'mobile'] },
  { path: 'marketplace', label: 'Marketplace', icon: 'shopping-bag', nav: ['side', 'top', 'mobile'] },
  { path: 'bookings', label: 'Bookings', icon: 'calendar', nav: ['side', 'top', 'mobile'] },
  { path: 'billing', label: 'Billing', icon: 'dollar-sign', nav: ['side', 'top', 'mobile'] },
  { path: 'scan', label: 'Scan', icon: 'camera', nav: ['side', 'top', 'mobile'] },
  { path: 'allocation', label: 'Allocation', icon: 'layers', nav: ['side', 'top', 'mobile'] },
  { path: 'incidents', label: 'Incidents', icon: 'alert-triangle', nav: ['side', 'mobile'] },
  { path: 'operator/dashboard', label: 'Operator Dashboard', icon: 'grid', nav: [] },
];
