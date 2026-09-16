import { select } from '@inquirer/prompts';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import type { TemplateLanguage, TemplateType } from '../src/create';

export type PreviewAction = 'init' | 'dev' | 'build' | 'lint' | 'typecheck';
export type PackageName = 'manage' | 'mobile' | 'shared' | '*';

export interface PreviewOptions {
	template: TemplateType;
	language: TemplateLanguage;
	packageName?: PackageName;
}

interface RawOptions {
	template?: string;
	language?: string;
	packageName?: string;
}

export interface PreviewCommand {
	command: string;
	args: string[];
	env?: Record<string, string>;
}

const ACTIONS: PreviewAction[] = ['init', 'dev', 'build', 'lint', 'typecheck'];
const TEMPLATES: TemplateType[] = ['single', 'monorepo'];
const LANGUAGES: TemplateLanguage[] = ['js', 'ts'];
const PACKAGE_NAMES: PackageName[] = ['manage', 'mobile', 'shared', '*'];
const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '../../..');
const templateRoot = resolve(scriptDir, '../templates');
const cliPath = resolve(rootDir, 'packages/cli/src/index.ts');
const tsconfigPath = resolve(rootDir, 'tsconfig.json');
const tsxPath = resolve(rootDir, 'node_modules/.bin/tsx');

const isInteractive = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);
const requireOption = (name: string) => {
	throw new Error(`${name} is required in non-interactive mode.`);
};
const validate = <T extends string>(name: string, value: string | undefined, values: T[]) => {
	if (value && !values.includes(value as T)) {
		throw new Error(`Unknown ${name}: ${value}`);
	}
	return value as T | undefined;
};

export const parsePreviewArgs = (args: string[]): RawOptions => {
	const { values } = parseArgs({
		args,
		options: {
			'template': { type: 'string' },
			'language': { type: 'string' },
			'package-name': { type: 'string' }
		},
		strict: true
	});
	return {
		template: values.template,
		language: values.language,
		packageName: values['package-name']
	};
};

export const getPreviewOptions = async (
	action: PreviewAction,
	raw: RawOptions,
	interactive = isInteractive()
): Promise<PreviewOptions> => {
	let template = validate('template', raw.template, TEMPLATES);
	let language = validate('language', raw.language, LANGUAGES);
	let packageName = validate('package name', raw.packageName, PACKAGE_NAMES);

	if (!template) {
		if (!interactive) return requireOption('--template');
		template = await select<TemplateType>({
			message: 'Select project type:',
			choices: [
				{ name: 'Monorepo', value: 'monorepo' },
				{ name: 'Single', value: 'single' }
			],
			default: 'monorepo'
		});
	}
	if (!language) {
		if (action === 'typecheck') {
			language = 'ts';
		} else {
			if (!interactive) return requireOption('--language');
			language = await select<TemplateLanguage>({
				message: 'Select language:',
				choices: [
					{ name: 'JavaScript', value: 'js' },
					{ name: 'TypeScript', value: 'ts' }
				],
				default: 'js'
			});
		}
	}
	if (action === 'typecheck' && language !== 'ts') {
		throw new Error('typecheck is only available for TypeScript templates.');
	}
	if (template === 'monorepo' && (action === 'dev' || action === 'build') && !packageName) {
		if (!interactive) return requireOption('--package-name');
		packageName = await select<PackageName>({
			message: `Select package to ${action}:`,
			choices: [
				{ name: 'All', value: '*' },
				{ name: 'Manage', value: 'manage' },
				{ name: 'Mobile', value: 'mobile' },
				{ name: 'Shared', value: 'shared' }
			],
			default: '*'
		});
	}

	return {
		template,
		language,
		packageName: template === 'monorepo' ? packageName : undefined
	};
};

export const getTemplateDir = (options: PreviewOptions) => resolve(
	templateRoot,
	`${options.template}-${options.language}`
);

export const getPreviewCommand = (
	action: PreviewAction,
	options: PreviewOptions
): PreviewCommand | null => {
	if (action === 'init') return null;
	if (action === 'lint' || action === 'typecheck') {
		return { command: 'pnpm', args: ['run', action] };
	}

	const args = [
		'--tsconfig',
		tsconfigPath,
		cliPath,
		action,
		'--workspace',
		options.template === 'monorepo' ? 'src' : './'
	];
	if (action === 'build') args.push('--out-dir', 'dist');
	if (options.template === 'monorepo' && options.packageName) {
		args.push('--package-name', options.packageName);
	}
	return {
		command: tsxPath,
		args,
		env: {
			BRANCH: action === 'build' ? 'prod' : 'dev',
			VITE_SCAFFOLD_VARIANT: `${options.template}-${options.language}`
		}
	};
};

const runCommand = (value: PreviewCommand, cwd: string) => new Promise<void>((resolve$, reject) => {
	const child = spawn(value.command, value.args, {
		cwd,
		env: { ...process.env, ...value.env },
		stdio: 'inherit'
	});
	child.on('error', reject);
	child.on('close', (code, signal) => {
		if (code === 0) resolve$();
		else reject(new Error(signal
			? `${value.command} terminated by ${signal}`
			: `${value.command} exited with code ${code}`));
	});
});

export const runPreview = async (action: PreviewAction, options: PreviewOptions) => {
	const cwd = getTemplateDir(options);
	console.log(`[scaffold] ${action}: ${options.template}-${options.language}`);
	console.log(`[scaffold] source: ${cwd}`);
	await runCommand({
		command: 'pnpm',
		args: ['install', '--frozen-lockfile', '--ignore-scripts']
	}, cwd);

	const command = getPreviewCommand(action, options);
	if (command) await runCommand(command, cwd);
};

export const main = async () => {
	const action = validate('action', process.argv[2], ACTIONS);
	if (!action) throw new Error(`Action is required: ${ACTIONS.join(', ')}`);
	const options = await getPreviewOptions(action, parsePreviewArgs(process.argv.slice(3)));
	await runPreview(action, options);
};

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
}
