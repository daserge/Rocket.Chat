import { PlaywrightTestConfig } from '@playwright/test';

import * as constants from './tests/e2e/utils/constants';

const setupIsLocalhost = constants.IS_LOCALHOST
	? {
			globalSetup: require.resolve('./tests/e2e/configs/setup.ts'),
			globalTeardown: require.resolve('./tests/e2e/configs/teardown.ts'),
	  }
	: { testIgnore: '00-wizard.spec.ts' };

export default {
	...setupIsLocalhost,
	use: {
		headless: true,
		viewport: { width: 1368, height: 768 },
		ignoreHTTPSErrors: true,
		video: 'retain-on-failure',
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
		baseURL: constants.BASE_URL,
	},
	outputDir: 'tests/e2e/test-failures',
	reporter: process.env.CI ? 'github' : 'list',
	testDir: 'tests/e2e',
	retries: 3,
	workers: 1,
	timeout: 42 * 1000,
} as PlaywrightTestConfig;
