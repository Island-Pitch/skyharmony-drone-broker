export function TermsPage() {
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
          <p>Operators assume custody of allocated drone assets upon check-out scan confirmation. The Platform records chain-of-custody events for accountability. Damage or loss during custody is the responsibility of the checked-out operator per the cooperative governance agreement.</p>
        </section>

        <section>
          <h2>6. Billing &amp; Payments</h2>
          <p>Allocation fees, standby fees, and insurance pool contributions are calculated per the cooperative governance agreement. Invoices are generated monthly with Net-30 payment terms. Disputed charges must be raised within 15 days of invoice date.</p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>The Platform, including its design, code, and documentation, is the intellectual property of Island Pitch LLC. Your data remains your property; we claim no ownership of fleet, booking, or operational data you submit.</p>
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
          <p>Island Pitch LLC<br />legal@skyharmony.dev</p>
        </section>
      </div>
    </div>
  );
}
