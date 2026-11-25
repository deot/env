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

export const getPackageName = (packageFolderName$: string, workspace$: string) => {
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

export const getPackageFolderName = (packageName$: string, workspace$: string) => {
	const { workspace, packageName } = impl(workspace$);
	if (!workspace || packageName$ === packageName) return '';

	return packageName$?.replace(new RegExp(`${packageName}-?`, 'g'), '');
};

export const getRealPackageName = (names: string, workspace$: string) => {
	return names.split(',').map((name) => {
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

const SHARED_PACKAGE_FOLDER_NAME = 'shared';
/*
 * `_` 开头的目录，以及 tpl / dist 作为独立片段的目录不参与扫描。
 * 片段用开头、结尾或 - _ . 分隔，避免 marketplace 因为中间的 tpl 被排除。
 */
const IGNORED_PACKAGE_FOLDER = /(?:^_|[-_.](?:tpl|dist)(?:[-_.]|$)|^(?:tpl|dist)(?:[-_.]|$))/;

export const isIgnoredPackageFolder = (file: string) => IGNORED_PACKAGE_FOLDER.test(file);

const configMap: { [key: string]: Config } = {};
export const impl = (workspace: string) => {
	const isMonorepo = path.resolve(cwd, workspace || './') !== cwd;

	if (configMap[workspace]) return configMap[workspace];
	workspace = isMonorepo ? workspace : '';

	const workspaceDir = path.resolve(cwd, workspace);
	const sharedPackageFolderName = isMonorepo ? SHARED_PACKAGE_FOLDER_NAME : '';

	// 所有包的路径
	const packageFolderNames: string[] = !isMonorepo || !fs.existsSync(workspaceDir)
		? []
		: fs.readdirSync(workspaceDir).reduce((pre: string[], file: string) => {
				const fullpath = path.resolve(workspaceDir, file);
				// 获取文件信息
				const stat = fs.statSync(fullpath);
				if (!isIgnoredPackageFolder(file) && stat.isDirectory()) {
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

	const packageDir = path.resolve(cwd);
	const packageOptions = require$(path.resolve(cwd, 'package.json'));

	const name = packageOptionsMap[sharedPackageFolderName]?.name || `@${workspace}/${SHARED_PACKAGE_FOLDER_NAME}`;
	const packageName = `${name.split('/').slice(0, -1).join('/')}/`;
	const packageVersion = packageOptions.version;

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
