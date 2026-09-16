import * as path from 'node:path';

const SOURCE_EXT_RE_SOURCE = '(?:vue|[jt]sx?|html)';

/*
 * 入口名同时用作官方 `virtualModulePrefix`，而官方会把它原样插进 `new RegExp()`，
 * 所以必须是白名单字符，否则 `.`、`*` 之类会变成正则元字符，让实例互相认领模块。
 */
export const ENTRY_NAME_RE = /^[\w-]+$/;

export const VIRTUAL_UNO_ID = 'virtual:uno.css';
/*
 * importer 不在任何包目录下时的兜底入口名。
 */
export const FALLBACK_UNO_ENTRY = '__root__';

export type UnoEntryOptions = Record<string, unknown>;

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
 * import query 上的配置与 `UNOCSS_OPTIONS` 合并，环境变量覆盖 query。
 */
export const mergeUnoOptions = (
	queryOptions: UnoEntryOptions = {},
	envOptions: UnoEntryOptions = {}
): UnoEntryOptions => ({
	...queryOptions,
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
 * `PresetStyleOptions` 里能用 query 表达的参数。
 * query 取出来全是字符串，必须按类型转换：`scale=2` 直接透传会变成 `'2'`，
 * 而 `presetStyle` 要求 scale 是有限数字，字符串会静默退回默认值。
 * `dark` 的对象形式 query 表达不了，只支持两个枚举值。
 */
const STRING_OPTION_KEYS = ['prefix', 'unit'];
const BOOLEAN_OPTION_KEYS = ['reset', 'variants', 'attributifyPseudo', 'arbitraryVariants'];
const DARK_OPTION_VALUES = ['class', 'media'];
/*
 * Vite 自己会往 id 上挂的 query（HMR 时间戳等），不算未知参数。
 */
const VITE_QUERY_KEYS = new Set(['t', 'v', 'import', 'direct', 'inline', 'used', 'raw', 'url', 'worker']);

export interface UnoQueryResult {
	/* 显式指定的入口名；非法时为 undefined 并记一条 warning */
	entry?: string;
	/* 解析后的 presetStyle 选项；没有任何配置参数时为空对象 */
	options: UnoEntryOptions;
	/* 是否出现过配置参数 —— 决定要不要触发实例绑定 */
	hasOptions: boolean;
	warnings: string[];
}

/*
 * 解析 `virtual:uno.css?unit=rem&scale=2` 这类 query。
 * 不认识或格式不对的参数只记 warning 并忽略，不抛错。
 */
export const parseUnoQueryOptions = (id: string): UnoQueryResult => {
	const { search } = normalizeUnoId(id);
	const options: UnoEntryOptions = {};
	const warnings: string[] = [];
	let entry: string | undefined;

	if (!search) return { entry, options, hasOptions: false, warnings };

	for (const [key, value] of new URLSearchParams(search)) {
		if (VITE_QUERY_KEYS.has(key)) continue;

		if (key === 'entry') {
			if (ENTRY_NAME_RE.test(value)) entry = value;
			else warnings.push(`entry=${JSON.stringify(value)} 不是合法入口名（只允许 ${ENTRY_NAME_RE.source}），已忽略`);
			continue;
		}

		if (STRING_OPTION_KEYS.includes(key)) {
			options[key] = value;
			continue;
		}

		if (BOOLEAN_OPTION_KEYS.includes(key)) {
			// `?reset` 这种无值写法按 true 处理
			if (value === '' || value === 'true') options[key] = true;
			else if (value === 'false') options[key] = false;
			else warnings.push(`${key}=${JSON.stringify(value)} 不是布尔值（true / false），已忽略`);
			continue;
		}

		if (key === 'scale') {
			const scale = Number(value);
			if (value !== '' && Number.isFinite(scale)) options[key] = scale;
			else warnings.push(`scale=${JSON.stringify(value)} 不是有限数字，已忽略`);
			continue;
		}

		if (key === 'dark') {
			if (DARK_OPTION_VALUES.includes(value)) options[key] = value;
			else warnings.push(`dark=${JSON.stringify(value)} 只支持 ${DARK_OPTION_VALUES.join(' / ')}，已忽略`);
			continue;
		}

		warnings.push(`未知参数 ${key}=${JSON.stringify(value)}，已忽略`);
	}

	return { entry, options, hasOptions: !!Object.keys(options).length, warnings };
};

/*
 * 配置的可比较指纹，用于判断同一个包里两处 import 写的是不是同一套配置。
 */
export const unoOptionsSignature = (options: UnoEntryOptions) => JSON.stringify(
	Object.keys(options).sort().map(key => [key, options[key]])
);

/*
 * 按 importer 推断入口：相对 root 的第一段目录名必须是已知入口。
 * `shared/examples/index.js` → `shared`；对不上则返回 undefined，由调用方走兜底入口。
 */
export const inferUnoEntry = (
	importer: string | undefined,
	root: string,
	known: string[]
) => {
	if (!importer || !known.length) return;
	const rel = path.relative(root, importer.split('?')[0]);
	if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return;
	const top = rel.split(path.sep)[0];
	return known.includes(top) ? top : undefined;
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
 * 入口的 `content.pipeline.include`：由它决定「哪些文件属于这个入口」。
 *
 * 必须是 RegExp 而不能用 glob：Vue SFC 的子请求 id 形如
 * `a.vue?vue&type=template`，glob 匹配不到（官方默认 include 同样是带 `($|\?)` 的 RegExp）。
 *
 * - 普通入口：自身目录 +（非 shared 时）shared 目录
 * - 兜底入口：root 下「首段目录不属于任何已知入口」的文件，外加 shared。
 *   不能放成整个 root —— 那样每个文件都会被兜底实例再提取一遍，
 *   而它通常根本没人 import。
 */
export const pipelineIncludeForEntry = (
	entry: string,
	root: string,
	sharedName = 'shared',
	knownEntries: string[] = []
) => {
	const base = `^${rootPattern(root)}[/\\\\]`;
	const tail = `.*\\.${SOURCE_EXT_RE_SOURCE}($|\\?)`;

	if (entry === FALLBACK_UNO_ENTRY) {
		const excluded = knownEntries.filter(name => name !== sharedName).map(escapeRe);
		const guard = excluded.length ? `(?!(?:${excluded.join('|')})[/\\\\])` : '';
		return new RegExp(`${base}${guard}${tail}`);
	}

	const dirs = entry === sharedName ? [entry] : [entry, sharedName];
	return new RegExp(`${base}(?:${dirs.map(escapeRe).join('|')})[/\\\\]${tail}`);
};
