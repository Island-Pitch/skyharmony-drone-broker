/** Named demo operators for bank presentation (SHD-50). */
export interface Operator {
  id: string;
  name: string;
  drone_count: number;
  region: string;
}

export const operators: Operator[] = [
  { id: 'a0000000-0000-4000-8000-000000000010', name: 'NightBrite Drones', drone_count: 120, region: 'Southern California' },
  { id: 'a0000000-0000-4000-8000-000000000020', name: 'Orion Skies', drone_count: 110, region: 'Northern California' },
  { id: 'a0000000-0000-4000-8000-000000000030', name: 'Vegas Drone Works', drone_count: 100, region: 'Nevada' },
  { id: 'a0000000-0000-4000-8000-000000000040', name: 'Patriotic Air', drone_count: 90, region: 'Arizona' },
  { id: 'a0000000-0000-4000-8000-000000000050', name: 'Sky Harmony Fleet', drone_count: 80, region: 'Southwest US' },
];
