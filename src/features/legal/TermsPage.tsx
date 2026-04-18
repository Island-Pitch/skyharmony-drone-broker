import { useState, useEffect } from 'react';
import { apiGet } from '@/data/repositories/http/apiClient';

interface CooperativeTermsData {
  brokerage_pct: string;
  allocation_fee_per_drone: string;
  standby_fee_per_drone: string;
  insurance_pool_pct: string;
  net_payment_days: number;
  damage_policy: string | null;
}

const FALLBACK: CooperativeTermsData = {
  brokerage_pct: '15.00',
  allocation_fee_per_drone: '350.00',
  standby_fee_per_drone: '150.00',
  insurance_pool_pct: '7.00',
  net_payment_days: 30,
  damage_policy: null,
};

export function TermsPage() {
  const [terms, setTerms] = useState<CooperativeTermsData>(FALLBACK);

  useEffect(() => {
    apiGet<CooperativeTermsData>('/terms/current')
      .then((res) => setTerms(res.data))
      .catch(() => setTerms(FALLBACK));
  }, []);

  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: April 17, 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using the SkyHarmony Drone Broker platform ("Platform"), you agree to be bound by these Terms of Service. If you are using the Platform on behalf of an organization, you represent that you have authority to bind that organization.</p>
        </section>

        <section>
          <h2>2. Platform Description</h2>
          <p>SkyHarmony is a drone fleet coordination and brokerage platform that enables cooperative operators to share, book, and manage drone assets for entertainment, commercial, and industrial applications.</p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <ul>
            <li>You must provide accurate registration information.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must notify us immediately of any unauthorized access.</li>
            <li>Account roles (Admin, Operator, Staff, Logistics) determine your access level and are assigned by your organization's administrator.</li>
          </ul>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Platform for any unlawful purpose or in violation of FAA regulations.</li>
            <li>Attempt to access assets, bookings, or data belonging to other operators without authorization.</li>
            <li>Interfere with platform security, chain-of-custody integrity, or audit trail systems.</li>
            <li>Submit false maintenance reports, incident reports, or booking requests.</li>
            <li>Reverse-engineer, decompile, or create derivative works from the Platform.</li>
          </ul>
        </section>

        <section>
          <h2>5. Asset Custody &amp; Liability</h2>
          <p>Operators assume custody of allocated drone assets upon check-out scan confirmation. The Platform records chain-of-custody events for accountability. {terms.damage_policy ? terms.damage_policy : 'Damage or loss during custody is the responsibility of the checked-out operator per the cooperative governance agreement.'}</p>
        </section>

        <section>
          <h2>6. Cooperative Fee Schedule</h2>
          <p>The following uniform terms apply equally to all cooperative partners:</p>
          <ul>
            <li><strong>Brokerage Fee:</strong> {Number(terms.brokerage_pct)}% of booking value</li>
            <li><strong>Allocation Fee:</strong> ${Number(terms.allocation_fee_per_drone).toLocaleString(undefined, { minimumFractionDigits: 2 })} per drone per booking</li>
            <li><strong>Standby Fee:</strong> ${Number(terms.standby_fee_per_drone).toLocaleString(undefined, { minimumFractionDigits: 2 })} per drone for standby fleet</li>
            <li><strong>Insurance Pool Contribution:</strong> {Number(terms.insurance_pool_pct)}% of allocation fees</li>
            <li><strong>Payment Terms:</strong> Net-{terms.net_payment_days} days from invoice date</li>
          </ul>
          <p>Disputed charges must be raised within 15 days of invoice date.</p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>The Platform, including its design, code, and documentation, is the intellectual property of Sky Harmony LLC. Your data remains your property; we claim no ownership of fleet, booking, or operational data you submit.</p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>The Platform is provided "as is." We are not liable for drone operational failures, flight incidents, or regulatory violations. The Platform is a coordination tool; operational safety remains the responsibility of each operator.</p>
        </section>

        <section>
          <h2>9. Termination</h2>
          <p>Either party may terminate access with 30 days written notice. We may suspend accounts immediately for Terms violations or security incidents. Upon termination, your data will be available for export for 90 days.</p>
        </section>

        <section>
          <h2>10. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of California, USA.</p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>Sky Harmony LLC<br />legal@skyharmony.dev</p>
        </section>
      </div>
    </div>
  );
}
