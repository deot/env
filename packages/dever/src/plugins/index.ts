import type { Options } from '@deot/dev-shared';
import createVueConfig from '@deot/env-vue';
import { defineConfig, mergeConfig } from 'vite';
import virtualHtml from './virtual-html';

export default (options: Options, packageFolderName?: string) => {
	const vueConfig = createVueConfig(options, packageFolderName);
	const baseConfig = defineConfig({
		plugins: [
			virtualHtml(options)
		]
	});
	return mergeConfig(vueConfig, baseConfig);
};
