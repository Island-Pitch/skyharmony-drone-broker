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
];
