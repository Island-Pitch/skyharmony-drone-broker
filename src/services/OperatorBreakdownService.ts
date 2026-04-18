/** Per-operator allocation statistics. */
export interface OperatorStats {
  operator_name: string;
  allocated_drones: number;
  utilization_pct: number;
  contribution_pct: number;
}

/**
 * Provides mock per-operator allocation breakdown for the admin dashboard.
 * In production this would aggregate from booking + asset allocation data.
 */
export class OperatorBreakdownService {
  async getBreakdown(): Promise<OperatorStats[]> {
    const operators: OperatorStats[] = [
      { operator_name: 'SkyShow Events', allocated_drones: 50, utilization_pct: 78, contribution_pct: 33 },
      { operator_name: 'DroneLight Co', allocated_drones: 35, utilization_pct: 92, contribution_pct: 23 },
      { operator_name: 'AeroSpectacle', allocated_drones: 28, utilization_pct: 65, contribution_pct: 18 },
      { operator_name: 'NightSky Drones', allocated_drones: 22, utilization_pct: 85, contribution_pct: 15 },
      { operator_name: 'StarFleet Shows', allocated_drones: 15, utilization_pct: 70, contribution_pct: 11 },
    ];
    return operators;
  }
}
