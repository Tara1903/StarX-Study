import { test, expect } from '@playwright/test';

test.describe('StarX Study Rebrand Verification', () => {
  test('Login page displays canonical StarX Study branding and tagline', async ({ page }) => {
    await page.goto('/login');

    // Verify Title
    await expect(page).toHaveTitle(/StarX Study/);

    // Verify Brand Logo Text
    const starText = page.locator('text=Star');
    await expect(starText.first()).toBeVisible();

    const xText = page.locator('text=X');
    await expect(xText.first()).toBeVisible();

    // Verify Tagline
    const tagline = page.getByText('BEYOND TOMORROW');
    await expect(tagline.first()).toBeVisible();

    // Verify Login Button with Primary Emerald
    const loginButton = page.getByRole('button', { name: /log in/i });
    await expect(loginButton).toBeVisible();

    // Verify Google OAuth Button
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();

    // Verify GitHub OAuth Button
    const githubButton = page.getByRole('button', { name: /continue with github/i });
    await expect(githubButton).toBeVisible();

    // Verify Passkey Button
    const passkeyButton = page.getByRole('button', { name: /continue with passkey/i });
    await expect(passkeyButton).toBeVisible();
  });

  test('Signup page displays StarX Study branding', async ({ page }) => {
    await page.goto('/signup');

    await expect(page).toHaveTitle(/StarX Study/);
    const welcome = page.getByText(/StarX Study/);
    await expect(welcome.first()).toBeVisible();
  });
});
