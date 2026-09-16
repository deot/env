import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

import { createScaffold } from './create';
import { getOptions } from './prompt';
import type { ScaffoldOptions } from './prompt';

export * from './create';
export type { ScaffoldOptions } from './prompt';

const install = (cwd: string) => new Promise<void>((resolve$, reject) => {
	const child = spawn('pnpm', ['install'], {
		cwd,
		stdio: 'inherit'
	});

	child.on('error', reject);
	child.on('close', (code) => {
		if (code === 0) {
			resolve$();
		} else {
			reject(new Error(`pnpm install exited with code ${code}`));
		}
	});
});

export const run = async (projectName: string | undefined, options: ScaffoldOptions) => {
	const { name, template, language } = await getOptions(projectName, options);
	const targetDir = resolve(process.cwd(), name);
	await createScaffold({ name, targetDir, template, language });
	console.log(`Created ${name} in ${targetDir}`);

	if (options.install === false) {
		console.log(`Next: cd ${name} && pnpm install`);
		return;
	}

	try {
		await install(targetDir);
	} catch (error) {
		console.error(`Project files were created. Retry with: cd ${name} && pnpm install`);
		throw error;
	}
};
