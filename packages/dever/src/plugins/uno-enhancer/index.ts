import * as path from 'node:path';
import fs from 'fs-extra';
import type { PluginOption } from 'vite';
import type { Options } from '@deot/dev-shared';
import { Locals } from '@deot/env-shared';
import UnoCSS, { type UnocssVitePluginAPI, type VitePluginConfig } from 'unocss/vite';
import { presetStyle } from '@deot/style-unocss';
import createRouter, { type UnoInstance } from './router';
import {
	mergeUnoOptions,
	parseUnoEnvOptions,
	pipelineIncludeForEntry,
	unoPrefixForEntry,
	ENTRY_NAME_RE,
	FALLBACK_UNO_ENTRY
} from './utils';

const UNO_CONFIG_FILES = ['uno.config', 'unocss.config']
	.flatMap(name => ['ts', 'mts', 'js', 'mjs', 'cjs'].map(ext => `${name}.${ext}`));

const findUnoConfig = (dir: string) => {
	for (let i = 0; i < UNO_CONFIG_FILES.length; i++) {
		const full = path.resolve(dir, UNO_CONFIG_FILES[i]);
		if (fs.existsSync(full)) return full;
	}
};

/*
 * 一个进程多套 UnoCSS 配置：给每个包目录挂一个官方 `unocss/vite` 实例，
 * 靠三个公开配置项把它们隔离开，提取与生成全部交给官方：
 *
 * - `virtualModulePrefix`：每个实例的虚拟模块 id 变成 `/__uno-<entry>.css`，互不认领
 * - `content.pipeline.include`：每个实例只提取属于本入口（+ shared）的文件
 * - `presets`：本入口的 `presetStyle` 选项，由 import query 延迟绑定
 *
 * 自研部分只剩 `createRouter`，负责选实例 + 把 query 上的配置绑给它。
 *
 * 入口列表以磁盘为准（包目录），配置写在 import query 上：
 *     import 'virtual:uno.css?unit=rem&scale=2';
 * 没写 query 的包用默认 `presetStyle()`。`UNOCSS_OPTIONS` 仍是全局覆盖。
 */
export default (options: Options, packageFolderName?: string): PluginOption => {
	const locals = Locals.impl(options.workspace);
	const root = locals.workspaceDir;

	/*
	 * 官方 `createContext` 会用 `updateRoot(config.root)` 把 unconfig 的搜索根切到 root
	 * （也就是 workspace 目录），所以放在项目根的 uno.config.* 官方其实找不到，
	 * 只会打一条 "Config file not found" 然后退回默认配置。
	 * 这里两处都查，找到就把绝对路径喂给它 —— `loadConfig` 里 `configOrPath = inlineConfig.configFile`。
	 */
	const unoConfigFile = findUnoConfig(root) || findUnoConfig(locals.cwd);
	if (unoConfigFile) return UnoCSS({ configFile: unoConfigFile });

	const sharedName = locals.sharedPackageFolderName || 'shared';
	const envOptions = parseUnoEnvOptions();

	/*
	 * 入口名会成为 `virtualModulePrefix`，而官方把它原样插进 `new RegExp()`。
	 * `Locals` 只过滤了 `/(^_|tpl|dist)/`，一个叫 `my.app` 的目录照样会把 `.` 带进正则，
	 * 所以这里必须过一遍白名单。
	 */
	const knownEntries = [...locals.packageFolderNames, locals.sharedPackageFolderName]
		.filter(Boolean)
		.filter((name) => {
			if (ENTRY_NAME_RE.test(name)) return true;
			console.warn(
				`[uno] 包目录 "${name}" 不是合法入口名（只允许 ${ENTRY_NAME_RE.source}），`
				+ `其文件将落到 ${FALLBACK_UNO_ENTRY}`
			);
			return false;
		});

	/*
	 * build 时每个包各跑一次独立的 createBuild，只需要当前包 + shared + 兜底三个实例。
	 * 不能只建当前包：`shared/` 里的裸 import 需要 shared 实例。
	 */
	const targets = packageFolderName && knownEntries.includes(packageFolderName)
		? [...new Set([packageFolderName, sharedName].filter(name => knownEntries.includes(name)))]
		: [...knownEntries];
	targets.push(FALLBACK_UNO_ENTRY);

	/*
	 * 多个实例会抢注同一个 `/__unocss` 路由，所以只能有一个开 inspector。
	 */
	const inspect = process.env.UNOCSS_INSPECT;
	const inspectEntry = inspect === 'off' || inspect === 'false' ? undefined : inspect || targets[0];

	const instances: UnoInstance[] = [];
	const created = targets.map((entry) => {
		const config: VitePluginConfig = {
			// 不设 false 的话，`loadConfig` 的 `Object.assign(defaults, inline, fileConfig)` 会让 uno.config.* 反过来覆盖
			configFile: false,
			virtualModulePrefix: unoPrefixForEntry(entry),
			content: { pipeline: { include: [pipelineIncludeForEntry(entry, root, sharedName, knownEntries)] } },
			presets: [presetStyle(mergeUnoOptions({}, envOptions))],
			inspector: entry === inspectEntry,
			// 当前页面没 import 到的那些入口实例，20s 后会误报 "Entry module not found"；
			// 会话级的检查由 router 自己补
			checkImport: false
		};

		const plugins = UnoCSS(config);
		const api = plugins.find(plugin => plugin.name === 'unocss:api')?.api as UnocssVitePluginAPI | undefined;
		instances.push({ entry, config, getContext: api?.getContext });
		return plugins;
	});

	return [
		createRouter({ root, knownEntries, instances, envOptions }),
		...created
	];
};
