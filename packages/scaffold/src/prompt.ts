import { input, select } from '@inquirer/prompts';

import type { TemplateLanguage, TemplateType } from './create';

export interface ScaffoldOptions {
	template?: TemplateType;
	language?: TemplateLanguage;
	install?: boolean;
}

const isInteractive = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

export const getOptions = async (projectName: string | undefined, options: ScaffoldOptions) => {
	const interactive = isInteractive();
	let name = projectName;
	let { template, language } = options;

	if (!name) {
		if (!interactive) throw new Error('Project name is required in non-interactive mode.');
		name = await input({ message: 'Project name:' });
	}
	if (!template) {
		if (!interactive) throw new Error('--template is required in non-interactive mode.');
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
		if (!interactive) throw new Error('--language is required in non-interactive mode.');
		language = await select<TemplateLanguage>({
			message: 'Select language:',
			choices: [
				{ name: 'JavaScript', value: 'js' },
				{ name: 'TypeScript', value: 'ts' }
			],
			default: 'js'
		});
	}

	return { name, template, language };
};
