import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { run } from '../src/index';

const options = { template: 'single' as const, language: 'js' as const };

describe('run', () => {
	let root: string;
	let previousCwd: string;
	let previousPath: string | undefined;

	beforeEach(async () => {
		root = await mkdtemp(resolve(tmpdir(), 'env-scaffold-run-'));
		previousCwd = process.cwd();
		previousPath = process.env.PATH;
		process.chdir(root);
	});

	afterEach(async () => {
		process.chdir(previousCwd);
		process.env.PATH = previousPath;
		await rm(root, { recursive: true, force: true });
	});

	const usePnpm = async (script: string) => {
		const bin = resolve(root, 'bin');
		await mkdir(bin);
		const pnpm = resolve(bin, 'pnpm');
		await writeFile(pnpm, script);
		await chmod(pnpm, 0o755);
		process.env.PATH = `${bin}${previousPath ? `:${previousPath}` : ''}`;
	};

	it('prints the install command when installation is skipped', async () => {
		await run('example', { ...options, install: false });

		const packageJson = JSON.parse(await readFile(resolve(root, 'example/package.json'), 'utf8'));
		expect(packageJson.name).toBe('example');
	});

	it('installs dependencies when pnpm exits successfully', async () => {
		await usePnpm('#!/bin/sh\nexit 0\n');
		const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

		await run('example', options);

		expect(log).toHaveBeenCalledWith(expect.stringContaining('Created example in'));
		log.mockRestore();
	});

	it('keeps created files when pnpm exits with a failure code', async () => {
		await usePnpm('#!/bin/sh\nexit 1\n');
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		await expect(run('example', options)).rejects.toThrow('pnpm install exited with code 1');
		expect(error).toHaveBeenCalledWith('Project files were created. Retry with: cd example && pnpm install');
		await expect(readFile(resolve(root, 'example/package.json'), 'utf8')).resolves.toContain('example');
		error.mockRestore();
	});

	it('reports a failure to start pnpm', async () => {
		process.env.PATH = resolve(root, 'empty');
		await mkdir(process.env.PATH);
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		await expect(run('example', options)).rejects.toThrow(/ENOENT|spawn/);
		expect(error).toHaveBeenCalledWith('Project files were created. Retry with: cd example && pnpm install');
		error.mockRestore();
	});
});
