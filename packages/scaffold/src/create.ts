import { randomUUID } from 'node:crypto';
import { access, cp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type TemplateType = 'single' | 'monorepo';
export type TemplateLanguage = 'js' | 'ts';

export interface TemplateMetadata {
	type: TemplateType;
	language: TemplateLanguage;
	label: string;
}

export interface CreateScaffoldOptions {
	name: string;
	targetDir: string;
	template: TemplateType;
	language: TemplateLanguage;
}

export const templates: TemplateMetadata[] = [
	{ type: 'monorepo', language: 'js', label: 'Monorepo / JavaScript' },
	{ type: 'monorepo', language: 'ts', label: 'Monorepo / TypeScript' }
];

const TEMPLATE_TYPES: TemplateType[] = ['single', 'monorepo'];
const TEMPLATE_LANGUAGES: TemplateLanguage[] = ['js', 'ts'];
const PROJECT_NAME_RE = /^[a-z0-9][a-z0-9._-]*$/;
const PLACEHOLDER = '__PROJECT_NAME__';
const PREVIEW_ARTIFACTS = ['node_modules', 'dist'];
const moduleUrl = new URL(import.meta.url);
const modulePath = moduleUrl.protocol === 'file:'
	? fileURLToPath(moduleUrl)
	: resolve(process.cwd(), moduleUrl.pathname.replace(/^\/+/, ''));
const templateRoot = resolve(dirname(modulePath), '../templates');

const exists = async (path: string) => {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
};

const replaceProjectName = async (path: string, name: string): Promise<void> => {
	const entries = await readdir(path, { withFileTypes: true });
	await Promise.all(entries.map(async (entry) => {
		const entryPath = resolve(path, entry.name);
		if (entry.isDirectory()) {
			await replaceProjectName(entryPath, name);
			return;
		}

		const content = await readFile(entryPath, 'utf8');
		if (content.includes(PLACEHOLDER)) {
			await writeFile(entryPath, content.replaceAll(PLACEHOLDER, name));
		}
	}));
};

const restoreDotfiles = async (path: string) => {
	const dotfiles = [
		['_gitignore', '.gitignore'],
		['_npmrc', '.npmrc']
	];

	await Promise.all(dotfiles.map(async ([source, target]) => {
		const sourcePath = resolve(path, source);
		if (await exists(sourcePath)) {
			await rename(sourcePath, resolve(path, target));
		}
	}));
};

export const createScaffold = async (options: CreateScaffoldOptions): Promise<void> => {
	const { name, targetDir, template, language } = options;
	if (!PROJECT_NAME_RE.test(name)) {
		throw new Error(`Invalid project name: ${name}`);
	}
	if (!TEMPLATE_TYPES.includes(template)) {
		throw new Error(`Unknown template: ${template}`);
	}
	if (!TEMPLATE_LANGUAGES.includes(language)) {
		throw new Error(`Unknown language: ${language}`);
	}

	const target = resolve(targetDir);
	if (await exists(target)) {
		throw new Error(`Target directory already exists: ${target}`);
	}

	const source = resolve(templateRoot, `${template}-${language}`);
	if (!(await exists(source)) || !(await stat(source)).isDirectory()) {
		throw new Error(`Template assets not found: ${template}-${language}`);
	}

	const temporary = resolve(dirname(target), `.${name}.dec-${randomUUID()}`);
	try {
		await cp(source, temporary, {
			recursive: true,
			errorOnExist: true,
			force: false,
			filter: path => !PREVIEW_ARTIFACTS.includes(basename(path))
		});
		await restoreDotfiles(temporary);
		await replaceProjectName(temporary, name);
		await rename(temporary, target);
	} catch (error) {
		await rm(temporary, { recursive: true, force: true });
		throw error;
	}
};
