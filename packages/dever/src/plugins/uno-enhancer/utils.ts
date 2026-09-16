import fs from 'fs-extra';
import * as path from 'node:path';
import { createGenerator } from 'unocss';
import { presetStyle } from '@deot/style-unocss';

const IGNORE_DIR_RE = /(?:^|[/\\])(?:node_modules|dist|\.git|\.temp)(?:[/\\]|$)/;
const ENTRY_NAME_RE = /^[\w-]+$/;

export const VIRTUAL_UNO_ID = 'virtual:uno.css';
export const SCAN_RE = /\.(?:vue|[jt]sx?|html)$/;
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
 * 无 query 导入对应的内部模块 id。
 * 避免把业务源码改写成 `?entry=`。
 */
export const RESOLVED_UNO_BARE_ID = `\0${VIRTUAL_UNO_ID}`;
/*
 * 显式 `?entry=` 的内部模块 id，用来拆开不同入口。
 */
export const resolvedUnoEntryId = (entry: string) => `\0${VIRTUAL_UNO_ID}?entry=${entry}`;

/*
 * HMR 时该入口可能同时存在 query 模块和无 query 模块，都要失效。
 */
export const resolvedIdsForEntry = (entry: string, inferred: Map<string, string>) => {
	const ids = [resolvedUnoEntryId(entry)];
	for (const [id, name] of inferred) {
		if (name === entry && !ids.includes(id)) ids.push(id);
	}
	return ids;
};

/*
 * 文件是否属于该入口的扫描范围：
 * 入口自己的目录，或其它入口引用的 shared。
 */
export const fileBelongsToEntry = (
	file: string,
	entry: string,
	root: string,
	sharedName = 'shared'
) => {
	if (entry === FALLBACK_UNO_ENTRY) {
		const rel = path.relative(root, file.split('?')[0]);
		return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
	}
	const rel = path.relative(root, file.split('?')[0]);
	if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
	const top = rel.split(path.sep)[0];
	return top === entry || (top === sharedName && entry !== sharedName);
};

/*
 * 递归收集可扫描源文件（vue / ts / js / html），跳过 node_modules / dist 等。
 */
export const collectScanFiles = (dir: string, acc: string[] = []) => {
	if (!fs.existsSync(dir)) return acc;
	const names = fs.readdirSync(dir);
	for (let i = 0; i < names.length; i++) {
		const full = path.join(dir, names[i]);
		if (IGNORE_DIR_RE.test(full)) continue;
		const stat = fs.statSync(full);
		if (stat.isDirectory()) {
			collectScanFiles(full, acc);
			continue;
		}
		if (SCAN_RE.test(names[i])) acc.push(full);
	}
	return acc;
};

/*
 * 某入口要扫描的目录：自身 +（非 shared 时）shared，保证公共 class 也能生成。
 */
export const sourcesForEntry = (entry: string, root: string, sharedName: string) => {
	if (entry === FALLBACK_UNO_ENTRY) return collectScanFiles(root, []);
	const dirs = [path.resolve(root, entry)];
	if (entry !== sharedName) dirs.push(path.resolve(root, sharedName));
	const files: string[] = [];
	for (let i = 0; i < dirs.length; i++) {
		collectScanFiles(dirs[i], files);
	}
	return files;
};

/*
 * 用 `entries[entry]`（可被 `UNOCSS_OPTIONS` 覆盖）建生成器，扫描该入口源码后产出 CSS。
 */
export const generateUnoEntryCss = async ({
	entry,
	root,
	sharedName = 'shared',
	entries = {},
	envOptions = parseUnoEnvOptions()
}: {
	entry: string;
	root: string;
	sharedName?: string;
	entries?: UnoEntries;
	envOptions?: UnoEntryOptions;
}) => {
	if (entry !== FALLBACK_UNO_ENTRY && Object.keys(entries).length && !(entry in entries)) {
		console.warn(`[uno-multiple-entry] missing entries.${entry} in UNOCSS_ENTRIES, fallback to {}`);
	}
	const uno = await createGenerator({
		presets: [
			presetStyle(mergeUnoOptions(entries[entry] || {}, envOptions))
		]
	});
	const files = sourcesForEntry(entry, root, sharedName);
	const code = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
	const result = await uno.generate(code, { minify: false });
	return result.css;
};
