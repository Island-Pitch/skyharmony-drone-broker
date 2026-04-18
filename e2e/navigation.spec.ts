import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders hero with SkyHarmony branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('SkyHarmony')).toBeVisible();
    await expect(page.getByText('Enter Platform')).toBeVisible();
  });

  test('CTA links to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Enter Platform').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Navigation', () => {
  test('sidebar renders all navigation items', async ({ page }) => {
    await page.goto('/dashboard');
    const nav = page.locator('.sidebar-nav');
    await expect(nav.getByText('Dashboard')).toBeVisible();
    await expect(nav.getByText('Fleet')).toBeVisible();
    await expect(nav.getByText('Bookings')).toBeVisible();
    await expect(nav.getByText('Billing')).toBeVisible();
    await expect(nav.getByText('Scan')).toBeVisible();
    await expect(nav.getByText('Allocation')).toBeVisible();
    await expect(nav.getByText('Incidents')).toBeVisible();
  });

  test('SkyHarmony branding in sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.sidebar-header')).toContainText('SkyHarmony');
  });

  test('demo watermark is visible', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Prototype')).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test('renders fleet summary KPIs', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Total Assets')).toBeVisible();
    await expect(page.getByText('Available')).toBeVisible();
    await expect(page.getByText('Utilization')).toBeVisible();
  });

  test('renders dashboard widgets', async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for async data to load then check DOM
    await page.waitForTimeout(1000);
    const html = await page.content();
    expect(html).toContain('Active Bookings');
    expect(html).toContain('Maintenance Alerts');
    expect(html).toContain('Revenue');
  });
});

test.describe('Fleet', () => {
  test('renders fleet table with seeded data', async ({ page }) => {
    await page.goto('/fleet');
    await expect(page.getByRole('heading', { name: /fleet/i })).toBeVisible();
    await expect(page.locator('.data-table')).toBeVisible();
    await expect(page.locator('.data-table tbody tr').first()).toBeVisible();
  });

  test('shows status badges', async ({ page }) => {
    await page.goto('/fleet');
    await expect(page.locator('.status-badge').first()).toBeVisible();
  });
});

test.describe('Bookings', () => {
  test('renders bookings page', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page.locator('.page').first()).toBeVisible();
  });

  test('booking form renders', async ({ page }) => {
    await page.goto('/bookings');
    // Look for any form element or booking-related content
    await expect(page.locator('form, .booking-form, .bookings-tabs').first()).toBeVisible();
  });
});

test.describe('Billing', () => {
  test('renders billing dashboard with revenue data', async ({ page }) => {
    await page.goto('/billing');
    await expect(page.getByText(/revenue/i).first()).toBeVisible();
  });
});

test.describe('Scan', () => {
  test('renders scan page with serial input', async ({ page }) => {
    await page.goto('/scan');
    await expect(page.locator('.scan-page')).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. VE-0001"]')).toBeVisible();
  });

  test('scanning a valid serial shows asset details', async ({ page }) => {
    await page.goto('/scan');
    await page.locator('input[placeholder="e.g. VE-0001"]').fill('VE-0001');
    await page.locator('button.scan-btn').click();
    // Wait for result to appear
    await expect(page.getByText(/VE-0001/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Allocation', () => {
  test('renders allocation panel', async ({ page }) => {
    await page.goto('/allocation');
    await expect(page.getByText(/allocation/i).first()).toBeVisible();
  });
});

test.describe('Incidents', () => {
  test('renders incidents page', async ({ page }) => {
    await page.goto('/incidents');
    await expect(page.getByText(/incident/i).first()).toBeVisible();
  });
});

test.describe('Coming Soon Pages', () => {
  test('missions shows coming soon', async ({ page }) => {
    await page.goto('/missions');
    await expect(page.getByText('Coming Soon')).toBeVisible();
    await expect(page.getByText('Mission Control')).toBeVisible();
  });

  test('marketplace shows coming soon', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.getByText('Coming Soon')).toBeVisible();
    await expect(page.getByText('Operator Marketplace')).toBeVisible();
  });
});

test.describe('Full Click-Through (No Dead Ends)', () => {
  test('every page renders without crash', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/fleet',
      '/bookings',
      '/billing',
      '/scan',
      '/allocation',
      '/incidents',
      '/missions',
      '/marketplace',
    ];

    for (const route of routes) {
      await page.goto(route);
      // Every page should have visible content within the main area
      await expect(page.locator('.main-content').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
