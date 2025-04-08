import type { Options } from '@deot/dev-shared';
import { defineConfig } from 'vite';
import { Locals } from '@deot/env-shared';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vueRouter from 'unplugin-vue-router/vite';
import vueLayouts from 'vite-plugin-vue-layouts';

export default (options: Options, packageFolderName?: string) => {
	const { workspace, packageFolderNames, sharedPackageFolderName } = Locals.impl();
	const packages$ = [...packageFolderNames] as string[];
	let uvrOptions;
	if (options.build && packageFolderName) {
		uvrOptions = {
			routesFolder: [
				{
					src: `${workspace}/${packageFolderName}/pages`,
				}
			]
		};
	} else {
		uvrOptions = {
			routesFolder: packages$
				.map((packageFolderName$) => {
					return {
						src: `${workspace}/${packageFolderName$}/pages`,
						path: `${packageFolderName$}/`
					};
				}).concat([
					{
						src: `${workspace}/${sharedPackageFolderName}/examples/pages`,
						path: `${sharedPackageFolderName}/`
					}
				])
		};
	};
	return defineConfig({
		plugins: [
			vueRouter(uvrOptions),
			vueLayouts({
				layoutsDirs: `${sharedPackageFolderName}/layouts`,
				pagesDirs: packages$
					.map(packageFolderName$ => `${workspace}/${packageFolderName$}/pages`)
					.concat([`${workspace}/${sharedPackageFolderName}/examples/pages`])
			}),
			vue(),
			vueJsx()
		]
	});
};
