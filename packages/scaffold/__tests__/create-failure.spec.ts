import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { createScaffold } from '../src/create';

describe('createScaffold failures', () => {
	let root: string;

	beforeEach(async () => {
		root = await mkdtemp(resolve(tmpdir(), 'env-scaffold-fail-'));
	});

	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	it('removes the temporary directory when the destination parent is not a directory', async () => {
		await writeFile(resolve(root, 'not-a-directory'), '');
		await expect(createScaffold({
			name: 'example',
			targetDir: resolve(root, 'not-a-directory/example'),
			template: 'single',
			language: 'js'
		})).rejects.toThrow();
		expect(await readdir(root)).toEqual(['not-a-directory']);
	});
});
