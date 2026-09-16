import type { Plugin } from 'vite';
import type { UnocssPluginContext } from '@unocss/core';
import type { VitePluginConfig } from 'unocss/vite';
import { presetStyle } from '@deot/style-unocss';
import {
	inferUnoEntry,
	isVirtualUnoId,
	mergeUnoOptions,
	parseUnoQueryOptions,
	unoOptionsSignature,
	unoPrefixForEntry,
	FALLBACK_UNO_ENTRY,
	VIRTUAL_UNO_ID,
	type UnoEntryOptions
} from './utils';

const WARN_TIMEOUT = 20000;

export interface UnoInstance {
	entry: string;
	/*
	 * 传给 `UnoCSS()` 的 inline 对象本身。
	 * `configFile: false` 时官方 `loadConfig` 会直接 `return { config: inlineConfig }`（不拷贝），
	 * 所以改这个对象再 `reloadConfig()` 就能换掉该实例的配置。
	 */
	config: VitePluginConfig;
	getContext?: () => UnocssPluginContext<VitePluginConfig>;
}

interface Bound {
	signature: string;
	importer: string;
	done: Promise<void>;
}

/*
 * 把 `virtual:uno.css` 路由到对应入口的官方 UnoCSS 实例，并把 query 上的配置绑定给它。
 *
 * 每个实例都用不同的 `virtualModulePrefix`（见 `unoPrefixForEntry`），
 * 所以 `/__uno-mobile.css` 只会被 mobile 那个实例认领：
 * 其余实例的 `RESOLVED_ID_WITH_QUERY_RE` 前缀不同，而官方的
 * `VIRTUAL_ENTRY_ALIAS`（`/^(?:virtual:)?uno(?::(.+))?\.css(\?.*)?$/`）
 * 要求以 `uno` / `virtual:uno` 开头，`/__uno-mobile.css` 不匹配。
 *
 * 入口判定顺序：显式 `?entry=` > importer 相对 root 的首段目录 > 兜底 `__root__`。
 *
 * 配置只能延迟绑定：Vite 的插件数组在 `asyncFlatten` 之后就冻结了，
 * 实例必须在任何模块被解析之前建好，而 query 要到 `resolveId` 才可见。
 * 好在 `resolveId` 严格早于 `load`，这里把绑定 await 掉即可。
 */
export default (options: {
	root: string;
	knownEntries: string[];
	instances: UnoInstance[];
	envOptions: UnoEntryOptions;
}): Plugin => {
	const { knownEntries, instances, envOptions } = options;
	let root = options.root;

	const byEntry = new Map(instances.map(instance => [instance.entry, instance]));
	const bound = new Map<string, Bound>();
	/*
	 * 同一个 import 会被解析不止一次（依赖预扫描、HMR 重解析），
	 * 去重避免同一条诊断刷屏。
	 */
	const warned = new Set<string>();
	let resolvedAny = false;
	let warnTimer: ReturnType<typeof setTimeout> | undefined;

	const clearWarnTimer = () => {
		if (!warnTimer) return;
		clearTimeout(warnTimer);
		warnTimer = undefined;
	};

	/*
	 * 实例级的 `checkImport` 必须保持 false（当前页面没 import 到的入口实例会误报），
	 * 但「整个项目忘了 import virtual:uno.css」是个真实场景，这里补一个会话级检查。
	 */
	const startWarnTimer = () => {
		if (warnTimer || process.env.TEST || process.env.NODE_ENV === 'test') return;
		warnTimer = setTimeout(() => {
			if (!resolvedAny) console.warn(`[uno] 没有任何模块 import 过 '${VIRTUAL_UNO_ID}'，UnoCSS 不会产出任何样式`);
		}, WARN_TIMEOUT);
		// 不要因为这个诊断定时器把 dev 进程钉住
		warnTimer.unref?.();
	};

	/*
	 * 首次带配置的 import 决定该实例的配置，之后不再变。
	 * 同一个包里出现第二套不同配置属于配置冲突，直接抛错 —— 静默取首次会产出极难诊断的 CSS。
	 */
	const bind = (instance: UnoInstance, queryOptions: UnoEntryOptions, importer: string) => {
		const signature = unoOptionsSignature(queryOptions);
		const previous = bound.get(instance.entry);

		if (previous) {
			if (previous.signature === signature) return previous.done;
			throw new Error(
				`入口 "${instance.entry}" 被配置了两套不同的 UnoCSS 选项：\n`
				+ `  ${previous.importer}\n`
				+ `  ${importer}\n`
				+ `同一个包内只能有一处 virtual:uno.css 配置 query`
			);
		}

		const done = (async () => {
			if (!instance.getContext) return;
			const ctx = instance.getContext();
			await ctx.ready;
			instance.config.presets = [presetStyle(mergeUnoOptions(queryOptions, envOptions))];
			await ctx.reloadConfig();
		})();

		bound.set(instance.entry, { signature, importer, done });
		return done;
	};

	return {
		name: 'vite-plugin-uno-entry-router',
		// 必须排在所有官方实例之前；同为 pre 时按插件数组顺序
		enforce: 'pre',
		configResolved(config) {
			root = config.root;
		},
		configureServer() {
			startWarnTimer();
		},
		buildEnd() {
			clearWarnTimer();
		},
		async resolveId(id, importer) {
			if (!isVirtualUnoId(id)) return;
			resolvedAny = true;
			clearWarnTimer();

			const query = parseUnoQueryOptions(id);
			for (const warning of query.warnings) {
				const key = `${importer || id}|${warning}`;
				if (warned.has(key)) continue;
				warned.add(key);
				this.warn(`[${importer || id}] ${warning}`);
			}

			const entry = query.entry
				|| inferUnoEntry(importer, root, knownEntries)
				|| FALLBACK_UNO_ENTRY;
			const instance = byEntry.get(entry);

			if (query.hasOptions && instance) {
				const overridden = Object.keys(query.options).filter(key => key in envOptions);
				const key = `${entry}|${overridden.join(',')}`;
				if (overridden.length && !warned.has(key)) {
					warned.add(key);
					this.warn(
						`UNOCSS_OPTIONS 覆盖了入口 "${entry}" query 里的 ${overridden.join(' / ')}，`
						+ `多入口差异会被抹平`
					);
				}
				// bind 的冲突错误交给 this.error，让 Vite 在 dev overlay 里显示
				try {
					await bind(instance, query.options, importer || id);
				} catch (error) {
					return this.error(error instanceof Error ? error.message : String(error));
				}
			}

			/*
			 * 必须交回官方实例自己 resolveId：
			 * dev 态靠它往内部 `entries` 登记模块（HMR 失效要用），
			 * build 态靠它往 `vfsLayers` 登记，否则 load 会直接 `this.error`。
			 *
			 * 也不能带 query：官方 `resolveLayer` 用的 `RESOLVED_ID_RE` 不含 `(\?.*)?`，
			 * 带 query 会导致 resolveId 阶段登记不上、load 阶段却又能匹配。
			 */
			const resolved = await this.resolve(`/${unoPrefixForEntry(entry)}.css`, importer, { skipSelf: true });
			if (resolved) return resolved.id;

			if (entry === FALLBACK_UNO_ENTRY) return;
			this.warn(`入口 "${entry}" 没有对应的 UnoCSS 实例，已回退到 ${FALLBACK_UNO_ENTRY}`);
			return (await this.resolve(`/${unoPrefixForEntry(FALLBACK_UNO_ENTRY)}.css`, importer, { skipSelf: true }))?.id;
		}
	};
};
