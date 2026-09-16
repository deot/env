import type { Plugin } from 'vite';
import type { Options } from '@deot/dev-shared';
import { Locals } from '@deot/env-shared';
import {
	fileBelongsToEntry,
	generateUnoEntryCss,
	inferUnoEntry,
	isVirtualUnoId,
	parseUnoEntries,
	parseUnoEntry,
	FALLBACK_UNO_ENTRY,
	RESOLVED_UNO_BARE_ID,
	resolvedIdsForEntry,
	resolvedUnoEntryId,
	type UnoEntries
} from './utils';

/*
 * 按入口拆分 `virtual:uno.css`，避免三端共用一份官方生成结果。
 *
 * `resolveId` 拦截顺序：
 * 1. 带 `?entry=<name>` → `\0virtual:uno.css?entry=<name>`
 * 2. 不带 query，且 importer 目录命中 `entries` → `\0virtual:uno.css`（不改写 query）
 * 3. 多个入口都写无 query 的 `virtual:uno.css` 且推断结果不同 → 后来者改写为 `?entry=`
 * 4. 仍无法确定入口（无 `entries` 的单包）→ `\0virtual:uno.css`，扫描整个 root
 */
export default (options: Options): Plugin => {
	const locals = Locals.impl(options.workspace);
	const sharedName = locals.sharedPackageFolderName || 'shared';
	let root = locals.workspaceDir;
	let entries: UnoEntries | undefined;
	const resolvedEntries = new Set<string>();
	/*
	 * 无 query 的 `virtual:uno.css` 对应的入口。
	 * load 时靠模块 id 反查，不把 `?entry=` 写进业务源码。
	 */
	const inferredById = new Map<string, string>();

	/*
	 * Vite 解析后 id 可能带或不带 `\0`，两边都记一份。
	 */
	const rememberInferred = (id: string, entry: string) => {
		inferredById.set(id, entry);
		inferredById.set(id.replace(/^\0/, ''), entry);
	};

	/*
	 * 优先读显式 `?entry=`，否则用 importer 推断结果。
	 */
	const entryFromId = (id: string) => parseUnoEntry(id) || inferredById.get(id);

	/*
	 * 读取 `process.env.UNOCSS_ENTRIES`。
	 * `vite.config` 在 config 解析时注入，之后每次按需再读。
	 */
	const getEntries = () => {
		if (!entries || !Object.keys(entries).length) entries = parseUnoEntries();
		return entries;
	};

	/*
	 * 按入口名生成 CSS：`presetStyle(entries[entry])` + 扫描该入口（及 shared）源码。
	 */
	const generateCss = async (entry: string) => generateUnoEntryCss({
		entry,
		root,
		sharedName,
		entries: getEntries()
	});

	return {
		name: 'vite-plugin-uno-multiple-entry',
		enforce: 'pre',
		configResolved(config) {
			root = config.root;
			entries = parseUnoEntries();
		},
		async resolveId(id, importer) {
			const explicit = parseUnoEntry(id);
			if (explicit) {
				resolvedEntries.add(explicit);
				return resolvedUnoEntryId(explicit);
			}
			if (!isVirtualUnoId(id)) return;
			const inferred = inferUnoEntry(importer, root, getEntries()) || FALLBACK_UNO_ENTRY;
			resolvedEntries.add(inferred);
			const existed = inferredById.get(RESOLVED_UNO_BARE_ID);
			if (existed !== undefined && existed !== inferred) {
				return resolvedUnoEntryId(inferred);
			}
			rememberInferred(RESOLVED_UNO_BARE_ID, inferred);
			return RESOLVED_UNO_BARE_ID;
		},
		async load(id) {
			const entry = entryFromId(id);
			if (!entry) return;
			return {
				code: await generateCss(entry),
				map: { mappings: '' }
			};
		},
		handleHotUpdate({ file, server: devServer, modules }) {
			const affected = [...resolvedEntries].filter(entry => fileBelongsToEntry(file, entry, root, sharedName));
			if (!affected.length) return;

			const extra = [...new Set(affected)].flatMap((entry) => {
				return resolvedIdsForEntry(entry, inferredById).map((resolvedId) => {
					const mod = devServer.moduleGraph.getModuleById(resolvedId);
					if (mod) devServer.moduleGraph.invalidateModule(mod);
					return mod;
				});
			}).filter((mod): mod is NonNullable<typeof mod> => !!mod);

			if (!extra.length) return;
			return [...modules, ...extra];
		}
	};
};
