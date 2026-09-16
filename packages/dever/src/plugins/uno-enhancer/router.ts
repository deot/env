import type { Plugin } from 'vite';
import type { UnocssPluginContext } from '@unocss/core';
import type { VitePluginConfig } from 'unocss/vite';
import { presetStyle } from '@deot/style-unocss';
import {
	inferUnoEntry,
	mergeUnoOptions,
	parseUnoQueryOptions,
	parseVirtualUnoId,
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
	 * 首次带配置的 import 决定该实例的配置。
	 * 两个不同文件给同一个包配了不同选项属于配置冲突，直接抛错 —— 静默取首次会产出极难诊断的 CSS。
	 *
	 * 但同一个文件改了自己的 query 是正常编辑：HMR 会重新解析该模块的每一行 import，
	 * 此时 signature 变了却不是冲突，按「更新」重新绑定。
	 * （query 被整个删掉时 `hasOptions` 为 false，这里收不到通知，实例会留着旧配置 —— 需要重启。）
	 */
	const bind = (instance: UnoInstance, queryOptions: UnoEntryOptions, importer: string) => {
		const signature = unoOptionsSignature(queryOptions);
		const previous = bound.get(instance.entry);

		if (previous) {
			if (previous.signature === signature) return previous.done;
			if (previous.importer !== importer) {
				throw new Error(
					`入口 "${instance.entry}" 被配置了两套不同的 UnoCSS 选项：\n`
					+ `  ${previous.importer}\n`
					+ `  ${importer}\n`
					+ `同一个包内只能有一处 virtual:uno.css 配置 query`
				);
			}
		}

		const done = (async () => {
			if (!instance.getContext) return;
			const ctx = instance.getContext();
			await ctx.ready;
			instance.config.presets = [presetStyle(mergeUnoOptions(queryOptions, envOptions))];
			// reloadConfig 会 tokens.clear() 并用新配置重新提取已缓存模块，与官方处理配置文件变更同路径
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
			const virtual = parseVirtualUnoId(id);
			if (!virtual) return;
			resolvedAny = true;
			clearWarnTimer();

			const source = importer || id;
			const query = parseUnoQueryOptions(id);
			const warnOnce = (key: string, message: string) => {
				if (warned.has(key)) return;
				warned.add(key);
				this.warn(message);
			};

			for (const warning of [...virtual.warnings, ...query.warnings]) {
				warnOnce(`${source}|${warning}`, `[${source}] ${warning}`);
			}

			/*
			 * 先把最终入口定下来再绑定配置 —— 否则 `?entry=typo&unit=rem` 会在回退时
			 * 把 `unit=rem` 一起丢掉。
			 *
			 * `?entry=` 指的包不存在时按同一条链继续往下找（importer 目录 → 兜底），
			 * 而不是直接跳到 `__root__`：兜底实例的 `pipeline.include` 排除了各包目录，
			 * 直接跳过去会让 importer 自己的 class 一个都不在生成结果里。
			 */
			const inferred = inferUnoEntry(importer, root, knownEntries);
			let entry = query.entry || inferred || FALLBACK_UNO_ENTRY;
			if (!byEntry.has(entry)) {
				const next = (inferred && byEntry.has(inferred)) ? inferred : FALLBACK_UNO_ENTRY;
				warnOnce(
					`missing-instance|${entry}`,
					`入口 "${entry}" 没有对应的 UnoCSS 实例，已回退到 ${next}`
				);
				entry = next;
			}
			const instance = byEntry.get(entry);

			if (query.hasOptions && instance) {
				const overridden = Object.keys(query.options).filter(key => key in envOptions);
				if (overridden.length) {
					warnOnce(
						`env-override|${entry}|${overridden.join(',')}`,
						`UNOCSS_OPTIONS 覆盖了入口 "${entry}" query 里的 ${overridden.join(' / ')}，`
						+ `多入口差异会被抹平`
					);
				}
				// bind 的冲突错误交给 this.error，让 Vite 在 dev overlay 里显示
				try {
					await bind(instance, query.options, source);
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
			 *
			 * layer 形式沿用官方的 `${prefix}_${layer}.css`。
			 */
			const suffix = virtual.layer ? `_${virtual.layer}` : '';
			const resolved = await this.resolve(
				`/${unoPrefixForEntry(entry)}${suffix}.css`,
				importer,
				{ skipSelf: true }
			);
			return resolved?.id;
		}
	};
};
