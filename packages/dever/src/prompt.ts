import { select } from '@inquirer/prompts';
import { Locals } from '@deot/env-shared';
import type { Options } from '@deot/dev-shared';

const ALL_PACKAGE = '*';

export const getOptions = async (options: Options) => {
	const { packageFolderNames, sharedPackageFolderName } = Locals.impl(options.workspace);
	const packages$ = [ALL_PACKAGE, ...packageFolderNames, sharedPackageFolderName] as string[];

	const packageFolderName = await select({
		message: 'Select Package To Develop:',
		choices: packages$.map(i => ({ value: i })),
		default: ALL_PACKAGE
	});
	return {
		packageFolderName: packageFolderName == ALL_PACKAGE ? undefined : packageFolderName,
	};
};
