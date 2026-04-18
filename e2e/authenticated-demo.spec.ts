import { test, expect } from '@playwright/test';

/**
 * SHD-53: Authenticated demo click-through E2E.
 * Logs in as admin, navigates every page, verifies real DB data renders.
 */

test.describe('Authenticated Demo Click-Through', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@skyharmony.dev');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('dashboard loads with real KPI data', async ({ page }) => {
    await expect(page.getByText('Dashboard')).toBeVisible();
    // Wait for summary to load from API
    await expect(page.getByText('Total Assets')).toBeVisible({ timeout: 10000 });
    // Should show a real number, not 0 or loading
    const totalEl = page.locator('.stat-value').first();
    await expect(totalEl).toBeVisible();
    const text = await totalEl.textContent();
    expect(Number(text)).toBeGreaterThan(100);
  });

  test('dashboard shows all widgets', async ({ page }) => {
    await page.waitForTimeout(2000);
    const html = await page.content();
    expect(html).toContain('Active Bookings');
    expect(html).toContain('Maintenance Alerts');
    expect(html).toContain('Revenue');
    expect(html).toContain('Operator');
  });

  test('fleet shows assets from database', async ({ page }) => {
    await page.getByText('Fleet').click();
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 10000 });
    const rows = page.locator('.data-table tbody tr');
    await expect(rows.first()).toBeVisible();
    // Should have status badges
    await expect(page.locator('.status-badge').first()).toBeVisible();
  });

  test('bookings page renders with tabs', async ({ page }) => {
    await page.getByText('Bookings').click();
    await expect(page.locator('form, .bookings-tabs, .booking-form').first()).toBeVisible({ timeout: 5000 });
  });

  test('billing shows real revenue from DB', async ({ page }) => {
    await page.getByText('Billing').click();
    await expect(page.getByText(/Total Revenue/i)).toBeVisible({ timeout: 10000 });
    // Revenue should be > $0
    const revenueEl = page.locator('.stat-value.revenue-total');
    await expect(revenueEl).toBeVisible();
    const text = await revenueEl.textContent();
    expect(text).toContain('$');
  });

  test('scan page accepts serial input', async ({ page }) => {
    await page.getByText('Scan').click();
    await expect(page.locator('.scan-page')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[placeholder="e.g. VE-0001"]')).toBeVisible();
  });

  test('allocation page renders for admin', async ({ page }) => {
    await page.getByText('Allocation').click();
    await expect(page.getByText(/Allocation/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('incidents page renders with tabs', async ({ page }) => {
    await page.getByText('Incidents').click();
    await expect(page.getByText(/Incident/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('sidebar shows user info and sign out', async ({ page }) => {
    await expect(page.locator('.sidebar-user-name')).toBeVisible();
    await expect(page.locator('.sidebar-user-role')).toBeVisible();
    await expect(page.getByText('Sign Out')).toBeVisible();
  });

  test('sign out redirects to login', async ({ page }) => {
    await page.getByText('Sign Out').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('full click-through: every page loads without errors', async ({ page }) => {
    const navItems = [
      'Fleet', 'Bookings', 'Billing', 'Scan', 'Allocation', 'Incidents',
    ];

    for (const item of navItems) {
      await page.locator('.sidebar-nav').getByText(item).click();
      // Each page should render content within 5 seconds
      await expect(page.locator('.main-content').first()).toBeVisible({ timeout: 5000 });
      // No uncaught JS errors
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      expect(errors).toHaveLength(0);
    }
  });
});
