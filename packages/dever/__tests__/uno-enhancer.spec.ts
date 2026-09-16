import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import UnoEnhancer from '../src/plugins/uno-enhancer';
import createMultipleEntry from '../src/plugins/uno-enhancer/multiple-entry';
import {
	fileBelongsToEntry,
	generateUnoEntryCss,
	inferUnoEntry,
	mergeUnoOptions,
	parseUnoEntries,
	parseUnoEntry,
	parseUnoEnvOptions,
	FALLBACK_UNO_ENTRY,
	RESOLVED_UNO_BARE_ID,
	resolvedIdsForEntry,
	resolvedUnoEntryId
} from '../src/plugins/uno-enhancer/utils';

// @vitest-environment node
describe('uno-enhancer', () => {
	it('parseUnoEntry', () => {
		expect(parseUnoEntry('virtual:uno.css')).toBeUndefined();
		expect(parseUnoEntry('virtual:uno.css?entry=mobile')).toBe('mobile');
		expect(parseUnoEntry('\0virtual:uno.css?entry=manage')).toBe('manage');
		expect(parseUnoEntry('/@id/virtual:uno.css?entry=shared')).toBe('shared');
		expect(parseUnoEntry('virtual:uno.css?entry=mobile&t=1')).toBe('mobile');
		expect(parseUnoEntry('virtual:uno.css?entry=bad/name')).toBeUndefined();
		expect(resolvedUnoEntryId('mobile')).toBe('\0virtual:uno.css?entry=mobile');
		expect(RESOLVED_UNO_BARE_ID).toBe('\0virtual:uno.css');
		expect(resolvedIdsForEntry('shared', new Map([['\0virtual:uno.css', 'shared']]))).toEqual([
			'\0virtual:uno.css?entry=shared',
			'\0virtual:uno.css'
		]);
	});

	it('UnoEnhancer mounts multiple-entry even if UNOCSS_ENTRIES is not set yet', () => {
		const prev = process.env.UNOCSS_ENTRIES;
		delete process.env.UNOCSS_ENTRIES;
		try {
			const plugin = UnoEnhancer({ workspace: 'packages' });
			expect(plugin).toMatchObject({ name: 'vite-plugin-uno-multiple-entry' });
		} finally {
			if (prev === undefined) delete process.env.UNOCSS_ENTRIES;
			else process.env.UNOCSS_ENTRIES = prev;
		}
	});

	it('multiple-entry reads UNOCSS_ENTRIES in configResolved after factory', async () => {
		const prev = process.env.UNOCSS_ENTRIES;
		delete process.env.UNOCSS_ENTRIES;
		try {
			const plugin = createMultipleEntry({ workspace: 'packages' });
			const configResolved = plugin.configResolved as (config: { root: string }) => void;
			const resolveId = plugin.resolveId as (id: string, importer?: string) => Promise<string | undefined>;
			configResolved({ root: '/app/src' });
			process.env.UNOCSS_ENTRIES = JSON.stringify({ mobile: { unit: 'rem', scale: 2 } });
			configResolved({ root: '/app/src' });
			expect(await resolveId('virtual:uno.css?entry=mobile')).toBe('\0virtual:uno.css?entry=mobile');
			expect(await resolveId('virtual:uno.css', '/app/src/mobile/index.js')).toBe('\0virtual:uno.css');
		} finally {
			if (prev === undefined) delete process.env.UNOCSS_ENTRIES;
			else process.env.UNOCSS_ENTRIES = prev;
		}
	});

	it('plugin resolveId intercepts virtual uno css', async () => {
		const plugin = createMultipleEntry({ workspace: 'packages' });
		const resolveId = plugin.resolveId as (id: string, importer?: string) => Promise<string | undefined>;
		expect(await resolveId('virtual:uno.css?entry=mobile')).toBe('\0virtual:uno.css?entry=mobile');
		expect(await resolveId('virtual:uno.css')).toBe('\0virtual:uno.css');
		expect(await resolveId('virtual:other.css')).toBeUndefined();
	});

	it('inferUnoEntry uses importer folder when it matches entries', () => {
		const root = '/app/src';
		const entries = { mobile: {}, manage: {}, shared: {} };
		expect(inferUnoEntry('/app/src/shared/examples/index.js', root, entries)).toBe('shared');
		expect(inferUnoEntry('/app/src/mobile/index.js', root, entries)).toBe('mobile');
		expect(inferUnoEntry('/app/src/unknown/index.js', root, entries)).toBeUndefined();
		expect(inferUnoEntry(undefined, root, entries)).toBeUndefined();
		expect(inferUnoEntry('/app/src/shared/examples/index.js', root, {})).toBeUndefined();
	});

	it('fileBelongsToEntry', () => {
		const root = '/app/src';
		expect(fileBelongsToEntry('/app/src/mobile/index.js', 'mobile', root)).toBe(true);
		expect(fileBelongsToEntry('/app/src/mobile/index.js', FALLBACK_UNO_ENTRY, root)).toBe(true);
		expect(fileBelongsToEntry('/other/src/mobile/index.js', FALLBACK_UNO_ENTRY, root)).toBe(false);
		expect(fileBelongsToEntry('/app/src/shared/index.js', 'mobile', root)).toBe(true);
		expect(fileBelongsToEntry('/app/src/manage/index.js', 'mobile', root)).toBe(false);
		expect(fileBelongsToEntry('/app/src/shared/index.js', 'shared', root)).toBe(true);
		expect(fileBelongsToEntry('/app/src/mobile/index.js', 'shared', root)).toBe(false);
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

	it('generateUnoEntryCss uses per-entry unit', async () => {
		const dir = await mkdtemp(resolve(tmpdir(), 'uno-css-'));
		try {
			await mkdir(resolve(dir, 'mobile'), { recursive: true });
			await mkdir(resolve(dir, 'manage'), { recursive: true });
			await mkdir(resolve(dir, 'shared'), { recursive: true });
			await writeFile(resolve(dir, 'mobile/index.vue'), '<div class="g-m-20"></div>');
			await writeFile(resolve(dir, 'manage/index.vue'), '<div class="g-m-20"></div>');
			await writeFile(resolve(dir, 'shared/box.vue'), '<div class="g-pd-8"></div>');

			const mobileCss = await generateUnoEntryCss({
				entry: 'mobile',
				root: dir,
				entries: { mobile: { unit: 'rem', scale: 2 } }
			});
			const manageCss = await generateUnoEntryCss({
				entry: 'manage',
				root: dir,
				entries: { manage: { unit: 'px', scale: 1 } }
			});

			expect(mobileCss).toContain('g-m-20');
			expect(mobileCss).toContain('g-pd-8');
			expect(mobileCss).toContain('rem');
			expect(manageCss).toContain('g-m-20');
			expect(manageCss).toContain('g-pd-8');
			expect(manageCss).toContain('px');
			expect(manageCss).not.toContain('40rem');
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
