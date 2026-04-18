import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/data/repositories/http/apiClient';

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  campaign_tag: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingSponsorLink {
  id: string;
  booking_id: string;
  sponsor_id: string;
  campaign_name: string | null;
  notes: string | null;
}

export interface SponsorReportBooking {
  id: string;
  operator_name: string;
  show_date: string;
  end_date: string | null;
  drone_count: number;
  location: string;
  status: string;
}

export interface SponsorReportSponsor {
  id: string;
  name: string;
  logo_url: string | null;
  campaign_tag: string | null;
  contact_email: string | null;
  campaign_name: string | null;
  notes: string | null;
}

export interface SponsorReport {
  booking: SponsorReportBooking;
  sponsors: SponsorReportSponsor[];
}

export interface CreateSponsorInput {
  name: string;
  logo_url?: string | null;
  campaign_tag?: string | null;
  contact_email?: string | null;
}

export interface AttachSponsorInput {
  booking_id: string;
  sponsor_id: string;
  campaign_name?: string | null;
}

/** Hook providing sponsor CRUD, attach, and report operations. */
export function useSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<Sponsor[]>('/sponsors');
      setSponsors(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSponsors();
  }, [refreshSponsors]);

  const createSponsor = useCallback(
    async (input: CreateSponsorInput) => {
      const res = await apiPost<Sponsor>('/sponsors', input);
      await refreshSponsors();
      return res.data;
    },
    [refreshSponsors],
  );

  const attachSponsor = useCallback(
    async (input: AttachSponsorInput) => {
      const res = await apiPost<BookingSponsorLink>('/sponsors/attach', input);
      return res.data;
    },
    [],
  );

  const getReport = useCallback(async (bookingId: string) => {
    const res = await apiGet<SponsorReport>(`/sponsors/report/${bookingId}`);
    return res.data;
  }, []);

  return { sponsors, loading, error, createSponsor, attachSponsor, getReport, refreshSponsors };
}
