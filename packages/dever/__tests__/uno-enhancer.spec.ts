import type { Plugin, PluginOption } from 'vite';

import UnoEnhancer from '../src/plugins/uno-enhancer';
import createRouter from '../src/plugins/uno-enhancer/router';
import {
	inferUnoEntry,
	mergeUnoOptions,
	parseUnoEntries,
	parseUnoEntry,
	parseUnoEnvOptions,
	pipelineIncludeForEntry,
	unoPrefixForEntry,
	FALLBACK_UNO_ENTRY
} from '../src/plugins/uno-enhancer/utils';

const ROOT = '/app/src';

/*
 * router 只用到 `this.resolve`，这里给一个最小的桩：
 * 把「存在哪些官方实例」建模成一组已知的虚拟模块 id。
 */
const createResolveStub = (known: string[]) => {
	const calls: string[] = [];
	const context = {
		warn: () => {},
		resolve: (id: string) => {
			calls.push(id);
			return known.includes(id) ? { id } : null;
		}
	};
	return { context, calls };
};

const runResolveId = (plugin: Plugin, context: unknown, id: string, importer?: string) => {
	const resolveId = plugin.resolveId as (this: unknown, id: string, importer?: string) => Promise<string | undefined>;
	return resolveId.call(context, id, importer);
};

// @vitest-environment node
describe('uno-enhancer', () => {
	it('parseUnoEntry', () => {
		expect(parseUnoEntry('virtual:uno.css')).toBeUndefined();
		expect(parseUnoEntry('virtual:uno.css?entry=mobile')).toBe('mobile');
		expect(parseUnoEntry('\0virtual:uno.css?entry=manage')).toBe('manage');
		expect(parseUnoEntry('/@id/virtual:uno.css?entry=shared')).toBe('shared');
		expect(parseUnoEntry('virtual:uno.css?entry=mobile&t=1')).toBe('mobile');
		expect(parseUnoEntry('virtual:uno.css?entry=bad/name')).toBeUndefined();
	});

	it('inferUnoEntry uses importer folder when it matches entries', () => {
		const entries = { mobile: {}, manage: {}, shared: {} };
		expect(inferUnoEntry('/app/src/shared/examples/index.js', ROOT, entries)).toBe('shared');
		expect(inferUnoEntry('/app/src/mobile/index.js', ROOT, entries)).toBe('mobile');
		expect(inferUnoEntry('/app/src/unknown/index.js', ROOT, entries)).toBeUndefined();
		expect(inferUnoEntry(undefined, ROOT, entries)).toBeUndefined();
		expect(inferUnoEntry('/app/src/shared/examples/index.js', ROOT, {})).toBeUndefined();
	});

	it('unoPrefixForEntry keeps entries from swallowing each other', () => {
		expect(unoPrefixForEntry('mobile')).toBe('__uno-mobile');
		expect(unoPrefixForEntry(FALLBACK_UNO_ENTRY)).toBe('__uno-__root__');

		/*
		 * 官方按前缀拼出的 layer 正则是 `[/\\]<prefix>(?:_(.*?))?\.css$`。
		 * 用 `-` 分隔时入口 `a` 不会把 `a-b` 的模块当成自己的 layer。
		 */
		const layerRe = (entry: string) => new RegExp(`[/\\\\]${unoPrefixForEntry(entry)}(?:_(.*?))?\\.css$`);
		expect(layerRe('a').test(`/${unoPrefixForEntry('a')}.css`)).toBe(true);
		expect(layerRe('a').test(`/${unoPrefixForEntry('a-b')}.css`)).toBe(false);
		expect(layerRe('a-b').test(`/${unoPrefixForEntry('a')}.css`)).toBe(false);
	});

	it('pipelineIncludeForEntry scopes files to the entry (plus shared)', () => {
		const mobile = pipelineIncludeForEntry('mobile', ROOT, 'shared');

		expect(mobile.test('/app/src/mobile/index.js')).toBe(true);
		expect(mobile.test('/app/src/mobile/views/a.vue')).toBe(true);
		// Vue SFC 子请求带 query，glob 匹配不到，所以这里必须是 RegExp
		expect(mobile.test('/app/src/mobile/views/a.vue?vue&type=template')).toBe(true);
		expect(mobile.test('/app/src/shared/utils/index.ts')).toBe(true);
		expect(mobile.test('/app/src/shared/index.html')).toBe(true);

		expect(mobile.test('/app/src/manage/index.js')).toBe(false);
		expect(mobile.test('/app/src/mobile/styles/a.scss')).toBe(false);
		expect(mobile.test('/other/src/mobile/index.js')).toBe(false);

		// shared 自己不再额外带上 shared
		const shared = pipelineIncludeForEntry('shared', ROOT, 'shared');
		expect(shared.test('/app/src/shared/index.js')).toBe(true);
		expect(shared.test('/app/src/mobile/index.js')).toBe(false);

		// 兜底入口收下 root 里的所有源码
		const root = pipelineIncludeForEntry(FALLBACK_UNO_ENTRY, ROOT, 'shared');
		expect(root.test('/app/src/mobile/index.js')).toBe(true);
		expect(root.test('/app/src/whatever/a.vue')).toBe(true);
		expect(root.test('/other/src/a.vue')).toBe(false);
	});

	it('router resolves virtual uno css to the matching instance', async () => {
		const plugin = createRouter({ root: ROOT, entries: { mobile: {}, manage: {}, shared: {} } });
		const known = ['mobile', 'manage', 'shared', FALLBACK_UNO_ENTRY].map(i => `/${unoPrefixForEntry(i)}.css`);
		const { context } = createResolveStub(known);

		expect(await runResolveId(plugin, context, 'virtual:uno.css?entry=mobile')).toBe('/__uno-mobile.css');
		expect(await runResolveId(plugin, context, 'virtual:uno.css', '/app/src/shared/examples/index.js'))
			.toBe('/__uno-shared.css');
		expect(await runResolveId(plugin, context, 'virtual:uno.css', '/app/src/unknown/index.js'))
			.toBe('/__uno-__root__.css');
		expect(await runResolveId(plugin, context, 'virtual:uno.css')).toBe('/__uno-__root__.css');
		expect(await runResolveId(plugin, context, 'virtual:other.css')).toBeUndefined();
	});

	it('router falls back when the requested entry has no instance', async () => {
		const plugin = createRouter({ root: ROOT, entries: { mobile: {} } });
		const { context, calls } = createResolveStub([`/${unoPrefixForEntry(FALLBACK_UNO_ENTRY)}.css`]);

		expect(await runResolveId(plugin, context, 'virtual:uno.css?entry=typo')).toBe('/__uno-__root__.css');
		expect(calls).toEqual(['/__uno-typo.css', '/__uno-__root__.css']);
	});

	it('UnoEnhancer defers reading UNOCSS_ENTRIES until vite flattens plugins', async () => {
		const prev = process.env.UNOCSS_ENTRIES;
		delete process.env.UNOCSS_ENTRIES;
		try {
			// 工厂阶段还没读 env —— vite.config.js 要到 loadConfigFromFile 之后才执行
			const deferred = UnoEnhancer({ workspace: 'packages' });
			process.env.UNOCSS_ENTRIES = JSON.stringify({
				mobile: { unit: 'rem', scale: 2 },
				manage: { unit: 'px', scale: 1 }
			});

			const plugins = (await deferred) as PluginOption[];
			expect(Array.isArray(plugins)).toBe(true);
			expect((plugins[0] as Plugin).name).toBe('vite-plugin-uno-entry-router');
			// mobile + manage + __root__
			expect(plugins.length).toBe(4);
		} finally {
			if (prev === undefined) delete process.env.UNOCSS_ENTRIES;
			else process.env.UNOCSS_ENTRIES = prev;
		}
	});

	it('UnoEnhancer mounts a single official instance without UNOCSS_ENTRIES', async () => {
		const prev = process.env.UNOCSS_ENTRIES;
		delete process.env.UNOCSS_ENTRIES;
		try {
			const plugins = (await UnoEnhancer({ workspace: 'packages' })) as Plugin[];
			expect(plugins.some(i => i.name === 'vite-plugin-uno-entry-router')).toBe(false);
			expect(plugins.some(i => i.name.startsWith('unocss:'))).toBe(true);
		} finally {
			if (prev === undefined) delete process.env.UNOCSS_ENTRIES;
			else process.env.UNOCSS_ENTRIES = prev;
		}
	});

	it('parseUnoEnvOptions / parseUnoEntries / mergeUnoOptions', () => {
		expect(parseUnoEnvOptions(undefined)).toEqual({});
		expect(parseUnoEnvOptions('{')).toEqual({});
		expect(parseUnoEnvOptions('{"scale":2}')).toEqual({ scale: 2 });
		expect(parseUnoEntries(undefined)).toEqual({});
		expect(parseUnoEntries('{')).toEqual({});
		expect(parseUnoEntries('{"mobile":{"unit":"rem"}}')).toEqual({
			mobile: { unit: 'rem' }
		});
		expect(mergeUnoOptions({ unit: 'rem', scale: 2 }, { scale: 1 })).toEqual({
			unit: 'rem',
			scale: 1
		});
	});
});
