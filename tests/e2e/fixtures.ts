/**
 * E2E Test Fixtures
 * Common test data and utilities for Playwright tests
 */

export const testUsers = {
  existing: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },
  new: {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'New Test User',
  },
};

export const testGames = {
  week1: {
    week: 1,
    season: 2025,
  },
  upcoming: {
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Detroit Lions',
  },
};

export const apiEndpoints = {
  production: 'https://nfl-pickem-app-production.m-de6.workers.dev',
  local: 'http://localhost:8787',
};

export const selectors = {
  // Authentication
  auth: {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    nameInput: 'input[name="name"]',
    signInButton: 'button:has-text("Sign in")',
    signUpButton: 'button:has-text("Create account")',
    signOutButton: 'button:has-text("Sign out")',
  },

  // Navigation
  nav: {
    gamesLink: 'a[href="/"], a[href="/games"]',
    leaderboardLink: 'a[href="/leaderboard"]',
    historyLink: 'a[href="/history"]',
  },

  // Games Page
  games: {
    gameCard: '[data-testid="game-card"], article, .game-card',
    weekSelector: 'select, button:has-text("Week")',
    pickButton: 'button:has-text("Pick"), button:has-text("Submit")',
    teamOption: 'button[role="radio"], button[aria-checked]',
    confirmButton: 'button:has-text("Confirm")',
  },

  // Leaderboard
  leaderboard: {
    table: 'table, [role="table"]',
    weekTab: 'button:has-text("Week")',
    seasonTab: 'button:has-text("Season")',
    userRow: 'tr, article',
  },

  // Mobile
  mobile: {
    menuButton: 'button[aria-label*="menu"], button:has(svg)',
    modal: '[role="dialog"], .modal',
    closeButton: 'button[aria-label*="close"], button:has-text("Cancel")',
  },
};

export const waitTimes = {
  short: 1000,
  medium: 3000,
  long: 5000,
  navigation: 10000,
};

export const testData = {
  validEmail: 'valid.user@example.com',
  invalidEmail: 'invalid-email',
  shortPassword: '123',
  validPassword: 'SecurePass123!',
  longName: 'A'.repeat(101),
  validName: 'John Doe',
};

/**
 * Helper function to generate unique test email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Helper function to wait for navigation
 */
export async function waitForNavigation(page: any, timeout = waitTimes.navigation) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Helper function to sign in
 */
export async function signIn(page: any, email: string, password: string) {
  await page.goto('/signin');
  await page.fill(selectors.auth.emailInput, email);
  await page.fill(selectors.auth.passwordInput, password);
  await page.click(selectors.auth.signInButton);
  await waitForNavigation(page);
}

/**
 * Helper function to sign out
 */
export async function signOut(page: any) {
  const signOutButton = page.locator(selectors.auth.signOutButton);
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await waitForNavigation(page);
  }
}

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(page: any): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  return token !== null;
}

/**
 * Helper function to clear authentication
 */
export async function clearAuth(page: any) {
  await page.evaluate(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  });
}

/**
 * Helper function to wait for API response
 */
export async function waitForApiResponse(
  page: any,
  urlPattern: string | RegExp,
  timeout = waitTimes.medium
) {
  return page.waitForResponse(
    (response: any) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Helper function to mock API response
 */
export async function mockApiResponse(
  page: any,
  urlPattern: string | RegExp,
  responseData: any,
  status = 200
) {
  await page.route(urlPattern, (route: any) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

/**
 * Helper function to get game cards
 */
export async function getGameCards(page: any) {
  return page.locator(selectors.games.gameCard);
}

/**
 * Helper function to select a team pick
 */
export async function selectTeamPick(page: any, gameIndex: number, teamName: string) {
  const gameCards = await getGameCards(page);
  const gameCard = gameCards.nth(gameIndex);

  // Click team button with the team name
  await gameCard.locator(`button:has-text("${teamName}")`).first().click();
}

/**
 * Helper function to submit a pick
 */
export async function submitPick(page: any, gameIndex: number, teamName: string) {
  await selectTeamPick(page, gameIndex, teamName);

  // Wait for confirmation or direct submission
  const confirmButton = page.locator(selectors.games.confirmButton);
  if (await confirmButton.isVisible({ timeout: 1000 })) {
    await confirmButton.click();
  }

  // Wait for API response
  await waitForApiResponse(page, '/api/picks');
}

/**
 * Helper function to navigate to a specific week
 */
export async function navigateToWeek(page: any, week: number) {
  const weekSelector = page.locator(selectors.games.weekSelector);
  if ((await weekSelector.count()) > 0) {
    await weekSelector.first().click();
    await page.click(`text=Week ${week}`);
    await waitForNavigation(page);
  }
}

/**
 * Helper function to check leaderboard position
 */
export async function getLeaderboardPosition(
  page: any,
  userName: string
): Promise<number | null> {
  await page.goto('/leaderboard');
  await waitForNavigation(page);

  const rows = page.locator(selectors.leaderboard.userRow);
  const count = await rows.count();

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = await row.textContent();
    if (text?.includes(userName)) {
      // Try to extract position number
      const positionMatch = text.match(/^(\d+)/);
      return positionMatch ? parseInt(positionMatch[1]) : i + 1;
    }
  }

  return null;
}

/**
 * Helper function to take screenshot with timestamp
 */
export async function takeScreenshot(page: any, name: string) {
  const timestamp = Date.now();
  await page.screenshot({
    path: `tests/e2e/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Helper function to wait for element
 */
export async function waitForElement(
  page: any,
  selector: string,
  timeout = waitTimes.medium
) {
  await page.waitForSelector(selector, { timeout, state: 'visible' });
}

/**
 * Test data cleanup helper
 */
export async function cleanupTestData(page: any) {
  // Clear local storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Clear cookies
  await page.context().clearCookies();
}
