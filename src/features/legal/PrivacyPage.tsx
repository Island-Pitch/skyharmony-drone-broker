export function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: April 17, 2026</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>SkyHarmony Drone Broker ("Platform") collects the following information when you create an account and use our services:</p>
          <ul>
            <li><strong>Account information:</strong> Name, email address, and role within your organization.</li>
            <li><strong>Fleet data:</strong> Asset serial numbers, manufacturer details, maintenance records, and custody events.</li>
            <li><strong>Booking data:</strong> Show dates, locations, drone counts, and operator assignments.</li>
            <li><strong>Usage data:</strong> Login timestamps, pages visited, and actions performed within the platform.</li>
            <li><strong>Device data:</strong> Browser type, operating system, and IP address for security monitoring.</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain the drone fleet coordination platform.</li>
            <li>To process booking requests and manage asset allocation.</li>
            <li>To maintain chain-of-custody records for regulatory compliance.</li>
            <li>To generate fleet utilization reports and billing summaries.</li>
            <li>To send critical operational notifications (maintenance alerts, booking confirmations).</li>
            <li>To improve platform reliability and performance.</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Sharing</h2>
          <p>We do not sell personal information. We share data only with:</p>
          <ul>
            <li><strong>Cooperative operators:</strong> Booking and fleet data relevant to shared drone shows.</li>
            <li><strong>Service providers:</strong> Infrastructure hosting (cloud-agnostic), payment processing.</li>
            <li><strong>Legal compliance:</strong> When required by law, subpoena, or regulatory authority.</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>All data is encrypted in transit (TLS 1.3) and at rest. Authentication uses industry-standard JWT tokens with bcrypt password hashing. Access is role-based with the principle of least privilege.</p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>Account data is retained while your account is active. Audit logs and custody records are retained for 7 years per FAA drone operation requirements. You may request account deletion by contacting privacy@skyharmony.dev.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to access, correct, export, or delete your personal data. Contact privacy@skyharmony.dev for any data requests.</p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>SkyHarmony Drone Broker is operated by Island Pitch LLC.<br />
          Privacy inquiries: privacy@skyharmony.dev</p>
        </section>
      </div>
    </div>
  );
}
