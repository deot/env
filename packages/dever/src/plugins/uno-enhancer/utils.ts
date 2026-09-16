import * as path from 'node:path';

const ENTRY_NAME_RE = /^[\w-]+$/;
const SOURCE_EXT_RE_SOURCE = '(?:vue|[jt]sx?|html)';

export const VIRTUAL_UNO_ID = 'virtual:uno.css';
/*
 * 无法从 `?entry=` / importer 推断时的兜底入口名。
 * 表示扫描整个 root，而不是某一个包目录。
 */
export const FALLBACK_UNO_ENTRY = '__root__';

export type UnoEntryOptions = Record<string, unknown>;
/*
 * `process.env.UNOCSS_ENTRIES` 里按包名划分的 `presetStyle` 选项。
 * 例如 `{ mobile: { unit: 'rem', scale: 2 } }`。
 */
export type UnoEntries = Record<string, UnoEntryOptions>;

/*
 * 解析进程级 `UNOCSS_OPTIONS`，用作所有入口的全局覆盖。
 */
export const parseUnoEnvOptions = (value = process.env.UNOCSS_OPTIONS): UnoEntryOptions => {
	if (value === undefined) return {};
	try {
		const parsed = JSON.parse(value);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		return parsed as UnoEntryOptions;
	} catch {
		return {};
	}
};

/*
 * 解析 `process.env.UNOCSS_ENTRIES`。
 * 由 `vite.config` 注入，key 为入口名。
 */
export const parseUnoEntries = (value = process.env.UNOCSS_ENTRIES): UnoEntries => {
	if (value === undefined) return {};
	try {
		const parsed = JSON.parse(value);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		return parsed as UnoEntries;
	} catch {
		return {};
	}
};

/*
 * 入口配置与 `UNOCSS_OPTIONS` 合并，环境变量覆盖 `entries`。
 */
export const mergeUnoOptions = (
	entryOptions: UnoEntryOptions = {},
	envOptions: UnoEntryOptions = {}
): UnoEntryOptions => ({
	...entryOptions,
	...envOptions
});

/*
 * 去掉 Vite `\0` / `/@id/` 前缀，拆出 pathname 与 search。
 */
export const normalizeUnoId = (id: string) => {
	const normalized = id
		.replace(/^\0/, '')
		.replace(/^\/@id\/__x00__/, '')
		.replace(/^\/@id\//, '');
	const qIndex = normalized.indexOf('?');
	return {
		pathname: (qIndex === -1 ? normalized : normalized.slice(0, qIndex)).replace(/^\//, ''),
		search: qIndex === -1 ? '' : normalized.slice(qIndex + 1)
	};
};

/*
 * 是否为 `virtual:uno.css`（可带任意 query）。
 */
export const isVirtualUnoId = (id: string) => normalizeUnoId(id).pathname === VIRTUAL_UNO_ID;

/*
 * 从 `virtual:uno.css?entry=<name>` 取出入口名。
 * 无 query 或非法 name 返回 undefined。
 */
export const parseUnoEntry = (id: string) => {
	const { pathname, search } = normalizeUnoId(id);
	if (pathname !== VIRTUAL_UNO_ID) return;
	const entry = new URLSearchParams(search).get('entry') || '';
	return ENTRY_NAME_RE.test(entry) ? entry : undefined;
};

/*
 * 无 `?entry=` 时按 importer 推断入口：
 * 相对 root 的第一段目录名必须出现在 `entries`（或 known 列表）里。
 * `shared/examples/index.js` → `shared`；对不上则返回 undefined，由调用方走兜底入口。
 */
export const inferUnoEntry = (
	importer: string | undefined,
	root: string,
	known: UnoEntries | string[]
) => {
	if (!importer) return;
	const names = Array.isArray(known) ? known : Object.keys(known);
	if (!names.length) return;
	const rel = path.relative(root, importer.split('?')[0]);
	if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return;
	const top = rel.split(path.sep)[0];
	return names.includes(top) ? top : undefined;
};

/*
 * 入口对应的官方 `virtualModulePrefix`，让每个 UnoCSS 实例拿到互不重叠的虚拟模块 id。
 *
 * 分隔符用 `-` 而不是 `_`：官方按前缀拼出的 `RESOLVED_ID_RE` 是
 * `[/\\]__uno-a(?:_(.*?))?\.css$`，其中 `(_.*?)` 是 layer 名。
 * 用 `-` 时入口 `a` 不会误吞 `__uno-a-b.css`（`-b` 匹配不上 `(_.*?)`）；
 * 若用 `_`，入口 `a` 会把入口 `a_b` 的模块当成自己的 `b` layer。
 */
export const unoPrefixForEntry = (entry: string) => `__uno-${entry}`;

const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/*
 * root 归一成 `/` 分隔后转义，再把分隔符放宽成 `[/\\]`，
 * 这样 Windows 下 `C:/app/src/...` 与 `C:\app\src\...` 都能命中。
 */
const rootPattern = (root: string) => escapeRe(
	root.replace(/\\/g, '/').replace(/\/+$/, '')
).replace(/\//g, '[/\\\\]');

/*
 * 入口的 `content.pipeline.include`：由它决定「哪些文件属于这个入口」，
 * 取代原先自己写的 `fileBelongsToEntry`。
 *
 * 必须是 RegExp 而不能用 glob：Vue SFC 的子请求 id 形如
 * `a.vue?vue&type=template`，glob 匹配不到（官方默认 include 同样是带 `($|\?)` 的 RegExp）。
 *
 * 非 shared 入口额外带上 shared 目录，保证公共 class 也能按本入口的配置生成。
 */
export const pipelineIncludeForEntry = (
	entry: string,
	root: string,
	sharedName = 'shared'
) => {
	const dirs = entry === FALLBACK_UNO_ENTRY
		? []
		: entry === sharedName ? [entry] : [entry, sharedName];
	const scope = dirs.length ? `(?:${dirs.map(escapeRe).join('|')})[/\\\\]` : '';
	return new RegExp(`^${rootPattern(root)}[/\\\\]${scope}.*\\.${SOURCE_EXT_RE_SOURCE}($|\\?)`);
};
