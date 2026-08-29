import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOTS_DIR = '/home/pratay-karali/.gemini/antigravity/brain/878f1256-8ee9-44c2-8cae-cbb120532bf8/screenshots';
await mkdir(SCREENSHOTS_DIR, { recursive: true });

console.log('🚀 Starting Vite preview server...');
const vite = spawn('npx', ['vite', 'preview', '--port', '4173', '--host'], {
  cwd: '/home/pratay-karali/Desktop/NIRANTAR/frontend',
  stdio: 'inherit',
});

// Wait 2s for server
await new Promise((r) => setTimeout(r, 2000));

console.log('📸 Launching Chrome to capture unobstructed screenshots...');
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1440, height: 900 },
});

try {
  const page = await browser.newPage();

  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // Dismiss welcome modal if present
  await page.evaluate(() => {
    localStorage.setItem('nirantar_welcomed', 'true');
    localStorage.setItem('nirantar_guided_tour_seen', 'true');
    const closeBtn = document.querySelector('button[aria-label="Close"], button.close, [class*="modal"] button');
    const exploreBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('explore myself'));
    if (exploreBtn) exploreBtn.click();
    else if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 1. HOME & SIDEBAR DEFAULT AVATAR
  console.log('📸 Capturing 01_home_sidebar_default_avatar.png...');
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '01_home_sidebar_default_avatar.png'), fullPage: false });

  // 2. SETTINGS PAGE
  console.log('📸 Capturing 02_settings_page.png...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('aside button')).find((b) => b.textContent.includes('Settings'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '02_settings_page.png'), fullPage: false });

  // 3. NIRANTAR GUIDE / HELP CENTER PAGE
  console.log('📸 Capturing 03_nirantar_guide_page.png...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('aside button')).find((b) => b.textContent.includes('Nirantar Guide'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '03_nirantar_guide_page.png'), fullPage: false });

  // 4. MY JOURNEY PAGE
  console.log('📸 Capturing 04_my_journeys_page.png...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('aside button')).find((b) => b.textContent.includes('My Journey'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '04_my_journeys_page.png'), fullPage: false });

  // 5. NIRA CHATBOT OPEN (Default Avatar Greeting)
  console.log('📸 Capturing 05_nira_chat_drawer_default.png...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('aside button')).find((b) => b.textContent.includes('Chat with Nira'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '05_nira_chat_drawer_default.png'), fullPage: false });

  // 6. SEND QUERY -> DYNAMIC EXPRESSION (Conductor / Search / Radar)
  console.log('📸 Capturing 06_nira_chat_dynamic_expression.png...');
  await page.type('input[placeholder*="Auto book"], input[placeholder*="Delhi to Mumbai"]', 'Show Rajdhani trains Delhi to Mumbai 3A');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '06_nira_chat_dynamic_expression.png'), fullPage: false });

  console.log('✅ All unobstructed screenshots captured successfully!');
} finally {
  await browser.close();
  vite.kill();
}
