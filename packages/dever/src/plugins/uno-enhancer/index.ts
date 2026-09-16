import * as path from 'node:path';
import fs from 'fs-extra';
import type { PluginOption } from 'vite';
import type { Options } from '@deot/dev-shared';
import { Locals } from '@deot/env-shared';
import UnoCSS from 'unocss/vite';
import { presetStyle } from '@deot/style-unocss';
import createRouter from './router';
import {
	mergeUnoOptions,
	parseUnoEntries,
	parseUnoEnvOptions,
	pipelineIncludeForEntry,
	unoPrefixForEntry,
	FALLBACK_UNO_ENTRY
} from './utils';

/*
 * 惰性求值。Vite 是先 `loadConfigFromFile`、再 `asyncFlatten(config.plugins)`，
 * 而 `asyncFlatten` 内部是 `await Promise.all(arr)`，会调用 thenable 的 `then`。
 * 于是这里的工厂正好在「用户 vite.config 已执行、插件尚未装配」那一刻运行，
 * `vite.config` 注入的 `process.env.UNOCSS_ENTRIES` 此时一定已就绪。
 *
 * 不能写成 `Promise.resolve().then(factory)`：那是微任务，
 * 会抢在 `loadConfigFromFile` 的真实 IO 之前跑完，env 依旧是空的。
 */
const lazy = (factory: () => PluginOption): PluginOption => ({
	then: (resolve: (value: PluginOption) => void) => resolve(factory())
} as unknown as PluginOption);

/*
 * 一个进程多套 UnoCSS 配置：给每个入口挂一个官方 `unocss/vite` 实例，
 * 靠三个公开配置项把它们隔离开，提取与生成全部交给官方：
 *
 * - `virtualModulePrefix`：每个实例的虚拟模块 id 变成 `/__uno-<entry>.css`，互不认领
 * - `content.pipeline.include`：每个实例只提取属于本入口（+ shared）的文件
 * - `presets`：本入口自己的 `presetStyle` 选项
 *
 * 自研部分只剩 `createRouter`，负责把 `virtual:uno.css` 指到对的那个实例。
 *
 * 项目根存在 `uno.config.ts` / `uno.config.js` 时完全退回官方单实例，不做拆分。
 */
export default (options: Options): PluginOption => lazy(() => {
	const locals = Locals.impl(options.workspace);
	const cwd = locals.cwd;
	const hasUnoConfig = fs.existsSync(path.resolve(cwd, './uno.config.ts'))
		|| fs.existsSync(path.resolve(cwd, './uno.config.js'));

	if (hasUnoConfig) return UnoCSS();

	const root = locals.workspaceDir;
	const sharedName = locals.sharedPackageFolderName || 'shared';
	const envOptions = parseUnoEnvOptions();
	const entries = parseUnoEntries();
	const names = Object.keys(entries);

	// 单包，或没注入 `UNOCSS_ENTRIES`：一套配置，官方默认行为即可
	if (!names.length) {
		return UnoCSS({ configFile: false, presets: [presetStyle(envOptions)] });
	}

	return [
		createRouter({ root, entries }),
		...[...new Set([...names, FALLBACK_UNO_ENTRY])].map(entry => UnoCSS({
			// 不设 false 的话，`loadConfig` 的 `Object.assign(defaults, inline, fileConfig)` 会让 uno.config.* 反过来覆盖内联配置
			configFile: false,
			virtualModulePrefix: unoPrefixForEntry(entry),
			content: { pipeline: { include: [pipelineIncludeForEntry(entry, root, sharedName)] } },
			presets: [presetStyle(mergeUnoOptions(entries[entry] || {}, envOptions))],
			// 多个实例会抢注同一个 /__unocss 路由
			inspector: false,
			// 当前页面没 import 到的那些入口实例，20s 后会误报 "Entry module not found"
			checkImport: false
		}))
	];
});
