import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { createScaffold, templates } from '../src';

describe('scaffold', () => {
	let root: string;

	beforeEach(async () => {
		root = await mkdtemp(resolve(tmpdir(), 'env-scaffold-'));
	});

	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	it.each(templates)('creates $type-$language', async ({ type, language }) => {
		const targetDir = resolve(root, 'example');
		await createScaffold({
			name: 'example',
			targetDir,
			template: type,
			language
		});

		const packageJson = JSON.parse(await readFile(resolve(targetDir, 'package.json'), 'utf8'));
		expect(packageJson.name).toBe('example');
		expect(packageJson.dependencies).toMatchObject({
			'@zumer/snapdom': '^2.0.1',
			'pinia': '^4.0.2',
			'vue': '^3.5.40',
			'vue-router': '^5.2.0'
		});
		expect(packageJson.dependencies).not.toHaveProperty('@sentry/vue');
		const rootEntries = await readdir(targetDir);
		expect(rootEntries).toContain('.gitignore');
		expect(rootEntries).toContain('.npmrc');
		expect(rootEntries).toContain('.husky');
		expect(rootEntries).not.toContain('node_modules');
		expect(rootEntries).not.toContain('dist');
		if (type === 'monorepo') {
			expect(await readdir(resolve(targetDir, 'src'))).toEqual(
				expect.arrayContaining(['manage', 'mobile', 'shared'])
			);
			expect(await readFile(resolve(targetDir, 'src/mobile/index.js'), 'utf8'))
				.toContain('virtual:uno.css?unit=rem&scale=2');
			expect(await readFile(resolve(targetDir, 'src/manage/index.js'), 'utf8'))
				.toContain('virtual:uno.css?unit=px&scale=1');
			expect(await readFile(resolve(targetDir, 'src/shared/examples/index.js'), 'utf8'))
				.toContain('virtual:uno.css');
			// 配置已移到 import query，vite.config 不再注入 env
			expect(await readFile(resolve(targetDir, 'vite.config.js'), 'utf8'))
				.not.toContain('UNOCSS_ENTRIES');
		}

		const extension = language === 'ts' ? 'ts' : 'js';
		const networkPath = type === 'monorepo'
			? `src/shared/modules/network.${extension}`
			: `src/modules/network.${extension}`;
		const network = await readFile(resolve(targetDir, networkPath), 'utf8');
		expect(network).toContain('createInstance({');
		expect(network).toContain('onRequest');
		expect(network).toContain('onResponse');
		expect(network).toContain('Authorization');

		if (type === 'monorepo') {
			const manageEnv = await readFile(resolve(targetDir, `src/manage/env.${extension}`), 'utf8');
			const mobileEnv = await readFile(resolve(targetDir, `src/mobile/env.${extension}`), 'utf8');
			const defaultLayout = await readFile(
				resolve(targetDir, 'src/shared/components/layouts/default.vue'),
				'utf8'
			);
			const defaultMobileLayout = await readFile(
				resolve(targetDir, 'src/shared/components/layouts/default-mobile.vue'),
				'utf8'
			);
			const layoutSizeStore = await readFile(
				resolve(
					targetDir,
					`src/shared/components/layouts/stores/use-layout-default-size.${extension}`
				),
				'utf8'
			);
			const setTitle = await readFile(
				resolve(targetDir, 'src/shared/components/set-title/set-title.vue'),
				'utf8'
			);
			const layoutConstants = await readFile(
				resolve(targetDir, `src/shared/constants/layout.${extension}`),
				'utf8'
			);
			const firstRouteHook = await readFile(
				resolve(targetDir, `src/shared/hooks/use-first-route.${extension}`),
				'utf8'
			);
			const manageEscape = await readFile(
				resolve(targetDir, 'src/manage/pages/escape/main/index.vue'),
				'utf8'
			);
			const mobileEscape = await readFile(
				resolve(targetDir, 'src/mobile/pages/escape/main/index.vue'),
				'utf8'
			);
			const unoOnDemandExample = await readFile(
				resolve(targetDir, 'src/shared/examples/components/style-unocss.vue'),
				'utf8'
			);
			const sharedExampleLayout = await readFile(
				resolve(targetDir, 'src/shared/examples/layout.js'),
				'utf8'
			);
			const sharedUnoPage = await readFile(
				resolve(targetDir, 'src/shared/examples/pages/style/unocss/on-demand/index.vue'),
				'utf8'
			);
			expect(manageEnv).toContain('Message');
			expect(manageEnv).toContain('Modal');
			expect(mobileEnv).toContain('MToast');
			expect(mobileEnv).toContain('MModal');
			expect(network).toContain('Context.platform');
			expect(network).not.toContain('from \'@deot/vc\'');
			expect(defaultLayout).toContain('\'has-border-radius\'');
			expect(defaultLayout).toContain('background: #e8e9ee');
			expect(defaultLayout).toContain('<style lang="scss">');
			expect(defaultLayout).not.toContain('<style scoped');
			expect(defaultLayout).toContain('$block: c-layout-default;');
			expect(defaultLayout).toContain('@include block($block)');
			expect(defaultLayout).toContain('@include element(display)');
			expect(defaultMobileLayout).toContain('class="c-layout-mobile"');
			expect(layoutSizeStore).toContain('width.value < 1366');
			expect(layoutSizeStore).toContain('width: 108');
			expect(layoutSizeStore).toContain(': 220');
			expect(await readdir(resolve(targetDir, 'src/shared/components/layouts/stores'))).toEqual(
				expect.arrayContaining([
					`use-layout-default-scroller.${extension}`,
					`use-layout-default-tabs.${extension}`
				])
			);
			expect(setTitle).toContain('Portal.clear()');
			expect(await readdir(resolve(targetDir, 'src/shared/components/layouts/header'))).toEqual(
				expect.arrayContaining(['navbar-toggle.vue', 'title-inner.vue'])
			);
			const layout = await readFile(resolve(targetDir, `src/manage/layout.${extension}`), 'utf8');
			expect(layout).toContain('/workspace/features/main');
			expect(layout).toContain('/state/manage/scroll');
			expect(layout).not.toContain('/home/main');
			expect(layout).toContain('/workspace/features');
			expect(layout).toContain('/state/manage');
			expect(layoutConstants).toContain('LAYOUT_HOME_VISIBLE = true');
			expect(firstRouteHook).toContain('findFirstRoute');
			expect(manageEscape).toContain('layout: \'none\'');
			expect(mobileEscape).toContain('layout: \'none\'');
			expect(unoOnDemandExample).toContain('large: \'g-fs-32\'');
			expect(unoOnDemandExample).toContain('large: \'g-m-20\'');
			expect(unoOnDemandExample).not.toContain('`g-fs-${');
			expect(sharedExampleLayout).toContain('value: \'/style/unocss/on-demand\'');
			expect(sharedUnoPage).toContain('layout: \'default\'');
			expect(await readFile(resolve(targetDir, `src/shared/constants/pages.${extension}`), 'utf8'))
				.toContain('ROUTE_UNAUTHORISED_REGEXP');
			const homePage = await readFile(
				resolve(targetDir, 'src/manage/pages/home/main/index.vue'),
				'utf8'
			);
			expect(homePage).toContain('layout: \'default\'');
			expect(homePage).toContain('useFirstRoute(\'default\', !LAYOUT_HOME_VISIBLE)');
			expect(await readdir(resolve(targetDir, 'src/manage/pages'))).toEqual(
				expect.arrayContaining(['escape', 'home', 'state', 'workspace'])
			);
		} else {
			const defaultLayout = await readFile(
				resolve(targetDir, 'src/components/layouts/default.vue'),
				'utf8'
			);
			const app = await readFile(resolve(targetDir, `src/app.${extension}`), 'utf8');
			const layout = await readFile(resolve(targetDir, `src/layout.${extension}`), 'utf8');
			const router = await readFile(resolve(targetDir, `src/router/index.${extension}`), 'utf8');
			const projectConfig = await readFile(
				resolve(targetDir, language === 'ts' ? 'tsconfig.json' : 'jsconfig.json'),
				'utf8'
			);
			const globalStyles = await readFile(resolve(targetDir, 'src/styles/index.scss'), 'utf8');
			const homePage = await readFile(resolve(targetDir, 'src/pages/home/main/index.vue'), 'utf8');
			expect(defaultLayout).toContain('useLayoutDefaultTabsStore');
			expect(defaultLayout).toContain('grid-template-columns: max-content minmax(0, 1fr)');
			expect(app).toContain('createAppContext');
			expect(layout).toContain('/workspace/features/main');
			expect(layout).toContain('/state/manage/scroll');
			expect(layout).not.toContain('/home/main');
			expect(router).toContain('vue-router/auto-routes');
			expect(router).toContain('setupLayouts(autoRoutes)');
			expect(projectConfig).toContain('"@/*": ["./*"]');
			expect(globalStyles).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
			expect(homePage).toContain('useFirstRoute(\'default\', !LAYOUT_HOME_VISIBLE)');
			expect(homePage).toContain('@/src/');
			expect(homePage).not.toContain('@/shared');
			expect(await readdir(resolve(targetDir, 'src/pages'))).toEqual(
				expect.arrayContaining(['home', 'state', 'workspace'])
			);
		}
	});

	it('wires per-entry unocss imports in the monorepo template', async () => {
		const targetDir = resolve(root, 'uno-example');
		await createScaffold({
			name: 'uno-example',
			targetDir,
			template: 'monorepo',
			language: 'js'
		});
		expect(await readFile(resolve(targetDir, 'src/mobile/index.js'), 'utf8'))
			.toContain('virtual:uno.css?unit=rem&scale=2');
		expect(await readFile(resolve(targetDir, 'src/manage/index.js'), 'utf8'))
			.toContain('virtual:uno.css?unit=px&scale=1');
		expect(await readFile(resolve(targetDir, 'src/shared/examples/index.js'), 'utf8'))
			.toContain('virtual:uno.css');
		const viteConfig = await readFile(resolve(targetDir, 'vite.config.js'), 'utf8');
		expect(viteConfig).not.toContain('UNOCSS_ENTRIES');
	});

	it('rejects an existing target', async () => {
		const targetDir = resolve(root, 'example');
		await createScaffold({ name: 'example', targetDir, template: 'monorepo', language: 'js' });

		await expect(createScaffold({
			name: 'example',
			targetDir,
			template: 'monorepo',
			language: 'js'
		})).rejects.toThrow('already exists');
	});

	it('rejects an invalid project name without writing files', async () => {
		await expect(createScaffold({
			name: '../example',
			targetDir: resolve(root, 'example'),
			template: 'single',
			language: 'js'
		})).rejects.toThrow('Invalid project name');
		expect(await readdir(root)).toEqual([]);
	});
});
