import type { ComponentType } from 'react';
import { Fleet } from '@/features/fleet/Fleet';
import { Missions } from '@/features/missions/Missions';
import { Marketplace } from '@/features/marketplace/Marketplace';
import { Bookings } from '@/features/bookings/Bookings';
import { BillingDashboard } from '@/features/billing/BillingDashboard';
import { ScanPage } from '@/features/scan/ScanPage';
import { AllocationPanel } from '@/features/allocation/AllocationPanel';
import { IncidentsPage } from '@/features/incidents/IncidentsPage';
import { LogisticsPage } from '@/features/logistics/LogisticsPage';
import { MaintenancePage } from '@/features/maintenance/MaintenancePage';
import { OperatorDashboard } from '@/features/operator-dashboard/OperatorDashboard';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';

export const routeComponents: Record<string, ComponentType> = {
  dashboard: AdminDashboard,
  'operator/dashboard': OperatorDashboard,
  fleet: Fleet,
  missions: Missions,
  marketplace: Marketplace,
  bookings: Bookings,
  billing: BillingDashboard,
  scan: ScanPage,
  allocation: AllocationPanel,
  incidents: IncidentsPage,
  logistics: LogisticsPage,
  maintenance: MaintenancePage,
};
