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
    await mainWindow.waitForLoadState('domcontentloaded');

    const loginButton = mainWindow.locator('button:has-text("Login with GitHub")');
    await loginButton.waitFor({ state: 'attached', timeout: 10000 });
    await loginButton.click({ force: true });

    // Wait for OAuth popup window
    const popupPromise = electronApp.waitForEvent('window').catch(() => null);
    await loginButton.click();
    const oauthWindow = await popupPromise;

    if (oauthWindow) {
        await oauthWindow.waitForLoadState('domcontentloaded');
        await oauthWindow.fill('input[name="login"]', GITHUB_USER);
        await oauthWindow.fill('input[name="password"]', GITHUB_PASS);
        await oauthWindow.click('input[name="commit"]');

        const authorizeBtn = oauthWindow.locator('[data-octo-click="oauth_application_authorization"]');
        if (await authorizeBtn.isVisible({ timeout: 5000 })) {
            await authorizeBtn.click();
        }

        await oauthWindow.waitForURL(url => url.toString().startsWith(REDIRECT_URI));
        await oauthWindow.close();
    } else {
        console.log('No OAuth popup — user likely already logged in');
    }

    await expect(mainWindow.locator('text=Logged in with GitHub')).toBeVisible();
    await electronApp.close();
});
