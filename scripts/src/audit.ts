import { chromium } from 'playwright-core';

async function runAudit() {
  console.log('Launching Chrome (Optimized Audit)...');
  const extensionPath = 'C:\\Projects\\fares\\Webtoon-Translator-Companion\\Webtoon-Translator-Companion\\apps\\extension\\dist';
  
  // Use a unique profile to avoid locks
  const profilePath = `C:\\Users\\Ahmed\\.gemini\\tmp\\chrome-profile-${Date.now()}`;

  const context = await chromium.launchPersistentContext(profilePath, {
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  // 1. Find Extension ID
  let background = context.serviceWorkers()[0];
  if (!background) {
    background = await new Promise(resolve => {
      const timeout = setTimeout(() => resolve(null), 10000);
      context.on('serviceworker', sw => {
        clearTimeout(timeout);
        resolve(sw);
      });
    });
  }
  
  if (!background) {
    console.error('Service worker not found. Extension might not be loaded.');
    process.exit(1);
  }

  const extensionId = new URL(background.url()).hostname;
  console.log(`Detected Extension ID: ${extensionId}`);

  const page = await context.newPage();
  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  const webtoonUrl = 'https://www.webtoons.com/en/action/omniscient-reader/episode-1/viewer?title_no=2154&episode_no=30';

  // --- STEP 1: INITIAL LOAD + BASELINE ---
  console.log('\n[STEP 1] Initial Load + Baseline');
  const startTime = Date.now();
  await page.goto(webtoonUrl, { waitUntil: 'load', timeout: 60000 });
  const loadTime = Date.now() - startTime;

  const baselineMetrics = await page.evaluate(() => {
    const perf = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domInteractive: perf.domInteractive,
      loadEventEnd: perf.loadEventEnd,
    };
  });
  console.log(`Load Time: ${loadTime}ms`);
  console.log('Baseline Metrics:', baselineMetrics);

  // --- STEP 2: ACTIVATE EXTENSION ---
  console.log('\n[STEP 2] Activate Extension');
  const popupPage = await context.newPage();
  popupPage.on('console', msg => console.log(`POPUP LOG: ${msg.text()}`));
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  
  // Click "Continue with Google" (Login)
  await popupPage.click('text=Continue with Google');
  await popupPage.waitForSelector('text=Welcome!', { timeout: 10000 });
  console.log('Logged in to Extension.');

  // Reload page to ensure content script is injected if it wasn't
  await page.reload({ waitUntil: 'load' });

  // --- STEP 3: IMAGE DETECTION PHASE ---
  console.log('\n[STEP 3] Image Detection Phase');
  
  // Start layout shift monitoring on Webtoon page
  await page.evaluate(() => {
    (window as any).layoutShifts = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          (window as any).layoutShifts += (entry as any).value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  });

  const detectionStart = Date.now();
  await popupPage.click('button:has-text("Start Detection")');
  
  // Wait for content script to finish detection
  await popupPage.waitForSelector('text=Detected images', { timeout: 45000 });
  const detectionEnd = Date.now();
  
  const imgCount = await page.evaluate(() => document.querySelectorAll('img').length);
  const shifts = await page.evaluate(() => (window as any).layoutShifts);
  
  console.log(`Images on page: ${imgCount}`);
  console.log(`Detection Time: ${detectionEnd - detectionStart}ms`);
  console.log(`Layout Shift Score during detection: ${shifts}`);

  // --- STEP 4: TRANSLATION PHASE ---
  console.log('\n[STEP 4] Translation Phase');
  
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  
  await page.evaluate(() => {
    (window as any).longTasks = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        (window as any).longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime
        });
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
  });

  const selectAll = await popupPage.$('text=Select All');
  if (selectAll) await selectAll.click();
  
  await popupPage.click('button:has-text("Start Translation")');
  
  const translationStart = Date.now();
  
  const metricsInterval = setInterval(async () => {
    const pMetrics = await client.send('Performance.getMetrics');
    const cpuMetric = pMetrics.metrics.find(m => m.name === 'ThreadTime');
    const jsHeap = pMetrics.metrics.find(m => m.name === 'JSHeapUsedSize');
    console.log(`  Metrics: CPU Time=${cpuMetric?.value.toFixed(2)}, JS Heap=${(jsHeap!.value / 1024 / 1024).toFixed(2)} MB`);
  }, 5000);

  // Wait for overlays to appear on page
  await page.waitForSelector('.wt-overlay-container', { timeout: 180000 });
  const translationEnd = Date.now();
  
  clearInterval(metricsInterval);
  
  const longTasks = await page.evaluate(() => (window as any).longTasks);
  console.log(`Translation Time: ${translationEnd - translationStart}ms`);
  console.log(`Number of Long Tasks (>50ms): ${longTasks.length}`);

  // --- STEP 5: PERFORMANCE ANALYSIS ---
  console.log('\n[STEP 5] Performance Analysis');
  
  const issues = [];
  if (shifts > 0.1) issues.push('High Layout Shift during lazy-load scrolling.');
  if (longTasks.length > 10) issues.push('Too many long tasks during image processing/base64 conversion.');
  if (loadTime > 10000) issues.push('Slow initial page load (likely Webtoons network).');
  
  const finalMetrics = await client.send('Performance.getMetrics');
  const finalHeap = finalMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')!.value;
  if (finalHeap > 300 * 1024 * 1024) issues.push('High memory usage (>300MB).');

  console.log('Performance Issues:');
  issues.forEach((issue, i) => console.log(`${i+1}. ${issue}`));

  console.log('\nAudit complete.');
  await context.close();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
