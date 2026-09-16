import { spawn } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

describe('init.ts', () => {
	const run = (cwd: string, args: string[], env = process.env) => {
		const cli = resolve(__dirname, '../src/index.ts');
		return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve$) => {
			const child = spawn('tsx', [
				'--tsconfig',
				resolve(__dirname, '../../../tsconfig.json'),
				cli,
				...args
			], { cwd, env });
			let stdout = '';
			let stderr = '';
			child.stdout.on('data', chunk => stdout += chunk.toString());
			child.stderr.on('data', chunk => stderr += chunk.toString());
			child.on('close', code => resolve$({ code, stdout, stderr }));
		});
	};

	it('dec init --no-install', async () => {
		expect.hasAssertions();
		const cwd = await mkdtemp(resolve(tmpdir(), 'env-cli-'));

		try {
			const response = await run(cwd, [
				'init',
				'example',
				'--template',
				'single',
				'--language',
				'js',
				'--no-install'
			]);

			expect(response.code).toBe(0);
			expect(response.stderr).toBe('');
			expect(response.stdout).toContain('Created example');
			const packageJson = JSON.parse(await readFile(resolve(cwd, 'example/package.json'), 'utf8'));
			expect(packageJson.name).toBe('example');
		} finally {
			await rm(cwd, { recursive: true, force: true });
		}
	}, 60000);

	it('runs pnpm install by default', async () => {
		expect.hasAssertions();
		const cwd = await mkdtemp(resolve(tmpdir(), 'env-cli-'));
		const bin = resolve(cwd, 'bin');
		await mkdir(bin);
		await writeFile(resolve(bin, 'pnpm'), '#!/bin/sh\nprintf installed > "$PWD/.installed"\n');
		await chmod(resolve(bin, 'pnpm'), 0o755);

		try {
			const response = await run(cwd, [
				'init',
				'example',
				'--template',
				'single',
				'--language',
				'js'
			], {
				...process.env,
				PATH: `${bin}:${process.env.PATH}`
			});

			expect(response.code).toBe(0);
			expect(response.stderr).toBe('');
			expect(await readFile(resolve(cwd, 'example/.installed'), 'utf8')).toBe('installed');
		} finally {
			await rm(cwd, { recursive: true, force: true });
		}
	}, 60000);
});
