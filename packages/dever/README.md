# @deot/env-dever

`@deot/env-dever` 是 `dec dev` 与 `dec build` 的运行时。它解析 workspace、生成 Vite 基础配置、注入 Vue 插件，并负责开发服务和逐包构建。

## 安装

```bash
pnpm add -D @deot/env-dever
```

普通项目建议安装聚合包：

```bash
pnpm add -D @deot/env
```

## API

```ts
import { run } from '@deot/env-dever';

await run({
	workspace: 'src',
	packageName: '*'
});
```

### `run(options)`

`Options` 来自 `@deot/dev-shared` 的开放键值类型。当前 Dever 实际读取：

```ts
interface DeverOptions {
	workspace?: string;
	outDir?: string;
	packageName?: string;
	packageFolderName?: string;
	mergePackageFolderNames?: string[];
	dryRun?: boolean;
	build?: boolean;
	custom?: unknown;
	[key: string]: unknown;
}
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `workspace` | `clients` | workspace 路径；指向当前目录时进入单仓库模式 |
| `outDir` | `clients/dist` | 构建输出根目录 |
| `packageName` | 空字符串 | 目录名、完整包名、`*` 或逗号分隔名称 |
| `packageFolderName` | 空字符串 | 当前包目录；运行过程中根据 `packageName` 计算 |
| `mergePackageFolderNames` | `[]` | 合并构建包含的目录；运行过程中计算 |
| `dryRun` | `false` | 返回探测子进程，不创建 Vite 服务 |
| `build` | `false` | `false` 开发，`true` 构建 |

整个实现由 `Utils.autoCatch()` 包装。内部异常交给默认 `console.error` 处理，因此调用方不要假设所有错误都会以 rejected Promise 形式继续抛出。

## 运行流程

1. 合并默认选项。
2. `dryRun` 时执行探测命令并提前返回。
3. 通过 `Locals.impl(workspace)` 扫描包。
4. 规范化 `packageName`；需要时打开交互选择器。
5. 计算 `packageFolderName` 和 `mergePackageFolderNames`。
6. 创建 Vite root、alias、define、CSS 与构建配置。
7. 选择用户配置文件。
8. 写入 `ENV_OPTIONS`。
9. 创建开发服务器，或按包循环构建。

## 包选择

`packageName` 支持：

| 输入 | 结果 |
| --- | --- |
| 空 | workspace 存在时打开交互选择器 |
| `*` | 开发时加载全部；构建时逐个构建普通应用 |
| `mobile` | 转换为 shared 前缀下的完整包名 |
| `@clients/mobile` | 解析回目录 `mobile` |
| `manage,mobile,shared` | 合并路由并以 `manage` 为输出包 |
| 不存在的目录 | 被过滤 |

包名转换来自 [`@deot/env-shared`](../shared)。

## Vite 基础配置

### Root 与 alias

多应用模式把 Vite `root` 设置为 workspace，并加入：

```text
@                     -> <workspace>
<package.json.name>   -> <workspace>/<folder>
```

例如：

```text
@clients/manage -> src/manage
@clients/shared -> src/shared
```

### 开发服务器

开发模式调用：

```ts
const server = await createServer(config);
await server.listen();
server.printUrls();
server.bindCLIShortcuts({ print: true });
```

服务器监听所有网络接口，因为基础配置使用 `server.host: true`。

### Define

`ENV_DEFINE` 是 URI 编码 JSON；每个值都会经过 `JSON.stringify` 后加入 Vite `define`。

运行时还加入：

```ts
declare const __MULTIPLE_PACKAGE_FOLDER_NAMES__: string;
```

其值是合并包目录的逗号字符串。

## 配置文件

查找顺序：

1. `z.env.config.js` / `z.env.config.ts`
2. `env.config.js` / `env.config.ts`
3. `vite.config.js` / `vite.config.ts`
4. 包内 `shared.config.ts`

默认配置只包含：

```ts
export default {
	optimizeDeps: {
		entries: []
	}
};
```

详细扩展方法见[配置扩展](../../docs/configuration.md)。

## CSS

生产构建启用：

```text
postcss-import
postcss-url
postcss-flexbugs-fixes
cssnano
autoprefixer({ remove: false })
```

如果项目能够解析 `@deot/style/src/mixins/bem.scss`，SCSS 还会自动注入：

```scss
@use "@deot/style/src/mixins/bem.scss" as *;
```

开发模式不加入生产 PostCSS 插件，但 BEM mixin 检测仍会执行。

## UnoCSS

`UnoEnhancer`：项目根存在 `uno.config.ts` / `uno.config.js` 时只挂官方 `unocss/vite`。否则挂 `createMultipleEntry`，在 `configResolved` 读取 `vite.config.js` 注入的 `UNOCSS_ENTRIES`（工厂阶段还拿不到）。没有 entries 时按 `__root__` 和默认 `presetStyle()` 生成。`UNOCSS_OPTIONS` 只做全局覆盖。

## 虚拟 HTML

开发服务的 `vite-plugin-virtual-html` 会处理不带文件扩展名的页面请求，同时跳过：

- 已经结束的响应。
- Vite HTML proxy 请求。
- `/@...` 与 `/__...` 内部路径。
- root 中真实存在的文件。

生成顺序：

1. 沿请求路径向上查找最近的 `index.html`。
2. 没有找到时读取 workspace 根部 `index.ejs`。
3. 查找目标包的 `index.js`，再查找 `index.ts`。
4. 把入口作为 EJS 的 `entry` 渲染。

实现不会生成默认 EJS；workspace 使用虚拟 HTML 时必须提供 `index.ejs`。

## 构建

### 全部应用

未选择包时，按 `locals.packageFolderNames` 逐个构建。该列表不包含 `shared`。

### 单包与合并构建

选择单包时只产生该包目录。逗号选择时：

- `packageFolderName` 是第一个包。
- `mergePackageFolderNames` 保留全部包。
- Vue 路由读取全部选中包。
- Rollup output 仍写入第一个包的目录。

### 临时入口

包缺少 `index.html` 时，会创建：

```text
<workspace>/<package>/.temp/index.html
```

构建后删除临时文件。随后运行时把 Vite 的嵌套输出整理为：

```text
<outDir>/<package>
```

每个包构建前会清理自己的目标目录。

完整部署规则见[构建与部署](../../docs/build-and-deploy.md)。

## 与其他包的关系

| 包 | 用途 |
| --- | --- |
| [`@deot/env-shared`](../shared) | workspace 与包名解析 |
| [`@deot/env-vue`](../vue) | Vue、JSX、路由与布局插件 |
| [`@deot/dev-shared`](https://www.npmjs.com/package/@deot/dev-shared) | `Options`、Shell 与错误包装 |
