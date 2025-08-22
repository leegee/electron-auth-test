import path from 'node:path';
import { test, expect, _electron } from '@playwright/test';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env.production') });

const GITHUB_USER = process.env.GITHUB_USER!;
const GITHUB_PASS = process.env.GITHUB_PASS!;
const REDIRECT_URI = process.env.REDIRECT_URI || 'myapp://callback';

const prodExe = path.resolve('./dist_electron/win-unpacked/MyApp.exe'); // Windows
// const prodExe = path.resolve('./dist_electron/mac/MyApp.app/Contents/MacOS/MyApp'); // macOS
// const prodExe = path.resolve('./dist_electron/linux-unpacked/MyApp'); // Linux

test('Launch Electron production build', async () => {
    const electronApp = await _electron.launch({
        executablePath: prodExe,
        colorScheme: 'dark'
    });

    const mainWindow = await electronApp.firstWindow();
    await mainWindow.bringToFront();
    await mainWindow.waitForLoadState('domcontentloaded');

    const loginButton = mainWindow.locator('#login');
    console.log('## found login button')
    await loginButton.waitFor({ state: 'visible', timeout: 30000 });
    console.log('## login button seen')
    await loginButton.click();
    console.log('## login button clicked')

    // Wait for OAuth popup window
    const popupPromise = electronApp.waitForEvent('window').catch(() => null);
    const oauthWindow = await popupPromise;

    if (oauthWindow) {
        await oauthWindow.waitForLoadState('domcontentloaded');

        const isLoggedIn = await oauthWindow.evaluate(() => {
            return document.body.classList.contains("logged-in");
        });

        if (!isLoggedIn) {
            console.log('### Not logged in - find  the form')
            const html = await oauthWindow.content();
            console.log(html);
            await oauthWindow.fill('input[name="login"]', GITHUB_USER);
            await oauthWindow.fill('input[name="password"]', GITHUB_PASS);
            await oauthWindow.click('input[name="commit"]');
            console.log('### oauthWindow filled in form')
        }
        else {
            console.log('### logged in')
        }

        const authorizeBtn = oauthWindow.locator('[data-octo-click="oauth_application_authorization"]');
        if (await authorizeBtn.isVisible({ timeout: 5000 })) {
            await authorizeBtn.click();
        }

        const continueBtn = oauthWindow.locator('text=Continue');
        await continueBtn.waitFor({ state: 'visible', timeout: 10000 });
        await continueBtn.click();

        // Wait for either redirect OR close
        try {
            await oauthWindow.waitForEvent('close', { timeout: 4000 });
        } catch {
            console.log('Popup did not close automatically, closing manually...');
            await oauthWindow.close();
        }
    } else {
        console.log('No OAuth popup — user likely already logged in');
    }

    await expect(mainWindow.locator('text=Logged in with GitHub')).toBeVisible();
    await electronApp.close();
});
