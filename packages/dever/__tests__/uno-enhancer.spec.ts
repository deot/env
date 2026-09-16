import type { Plugin } from 'vite';
import { Locals } from '@deot/env-shared';

import UnoEnhancer from '../src/plugins/uno-enhancer';
import createRouter, { type UnoInstance } from '../src/plugins/uno-enhancer/router';
import {
	inferUnoEntry,
	mergeUnoOptions,
	parseUnoEnvOptions,
	parseUnoQueryOptions,
	parseVirtualUnoId,
	pipelineIncludeForEntry,
	unoOptionsSignature,
	unoPrefixForEntry,
	FALLBACK_UNO_ENTRY
} from '../src/plugins/uno-enhancer/utils';

const ROOT = '/app/src';
const KNOWN = ['mobile', 'manage', 'shared'];

/*
 * router 只用到 `this.resolve` / `this.warn` / `this.error`，这里给一个最小的桩。
 * 「存在哪些官方实例」建模成一组已知的虚拟模块 id。
 */
const createStub = (known: string[] = KNOWN.concat(FALLBACK_UNO_ENTRY)) => {
	const resolved: string[] = [];
	const warnings: string[] = [];
	const ids = known.map(i => `/${unoPrefixForEntry(i)}.css`);
	const context = {
		warn: (message: string) => warnings.push(message),
		error: (message: string) => { throw new Error(message); },
		resolve: (id: string) => {
			resolved.push(id);
			return ids.includes(id) ? { id } : null;
		}
	};
	return { context, resolved, warnings };
};

/*
 * 模拟官方实例：记录 reloadConfig 被调用的次数，以及调用时 config.presets 是否已被换掉。
 */
const createInstances = (entries: string[]) => {
	const reloads: string[] = [];
	const instances: UnoInstance[] = entries.map((entry) => {
		const config = { presets: ['default'] } as never as UnoInstance['config'];
		return {
			entry,
			config,
			getContext: () => ({
				ready: Promise.resolve(),
				reloadConfig: async () => { reloads.push(entry); }
			})
		} as never as UnoInstance;
	});
	return { instances, reloads };
};

const runResolveId = (plugin: Plugin, context: unknown, id: string, importer?: string) => {
	const resolveId = plugin.resolveId as (this: unknown, id: string, importer?: string) => Promise<string | undefined>;
	return resolveId.call(context, id, importer);
};

// @vitest-environment node
describe('uno-enhancer', () => {
	it('parseUnoQueryOptions converts types instead of passing strings through', () => {
		// scale 直接透传会变成 '2'，presetStyle 要的是有限数字
		expect(parseUnoQueryOptions('virtual:uno.css?unit=rem&scale=2')).toMatchObject({
			options: { unit: 'rem', scale: 2 },
			hasOptions: true,
			warnings: []
		});
		expect(parseUnoQueryOptions('virtual:uno.css?reset=false&variants=true'))
			.toMatchObject({ options: { reset: false, variants: true } });
		// 无值写法按 true
		expect(parseUnoQueryOptions('virtual:uno.css?reset')).toMatchObject({ options: { reset: true } });
		expect(parseUnoQueryOptions('virtual:uno.css?dark=media')).toMatchObject({ options: { dark: 'media' } });
	});

	it('parseVirtualUnoId matches every official alias form', () => {
		expect(parseVirtualUnoId('uno.css')).toMatchObject({ layer: undefined, warnings: [] });
		expect(parseVirtualUnoId('virtual:uno.css')).toMatchObject({ layer: undefined });
		expect(parseVirtualUnoId('uno.css?unit=rem')).toMatchObject({ layer: undefined });
		expect(parseVirtualUnoId('\0virtual:uno.css?entry=mobile')).toMatchObject({ layer: undefined });
		expect(parseVirtualUnoId('uno:preflights.css')).toMatchObject({ layer: 'preflights' });
		expect(parseVirtualUnoId('virtual:uno:preflights.css')).toMatchObject({ layer: 'preflights' });
		expect(parseVirtualUnoId('/@id/virtual:uno:shortcuts.css')).toMatchObject({ layer: 'shortcuts' });

		expect(parseVirtualUnoId('virtual:other.css')).toBeUndefined();
		expect(parseVirtualUnoId('unocss.css')).toBeUndefined();

		// layer 会被拼进虚拟模块路径，含 `/` 会破坏官方 RESOLVED_ID_RE 的 `[/\\]` 锚点
		const evil = parseVirtualUnoId('virtual:uno:../evil.css');
		expect(evil?.layer).toBeUndefined();
		expect(evil?.warnings[0]).toContain('layer');
	});

	it('parseUnoQueryOptions warns on bad values and unknown params', () => {
		const scale = parseUnoQueryOptions('virtual:uno.css?scale=abc');
		expect(scale.options).toEqual({});
		expect(scale.warnings[0]).toContain('scale');

		const dark = parseUnoQueryOptions('virtual:uno.css?dark=whatever');
		expect(dark.options).toEqual({});
		expect(dark.warnings[0]).toContain('dark');

		const reset = parseUnoQueryOptions('virtual:uno.css?reset=maybe');
		expect(reset.options).toEqual({});
		expect(reset.warnings[0]).toContain('reset');

		const unknown = parseUnoQueryOptions('virtual:uno.css?foo=1');
		expect(unknown.warnings[0]).toContain('未知参数');

		// `?unit=` 收下空串会生成无单位的声明
		const empty = parseUnoQueryOptions('virtual:uno.css?unit=');
		expect(empty.options).toEqual({});
		expect(empty.hasOptions).toBe(false);
		expect(empty.warnings[0]).toContain('unit');

		// Vite 自己挂的 query 不算未知参数
		expect(parseUnoQueryOptions('virtual:uno.css?unit=rem&t=123&import').warnings).toEqual([]);
	});

	it('parseUnoQueryOptions handles entry selection', () => {
		expect(parseUnoQueryOptions('virtual:uno.css?entry=mobile')).toMatchObject({
			entry: 'mobile',
			hasOptions: false
		});
		expect(parseUnoQueryOptions('\0virtual:uno.css?entry=manage&unit=px')).toMatchObject({
			entry: 'manage',
			options: { unit: 'px' }
		});
		expect(parseUnoQueryOptions('/@id/virtual:uno.css?entry=shared')).toMatchObject({ entry: 'shared' });

		// 非法入口名不再静默按 importer 推断
		const bad = parseUnoQueryOptions('virtual:uno.css?entry=bad/name');
		expect(bad.entry).toBeUndefined();
		expect(bad.warnings[0]).toContain('entry');

		expect(parseUnoQueryOptions('virtual:uno.css')).toMatchObject({ hasOptions: false, warnings: [] });
	});

	it('unoOptionsSignature ignores key order', () => {
		expect(unoOptionsSignature({ unit: 'rem', scale: 2 }))
			.toBe(unoOptionsSignature({ scale: 2, unit: 'rem' }));
		expect(unoOptionsSignature({ unit: 'rem' })).not.toBe(unoOptionsSignature({ unit: 'px' }));
	});

	it('inferUnoEntry uses importer folder when it matches a package dir', () => {
		expect(inferUnoEntry('/app/src/shared/examples/index.js', ROOT, KNOWN)).toBe('shared');
		expect(inferUnoEntry('/app/src/mobile/index.js', ROOT, KNOWN)).toBe('mobile');
		expect(inferUnoEntry('/app/src/unknown/index.js', ROOT, KNOWN)).toBeUndefined();
		expect(inferUnoEntry(undefined, ROOT, KNOWN)).toBeUndefined();
		expect(inferUnoEntry('/app/src/shared/examples/index.js', ROOT, [])).toBeUndefined();
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
		const mobile = pipelineIncludeForEntry('mobile', ROOT, 'shared', KNOWN);

		expect(mobile.test('/app/src/mobile/index.js')).toBe(true);
		expect(mobile.test('/app/src/mobile/views/a.vue')).toBe(true);
		// Vue SFC 子请求带 query，glob 匹配不到，所以这里必须是 RegExp
		expect(mobile.test('/app/src/mobile/views/a.vue?vue&type=template')).toBe(true);
		expect(mobile.test('/app/src/shared/utils/index.ts')).toBe(true);

		expect(mobile.test('/app/src/manage/index.js')).toBe(false);
		expect(mobile.test('/app/src/mobile/styles/a.scss')).toBe(false);
		expect(mobile.test('/other/src/mobile/index.js')).toBe(false);

		// shared 自己不再额外带上 shared
		const shared = pipelineIncludeForEntry('shared', ROOT, 'shared', KNOWN);
		expect(shared.test('/app/src/shared/index.js')).toBe(true);
		expect(shared.test('/app/src/mobile/index.js')).toBe(false);
	});

	it('pipelineIncludeForEntry narrows the fallback entry to leftovers', () => {
		const fallback = pipelineIncludeForEntry(FALLBACK_UNO_ENTRY, ROOT, 'shared', KNOWN);

		// 不属于任何包目录的文件，以及 shared
		expect(fallback.test('/app/src/preload.js')).toBe(true);
		expect(fallback.test('/app/src/shared/box.js')).toBe(true);
		expect(fallback.test('/app/src/other/a.vue')).toBe(true);

		// 各包自己的文件不该再被兜底实例提取一遍
		expect(fallback.test('/app/src/mobile/a.vue')).toBe(false);
		expect(fallback.test('/app/src/manage/a.vue')).toBe(false);
		expect(fallback.test('/other/src/a.vue')).toBe(false);

		// 没有已知入口时退化成整个 root
		const bare = pipelineIncludeForEntry(FALLBACK_UNO_ENTRY, ROOT, 'shared', []);
		expect(bare.test('/app/src/mobile/a.vue')).toBe(true);
	});

	it('router resolves virtual uno css to the matching instance', async () => {
		const { instances } = createInstances(KNOWN.concat(FALLBACK_UNO_ENTRY));
		const plugin = createRouter({ root: ROOT, knownEntries: KNOWN, instances, envOptions: {} });
		const { context } = createStub();

		expect(await runResolveId(plugin, context, 'virtual:uno.css?entry=mobile')).toBe('/__uno-mobile.css');
		expect(await runResolveId(plugin, context, 'virtual:uno.css', '/app/src/shared/examples/index.js'))
			.toBe('/__uno-shared.css');
		expect(await runResolveId(plugin, context, 'virtual:uno.css', '/app/src/unknown/index.js'))
			.toBe('/__uno-__root__.css');
		expect(await runResolveId(plugin, context, 'virtual:uno.css')).toBe('/__uno-__root__.css');
		expect(await runResolveId(plugin, context, 'virtual:other.css')).toBeUndefined();
	});

	it('router binds query options to the instance exactly once', async () => {
		const { instances, reloads } = createInstances(KNOWN.concat(FALLBACK_UNO_ENTRY));
		const plugin = createRouter({ root: ROOT, knownEntries: KNOWN, instances, envOptions: {} });
		const { context } = createStub();

		await runResolveId(plugin, context, 'virtual:uno.css?unit=rem&scale=2', '/app/src/mobile/index.js');
		expect(reloads).toEqual(['mobile']);
		expect(instances[0].config.presets).not.toEqual(['default']);

		// 同一套配置重复出现（含 HMR 重新解析）不算冲突，也不重复 reload
		await runResolveId(plugin, context, 'virtual:uno.css?scale=2&unit=rem', '/app/src/mobile/views/a.vue');
		expect(reloads).toEqual(['mobile']);

		// 裸 import 不表达配置，不触发绑定
		await runResolveId(plugin, context, 'virtual:uno.css', '/app/src/manage/index.js');
		expect(reloads).toEqual(['mobile']);
	});

	it('router errors when one package declares two different configs', async () => {
		const { instances } = createInstances(KNOWN.concat(FALLBACK_UNO_ENTRY));
		const plugin = createRouter({ root: ROOT, knownEntries: KNOWN, instances, envOptions: {} });
		const { context } = createStub();

		await runResolveId(plugin, context, 'virtual:uno.css?unit=rem', '/app/src/mobile/index.js');
		await expect(
			runResolveId(plugin, context, 'virtual:uno.css?unit=px', '/app/src/mobile/other.js')
		).rejects.toThrow(/mobile/);
	});

	it('router warns when UNOCSS_OPTIONS overrides query options', async () => {
		const { instances } = createInstances(KNOWN.concat(FALLBACK_UNO_ENTRY));
		const plugin = createRouter({
			root: ROOT,
			knownEntries: KNOWN,
			instances,
			envOptions: { unit: 'px' }
		});
		const { context, warnings } = createStub();

		await runResolveId(plugin, context, 'virtual:uno.css?unit=rem&scale=2', '/app/src/mobile/index.js');
		expect(warnings.some(i => i.includes('UNOCSS_OPTIONS') && i.includes('unit'))).toBe(true);
	});

	it('router falls back when the requested entry has no instance, keeping the config', async () => {
		const { instances, reloads } = createInstances([FALLBACK_UNO_ENTRY]);
		const plugin = createRouter({ root: ROOT, knownEntries: ['mobile'], instances, envOptions: {} });
		const { context, resolved, warnings } = createStub([FALLBACK_UNO_ENTRY]);

		expect(await runResolveId(plugin, context, 'virtual:uno.css?entry=typo&unit=rem'))
			.toBe('/__uno-__root__.css');
		// 入口先回退再绑定，配置不能跟着丢
		expect(reloads).toEqual([FALLBACK_UNO_ENTRY]);
		expect(instances[0].config.presets).not.toEqual(['default']);
		// 只解析一次，不再先试一次不存在的入口
		expect(resolved).toEqual(['/__uno-__root__.css']);
		expect(warnings.some(i => i.includes('typo'))).toBe(true);
	});

	it('router falls back through inference before the root entry', async () => {
		const { instances, reloads } = createInstances(KNOWN.concat(FALLBACK_UNO_ENTRY));
		const plugin = createRouter({ root: ROOT, knownEntries: KNOWN, instances, envOptions: {} });
		const { context, warnings } = createStub();

		/*
		 * 兜底实例的 pipeline.include 排除了各包目录，直接跳到 __root__ 会让
		 * importer 自己的 class 一个都不在生成结果里，所以先试 importer 目录。
		 */
		expect(await runResolveId(plugin, context, 'virtual:uno.css?entry=typo&unit=rem', '/app/src/mobile/index.js'))
			.toBe('/__uno-mobile.css');
		expect(reloads).toEqual(['mobile']);
		expect(warnings.some(i => i.includes('typo') && i.includes('mobile'))).toBe(true);
	});

	it('router treats every official uno.css alias the same', async () => {
		const { instances } = createInstances(KNOWN.concat(FALLBACK_UNO_ENTRY));
		const plugin = createRouter({ root: ROOT, knownEntries: KNOWN, instances, envOptions: {} });
		const { context } = createStub();
		const from = '/app/src/mobile/index.js';

		// 官方 VIRTUAL_ENTRY_ALIAS 的 `virtual:` 前缀可省，只认 virtual:uno.css
		// 会让这些写法绕过 router 被第一个实例抢走
		expect(await runResolveId(plugin, context, 'uno.css', from)).toBe('/__uno-mobile.css');
		expect(await runResolveId(plugin, context, 'virtual:uno.css', from)).toBe('/__uno-mobile.css');
		expect(await runResolveId(plugin, context, 'uno.css?entry=manage')).toBe('/__uno-manage.css');
	});

	it('router keeps the layer segment when routing', async () => {
		const { instances } = createInstances(KNOWN.concat(FALLBACK_UNO_ENTRY));
		const plugin = createRouter({ root: ROOT, knownEntries: KNOWN, instances, envOptions: {} });
		// 官方 resolved id 形式是 `${prefix}_${layer}.css`
		const { context, warnings } = createStub(['mobile_preflights', FALLBACK_UNO_ENTRY]);
		const from = '/app/src/mobile/index.js';

		expect(await runResolveId(plugin, context, 'virtual:uno:preflights.css', from))
			.toBe('/__uno-mobile_preflights.css');
		expect(await runResolveId(plugin, context, 'uno:preflights.css', from))
			.toBe('/__uno-mobile_preflights.css');

		// layer 名会被拼进路径，含 `/` 会破坏官方 RESOLVED_ID_RE 的锚点
		await runResolveId(plugin, context, 'virtual:uno:../evil.css', from);
		expect(warnings.some(i => i.includes('layer'))).toBe(true);
	});

	it('router rebinds when the same file edits its own query', async () => {
		const { instances, reloads } = createInstances(KNOWN.concat(FALLBACK_UNO_ENTRY));
		const plugin = createRouter({ root: ROOT, knownEntries: KNOWN, instances, envOptions: {} });
		const { context } = createStub();
		const from = '/app/src/mobile/index.js';

		await runResolveId(plugin, context, 'virtual:uno.css?scale=2', from);
		// HMR 会重新解析该模块的每一行 import —— 改自己的 query 不是冲突
		await runResolveId(plugin, context, 'virtual:uno.css?scale=3', from);
		expect(reloads).toEqual(['mobile', 'mobile']);

		// 换成另一个文件写不同配置，仍然是冲突
		await expect(
			runResolveId(plugin, context, 'virtual:uno.css?scale=4', '/app/src/mobile/other.js')
		).rejects.toThrow(/mobile/);
	});

	it('UnoEnhancer mounts one instance per package dir plus the fallback', () => {
		const locals = Locals.impl('packages');
		const known = [...locals.packageFolderNames, locals.sharedPackageFolderName].filter(Boolean);

		const plugins = UnoEnhancer({ workspace: 'packages' }) as Plugin[];
		expect((plugins[0] as Plugin).name).toBe('vite-plugin-uno-entry-router');
		expect(plugins.length).toBe(known.length + 2); // router + 每个包 + __root__
	});

	it('UnoEnhancer only builds the current package when given one', () => {
		// build 时每个包各跑一次独立的 createBuild，不需要其它包的实例
		const plugins = UnoEnhancer({ workspace: 'packages' }, 'dever') as Plugin[];
		expect((plugins[0] as Plugin).name).toBe('vite-plugin-uno-entry-router');
		expect(plugins.length).toBe(4); // router + dever + shared + __root__
	});

	it('UnoEnhancer sets envMode explicitly', () => {
		/*
		 * `configFile: false` 会让官方 loadConfig 走早退分支，
		 * createContext 传的 defaults（含 envMode）不会被合并，必须自己补。
		 */
		const dev = UnoEnhancer({ workspace: 'packages' }, 'dever') as Plugin[];
		const api = (dev.flat() as Plugin[]).find(i => i.name === 'unocss:api')?.api as {
			getContext: () => { getConfig: () => Promise<{ envMode?: string }> };
		};
		return expect(api.getContext().getConfig()).resolves.toMatchObject({ envMode: 'dev' });
	});

	it('parseUnoEnvOptions / mergeUnoOptions', () => {
		expect(parseUnoEnvOptions(undefined)).toEqual({});
		expect(parseUnoEnvOptions('{')).toEqual({});
		expect(parseUnoEnvOptions('{"scale":2}')).toEqual({ scale: 2 });
		expect(mergeUnoOptions({ unit: 'rem', scale: 2 }, { scale: 1 })).toEqual({
			unit: 'rem',
			scale: 1
		});
	});
});
