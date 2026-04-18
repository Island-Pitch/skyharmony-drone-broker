import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '@/data/repositories/http/apiClient';

export interface OperatorOverviewBooking {
  id: string;
  show_date: string;
  location: string;
  drone_count: number;
  status: string;
}

export interface OperatorInvoiceSummary {
  id: string;
  total: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface OperatorOverview {
  organization: string;
  fleet_total: number;
  fleet_by_status: Record<string, number>;
  upcoming_bookings: OperatorOverviewBooking[];
  upcoming_bookings_count: number;
  revenue_this_month: number;
  outstanding_balance: number;
  latest_settlement: {
    id: string;
    status: string;
    net_amount: string;
    period_start: string;
    period_end: string;
  } | null;
  team_size: number;
  recent_invoices: OperatorInvoiceSummary[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export function useOperatorOverview() {
  const [overview, setOverview] = useState<OperatorOverview | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(true);

  const refreshOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<OperatorOverview>('/operator/overview');
      setOverview(res.data);
    } catch {
      // Silently fail — demo mode may not have API
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await apiGet<TeamMember[]>('/operator/team');
      setTeam(res.data);
    } catch {
      // Silently fail
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshOverview();
    refreshTeam();
  }, [refreshOverview, refreshTeam]);

  const inviteTeamMember = useCallback(
    async (email: string, name: string, role: string = 'OperatorStaff') => {
      const res = await apiPost<TeamMember>('/operator/team/invite', {
        email,
        name,
        role,
      });
      await refreshTeam();
      await refreshOverview();
      return res.data;
    },
    [refreshTeam, refreshOverview],
  );

  const removeTeamMember = useCallback(
    async (userId: string) => {
      await apiDelete(`/operator/team/${userId}`);
      await refreshTeam();
      await refreshOverview();
    },
    [refreshTeam, refreshOverview],
  );

  return {
    overview,
    team,
    loading,
    teamLoading,
    refreshOverview,
    refreshTeam,
    inviteTeamMember,
    removeTeamMember,
  };
}
