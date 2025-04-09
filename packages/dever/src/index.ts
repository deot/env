import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Options } from '@deot/dev-shared';
import { Utils, Shell } from '@deot/dev-shared';
import { Locals } from '@deot/env-shared';
import fs from 'fs-extra';
import type { InlineConfig } from 'vite';
import { cloneDeep } from 'lodash-es';
import { build as createBuild, createServer, mergeConfig } from 'vite';
import createPlugins from './plugins';
import { generateVirtualHtml } from './utils';
import { getOptions } from './prompt';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const require$ = createRequire(process.cwd());

export const run = (options: Options) => Utils.autoCatch(async () => {
	options = {
		packageName: '',
		packageFolderName: '',
		dryRun: false,
		build: false,
		...options
	};

	if (typeof options.dryRun === 'undefined') {
		options.dryRun = process.env.NODE_ENV === 'UNIT';
	}
	if (options.dryRun) return Shell.spawn(`echo development ${dirname}`);

	const locals = Locals.impl();
	options.packageName = Locals.getRealPackageName(options.packageName);
	if (locals.workspace && !options.packageName) {
		const promptOptions = await getOptions();
		options = {
			...options,
			...promptOptions
		};
	}

	if (options.packageName !== '*') {
		options.packageFolderName = Locals.getPackageFolderName(options.packageName) || options.packageFolderName;
	} else {
		options.packageName = '';
	}

	const { cwd } = locals;
	let options$: InlineConfig = {
		root: locals.workspace,
		resolve: {
			alias: Object.keys(locals.packageOptionsMap).reduce((pre, cur) => {
				const packageOptions = locals.packageOptionsMap[cur];
				pre[packageOptions.name] = path.resolve(locals.workspaceDir, cur);
				return pre;
			}, {
				'@': path.resolve(locals.workspaceDir),
			})
		},
		server: {
			host: true
		},
		build: {
			rollupOptions: {

			}
		},
		css: (() => {
			let has = false;
			try {
				// 本地环境和真实环境存在差异，这里待优化
				// eslint-disable-next-line @stylistic/max-len
				has = fs.existsSync(path.resolve(locals.cwd, './node_modules/@deot/style/src/mixins/bem.scss')) || fs.existsSync(require$.resolve('@deot/style/src/mixins/bem.scss'));
			} catch {
				has = false;
			}

			return !has
				? {}
				: {
						preprocessorOptions: {
							scss: {
								additionalData: '@use "@deot/style/src/mixins/bem.scss" as *;'
							}
						}
					};
		})()
	};

	const devOptions = {
		...options
	};

	if (fs.existsSync(`${cwd}/z.env.config.ts`)) {
		options$.configFile = path.relative(cwd, path.resolve(cwd, './z.env.config.ts'));
	} else if (fs.existsSync(`${cwd}/env.config.ts`)) {
		options$.configFile = path.relative(cwd, path.resolve(cwd, './env.config.ts'));
	} else {
		options$.configFile = path.relative(cwd, path.resolve(dirname, '../shared.config.ts'));
	}

	process.env.DEV_OPTIONS = encodeURIComponent(JSON.stringify(devOptions));
	if (!options.build) {
		options$ = mergeConfig(createPlugins(options), options$);

		const server = await createServer(options$);
		await server.listen();

		server.printUrls();
		server.bindCLIShortcuts({ print: true });
	} else {
		const dirs = options.packageFolderName ? [options.packageFolderName] : locals.packageFolderNames;

		for (let i = 0; i < dirs.length; i++) {
			let newOptions = cloneDeep(options$);
			const packageFolderName = dirs[i];
			let tempPath = '';
			if (!fs.existsSync(path.resolve(locals.workspaceDir, packageFolderName, './index.html'))) {
				tempPath = path.resolve(locals.workspaceDir, packageFolderName, './.temp/index.html');
				fs.outputFileSync(tempPath, generateVirtualHtml(locals.workspace, `/${packageFolderName}/`));
				newOptions.build!.rollupOptions!.input = `/${packageFolderName}/.temp/index.html`;
			}

			newOptions.build!.rollupOptions!.input = {
				[packageFolderName]: `./${locals.workspace}/${packageFolderName}/${tempPath ? '.temp/' : ''}index.html`
			};

			newOptions.build!.rollupOptions!.output = {
				dir: `./${locals.workspace}/dist/${packageFolderName}`
			};

			newOptions = mergeConfig(createPlugins(options, packageFolderName), newOptions);
			await createBuild(newOptions);
			if (tempPath) {
				await fs.remove(tempPath);
			}
			await fs.copySync(
				path.resolve(locals.workspaceDir, `./dist/${packageFolderName}/${packageFolderName}/${tempPath ? '.temp/' : ''}`),
				path.resolve(locals.workspaceDir, `./dist/${packageFolderName}`),
			);
			await fs.remove(path.resolve(locals.workspaceDir, `./dist/${packageFolderName}/${packageFolderName}`));
		}
	}
});
