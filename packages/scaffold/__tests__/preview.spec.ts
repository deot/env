import { select } from '@inquirer/prompts';

import {
	getPreviewCommand,
	getPreviewOptions,
	getTemplateDir,
	parsePreviewArgs
} from '../scripts/preview';

vi.mock('@inquirer/prompts', () => ({ select: vi.fn() }));

describe('scaffold preview', () => {
	beforeEach(() => vi.mocked(select).mockReset());

	it('parses explicit options', () => {
		expect(parsePreviewArgs([
			'--template',
			'monorepo',
			'--language',
			'ts',
			'--package-name',
			'manage'
		])).toEqual({ template: 'monorepo', language: 'ts', packageName: 'manage' });
	});

	it('uses prompts for missing dev options', async () => {
		vi.mocked(select)
			.mockResolvedValueOnce('monorepo')
			.mockResolvedValueOnce('ts')
			.mockResolvedValueOnce('manage');

		await expect(getPreviewOptions('dev', {}, true)).resolves.toEqual({
			template: 'monorepo',
			language: 'ts',
			packageName: 'manage'
		});
		expect(select).toHaveBeenCalledTimes(3);
	});

	it('keeps explicit options without prompting', async () => {
		await expect(getPreviewOptions('dev', {
			template: 'single',
			language: 'js',
			packageName: 'manage'
		}, false)).resolves.toEqual({
			template: 'single',
			language: 'js',
			packageName: undefined
		});
		expect(select).not.toHaveBeenCalled();
	});

	it('requires missing options in non-interactive mode', async () => {
		await expect(getPreviewOptions('dev', {}, false)).rejects.toThrow('--template is required');
		await expect(getPreviewOptions('dev', {
			template: 'monorepo',
			language: 'ts'
		}, false)).rejects.toThrow('--package-name is required');
	});

	it('restricts typecheck to TypeScript templates', async () => {
		await expect(getPreviewOptions('typecheck', { template: 'single' }, false)).resolves.toEqual({
			template: 'single',
			language: 'ts',
			packageName: undefined
		});
		await expect(getPreviewOptions('typecheck', {
			template: 'single',
			language: 'js'
		}, false)).rejects.toThrow('only available for TypeScript');
	});

	it('maps actions to the current repository CLI', async () => {
		const options = await getPreviewOptions('dev', {
			template: 'monorepo',
			language: 'ts',
			packageName: 'mobile'
		}, false);
		const command = getPreviewCommand('dev', options)!;
		expect(command.command).toContain('node_modules/.bin/tsx');
		expect(command.args).toEqual(expect.arrayContaining([
			'dev',
			'--workspace',
			'src',
			'--package-name',
			'mobile'
		]));
		expect(command.env).toEqual({ BRANCH: 'dev', VITE_SCAFFOLD_VARIANT: 'monorepo-ts' });
		expect(getTemplateDir(options)).toMatch(/templates\/monorepo-ts$/);
	});
});
