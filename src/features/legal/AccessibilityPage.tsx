export function AccessibilityPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Accessibility Statement</h1>
        <p className="legal-updated">Last updated: April 17, 2026</p>

        <section>
          <h2>Our Commitment</h2>
          <p>SkyHarmony Drone Broker is committed to ensuring digital accessibility for people of all abilities. We strive to conform to <strong>WCAG 2.2 Level AA</strong> standards and continuously improve the user experience for everyone.</p>
        </section>

        <section>
          <h2>Accessibility Features</h2>
          <ul>
            <li><strong>Keyboard navigation:</strong> All interactive elements are operable via keyboard (Tab, Enter, Space, Escape).</li>
            <li><strong>Screen reader support:</strong> Semantic HTML, ARIA labels, and live regions for dynamic content updates.</li>
            <li><strong>Color contrast:</strong> Text and UI components meet WCAG 2.2 AA contrast ratios (4.5:1 for normal text, 3:1 for large text).</li>
            <li><strong>Reduced motion:</strong> Animations respect the <code>prefers-reduced-motion</code> system preference.</li>
            <li><strong>Focus indicators:</strong> Visible focus outlines on all interactive elements.</li>
            <li><strong>Form labels:</strong> All form inputs have associated visible labels.</li>
            <li><strong>Status announcements:</strong> Loading states, errors, and confirmations are announced to assistive technology.</li>
            <li><strong>Touch targets:</strong> Interactive elements are at least 44x44 pixels for mobile usability.</li>
          </ul>
        </section>

        <section>
          <h2>Known Limitations</h2>
          <ul>
            <li>The QR scanner component currently uses manual serial number entry; camera-based scanning accessibility is under evaluation.</li>
            <li>Some data visualizations (operator breakdown bars) may benefit from additional text alternatives.</li>
            <li>The fleet table with 500+ rows may present challenges for screen reader users; virtual scrolling improvements are planned.</li>
          </ul>
        </section>

        <section>
          <h2>Testing</h2>
          <p>We test accessibility using:</p>
          <ul>
            <li>Automated testing with axe-core in our CI pipeline.</li>
            <li>Manual keyboard navigation testing across all features.</li>
            <li>VoiceOver (macOS) and NVDA (Windows) screen reader testing.</li>
            <li>Playwright E2E tests that verify semantic structure.</li>
          </ul>
        </section>

        <section>
          <h2>Feedback &amp; Contact</h2>
          <p>We welcome your feedback on the accessibility of SkyHarmony. If you encounter any barriers or have suggestions, please contact us:</p>
          <ul>
            <li>Email: <strong>accessibility@skyharmony.dev</strong></li>
            <li>Response time: We aim to respond within 2 business days and resolve issues within 10 business days.</li>
          </ul>
        </section>

        <section>
          <h2>Enforcement</h2>
          <p>If you are not satisfied with our response, you may file a complaint with the U.S. Department of Justice, Civil Rights Division, or your local accessibility enforcement authority.</p>
        </section>
      </div>
    </div>
  );
}
