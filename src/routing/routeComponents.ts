import type { ComponentType } from 'react';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Fleet } from '@/features/fleet/Fleet';
import { Missions } from '@/features/missions/Missions';
import { Marketplace } from '@/features/marketplace/Marketplace';
import { Bookings } from '@/features/bookings/Bookings';
import { IncidentsPage } from '@/features/incidents/IncidentsPage';

export const routeComponents: Record<string, ComponentType> = {
  dashboard: Dashboard,
  fleet: Fleet,
  missions: Missions,
  marketplace: Marketplace,
  bookings: Bookings,
  incidents: IncidentsPage,
};
