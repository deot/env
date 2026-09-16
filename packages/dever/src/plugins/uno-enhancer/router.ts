import type { Plugin } from 'vite';
import {
	inferUnoEntry,
	isVirtualUnoId,
	parseUnoEntry,
	unoPrefixForEntry,
	FALLBACK_UNO_ENTRY,
	type UnoEntries
} from './utils';

/*
 * 把 `virtual:uno.css` 路由到对应入口的官方 UnoCSS 实例。
 *
 * 每个实例都用不同的 `virtualModulePrefix`（见 `unoPrefixForEntry`），
 * 所以 `/__uno-mobile.css` 只会被 mobile 那个实例认领：
 * 其余实例的 `RESOLVED_ID_WITH_QUERY_RE` 前缀不同，而官方的
 * `VIRTUAL_ENTRY_ALIAS`（`/^(?:virtual:)?uno(?::(.+))?\.css(\?.*)?$/`）
 * 要求以 `uno` / `virtual:uno` 开头，`/__uno-mobile.css` 不匹配。
 *
 * 入口判定顺序：
 * 1. 显式 `?entry=<name>`
 * 2. importer 相对 root 的首段目录命中 `entries`（`shared/examples/index.js` → `shared`）
 * 3. 兜底 `__root__`
 */
export default (options: {
	root: string;
	entries: UnoEntries;
}): Plugin => {
	let root = options.root;
	const { entries } = options;

	return {
		name: 'vite-plugin-uno-entry-router',
		// 必须排在所有官方实例之前；同为 pre 时按插件数组顺序
		enforce: 'pre',
		configResolved(config) {
			root = config.root;
		},
		async resolveId(id, importer) {
			if (!isVirtualUnoId(id)) return;

			const entry = parseUnoEntry(id)
				|| inferUnoEntry(importer, root, entries)
				|| FALLBACK_UNO_ENTRY;

			/*
			 * 这里不能直接返回拼好的 id，必须交回官方实例自己 resolveId：
			 * dev 态靠它往内部 `entries` 登记模块（HMR 失效要用），
			 * build 态靠它往 `vfsLayers` 登记，否则 load 会直接 `this.error`。
			 *
			 * 也不能带 query：官方 `resolveLayer` 用的 `RESOLVED_ID_RE` 不含 `(\?.*)?`，
			 * 带 query 会导致 resolveId 阶段登记不上、load 阶段却又能匹配。
			 */
			const resolved = await this.resolve(`/${unoPrefixForEntry(entry)}.css`, importer, { skipSelf: true });
			if (resolved) return resolved.id;

			if (entry === FALLBACK_UNO_ENTRY) return;
			this.warn(`[uno-entry-router] no UnoCSS instance for entry "${entry}", fallback to ${FALLBACK_UNO_ENTRY}`);
			return (await this.resolve(`/${unoPrefixForEntry(FALLBACK_UNO_ENTRY)}.css`, importer, { skipSelf: true }))?.id;
		}
	};
};
