import { select } from '@inquirer/prompts';
import { Locals } from '@deot/env-shared';

const ALL_PACKAGE = '*';

export const getOptions = async () => {
	const { packageFolderNames, sharedPackageFolderName } = Locals.impl();
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
