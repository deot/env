import * as path from 'node:path';
import fs from 'fs-extra';
import type { PluginOption } from 'vite';
import type { Options } from '@deot/dev-shared';
import { Locals } from '@deot/env-shared';
import UnoCSS from 'unocss/vite';
import createMultipleEntry from './multiple-entry';

/*
 * 有 `uno.config.ts` / `uno.config.js` 时走官方 `unocss/vite`，不启用 `createMultipleEntry`。
 * 官方插件会自行读取该配置；此时不要再拦截 `virtual:uno.css`。
 *
 * 没有官方配置时一律挂 `createMultipleEntry`，不要在工厂里读 `UNOCSS_ENTRIES`：
 * `vite.config.js` 里的赋值要等 Vite `loadConfigFromFile` 才会执行，工厂阶段一定是空的。
 * `configResolved` 再解析 entries：
 * 1. `import 'virtual:uno.css?entry=<name>'` —— 显式入口
 * 2. `import 'virtual:uno.css'` 且 importer 所在包目录是 `UNOCSS_ENTRIES` 的 key
 *    （例如 `shared/examples/index.js` → `shared`）
 * 3. 仍没有 entries 时走 `__root__` + 默认 `presetStyle()`
 */
export default (options: Options): PluginOption => {
	const locals = Locals.impl(options.workspace);
	const cwd = locals.cwd;
	const hasUnoConfig = fs.existsSync(path.resolve(cwd, './uno.config.ts'))
		|| fs.existsSync(path.resolve(cwd, './uno.config.js'));

	if (hasUnoConfig) return UnoCSS();
	return createMultipleEntry(options);
};
