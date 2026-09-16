import type { Options } from '@deot/dev-shared';
import createVueConfig from '@deot/env-vue';
import { defineConfig, mergeConfig } from 'vite';
import virtualHtml from './virtual-html';
import UnoEnhancer from './uno-enhancer';

export default (options: Options, packageFolderName?: string) => {
	const vueConfig = createVueConfig(options, packageFolderName);
	const baseConfig = defineConfig({
		plugins: [
			virtualHtml(options),
			UnoEnhancer(options, packageFolderName)
		]
	});
	return mergeConfig(vueConfig, baseConfig);
};
