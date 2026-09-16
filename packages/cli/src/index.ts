import { program, Option } from 'commander';
import type { Command } from 'commander';
import { createRequire } from 'node:module';

import * as Dever from '@deot/env-dever';
import * as Scaffold from '@deot/env-scaffold';

const require = createRequire(import.meta.url);

const defaultOptions: Option[] = [
	// new Option('--workspace <string>', 'Select Workspace', 'clients'),
	new Option('--dry-run [boolean]', 'Dry Run'),
	new Option('--custom <string>', 'Any Custom Info')
];

/**
 * 后置公共options
 * ctx.option('--no-dry-run').option('--dry-run')
 * 默认 -> dryRun: true.目前这是期望的
 *
 * ctx.option('--dry-run').option('--no-dry-run')
 * 默认 -> dryRun: undefined
 * @param ctx ~
 * @param action ~
 */
const addOptions = (ctx: Command, action: any) => {
	defaultOptions.forEach(i => ctx.addOption(i));
	ctx.action(action);
};

program
	.version(require('../package').version);

// 使用指令参数 如 dec *;
program
	.usage('<cmd>');

// dec init
program
	.command('init [name]')
	.addOption(new Option('-t, --template <type>', 'Select Template').choices(['single', 'monorepo']))
	.addOption(new Option('-l, --language <language>', 'Select Language').choices(['js', 'ts']))
	.option('--no-install', 'Skip pnpm install')
	.description('create a project from a template')
	.action(Scaffold.run);

// dec dev
addOptions(
	program
		.command('dev')
		.option('--workspace <string>', 'Select Workspace')
		.option('--package-name <string>', 'Select PackageName')
		.description('development mode'),
	Dever.run
);

// dec build
addOptions(
	program
		.command('build')
		.option('--workspace <string>', 'Select Workspace')
		.option('--out-dir <string>', 'Select Build OutDir')
		.option('--package-name <string>', 'Select PackageName')
		.description('production mode'),
	(options: any) => {
		options.build = true;
		return Dever.run(options);
	}
);

const main = async () => {
	await program.parseAsync(process.argv);

	if (!program.args.length) {
		program.help();
	}
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
