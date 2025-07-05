const express = require('express');
const bodyParser = require('body-parser');
const playwright = require('playwright');

const app = express();
app.use(bodyParser.json());

app.post('/api/create', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'username and password required' });

  let browser = null;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
      ][Math.floor(Math.random()*2)]
    });

    // Go to signup page
    await page.goto('https://www.roblox.com/login');

    // Navigate to signup
    await page.click('a[href*="/signup"]');

    // Fill in details
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="birthdayMonth"]', '1');
    await page.selectOption('select[name="birthdayDay"]', '1');
    await page.selectOption('select[name="birthdayYear"]', '2002');
    await page.check('input[name="gender"][value="2"]');
    await page.click('button[type="submit"]');

    // Wait for FunCaptcha iframe to load
    const frame = await page.waitForSelector('iframe[src*="arkose"]');
    const captchaFrame = await frame.contentFrame();
    if (!captchaFrame)
      throw new Error('FunCaptcha frame not found');

    // Wait user-like behavior
    await captchaFrame.waitForTimeout(15000);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success or error
    await page.waitForTimeout(5000);

    // Check success
    const success = page.url().includes('/home');
    res.json({ success });

  } catch (err) {
    res.json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));
