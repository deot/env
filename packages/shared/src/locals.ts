import { createRequire } from 'node:module';
import * as path from 'node:path';
import * as fs from 'node:fs';

const cwd = process.cwd();
const require$ = createRequire(cwd);

interface PackageOptions {
	[key: string]: any;
	version: string;
	name: string;
}

interface Config {
	cwd: string;
	workspace: string;
	workspaceDir: string;
	packageDir: string;
	packageOptions: PackageOptions;
	packageName: string;
	packageVersion: string;
	packageFolderNames: string[];
	packageOptionsMap: {
		[key: string]: PackageOptions;
	};
	packageDirsMap: {
		[key: string]: PackageOptions;
	};
	sharedPackageFolderName: string;
}

export const getPackageName = (packageFolderName$: string, workspace$?: string) => {
	const { workspace, packageName } = impl(workspace$);
	if (
		!workspace
		|| !packageFolderName$
	) {
		return packageName;
	} else {
		return `${packageName}${packageFolderName$.replace(new RegExp(`${packageName}-?`), '')}`;
	}
};

export const getPackageFolderName = (packageName$: string, workspace$?: string) => {
	const { workspace, packageName } = impl(workspace$);
	if (!workspace || packageName$ === packageName) return '';

	return packageName$?.replace(new RegExp(`${packageName}-?`, 'g'), '');
};

export const getRealPackageName = (names?: string, workspace$?: string) => {
	return names?.split(',').map((name) => {
		const { workspace, packageName, workspaceDir } = impl(workspace$);
		if (!workspace || !name || name === '*') return name;
		if ((name as any).includes(packageName)) {
			name = getPackageFolderName(name, workspace$);
		}

		if (fs.existsSync(path.resolve(workspaceDir, name))) {
			return getPackageName(name, workspace$);
		}

		return '';
	}).filter(i => !!i).join(',');
};

const configMap: { [key: string]: Config } = {};
export const impl = (workspace?: string) => {
	/* istanbul ignore next -- @preserve */
	workspace = typeof workspace === 'undefined' ? 'clients' : workspace;
	if (configMap[workspace]) return configMap[workspace];
	const isMonorepo = !!workspace;
	workspace = isMonorepo ? workspace : '';

	const workspaceDir = path.resolve(cwd, workspace);
	const packageDir = path.resolve(cwd);
	const packageOptions = require$(path.resolve(cwd, 'package.json'));
	const packageName = `@${workspace}/`;
	const packageVersion = packageOptions.version;

	const sharedPackageFolderName = isMonorepo ? 'shared' : '';

	// 所有包的路径
	const packageFolderNames: string[] = !isMonorepo || !fs.existsSync(workspaceDir)
		? []
		: fs.readdirSync(workspaceDir).reduce((pre: string[], file: string) => {
				const fullpath = path.resolve(workspaceDir, file);
				// 获取文件信息
				const stat = fs.statSync(fullpath);
				if (!(/(^_|tpl|dist)/.test(file)) && stat.isDirectory()) {
					pre.push(file);
				}
				return pre;
			}, []);

	// 所有包的package.json
	const packageOptionsMap = packageFolderNames.reduce((pre, packageFolderName$) => {
		pre[packageFolderName$] = require$(path.resolve(workspaceDir, packageFolderName$, 'package.json'));
		return pre;
	}, {});

	const packageDirsMap = packageFolderNames.reduce((pre, packageFolderName$) => {
		pre[packageFolderName$] = path.resolve(workspaceDir, packageFolderName$);
		return pre;
	}, {});

	const config = {
		cwd,
		workspace,
		workspaceDir,
		packageDir,
		packageOptions,
		packageName,
		packageVersion,
		packageFolderNames: packageFolderNames.filter(i => i !== sharedPackageFolderName),
		packageOptionsMap,
		packageDirsMap,
		sharedPackageFolderName
	};

	configMap[workspace] = config;
	return config;
};
