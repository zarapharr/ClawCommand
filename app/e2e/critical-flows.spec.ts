import { expect, test } from '@playwright/test';

test('factory floor and sessions load', async ({ page }) => {
  await page.goto('/?view=factory-floor');
  await expect(page.getByRole('heading', { name: /Factory Floor/i })).toBeVisible();

  await page.getByRole('button', { name: /Session Center/i }).click();
  await expect(page.getByText(/Session Center/i)).toBeVisible();
});

test('workflow and budget surfaces render', async ({ page }) => {
  await page.goto('/?view=workflows');
  await expect(page.getByText(/Workflow/i).first()).toBeVisible();

  await page.goto('/?view=budget');
  await expect(page.getByText(/Budget/i).first()).toBeVisible();
});

