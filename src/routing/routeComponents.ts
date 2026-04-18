import type { ComponentType } from 'react';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Fleet } from '@/features/fleet/Fleet';
import { Missions } from '@/features/missions/Missions';
import { Marketplace } from '@/features/marketplace/Marketplace';
import { Bookings } from '@/features/bookings/Bookings';
import { BillingDashboard } from '@/features/billing/BillingDashboard';
import { ScanPage } from '@/features/scan/ScanPage';
import { AllocationPanel } from '@/features/allocation/AllocationPanel';
import { IncidentsPage } from '@/features/incidents/IncidentsPage';

export const routeComponents: Record<string, ComponentType> = {
  dashboard: Dashboard,
  fleet: Fleet,
  missions: Missions,
  marketplace: Marketplace,
  bookings: Bookings,
  billing: BillingDashboard,
  scan: ScanPage,
  allocation: AllocationPanel,
  incidents: IncidentsPage,
};
