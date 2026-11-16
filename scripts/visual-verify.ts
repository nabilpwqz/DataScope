import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.join(process.cwd(), 'public', 'screenshots');

const pagesToCapture = [
  { name: 'landing', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'explorer', path: '/dashboard/explorer' },
  { name: 'advanced-search', path: '/dashboard/advanced-search' },
  { name: 'analytics', path: '/dashboard/analytics' },
  { name: 'architecture', path: '/dashboard/architecture' },
];

async function captureScreenshots() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log(`Starting visual capture against: ${BASE_URL}`);
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`\nCapturing viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Capture public pages before logging in
    for (const p of pagesToCapture.slice(0, 3)) {
      console.log(`  Capturing ${p.name} (${vp.name})...`);
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
      const filename = `${p.name}-${vp.name}.png`;
      await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: false });
      console.log(`  -> Saved ${filename}`);
    }

    // 2. Log in as admin to access protected dashboard pages
    console.log(`  Authenticating for dashboard access on ${vp.name}...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    const dbAuthTab = page.locator('button:has-text("Database Auth")');
    if (await dbAuthTab.isVisible()) {
      await dbAuthTab.click();
    }
    await page.fill('input[type="email"]', 'admin@datascope.io');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 20000 });
    console.log(`  Successfully authenticated as Admin.`);

    // 3. Capture protected dashboard pages
    for (const p of pagesToCapture.slice(3)) {
      console.log(`  Capturing ${p.name} (${vp.name})...`);
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const filename = `${p.name}-${vp.name}.png`;
      await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: false });
      console.log(`  -> Saved ${filename}`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nVisual capture complete! Screenshots saved to: ${OUT_DIR}`);
  process.exit(0);
}

captureScreenshots().catch((err) => {
  console.error('Visual capture error:', err);
  process.exit(1);
});
