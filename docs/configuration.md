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

开发态一个 Vite 进程会同时挂 `/mobile`、`/manage`、`/shared/`，因此不能靠 `process.env.UNOCSS_OPTIONS` 按 URL 切换配置。每个包的 `presetStyle` 选项直接写在 import 的 query 上：

```js
import 'virtual:uno.css?unit=rem&scale=2'; // src/mobile/index.js
import 'virtual:uno.css?unit=px&scale=1'; // src/manage/index.js
import 'virtual:uno.css'; // src/shared/examples/index.js，默认配置
```

不需要在 `vite.config.js` 里配置任何东西。

### 入口与配置

**入口列表以磁盘为准**：`src/` 下的每个包目录各对应一个 UnoCSS 实例，外加一个兜底入口 `__root__`。没写 query 的包用默认 `presetStyle()`，也仍然有自己的独立实例。

**配置写在 query 上**，作用域是整个包——`src/mobile/` 下任意一个文件写了 query，配置的就是 mobile 这个包。因此**同一个包里只能有一处配置 query**，两个不同文件给同一个包配了不同选项会直接报错（静默取首次会产出极难诊断的 CSS）。同一套配置重复写不算冲突；同一个文件改自己的 query 算编辑，会重新绑定并热更新。

> 把 query **整个删掉或清空**检测不到（没有配置参数就等于没表态），实例会留着上一次绑定的配置，需要重启 dev server。

`virtual:` 前缀可以省略，也支持官方的 layer 写法，四种形式等价地受支持：

```js
import 'uno.css?unit=rem&scale=2';
import 'virtual:uno.css?unit=rem&scale=2';
import 'uno:preflights.css';
import 'virtual:uno:preflights.css';
```

query 支持的参数（对应 `PresetStyleOptions`，会按类型转换）：

| 参数 | 类型 |
| --- | --- |
| `prefix`、`unit` | 字符串，空值会被忽略并告警 |
| `scale` | 数字，非有限数字会被忽略并告警 |
| `reset`、`variants`、`attributifyPseudo`、`arbitraryVariants` | 布尔，`?reset` 这种无值写法按 `true` |
| `dark` | 只支持 `class` / `media`（对象形式 query 表达不了） |
| `entry` | 显式指定实例，不进 preset |

未知参数会被忽略并告警。

### 实例怎么隔离

项目根或 `src/` 下若存在 `uno.config.ts` / `unocss.config.ts` 等，`UnoEnhancer` 只启用官方 `unocss/vite` 并把该文件的绝对路径喂给它，不做拆分。

否则每个包各挂**一个官方 `unocss/vite` 实例**，用三个公开配置项隔离开，提取、生成、HMR 与 build 产物全部由官方完成：

| 配置项 | 作用 |
| --- | --- |
| `virtualModulePrefix` | 该实例的虚拟模块变成 `/__uno-<entry>.css`，实例之间互不认领 |
| `content.pipeline.include` | 该实例只提取本包目录（以及 `shared`）下的源码 |
| `presets` | 本包的 `presetStyle` 选项，由 import query 绑定 |

自研部分只剩一个 `vite-plugin-uno-entry-router`，负责选实例并把 query 上的配置绑给它：显式 `?entry=` 优先，其次按 importer 相对 root 的首段目录匹配包名，都对不上则落到 `__root__`（收下不属于任何包目录的文件，以及 `shared`）。

配置只能在首次 `resolveId` 时绑定：Vite 的插件数组在 `asyncFlatten` 之后就冻结了，实例必须在任何模块被解析之前建好，而 query 要到 `resolveId` 才可见。`resolveId` 严格早于 `load`，router 把绑定 await 掉即可。

### 其它

- `UNOCSS_OPTIONS` 仍是全局覆盖（CI 或临时调试），它会盖掉 query 里的同名参数并告警——因为那等于把多入口差异抹平。
- UnoCSS devtools（`/__unocss`）同一时间只能有一个实例挂载，默认给第一个包；用 `UNOCSS_INSPECT=<包名>` 指定，`UNOCSS_INSPECT=off` 全关。
- 三端可以在同一个开发服务里同时打开。

> **行为变更**：没有任何配置 query 的 monorepo，CSS 从「一份全局表」变成「按包拆分」——每个包只拿到自己和 `shared` 里引用到的 class。这是多入口本该有的语义，但对既有项目是可见变化。

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

