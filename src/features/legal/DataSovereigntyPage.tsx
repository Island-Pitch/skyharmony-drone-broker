export function DataSovereigntyPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Data Sovereignty</h1>
        <p className="legal-updated">
          Aligned with <a href="https://www.temanararaunga.maori.nz/" target="_blank" rel="noopener noreferrer">Te Mana Raraunga</a> — Maori Data Sovereignty Network
        </p>

        <section>
          <h2>Our Data, Our Sovereignty, Our Future</h2>
          <p>
            SkyHarmony formally adopts the principles of <strong>Te Mana Raraunga</strong> as our data governance framework.
            Data is a living <em>taonga</em> (treasure) of strategic value. It tells the story of <em>whakapapa</em> (genealogy and origins).
            We treat all cooperative data — fleet records, custody chains, billing, operator relationships — as taonga held in trust.
          </p>
        </section>

        <section>
          <h2>Maori Data Sovereignty Principles</h2>
          <ul>
            <li><strong>Rangatiratanga (Authority)</strong> — Operators own their data. Role-based access ensures each operator controls their fleet, bookings, and billing. No operator can see another's data without consent.</li>
            <li><strong>Kaitiakitanga (Guardianship)</strong> — Zero outbound network calls. Self-hosted on operator-controlled infrastructure. Data never leaves your network.</li>
            <li><strong>Manaakitanga (Care)</strong> — Audit trail on every status change, custody event, and terms modification. Immutable event log protects all parties.</li>
            <li><strong>Kotahitanga (Unity)</strong> — Uniform Terms Enforcement. All cooperative decisions are transparent, versioned, and auditable. No hidden deals.</li>
          </ul>
        </section>

        <section>
          <h2>CARE Principles Compliance</h2>
          <p>SkyHarmony aligns with the <a href="https://www.gida-global.org/care" target="_blank" rel="noopener noreferrer">CARE Principles</a> for Indigenous Data Governance:</p>
          <ul>
            <li><strong>Collective Benefit</strong> — Revenue transparently calculated and split across the cooperative. Fair allocation with no favoritism.</li>
            <li><strong>Authority to Control</strong> — Self-hosted. No cloud vendor has access. Data exportable via standard SQL at any time.</li>
            <li><strong>Responsibility</strong> — Complete audit trail. Maintenance triggers protect equipment. Incident reporting ensures accountability.</li>
            <li><strong>Ethics</strong> — Transparent billing from real data. No hidden collection. Privacy by design.</li>
          </ul>
        </section>

        <section>
          <h2>Technical Implementation</h2>
          <ul>
            <li><strong>Zero outbound calls</strong> — No analytics, telemetry, CDN, or external fonts. Fully self-contained.</li>
            <li><strong>Self-hosted Docker</strong> — Runs on your NAS, server, or sovereign cloud. No vendor lock-in.</li>
            <li><strong>Operator-scoped RBAC</strong> — Every API endpoint filters data by the requesting operator's identity.</li>
            <li><strong>Encrypted credentials</strong> — Passwords bcrypt-hashed. JWT tokens for stateless auth.</li>
            <li><strong>Data portability</strong> — PostgreSQL with standard pg_dump. Your data is always exportable.</li>
          </ul>
        </section>

        <section>
          <h2>Sovereign Hosting</h2>
          <p>We recommend hosting on infrastructure where data sovereignty is guaranteed:</p>
          <ul>
            <li><strong>Self-hosted</strong> — Synology NAS, bare metal, or your own data center</li>
            <li><strong>Catalyst Cloud</strong> (Aotearoa NZ) — NZ-owned, NZ data centers</li>
            <li><strong>Tribal Broadband</strong> (USA) — Indigenous community infrastructure grants via NTIA</li>
          </ul>
          <p>Avoid hyperscale cloud providers for primary data unless the cooperative explicitly consents and understands jurisdiction implications.</p>
        </section>

        <section>
          <h2>References</h2>
          <ul>
            <li><a href="https://www.temanararaunga.maori.nz/" target="_blank" rel="noopener noreferrer">Te Mana Raraunga</a> — Maori Data Sovereignty Network</li>
            <li><a href="https://www.gida-global.org/care" target="_blank" rel="noopener noreferrer">CARE Principles</a> — Global Indigenous Data Alliance</li>
            <li>UN Declaration on the Rights of Indigenous Peoples (UNDRIP)</li>
            <li>Treaty of Waitangi / Te Tiriti o Waitangi</li>
          </ul>
        </section>

        <p style={{ marginTop: '2rem', fontStyle: 'italic', opacity: 0.7 }}>
          Prepared in the spirit of manaakitanga — caring for the data as we care for each other.
        </p>
      </div>
    </div>
  );
}
