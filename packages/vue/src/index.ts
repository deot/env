import type { Options } from '@deot/dev-shared';
import { defineConfig } from 'vite';
import { Locals } from '@deot/env-shared';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vueRouter from 'unplugin-vue-router/vite';
import vueLayouts from 'vite-plugin-vue-layouts';

export default (options: Options, packageFolderName?: string) => {
	const { workspace, packageFolderNames, sharedPackageFolderName } = Locals.impl(options.workspace);
	const packages$ = [...packageFolderNames] as string[];
	const workspaceDir = workspace ? `${workspace}/` : '';
	let uvrOptions: Options = { dts: false };

	if (options.build && workspace && packageFolderName) {
		uvrOptions = {
			...uvrOptions,
			routesFolder: [
				{
					src: `${workspaceDir}${packageFolderName}/pages`,
					path: `${packageFolderName}/`
				}
			]
		};
	} else if (workspace) {
		uvrOptions = {
			...uvrOptions,
			routesFolder: packages$
				.map((packageFolderName$) => {
					return {
						src: `${workspaceDir}${packageFolderName$}/pages`,
						path: `${packageFolderName$}/`
					};
				}).concat([
					{
						src: `${workspaceDir}${sharedPackageFolderName}/examples/pages`,
						path: `${sharedPackageFolderName}/`
					}
				])
		};
	} else {
		uvrOptions = {
			...uvrOptions,
			routesFolder: [
				{
					src: `src/pages`,
					path: `/`
				}
			]
		};
	}
	return defineConfig({
		plugins: [
			vueRouter(uvrOptions),
			vueLayouts({
				layoutsDirs: workspace ? `${sharedPackageFolderName}/layouts` : 'src/layouts',
				pagesDirs: workspace
					? packages$
							.map(packageFolderName$ => `${workspaceDir}${packageFolderName$}/pages`)
							.concat([`${workspaceDir}${sharedPackageFolderName}/examples/pages`])
					: ['src/pages']
			}),
			vue(),
			vueJsx()
		]
	});
};
