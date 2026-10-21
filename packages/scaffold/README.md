# @deot/env-scaffold

`@deot/env-scaffold` 为 `dec init` 提供项目生成器，以及单应用、多应用、JavaScript、TypeScript 模板。

模板通过 npm 包分发，生成过程不访问远程模板仓库。业务项目通常通过 `@deot/env-cli` 使用该能力，不需要直接调用本包。

## 创建项目

```bash
pnpm dlx @deot/env-cli init my-app
cd my-app
npm run dev
```

| 模板 | 结构 | 语言 |
| --- | --- | --- |
| `single-js` | 单应用，Manage 与 Shared 合并到 `src/` | JavaScript |
| `single-ts` | 单应用，Manage 与 Shared 合并到 `src/` | TypeScript |
| `monorepo-js` | `src/manage`、`src/mobile`、`src/shared` | JavaScript |
| `monorepo-ts` | `src/manage`、`src/mobile`、`src/shared` | TypeScript |

命令参数使用 `--template single|monorepo` 与 `--language js|ts`，例如 `dec init my-app --template monorepo --language ts`。完整选项见 [CLI](../cli/README.md#dec-init)，应用组织见[项目结构](../../docs/project-structure.md)。

## 生成 API

- `run()`：与 `Dever.run()` 一致的命令入口，负责交互补全、生成项目和安装依赖。
- `createScaffold()`：无交互的底层生成 API。
- `prompt.ts`：仅补全缺少的项目名、项目结构和语言；是否安装仍由 `--no-install` 控制。

```ts
import { resolve } from 'node:path';
import { createScaffold } from '@deot/env-scaffold';

await createScaffold({
	name: 'my-app',
	targetDir: resolve('my-app'),
	template: 'monorepo',
	language: 'ts'
});
```

`createScaffold()` 只生成文件，不安装依赖。目标目录必须不存在；CLI 的 `run()` 会继续完成交互和依赖安装。

## 模板能力

Monorepo 模板包含：

- `manage/env.js|ts`：使用 `Message`、`Modal` 的桌面端平台配置。
- `mobile/env.js|ts`：使用 `MToast`、`MModal` 的移动端平台配置。
- `shared/components/layouts/default.vue`：包含菜单、标签页、KeepAlive 和滚动位置记忆。
- `shared/components/layouts/default-mobile.vue`：移动端独立布局，由 Shared 统一维护。

Single 模板不是简化示例，而是 Monorepo 中 `manage + shared` 的扁平合并版本：

- `manage` 的 `env`、`layout`、`pages` 与路由入口位于 Single 的 `src/` 根目录。
- `shared` 的组件、常量、Hooks、Modules、Stores、样式与工具合并到 Single 的对应 `src/*` 目录。
- Single 与 Monorepo Manage 提供相同的首页、菜单、标签页、KeepAlive、滚动记忆和桌面反馈能力。

API 地址通过 `VITE_MANAGE_API_BASE_URL`、`VITE_MOBILE_API_BASE_URL` 配置，来源标识通过 `VITE_SOURCE_CODE` 配置；未设置 API 地址时回退到当前页面域名。

## 仓库内预览

在 d-env 根目录直接运行模板源码：

```bash
npm run scaffold:dev

npm run scaffold:dev -- \
	--template monorepo \
	--language ts \
	--package-name manage
```

未提供的选项会通过 Prompt 补全。还可以使用 `scaffold:init`、`scaffold:build`、`scaffold:lint` 和 `scaffold:typecheck`。预览命令会在所选 `templates/<variant>` 中执行锁定安装，dev/build 使用当前仓库的 CLI 与 Dever，因此修改模板源码后可以直接看到 HMR 结果。
