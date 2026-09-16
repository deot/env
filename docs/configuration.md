# 配置扩展

`@deot/env-dever` 提供基础 Vite 配置，同时允许项目使用标准 Vite 配置继续扩展。

## 配置文件优先级

运行时按以下顺序查找：

1. `z.env.config.js` / `z.env.config.ts`
2. `env.config.js` / `env.config.ts`
3. `vite.config.js` / `vite.config.ts`
4. 包内的 `shared.config.ts`

找到第一个文件后停止。当前源码不读取旧文档曾提到的 `dev.config.ts`；新项目应使用上面的名称。

默认 `shared.config.ts` 只关闭 Vite 依赖预构建入口扫描，因为虚拟 HTML 模式没有固定入口。

## Vite 配置

实际多应用项目通常使用标准 `vite.config.js`：

```js
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default ({ command }) => {
	const isBuild = command === 'build';
	const branch = process.env.BRANCH;
	const options = JSON.parse(
		decodeURIComponent(process.env.ENV_OPTIONS || '{}')
	);
	const { packageFolderName } = options;

	let base = '/';
	if (isBuild && branch !== 'dev') {
		base = 'https://cdn.example.com/' + packageFolderName + '/';
	}

	return defineConfig({
		base,
		publicDir: packageFolderName
			? 'src/' + packageFolderName + '/assets/static'
			: false,
		define: {
			__BRANCH__: JSON.stringify(branch)
		},
		resolve: {
			alias: {
				'@vendor/ui': '@deot/vc',
				'@local/module': path.resolve('./3rd-modules/module/index.js')
			}
		}
	});
};
```

不要在 Vite 配置中自行改写 `ENV_OPTIONS`。它由运行时在创建服务前写入，并在逐包构建时更新。

## ENV_OPTIONS

`ENV_OPTIONS` 是 URI 编码的 JSON，包含传给 `Dever.run()` 的选项。常用字段：

| 字段 | 来源 | 说明 |
| --- | --- | --- |
| `workspace` | CLI / API | workspace 相对路径 |
| `outDir` | CLI / API | 构建输出目录 |
| `packageName` | CLI / API | 选择的完整包名或目录名 |
| `packageFolderName` | 运行时 | 当前构建中的包目录 |
| `mergePackageFolderNames` | 运行时 | 合并路由的目录数组 |
| `build` | 运行时 | 是否处于构建流程 |
| `dryRun` | CLI / API | 是否只做命令探测 |
| `custom` | CLI | 业务自定义字符串 |

读取时应始终提供空对象回退：

```js
const envOptions = JSON.parse(
	decodeURIComponent(process.env.ENV_OPTIONS || '{}')
);
```

开发模式可能没有明确的 `packageFolderName`；依赖该字段的 `publicDir` 等配置应提供回退或仅在构建时启用。

## ENV_DEFINE

`ENV_DEFINE` 用于向 Vite `define` 批量注入值。运行时会解码 JSON，并对每个值调用 `JSON.stringify`。

通过代码 API 设置：

```ts
import { Dever } from '@deot/env';

process.env.ENV_DEFINE = encodeURIComponent(JSON.stringify({
	__BRANCH__: 'pre',
	__FEATURE__: true
}));

await Dever.run({
	workspace: 'src',
	packageName: '*'
});
```

业务项目也可以像上面的 Vite 示例一样直接读取 `BRANCH` 等环境变量，并在 `define` 中显式转换。两种方式不要给同一个 key 设置不同值。

## 内置 define

运行时始终提供：

```ts
declare const __MULTIPLE_PACKAGE_FOLDER_NAMES__: string;
```

值为 `mergePackageFolderNames.join(',')`。单应用或未选择包时是空字符串。

它适合在合并构建中判断当前产物包含哪些应用：

```js
const packages = __MULTIPLE_PACKAGE_FOLDER_NAMES__.split(',').filter(Boolean);
```

## 内置 alias

多应用模式自动加入：

| alias | 目标 |
| --- | --- |
| `@` | workspace 根目录 |
| 每个 `package.json.name` | 对应包目录 |

用户 Vite 配置可以追加 alias。避免把同名 alias 指向另一个位置，否则导入结果取决于 Vite 合并顺序。

## CSS 与 Sass

生产构建默认加入：

- `postcss-import`：展开 CSS `@import`。
- `postcss-url`：处理 CSS 资源 URL。
- `postcss-flexbugs-fixes`：修正常见 Flex 问题。
- `cssnano`：压缩并去重。
- `autoprefixer({ remove: false })`：增加前缀且保留已有前缀。

如果能够解析 `@deot/style/src/mixins/bem.scss`，还会给所有 SCSS 文件注入：

```scss
@use "@deot/style/src/mixins/bem.scss" as *;
```

项目无需重复配置同一段 `additionalData`。若没有安装 `@deot/style`，则只使用基础 CSS 配置。

## UnoCSS 多入口

开发态一个 Vite 进程会同时挂 `/mobile`、`/manage`、`/shared/`，因此不能靠 `process.env.UNOCSS_OPTIONS` 按 URL 切换配置。在 `vite.config.js` 注入 `UNOCSS_ENTRIES`：

```js
process.env.UNOCSS_ENTRIES = JSON.stringify({
	mobile: { unit: 'rem', scale: 2 },
	manage: { unit: 'px', scale: 1 },
	shared: { unit: 'px', scale: 1 }
});
```

业务侧可以显式带 query，也可以只写 `virtual:uno.css`，由 importer 所在目录匹配 `UNOCSS_ENTRIES` 的 key：

```js
import 'virtual:uno.css?entry=mobile';
import 'virtual:uno.css?entry=manage';
import 'virtual:uno.css'; // shared/examples/index.js → shared
```

项目根若存在 `uno.config.ts` / `uno.config.js`，`UnoEnhancer` 只启用官方 `unocss/vite`，不做拆分。

否则每个入口各挂**一个官方 `unocss/vite` 实例**，用三个公开配置项隔离开，提取、生成、HMR 与 build 产物全部由官方完成：

| 配置项 | 作用 |
| --- | --- |
| `virtualModulePrefix` | 该实例的虚拟模块变成 `/__uno-<entry>.css`，实例之间互不认领 |
| `content.pipeline.include` | 该实例只提取本入口目录（以及 `shared`）下的源码 |
| `presets` | 本入口自己的 `presetStyle` 选项 |

自研部分只剩一个 `vite-plugin-uno-entry-router`，负责把 `virtual:uno.css` 指向对的那个实例：显式 `?entry=` 优先，其次按 importer 相对 root 的首段目录匹配 `UNOCSS_ENTRIES` 的 key，都对不上则落到兜底入口 `__root__`（收下 root 下所有源码、用默认 `presetStyle()`）。

`UNOCSS_ENTRIES` 是在 `vite.config.js` 里赋值的，插件工厂阶段还读不到。`UnoEnhancer` 因此返回一个惰性 thenable：Vite 先 `loadConfigFromFile`、再 `asyncFlatten(config.plugins)`，工厂正好在这两步之间求值，env 一定已就绪。

没有 `UNOCSS_ENTRIES` 时只挂一个官方实例、用默认 `presetStyle()`。三端可以在同一个开发服务里同时打开。`UNOCSS_OPTIONS` 只作为全局覆盖（CI 或临时调试）。

## ESLint、Stylelint 与 TypeScript

`@deot/env` 通过 `@deot/env-deps` 带入 `@deot/dev` 工具链。实际项目可以直接复用配置。

```js
// eslint.config.js
import { configure } from '@deot/dev-eslint';

export default configure();
```

```js
// stylelint.config.js
import { configure } from '@deot/dev-stylelint';

export default configure();
```

```json
{
  "extends": "@deot/dev/tsconfig.shared.json",
  "compilerOptions": {
    "allowJs": true
  }
}
```

需要业务规则时，先取得默认配置再局部扩展，不要复制整份规则：

```js
import { configure } from '@deot/dev-eslint';

export default (async () => {
	const defaults = await configure();
	return [
		{
			languageOptions: {
				globals: {
					wx: true
				}
			}
		},
		...defaults,
		{
			ignores: ['**/3rd-modules']
		}
	];
})();
```

